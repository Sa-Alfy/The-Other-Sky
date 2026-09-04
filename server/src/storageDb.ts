import { query, transaction, getClient } from './db';
import { Constellation, CreateWishInput, DbLight, DbStar, DbUser, DbWish, MirrorResult, PersonalSkyData, Wish } from './types';
import { generateAnonymousId } from './utils';
import { generateRecoveryPhrase, hashRecoveryPhrase, verifyRecoveryPhrase } from './recovery';

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

const reportThreshold = 3;
const spamPatterns = [/https?:\/\//i, /(.)\1{9,}/, /(?:free money|click here|buy now|casino)/i];

export function isSpamLike(text: string): boolean {
  return spamPatterns.some((pattern) => pattern.test(text));
}

export function checkRateLimit(userId: string, action: keyof typeof rateLimitConfigs): boolean {
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
     RETURNING id, anonymous_id, created_at, last_seen_at, recovery_key_hash`,
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
    fulfilledAt: wish.fulfilled_at ?? null,
    fulfillmentNote: wish.fulfillment_note ?? null,
    reactions,
    x: Number(star.x),
    y: Number(star.y),
    z: Number(star.z),
    size: Number(star.size),
    brightness: Number(star.brightness),
    hue: star.hue,
  };
}

function mapRowToWish(row: any): Promise<Wish> {
  return hydrateWish(
    {
      id: row.id,
      user_id: row.user_id ?? '',
      text: row.text,
      category: row.category,
      status: row.status,
      visibility: row.visibility,
      created_at: row.created_at,
      updated_at: row.updated_at,
      fulfilled_at: row.fulfilled_at ?? null,
      fulfillment_note: row.fulfillment_note ?? null,
    },
    {
      id: '',
      wish_id: row.id,
      x: row.x ?? 0.5,
      y: row.y ?? 0.5,
      z: row.z ?? 0,
      size: row.size ?? 1.5,
      brightness: row.brightness ?? 1.0,
      hue: row.hue ?? 45,
      created_at: row.created_at,
    },
    Number(row.reaction_count ?? 0)
  );
}

/**
 * List all approved wishes with their stars (optionally filtered by category)
 */
export async function listWishes(category?: string): Promise<Wish[]> {
  const client = await getClient();
  try {
    let sql = `
      SELECT w.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
             w.fulfilled_at, w.fulfillment_note,
             s.x, s.y, s.z, s.size, s.brightness, s.hue,
             COUNT(wl.id) AS reaction_count
      FROM wishes w
      LEFT JOIN stars s ON w.id = s.wish_id
      LEFT JOIN wish_lights wl ON w.id = wl.wish_id
      WHERE w.status = 'approved' AND w.visibility = 'public'
    `;
    const params: any[] = [];

    if (category) {
      params.push(category);
      sql += ` AND w.category = $${params.length}`;
    }

    sql += `
      GROUP BY w.id, s.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
               w.fulfilled_at, w.fulfillment_note, s.x, s.y, s.z, s.size, s.brightness, s.hue
      ORDER BY w.created_at DESC
    `;

    const result = await client.query(sql, params);
    return Promise.all(result.rows.map(mapRowToWish));
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
              w.fulfilled_at, w.fulfillment_note,
              s.x, s.y, s.z, s.size, s.brightness, s.hue,
              COUNT(wl.id) AS reaction_count
       FROM wishes w
       LEFT JOIN stars s ON w.id = s.wish_id
       LEFT JOIN wish_lights wl ON w.id = wl.wish_id
       WHERE w.id = $1 AND w.status = 'approved' AND w.visibility = 'public'
       GROUP BY w.id, s.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
                w.fulfilled_at, w.fulfillment_note, s.x, s.y, s.z, s.size, s.brightness, s.hue`,
      [id]
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    return mapRowToWish(result.rows[0]);
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
  const text = input.text.trim();
  if (text.length < 3 || text.length > 280) {
    return { error: 'Wish must be between 3 and 280 characters.', code: 'INVALID_REQUEST' };
  }

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
       VALUES ($1, $2, $3, $7, $4, $5, $6)
       RETURNING id, text, category, status, visibility, created_at, updated_at, fulfilled_at, fulfillment_note`,
      [userId, text, input.category ?? 'general', input.visibility ?? 'public', createdAt, createdAt, isSpamLike(text) ? 'flagged' : 'approved']
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

export async function reportWish(wishId: string, anonymousId: string, reason?: string): Promise<{ reported: true } | undefined> {
  return transaction(async (client) => {
    const userResult = await client.query(`INSERT INTO users (anonymous_id, last_seen_at) VALUES ($1, CURRENT_TIMESTAMP) ON CONFLICT (anonymous_id) DO UPDATE SET last_seen_at = CURRENT_TIMESTAMP RETURNING id`, [anonymousId]);
    const wish = await client.query('SELECT id FROM wishes WHERE id = $1', [wishId]);
    if (wish.rows.length === 0) return undefined;
    const reporterId = userResult.rows[0].id;
    const existingReport = await client.query(
      `SELECT id FROM moderation_events WHERE wish_id = $1 AND action = 'report' AND metadata->>'reporter_id' = $2 LIMIT 1`,
      [wishId, reporterId]
    );
    if (existingReport.rows.length > 0) {
      return { reported: true };
    }
    await client.query(`INSERT INTO moderation_events (wish_id, action, reason_code, reviewer_id, metadata) VALUES ($1, 'report', $2, NULL, $3)`, [wishId, reason ?? 'unspecified', JSON.stringify({ reporter_id: reporterId })]);
    const reports = await client.query("SELECT COUNT(*)::int AS count FROM moderation_events WHERE wish_id = $1 AND action = 'report'", [wishId]);
    if (reports.rows[0].count >= reportThreshold) await client.query("UPDATE wishes SET status = 'flagged', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [wishId]);
    return { reported: true };
  });
}

export async function getModerationQueue(): Promise<Wish[]> {
  const result = await query("SELECT w.*, s.x, s.y, s.z, s.size, s.brightness, s.hue, 0 AS reaction_count FROM wishes w LEFT JOIN stars s ON w.id = s.wish_id WHERE w.status IN ('pending', 'flagged') ORDER BY w.created_at ASC");
  return Promise.all(result.rows.map(mapRowToWish));
}

export async function moderateWish(id: string, action: 'approve' | 'reject'): Promise<Wish | undefined> {
  const result = await query("UPDATE wishes SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *", [id, action === 'approve' ? 'approved' : 'rejected']);
  if (result.rows.length === 0) return undefined;
  const wishResult = await query(
    `SELECT w.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
            w.fulfilled_at, w.fulfillment_note,
            s.x, s.y, s.z, s.size, s.brightness, s.hue,
            0 AS reaction_count
     FROM wishes w
     LEFT JOIN stars s ON w.id = s.wish_id
     WHERE w.id = $1
     GROUP BY w.id, s.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
              w.fulfilled_at, w.fulfillment_note, s.x, s.y, s.z, s.size, s.brightness, s.hue`,
    [id]
  );
  if (wishResult.rows.length === 0) return undefined;
  return mapRowToWish(wishResult.rows[0]);
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

    // Check if wish exists and is approved and public
    const wishCheck = await client.query(
      "SELECT id FROM wishes WHERE id = $1 AND status = 'approved' AND visibility = 'public'",
      [wishId]
    );
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
              w.fulfilled_at, w.fulfillment_note,
              s.x, s.y, s.z, s.size, s.brightness, s.hue,
              COUNT(wl.id) AS reaction_count
       FROM wishes w
       LEFT JOIN stars s ON w.id = s.wish_id
       LEFT JOIN wish_lights wl ON w.id = wl.wish_id
       WHERE w.id = $1
       GROUP BY w.id, s.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
                w.fulfilled_at, w.fulfillment_note, s.x, s.y, s.z, s.size, s.brightness, s.hue`,
      [wishId]
    );

    if (result.rows.length === 0) {
      return undefined;
    }

    return mapRowToWish(result.rows[0]);
  });
}

