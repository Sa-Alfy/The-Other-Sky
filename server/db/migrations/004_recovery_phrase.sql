-- Migration 004: Personal Sky Recovery Phrase

ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_key_hash TEXT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_recovery_key_hash ON users(recovery_key_hash) WHERE recovery_key_hash IS NOT NULL;
