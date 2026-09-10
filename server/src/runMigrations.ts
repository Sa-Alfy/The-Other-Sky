import fs from 'fs';
import path from 'path';
import { query, closePool } from './db';

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');

async function runMigrations() {
  console.log('Starting database migrations...');

  try {
    // Create migrations tracking table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get all migration files
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      // Check if migration has been run
      const result = await query(
        'SELECT * FROM _migrations WHERE name = $1',
        [file]
      );

      if (result.rows.length > 0) {
        console.log(`✓ Migration already run: ${file}`);
        continue;
      }

      // Read and execute migration
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`Running migration: ${file}`);
      await query(sql);

      // Record migration
      await query(
        'INSERT INTO _migrations (name) VALUES ($1)',
        [file]
      );

      console.log(`✓ Completed: ${file}`);
    }

    console.log('✓ All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

runMigrations();