/**
 * Save a wish to user's saved collection
 */
export async function saveWish(
  wishId: string,
  anonymousId: string
): Promise<{ saved: true } | undefined> {
  return transaction(async (client) => {
    const user = await getOrCreateUser(anonymousId);
    const wishCheck = await client.query(
      "SELECT id FROM wishes WHERE id = $1 AND status = 'approved' AND visibility = 'public'",
      [wishId]
    );
    if (wishCheck.rows.length === 0) return undefined;

    await client.query(
      `INSERT INTO saved_wishes (user_id, wish_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [user.id, wishId]
    );
    return { saved: true };
  });
}

/**
 * Unsave a wish from user's saved collection
 */
export async function unsaveWish(
  wishId: string,
  anonymousId: string
): Promise<{ saved: false }> {
  return transaction(async (client) => {
    const user = await getOrCreateUser(anonymousId);
    await client.query(
      `DELETE FROM saved_wishes WHERE user_id = $1 AND wish_id = $2`,
      [user.id, wishId]
    );
    return { saved: false };
  });
}

/**
 * Get Personal Sky for the current session:
 * - Own wishes created by this user
 * - Saved wishes
 * - Lighted wishes
 */
export async function getPersonalSky(anonymousId: string): Promise<PersonalSkyData> {
  const user = await getOrCreateUser(anonymousId);
  const client = await getClient();

  try {
    // 1. Own wishes
    const ownResult = await client.query(
      `SELECT w.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
              w.fulfilled_at, w.fulfillment_note,
              s.x, s.y, s.z, s.size, s.brightness, s.hue,
              COUNT(wl.id) AS reaction_count
       FROM wishes w
       LEFT JOIN stars s ON w.id = s.wish_id
       LEFT JOIN wish_lights wl ON w.id = wl.wish_id
       WHERE w.user_id = $1 AND w.status != 'rejected'
       GROUP BY w.id, s.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
                w.fulfilled_at, w.fulfillment_note, s.x, s.y, s.z, s.size, s.brightness, s.hue
       ORDER BY w.created_at DESC`,
      [user.id]
    );

    // 2. Saved wishes
    const savedResult = await client.query(
      `SELECT w.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
              w.fulfilled_at, w.fulfillment_note,
              s.x, s.y, s.z, s.size, s.brightness, s.hue,
              COUNT(DISTINCT wl.id) AS reaction_count
       FROM wishes w
       JOIN saved_wishes sw ON w.id = sw.wish_id
       LEFT JOIN stars s ON w.id = s.wish_id
       LEFT JOIN wish_lights wl ON w.id = wl.wish_id
       WHERE sw.user_id = $1 AND w.status = 'approved' AND w.visibility = 'public'
       GROUP BY w.id, s.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
                w.fulfilled_at, w.fulfillment_note, s.x, s.y, s.z, s.size, s.brightness, s.hue
       ORDER BY MAX(sw.created_at) DESC`,
      [user.id]
    );

    // 3. Lighted wishes
    const lightedResult = await client.query(
      `SELECT w.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
              w.fulfilled_at, w.fulfillment_note,
              s.x, s.y, s.z, s.size, s.brightness, s.hue,
              COUNT(DISTINCT wl2.id) AS reaction_count
       FROM wishes w
       JOIN wish_lights wl ON w.id = wl.wish_id
       LEFT JOIN stars s ON w.id = s.wish_id
       LEFT JOIN wish_lights wl2 ON w.id = wl2.wish_id
       WHERE wl.user_id = $1 AND w.status = 'approved' AND w.visibility = 'public'
       GROUP BY w.id, s.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
                w.fulfilled_at, w.fulfillment_note, s.x, s.y, s.z, s.size, s.brightness, s.hue
       ORDER BY MAX(wl.created_at) DESC`,
      [user.id]
    );

    const [ownWishes, savedWishes, lightedWishes] = await Promise.all([
      Promise.all(ownResult.rows.map(mapRowToWish)),
      Promise.all(savedResult.rows.map(mapRowToWish)),
      Promise.all(lightedResult.rows.map(mapRowToWish)),
    ]);

    return {
      ownWishes,
      savedWishes,
      lightedWishes,
      hasRecoveryPhrase: Boolean(user.recovery_key_hash),
    };
  } finally {
    client.release();
  }
}

/**
 * Voluntary wish fulfillment (owner only)
 */
export async function fulfillWish(
  wishId: string,
  anonymousId: string,
  note?: string
): Promise<Wish | { error: string; code: string } | undefined> {
  const user = await getOrCreateUser(anonymousId);
  const client = await getClient();

  try {
    const wishResult = await client.query("SELECT id, user_id FROM wishes WHERE id = $1", [wishId]);
    if (wishResult.rows.length === 0) return undefined;

    const wish = wishResult.rows[0];
    if (wish.user_id !== user.id) {
      return { error: 'You can only fulfill your own wishes.', code: 'FORBIDDEN' };
    }

    const trimmedNote = note ? note.trim().slice(0, 280) : null;
    await client.query(
      `UPDATE wishes
       SET fulfilled_at = CURRENT_TIMESTAMP,
           fulfillment_note = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [wishId, trimmedNote]
    );

    const updatedWish = await client.query(
      `SELECT w.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
              w.fulfilled_at, w.fulfillment_note,
              s.x, s.y, s.z, s.size, s.brightness, s.hue,
              COUNT(wl.id) AS reaction_count
       FROM wishes w
       LEFT JOIN stars s ON w.id = s.wish_id
       LEFT JOIN wish_lights wl ON w.id = wl.wish_id
       WHERE w.id = $1
       GROUP BY w.id, s.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
                w.fulfilled_at, w.fulfillment_note, s.x, s.y, s.z, s.size, s.brightness, s.hue`,
      [wishId]
    );

    if (updatedWish.rows.length === 0) return undefined;
    return mapRowToWish(updatedWish.rows[0]);
  } finally {
    client.release();
  }
}

/**
 * Morning Sky: List fulfilled wishes
 */
export async function getFulfilledWishes(): Promise<Wish[]> {
  const client = await getClient();
  try {
    const result = await client.query(
      `SELECT w.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
              w.fulfilled_at, w.fulfillment_note,
              s.x, s.y, s.z, s.size, s.brightness, s.hue,
              COUNT(wl.id) AS reaction_count
       FROM wishes w
       LEFT JOIN stars s ON w.id = s.wish_id
       LEFT JOIN wish_lights wl ON w.id = wl.wish_id
       WHERE w.status = 'approved' AND w.visibility = 'public' AND w.fulfilled_at IS NOT NULL
       GROUP BY w.id, s.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
                w.fulfilled_at, w.fulfillment_note, s.x, s.y, s.z, s.size, s.brightness, s.hue
       ORDER BY w.fulfilled_at DESC`
    );

    return Promise.all(result.rows.map(mapRowToWish));
  } finally {
    client.release();
  }
}

/**
 * Constellations: Aggregate categories and descriptions
 */
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  hope: 'Quiet beacons reaching toward tomorrow.',
  love: 'Ties between souls, whispered across distance.',
  peace: 'Calm waters in the vastness of the dark.',
  healing: 'The slow mending of what felt broken.',
  growth: 'Unfolding gently into who we might become.',
  clarity: 'Moments when the fog lifts and stars shine through.',
};

