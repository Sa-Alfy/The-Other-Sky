-- The Other Sky Database Schema
-- Initial schema for user sessions, wishes, stars, and interactions

-- Users table (anonymous sessions)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wishes table
CREATE TABLE IF NOT EXISTS wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text VARCHAR(280) NOT NULL,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  visibility VARCHAR(20) DEFAULT 'public' NOT NULL CHECK (visibility IN ('public', 'private')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fulfilled_at TIMESTAMP
);

-- Stars table (visual representation of wishes)
CREATE TABLE IF NOT EXISTS stars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID UNIQUE NOT NULL REFERENCES wishes(id) ON DELETE CASCADE,
  x DECIMAL(5, 3) NOT NULL,
  y DECIMAL(5, 3) NOT NULL,
  z DECIMAL(5, 3) NOT NULL DEFAULT 0,
  size DECIMAL(4, 2) NOT NULL,
  brightness DECIMAL(4, 2) NOT NULL,
  hue INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wish lights (Send Light interactions)
CREATE TABLE IF NOT EXISTS wish_lights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID NOT NULL REFERENCES wishes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(wish_id, user_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_wishes_user_id ON wishes(user_id);
CREATE INDEX IF NOT EXISTS idx_wishes_created_at ON wishes(created_at);
CREATE INDEX IF NOT EXISTS idx_wishes_status ON wishes(status);
CREATE INDEX IF NOT EXISTS idx_wish_lights_wish_id ON wish_lights(wish_id);
CREATE INDEX IF NOT EXISTS idx_wish_lights_user_id ON wish_lights(user_id);
CREATE INDEX IF NOT EXISTS idx_stars_wish_id ON stars(wish_id);
CREATE INDEX IF NOT EXISTS idx_users_anonymous_id ON users(anonymous_id);
