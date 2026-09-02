import { query, closePool, transaction, getClient } from './db';

const SEED_WISHES = [
  'I hope future me is peaceful.',
  'I wish I could stop comparing myself to everyone else.',
  'Maybe I am allowed to begin again.',
  'I want to be brave enough to tell the truth.',
  'I hope someone remembers how hard I tried.',
  'I wish I trusted my own timing.',
  'I want a quieter kind of happiness.',
  'I hope my life slows down enough to feel real.',
  'I am learning to be gentle with my own becoming.',
  'I hope the next chapter is kinder.',
  'I wish I could stop carrying this fear so heavily.',
  'I want to feel seen without performing for it.',
  'I hope the people I love know how much I try.',
  'I want to believe my life is not late.',
  'I wish I could forgive myself in public and private.',
  'I hope the lonely parts of me find company.',
  'I want to trust the path even when I cannot see the end.',
  'I wish I were less afraid of being honest.',
  'I hope my courage arrives before my certainty does.',
  'I want to leave this season behind with more grace than fear.',
];

const CATEGORIES = ['hope', 'love', 'peace', 'healing', 'growth', 'clarity'];

async function seedDatabase() {
  console.log('Seeding database with development data...');

  try {
    await transaction(async (client) => {
      // Clear existing data
      await client.query('DELETE FROM wish_lights');
      await client.query('DELETE FROM stars');
      await client.query('DELETE FROM wishes');
      await client.query('DELETE FROM users');

      // Create test user
      const userResult = await client.query(
        `INSERT INTO users (anonymous_id) VALUES ($1) RETURNING id`,
        [`dev-user-${Date.now()}`]
      );
      const userId = userResult.rows[0].id;

      console.log(`Created test user: ${userId}`);

      // Generate wishes
      let wishCount = 0;
      for (let i = 0; i < 72; i++) {
        const text = SEED_WISHES[i % SEED_WISHES.length];
        const category = CATEGORIES[i % CATEGORIES.length];
        const createdAtOffset = -(i + 1) * 1000 * 60 * 24 * 2.7;
        const createdAt = new Date(Date.now() + createdAtOffset);

        const x = (i % 9) / 8 + ((i % 3) * 0.11);
        const y = (i % 11) / 10 + ((i % 5) * 0.08);
        const size = 1.2 + (((i * 7) % 8) / 7);
        const brightness = 0.7 + (((i * 13) % 10) / 10);
        const hue = 35 + ((i * 9) % 80);

        // Create wish
        const wishResult = await client.query(
          `INSERT INTO wishes (user_id, text, category, status, visibility, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [userId, text, category, 'approved', 'public', createdAt, createdAt]
        );
        const wishId = wishResult.rows[0].id;

        // Create star
        await client.query(
          `INSERT INTO stars (wish_id, x, y, size, brightness, hue, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [wishId, x, y, size, brightness, hue, createdAt]
        );

        // Add random light interactions
        const lightCount = 18 + (i % 23);
        for (let j = 0; j < Math.min(lightCount, 10); j++) {
          // Create additional test users for interactions
          const interactionUserResult = await client.query(
            `INSERT INTO users (anonymous_id) VALUES ($1) ON CONFLICT (anonymous_id) DO UPDATE SET last_seen_at = CURRENT_TIMESTAMP RETURNING id`,
            [`dev-user-interaction-${i}-${j}`]
          );
          const interactionUserId = interactionUserResult.rows[0].id;

          // Try to add light (will fail silently if user already sent light)
          await client.query(
            `INSERT INTO wish_lights (wish_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [wishId, interactionUserId]
          );
        }

        wishCount++;
        if (wishCount % 10 === 0) {
          console.log(`  Created ${wishCount} wishes...`);
        }
      }

      console.log(`✓ Created ${wishCount} wishes with interactions`);
    });

    console.log('✓ Database seed completed successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

seedDatabase();