export async function listConstellations(): Promise<Constellation[]> {
  const client = await getClient();
  try {
    const result = await client.query(
      `SELECT category, COUNT(*)::int AS count
       FROM wishes
       WHERE status = 'approved' AND visibility = 'public'
       GROUP BY category
       ORDER BY count DESC`
    );

    return result.rows.map((row) => ({
      id: row.category,
      name: row.category.charAt(0).toUpperCase() + row.category.slice(1),
      slug: row.category.toLowerCase(),
      description: CATEGORY_DESCRIPTIONS[row.category.toLowerCase()] ?? 'Strangers connected by a shared human journey.',
      wishCount: row.count,
    }));
  } finally {
    client.release();
  }
}

/**
 * Mirror: Find emotionally related wishes using tsvector + category matching
 */
export async function getMirrorWishes(wishId: string, limit = 4): Promise<MirrorResult> {
  const client = await getClient();
  try {
    // 1. Get source wish
    const sourceResult = await client.query(
      "SELECT id, text, category FROM wishes WHERE id = $1 AND status = 'approved'",
      [wishId]
    );

    if (sourceResult.rows.length === 0) {
      return { relatedWishes: [], message: 'Wish not found.' };
    }

    const source = sourceResult.rows[0];

    // 2. Full-text search match using plainto_tsquery on source text
    const searchResult = await client.query(
      `SELECT w.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
              w.fulfilled_at, w.fulfillment_note,
              s.x, s.y, s.z, s.size, s.brightness, s.hue,
              COUNT(wl.id) AS reaction_count,
              ts_rank(w.search_vector, plainto_tsquery('english', $1)) AS rank
       FROM wishes w
       LEFT JOIN stars s ON w.id = s.wish_id
       LEFT JOIN wish_lights wl ON w.id = wl.wish_id
       WHERE w.id != $2
         AND w.status = 'approved'
         AND w.visibility = 'public'
         AND (
           w.search_vector @@ plainto_tsquery('english', $1)
           OR w.category = $3
         )
       GROUP BY w.id, s.id, w.text, w.category, w.status, w.visibility, w.created_at, w.updated_at,
                w.fulfilled_at, w.fulfillment_note, s.x, s.y, s.z, s.size, s.brightness, s.hue
       ORDER BY rank DESC, (w.category = $3) DESC, w.created_at DESC
       LIMIT $4`,
      [source.text, wishId, source.category, limit]
    );

    const relatedWishes = await Promise.all(searchResult.rows.map(mapRowToWish));

    return {
      relatedWishes,
      message: "You're not the only one.",
    };
  } finally {
    client.release();
  }
}

