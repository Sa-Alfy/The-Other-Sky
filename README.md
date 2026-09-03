# The Other Sky

A quiet, anonymous digital universe where wishes become stars.

## Current milestone
**Milestone 4: End-to-End Verification (Postgres + Browser)**

The core application and Milestone 3 verification work are complete. The implementation supports:
- Real wish persistence (survives server restart)
- Anonymous session tracking (no accounts, no personal data)
- Rate limiting and abuse prevention
- Moderation-aware wish storage
- Browser-verified galaxy, wish, light, and submission flows

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + TypeScript + Express
- Database: PostgreSQL (local or Supabase)
- Authentication: Anonymous sessions (no passwords, no emails)

## Prerequisites
- PostgreSQL 12+ (or Supabase account)
- Node.js 18+
- npm or yarn

## Quick Start

### 1. Database Setup

#### Option A: Local PostgreSQL
```bash
# Create database
createdb the_other_sky

# Create .env file in root
cat > .env << EOF
DATABASE_URL=postgresql://postgres:password@localhost:5432/the_other_sky
PORT=3001
NODE_ENV=development
EOF
```

#### Option B: Supabase
```bash
# Get connection string from Supabase dashboard
# Create .env with your Supabase connection:
cat > .env << EOF
DATABASE_URL=postgresql://[user]:[password]@[project].supabase.co:5432/postgres
PORT=3001
NODE_ENV=development
EOF
```

### 2. Install & Initialize

```bash
# Install dependencies
npm install

# Run database migrations
cd server
npm install
npm run db:migrate

# Seed with development wishes
npm run db:seed

# Return to root
cd ..
```

### 3. Run Development Servers

From the root directory:

```bash
# Run both frontend and backend
npm run dev:frontend &
npm run dev:server &
```

Or in separate terminals:

**Terminal 1 (Frontend on http://localhost:5173):**
```bash
cd frontend
npm run dev
```

**Terminal 2 (Backend on http://localhost:3001):**
```bash
cd server
npm run dev
```

### 4. Test the App

Open http://localhost:5173 and verify:
- ✓ Landing page loads
- ✓ Enter Sky → galaxy appears
- ✓ Click a star → wish displays
- ✓ Send Light → counter increases
- ✓ Leave a Wish → release animation plays
- ✓ Refresh browser → data persists ✓

## Key Commands

### Frontend
```bash
cd frontend
npm install         # Clean install verified
npm run dev      # Dev server
npm run build    # Production build
npm run lint     # Check code style
npm test          # Run Vitest tests
```

### Backend
```bash
cd server
npm run dev           # Dev server with auto-reload
npm run build         # Compile TypeScript
npm run db:migrate    # Run database migrations
npm run db:seed       # Seed development data
npm run db:reset      # Reset and re-seed database
```

## Database

See [docs/DATABASE.md](docs/DATABASE.md) for:
- Schema documentation
- Migration system
- Rate limiting
- Privacy & security design
- Setup troubleshooting

## Project Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System overview
- [docs/API.md](docs/API.md) — API contract
- [docs/DATABASE.md](docs/DATABASE.md) — Database design
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Deployment guide
- [docs/ROADMAP.md](docs/ROADMAP.md) — Feature roadmap

## Important: This is not a social network

The Other Sky is intentionally **not**:
- A follower/follower social graph
- A profile system with usernames
- A recommendation algorithm
- A gamification system

It is:
- Anonymous by design
- Text-first (no media feeds)
- Contemplative (no real-time notifications)
- Privacy-respecting (no tracking, no analytics packages)

## Development Notes

### Environment Variables
See `.env.example` for required variables.

### TypeScript
Both frontend and backend use strict TypeScript. No `any` types.

### Linting
```bash
npm run lint  # Frontend (oxlint)
cd server && npm run lint  # Backend (TypeScript compiler)
```

### Testing
Frontend verification from a clean install:

```text
npm run build      # Passed with zero TypeScript errors
npm run lint       # Passed with zero warnings and errors
npm test           # 3 files passed, 10 tests passed
```

Server verification from a clean install:

```text
npm run build      # Passed
npm test           # 3 tests passed, 0 failed
```

The canvas tests print jsdom `HTMLCanvasElement.getContext()` not-implemented
warnings because jsdom does not execute real canvas drawing. Browser verification
is still required for rendering and interaction behavior.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production setup guidance.

---

**Status:** Milestone 4 verification complete; Milestone 5 is next
**Last updated:** 2026-09-04
