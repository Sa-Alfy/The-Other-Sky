# Database Design — The Other Sky

## Overview

The Other Sky uses PostgreSQL as its persistent data store. The database schema is designed to support:

- Anonymous session tracking (without personal data)
- Wish persistence and moderation
- Visual star placement
- Send Light interactions with deduplication
- Rate limiting and abuse prevention

## Schema

### `users` Table
Represents anonymous browser sessions.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Each browser/device gets an opaque anonymous identifier. This allows:
- Rate limiting per user
- Preventing duplicate Send Light reactions
- Future personal sky functionality (without exposing identity)

**Privacy:** The `anonymous_id` is random and contains no personal information.

---

### `wishes` Table
Stores wish text and metadata.

```sql
CREATE TABLE wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text VARCHAR(280) NOT NULL,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fulfilled_at TIMESTAMP
);
```

**Statuses:**
- `pending` — Awaiting moderation review
- `approved` — Visible in the public sky
- `rejected` — Hidden; not returned by API
- `flagged` — Under review for abuse

**Current MVP behavior:** New wishes are created with `status='approved'` immediately (simplified workflow). In future phases, wishes can require admin approval.

**Indexes:**
- `idx_wishes_user_id` — Find wishes by creator
- `idx_wishes_created_at` — Sort by newest first
- `idx_wishes_status` — Filter by moderation state

---

### `stars` Table
Stores visual representation data separately from wish content.

```sql
CREATE TABLE stars (
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
```

**Purpose:** Keep rendering logic separate from wish content. Future rendering systems can query stars independently.

**Fields:**
- `x`, `y`, `z` — 3D coordinates (0.0 to 1.0 range; normalized for flexible rendering)
- `size`, `brightness` — Visual properties
- `hue` — Color in HSL (0-360 degrees)

---

### `wish_lights` Table
Stores Send Light interactions with deduplication.

```sql
CREATE TABLE wish_lights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID NOT NULL REFERENCES wishes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(wish_id, user_id)
);
```

**Key Feature:** The UNIQUE constraint on `(wish_id, user_id)` ensures each anonymous user can send light only once per wish.

When a user attempts to send light twice:
- First attempt: inserts a new record
- Second attempt: `ON CONFLICT DO NOTHING` silently ignores the duplicate

The API returns the updated wish with the current reaction count, so the UX feels consistent.

**Indexes:**
- `idx_wish_lights_wish_id` — Count reactions per wish
- `idx_wish_lights_user_id` — Find interactions by user

---

### `saved_wishes` Table
Stores private saved wishes per anonymous user session (Milestone 5).

```sql
CREATE TABLE saved_wishes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wish_id UUID NOT NULL REFERENCES wishes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, wish_id)
);
```

**Key Feature:** The composite primary key `(user_id, wish_id)` guarantees uniqueness and fast lookup for a user's Personal Sky saved collection.

---

### `moderation_events` Table
Tracks moderation actions, automated flags, user reports, and administrative decisions.

```sql
CREATE TABLE moderation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID NOT NULL REFERENCES wishes(id) ON DELETE CASCADE,
  action VARCHAR(30) NOT NULL,
  reason_code VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB
);
```

---

## Full-Text Search (The Mirror)

The `wishes` table includes a `search_vector` column of type `tsvector` with a GIN index:

```sql
ALTER TABLE wishes ADD COLUMN search_vector tsvector;
CREATE INDEX idx_wishes_search_vector ON wishes USING GIN(search_vector);
```

A PostgreSQL trigger automatically keeps `search_vector` updated upon insert or update:
```sql
to_tsvector('english', COALESCE(NEW.text, '') || ' ' || COALESCE(NEW.category, ''))
```

This powers **The Mirror** (`/api/mirror`) using `plainto_tsquery('english', query)` to calculate emotional similarity ranks without requiring external AI service dependencies.

---

## Local Development Setup

### Prerequisites

- PostgreSQL 12+ installed locally
- Node.js 18+

### 1. Create Local Database

```bash
# As your PostgreSQL user
createdb the_other_sky

# Optional: verify
psql the_other_sky -c "SELECT version();"
```

### 2. Set Environment Variables

Create `.env` in the project root:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/the_other_sky
PORT=3001
NODE_ENV=development
```

(Replace `postgres` and `password` with your local credentials if different.)

### 3. Install Dependencies

```bash
cd server
npm install
```

### 4. Run Migrations

```bash
npm run db:migrate
```

This creates all tables and indexes.

### 5. Seed Development Data

```bash
npm run db:seed
```

This populates ~72 wishes with random interactions for testing.

### 6. Start the Server

```bash
npm run dev
```

Server runs on http://localhost:3001

---

## Supabase Alternative

If local PostgreSQL is inconvenient, use [Supabase](https://supabase.com) (free tier available).

1. Create a Supabase project
2. Copy the PostgreSQL connection string from Supabase dashboard
3. Set `DATABASE_URL` in `.env`
4. Run `npm run db:migrate` and `npm run db:seed` as usual

**Important:** Never expose Supabase keys to the browser. Database access is always through the backend API.

---

## Rate Limiting

Rate limits are enforced in-memory on the backend (suitable for MVP single-server deployment).

Current limits:
- **Create wish:** 5 per hour per anonymous user
- **Send light:** 20 per hour per anonymous user

Limits are tracked in memory and reset with server restart. For production with multiple servers, migrate to Redis.

---

## Migrations

All schema changes are version-controlled in:

```
server/db/migrations/
```

Example:
```
001_initial_schema.sql
002_add_custom_fields.sql
```

Migration runner automatically:
- Detects which migrations have been run
- Executes new migrations in order
- Records completion in `_migrations` table

To reset development database:

```bash
npm run db:reset
```

This drops and recreates all data (use with care).

---

## Indexing

Current indexes optimize common API queries:

```
wishes(status)        → filter approved wishes
wishes(created_at)    → sort newest first
wishes(user_id)       → find creator's wishes
wish_lights(wish_id)  → count reactions
wish_lights(user_id)  → find user's light history
users(anonymous_id)   → lookup/create session
```

Do NOT blindly add indexes. Each index consumes memory and slows writes. Add indexes only when:
- A query is known to be slow
- It matches a pattern likely to repeat in production

---

## Backup & Restore

### Local PostgreSQL

```bash
# Dump
pg_dump the_other_sky > backup.sql

# Restore
psql the_other_sky < backup.sql
```

### Supabase

Supabase provides automated daily backups. Access them via the dashboard.

---

## Privacy & Security Notes

### What is NOT stored:
- Real names
- Email addresses
- IP addresses (not recorded in the database)
- Precise location data
- Browser fingerprints

### What IS stored:
- Random `anonymous_id` (untrackable to a person)
- Wish text (user-submitted, treated as untrusted)
- Timestamps (for sorting and rate limiting)
- Interaction counts

### XSS Protection:
- All user-submitted text stored as plain text
- React frontend escapes text content by default
- API never returns HTML; only JSON
- If future features use rich text, must sanitize carefully

---

## Future Enhancements

### Phase 2+:
- Redis for rate limiting (scales across servers)
- Moderation dashboard (admin interface)
- Wish archive (timestamped retention)
- Analytics (anonymized usage patterns)
- Spatial indexing for fast sky queries
- Connection pooling with pgBouncer
- Read replicas for scaling reads

### Not in Scope (Milestone 2):
- User authentication/accounts
- Custom user profiles
- Direct messaging
- Temporal features (Morning Sky, Night Archive)
- Constellation intelligence
- Production scaling infrastructure