/**
 * Generate and store a new recovery phrase hash for an anonymous identity.
 * Rejects if user already has a phrase generated.
 */
export async function createRecoveryPhrase(
  anonymousId: string
): Promise<{ phrase: string } | { error: string; code: string }> {
  const user = await getOrCreateUser(anonymousId);
  if (user.recovery_key_hash) {
    return {
      error: 'A recovery phrase has already been generated for this Personal Sky.',
      code: 'CONFLICT',
    };
  }

  const phrase = generateRecoveryPhrase();
  const hash = await hashRecoveryPhrase(phrase);

  await query(
    `UPDATE users
     SET recovery_key_hash = $1,
         last_seen_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [hash, user.id]
  );

  return { phrase };
}

/**
 * Recover a user session using a plaintext 4-word recovery phrase.
 * Note: A full-table bcrypt comparison loop is acceptable at this stage given current expected scale,
 * but will not scale past a few thousand recovery-enabled users and would need a different scheme
 * (e.g. keyed lookup by a non-secret prefix or hash index) later.
 */
export async function recoverUserByPhrase(phrase: string): Promise<DbUser | null> {
  if (!phrase || typeof phrase !== 'string') {
    return null;
  }

  const client = await getClient();
  try {
    const result = await client.query(
      `SELECT id, anonymous_id, created_at, last_seen_at, recovery_key_hash
       FROM users
       WHERE recovery_key_hash IS NOT NULL`
    );

    for (const row of result.rows) {
      if (row.recovery_key_hash) {
        const matches = await verifyRecoveryPhrase(phrase, row.recovery_key_hash);
        if (matches) {
          await client.query(
            `UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [row.id]
          );
          return row;
        }
      }
    }

    return null;
  } finally {
    client.release();
  }
}

