import { query, transaction, getClient } from './db';
import { CreateWishInput, DbLight, DbStar, DbUser, DbWish, Wish } from './types';
import { generateAnonymousId } from './utils';

// Rate limiting store (in-memory for MVP; can be moved to Redis later)
const rateLimitStore = new Map<
  string,
  { count: number; resetAt: number; action: string }
>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const rateLimitConfigs = {
  createWish: { maxRequests: 5, windowMs: 60 * 60 * 1000 } as RateLimitConfig, // 5 wishes per hour
  sendLight: { maxRequests: 20, windowMs: 60 * 60 * 1000 } as RateLimitConfig, // 20 lights per hour
};

function checkRateLimit(userId: string, action: keyof typeof rateLimitConfigs): boolean {
  const key = `${userId}:${action}`;
  const config = rateLimitConfigs[action];
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs, action });
    return true;
  }

  if (entry.count >= config.maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

async function getOrCreateUser(anonymousId: string): Promise<DbUser> {
  const result = await query(
    `INSERT INTO users (anonymous_id, last_seen_at) 
     VALUES ($1, CURRENT_TIMESTAMP) 
     ON CONFLICT (anonymous_id) 
     DO UPDATE SET last_seen_at = CURRENT_TIMESTAMP 
     RETURNING id, anonymous_id, created_at, last_seen_at`,
    [anonymousId]
  );

  return result.rows[0];
}

async function hydrateWish(wish: DbWish, star: DbStar, reactions: number): Promise<Wish> {
  return {
    id: wish.id,
    text: wish.text,
    category: wish.category,
    status: wish.status,
    visibility: wish.visibility,
    createdAt: wish.created_at,
    updatedAt: wish.updated_at,
    reactions,
    x: Number(star.x),
    y: Number(star.y),
    z: Number(star.z),
    size: Number(star.size),
    brightness: Number(star.brightness),
    hue: star.hue,
  };
}

/**
 * List all approved wishes with their stars
 */
export async function listWishes(): Promise<Wish[]> {
  const client = await getClient();
  try {
    const result = await client.query(
      `SELECT w.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
              s.x, s.y, s.z, s.size, s.brightness, s.hue,
              COUNT(wl.id) AS reaction_count
       FROM wishes w
       LEFT JOIN stars s ON w.id = s.wish_id
       LEFT JOIN wish_lights wl ON w.id = wl.wish_id
       WHERE w.status = 'approved'
       GROUP BY w.id, s.id
       ORDER BY w.created_at DESC
       LIMIT 500`
    );

    return Promise.all(
      result.rows.map((row: any) =>
        hydrateWish(
          {
            id: row.id,
            user_id: '',
            text: row.text,
            category: row.category,
            status: row.status,
            visibility: row.visibility,
            created_at: row.created_at,
            updated_at: row.updated_at,
            fulfilled_at: null,
          },
          {
            id: '',
            wish_id: row.id,
            x: row.x,
            y: row.y,
            z: row.z,
            size: row.size,
            brightness: row.brightness,
            hue: row.hue,
            created_at: row.created_at,
          },
          Number(row.reaction_count)
        )
      )
    );
  } finally {
    client.release();
  }
}

/**
 * Get a single wish by ID with reactions
 */
export async function getWishById(id: string): Promise<Wish | undefined> {
  const client = await getClient();
  try {
    const result = await client.query(
      `SELECT w.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
              s.x, s.y, s.z, s.size, s.brightness, s.hue,
              COUNT(wl.id) AS reaction_count
       FROM wishes w
       LEFT JOIN stars s ON w.id = s.wish_id
       LEFT JOIN wish_lights wl ON w.id = wl.wish_id
       WHERE w.id = $1 AND w.status = 'approved'
       GROUP BY w.id, s.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    const row = result.rows[0];
    return hydrateWish(
      {
        id: row.id,
        user_id: '',
        text: row.text,
        category: row.category,
        status: row.status,
        visibility: row.visibility,
        created_at: row.created_at,
        updated_at: row.updated_at,
        fulfilled_at: null,
      },
      {
        id: '',
        wish_id: row.id,
        x: row.x,
        y: row.y,
        z: row.z,
        size: row.size,
        brightness: row.brightness,
        hue: row.hue,
        created_at: row.created_at,
      },
      Number(row.reaction_count)
    );
  } finally {
    client.release();
  }
}

/**
 * Create a new wish (with rate limiting)
 */
export async function createWish(
  input: CreateWishInput,
  anonymousId: string
): Promise<Wish | { error: string; code: string }> {
  // Check rate limit
  if (!checkRateLimit(anonymousId, 'createWish')) {
    return {
      error: 'Too many wishes created recently. Please wait before creating another.',
      code: 'RATE_LIMITED',
    };
  }

  return transaction(async (client) => {
    // Get or create user
    const userResult = await client.query(
      `INSERT INTO users (anonymous_id, last_seen_at) 
       VALUES ($1, CURRENT_TIMESTAMP) 
       ON CONFLICT (anonymous_id) 
       DO UPDATE SET last_seen_at = CURRENT_TIMESTAMP 
       RETURNING id`,
      [anonymousId]
    );
    const userId = userResult.rows[0].id;

    // Create wish
    const createdAt = new Date().toISOString();
    const wishResult = await client.query(
      `INSERT INTO wishes (user_id, text, category, status, visibility, created_at, updated_at)
       VALUES ($1, $2, $3, 'approved', $4, $5, $6)
       RETURNING id, text, category, status, visibility, created_at, updated_at`,
      [userId, input.text.trim(), input.category ?? 'general', input.visibility ?? 'public', createdAt, createdAt]
    );
    const wish = wishResult.rows[0];

    // Generate star placement
    const x = Number((Math.random() * 0.9 + 0.07).toFixed(3));
    const y = Number((Math.random() * 0.9 + 0.04).toFixed(3));
    const z = 0;
    const size = Number((Math.random() * 1.6 + 1.2).toFixed(2));
    const brightness = Number((Math.random() * 0.5 + 0.8).toFixed(2));
    const hue = Math.floor(Math.random() * 80) + 30;

    // Create star
    const starResult = await client.query(
      `INSERT INTO stars (wish_id, x, y, z, size, brightness, hue, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING x, y, z, size, brightness, hue`,
      [wish.id, x, y, z, size, brightness, hue, createdAt]
    );
    const star = starResult.rows[0];

    return hydrateWish(wish, { ...star, wish_id: wish.id, id: '', created_at: createdAt }, 0);
  });
}

/**
 * Send light to a wish (with deduplication)
 */
export async function addLight(
  wishId: string,
  anonymousId: string
): Promise<Wish | { error: string; code: string } | undefined> {
  // Check rate limit
  if (!checkRateLimit(anonymousId, 'sendLight')) {
    return {
      error: 'Too much light sent recently. Please wait before sending more.',
      code: 'RATE_LIMITED',
    };
  }

  return transaction(async (client) => {
    // Get or create user
    const userResult = await client.query(
      `INSERT INTO users (anonymous_id, last_seen_at) 
       VALUES ($1, CURRENT_TIMESTAMP) 
       ON CONFLICT (anonymous_id) 
       DO UPDATE SET last_seen_at = CURRENT_TIMESTAMP 
       RETURNING id`,
      [anonymousId]
    );
    const userId = userResult.rows[0].id;

    // Check if wish exists
    const wishCheck = await client.query('SELECT id FROM wishes WHERE id = $1', [wishId]);
    if (wishCheck.rows.length === 0) {
      return undefined;
    }

    // Try to add light (unique constraint prevents duplicates)
    await client.query(
      `INSERT INTO wish_lights (wish_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [wishId, userId]
    );

    // Fetch updated wish with new reaction count
    const result = await client.query(
      `SELECT w.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
              s.x, s.y, s.z, s.size, s.brightness, s.hue,
              COUNT(wl.id) AS reaction_count
       FROM wishes w
       LEFT JOIN stars s ON w.id = s.wish_id
       LEFT JOIN wish_lights wl ON w.id = wl.wish_id
       WHERE w.id = $1
       GROUP BY w.id, s.id`,
      [wishId]
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    const row = result.rows[0];
    return hydrateWish(
      {
        id: row.id,
        user_id: userId,
        text: row.text,
        category: row.category,
        status: row.status,
        visibility: row.visibility,
        created_at: row.created_at,
        updated_at: row.updated_at,
        fulfilled_at: null,
      },
      {
        id: '',
        wish_id: row.id,
        x: row.x,
        y: row.y,
        z: row.z,
        size: row.size,
        brightness: row.brightness,
        hue: row.hue,
        created_at: row.created_at,
      },
      Number(row.reaction_count)
    );
  });
}
