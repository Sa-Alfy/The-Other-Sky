# The Other Sky

A quiet, anonymous digital universe where wishes become stars.

## Current milestone
**Milestone 5 Complete: Personal Sky, Constellations, Mirror & Morning Sky**

All Phase 5 product features from the project specification are implemented and verified:
- **Interactive Galaxy**: 2D HTML5 canvas with smooth camera lerping, star temperature hues, twinkle animations, and full reduced-motion accessibility.
- **Personal Sky (`/me`)**: Private three-tab sanctuary for tracking your own wishes, saved stranger wishes, and light sent history, with voluntary fulfillment actions.
- **The Morning Sky (`/morning-sky`)**: Serene dawn space showcasing wishes that came true (*"It happened."*) with personal fulfillment reflections.
- **Constellations (`/constellations`)**: Thematic clustering across 6 core categories (Hope, Love, Peace, Healing, Growth, Clarity) with star counts and evocative descriptions.
- **The Mirror (`/api/mirror` + `MirrorPanel`)**: Emotional resonance discovery finding related stranger wishes using PostgreSQL full-text search (`tsvector`), returning *"You're not the only one."*
- **Save / Unsave**: Instant wish saving into the user's private collection.
- **Deep-linking & Navigation**: Direct navigation via `?wishId=...` and `?category=...`, with responsive navigation bar and smooth dialog dismissal.
- **Durable Persistence & Moderation**: PostgreSQL 16 backing, automated spam screening, 3-report threshold flagging, and Bearer-token admin moderation.

## Stack
- **Frontend**: React 19 + TypeScript + Vite + React Router DOM
- **Backend**: Node.js + TypeScript + Express + Zod + pg
- **Database**: PostgreSQL 16 (local or Supabase)
- **Authentication**: Privacy-first anonymous cookie sessions (`othersky_sid`, no passwords, no email collection)

## Prerequisites
- PostgreSQL 12+ (or Supabase account)
- Node.js 18+ (tested on Node 20 / 22 LTS)
- npm 10+ or 11+

## Quick Start

### 1. Database Setup

Ensure PostgreSQL is running and create the database:
```bash
createdb the_other_sky
```

Create `server/.env`:
```env
DATABASE_URL=postgres://postgres@127.0.0.1:5432/the_other_sky
PORT=3001
NODE_ENV=development
ADMIN_TOKEN=test-admin-token
FRONTEND_ORIGIN=http://localhost:5173
```

Run database migrations:
```bash
cd server
npm install
npm run db:migrate
npm run db:seed
```

### 2. Run Development Servers

From the project root:
```bash
npm run dev
```

Or run frontend and backend in separate terminals:

**Terminal 1 (Backend on http://localhost:3001):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend on http://localhost:5173):**
```bash
cd frontend
npm run dev
```

### 3. Explore The Other Sky

Open **`http://localhost:5173`**:
- Click **"Enter the Sky"** to explore the celestial canvas.
- Click any star to view its wish, send light, save it, or consult **✦ Mirror** echoes.
- Click **"Leave a Wish"** to compose and release a wish as a new star into the universe.
- Use the top navigation bar to explore **Constellations**, the **Morning Sky**, and your **Personal Sky**.

## Key Commands

### Frontend
```bash
cd frontend
npm install         # Clean install
npm run dev         # Development server on port 5173
npm run build       # Production build (tsc -b && vite build)
npm run lint        # Oxlint linter (0 errors, 0 warnings)
npm test            # Vitest test suite (15/15 tests passing)
```

### Backend
```bash
cd server
npm run dev         # Development server with auto-reload (tsx)
npm run build       # Compile TypeScript (tsc)
npm test            # Run backend test runner (7/7 tests passing)
npm run db:migrate  # Run pending database migrations
npm run db:seed     # Seed development data (72 wishes + stars)
npm run db:reset    # Reset and re-seed database
```

## Project Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System and component architecture
- [docs/API.md](docs/API.md) — Complete REST API contract
- [docs/DATABASE.md](docs/DATABASE.md) — Schema, migrations, and indexing guide
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Production deployment guide
- [docs/ROADMAP.md](docs/ROADMAP.md) — Milestone roadmap and progress
- [PROJECT_STATUS.md](PROJECT_STATUS.md) — Verification records and test logs
- [THE_OTHER_SKY_PROJECT_SPEC.md](THE_OTHER_SKY_PROJECT_SPEC.md) — Canonical product & technical specification

## Important: This is not a social network

The Other Sky is intentionally **not**:
- A follower/following social graph
- A profile system with usernames or avatars
- A recommendation engagement feed
- A gamified point-scoring system

It is:
- Anonymous by design
- Text-first and contemplative
- Privacy-respecting (zero PII, zero surveillance analytics)
- Emotionally focused: witnessing over liking

## Development & Test Verification

### Frontend Suite (Vitest)
```text
Test Files  3 passed (3)
Tests       15 passed (15)
- App.test.tsx (6 tests)
- GalaxyCanvas.test.tsx (2 tests)
- starColors.test.ts (7 tests)
```

### Server Suite (Node Test Runner)
```text
✔ spam screening flags obvious URLs and flooding
✔ rate limiting blocks the sixth wish for one identity
✔ rate-limit buckets are independent per identity
✔ save and unsave wish updates saved collection
✔ voluntary wish fulfillment and Morning Sky retrieval
✔ constellations list categories with counts and descriptions
✔ mirror returns related wishes excluding source wish

tests 7 | pass 7 | fail 0
```

---

**Status:** Milestone 5 Complete  
**Last updated:** 2026-09-05  
