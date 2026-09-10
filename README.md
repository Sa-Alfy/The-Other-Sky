# The Other Sky

A quiet, anonymous digital universe where wishes become stars.

## Current milestone
**Milestone 6.1: Depth-Driven Sky & Navigation UI**

Refines the Milestone 6 depth work so the sky actually reads as three-dimensional, and adds in-sky navigation. (Note: this is distinct from the spec's *Phase 6 — Semantic Clustering*, which remains upcoming; see [docs/ROADMAP.md](docs/ROADMAP.md).)

Phase 5 core product features plus the depth/navigation work are implemented and verified:
- **Interactive Galaxy**: 2D HTML5 canvas where **depth is the dominant visual cue**. A star's stored depth (`z`) drives its radius (~3.5× spread front to back), opacity, core sharpness and twinkle amplitude, with per-star `size`/`brightness` applied only as a ±15% jitter — far stars are faint diffuse specks, near stars crisp points with a specular centre. Stars are drawn far-to-near (painter's algorithm).
- **Parallax & perspective**: Camera panning is distributed across depth (0.45–1.50 pan factors), and zoom is per-depth, so zooming expands near layers faster than far ones. The galactic band and three ambient dust sheets are rendered **in-canvas** so they parallax with the sky rather than staying fixed to the viewport, with dust clustering along the same diagonal band the server biases star placement toward (`starPlacement.ts`).
- **Constellation lines**: When a single constellation is in view (`?category=...`), its stars are connected into one shape via a minimum spanning tree over world-space distance — every star joins with a line to its nearest neighbour, with no full mesh and no orphans.
- **Ambient idle drift**: After a few seconds without input the camera wanders gently on a bounded path so the sky feels alive; any interaction, an open selection, or `prefers-reduced-motion` suppresses it immediately.
- **Find a wish**: Client-side keyword search in the sky's top bar filters the visible stars with a live match count, no extra API calls.
- **Accessibility**: Full reduced-motion support (no twinkle, no drift, instant camera settle) and a screen-reader list mirroring the visible stars.
- **Personal Sky (`/me`)**: Private three-tab sanctuary for tracking your own wishes, saved stranger wishes, and light sent history, with voluntary fulfillment actions and a **recovery-phrase flow** ("Already have a sky? Recover it") so the sky can be found again from a different browser/device without any account, email, or password.
- **Keep this link**: Releasing a wish surfaces a shareable `?wishId=...` deep-link so an anonymous author can return to their own wish later, independent of the recovery phrase. The composer shows a live character count against the 280-character limit.
- **The Morning Sky (`/morning-sky`)**: Serene dawn space showcasing wishes that came true (*"It happened."*) with personal fulfillment reflections.
- **Constellations (`/constellations`)**: Thematic clustering across 6 core categories (Hope, Love, Peace, Healing, Growth, Clarity) with star counts and evocative descriptions.
- **The Mirror (`/api/mirror` + `MirrorPanel`)**: Emotional resonance discovery finding related stranger wishes using PostgreSQL full-text search (`tsvector`), returning *"You're not the only one."*
- **Save / Unsave**: Instant wish saving into the user's private collection.
- **Deep-linking & Navigation**: Direct navigation via `?wishId=...` and `?category=...`, with responsive navigation bar and smooth dialog dismissal.
- **Durable Persistence & Moderation**: PostgreSQL 16 backing, automated spam screening, 3-report threshold flagging, and Bearer-token admin moderation.
- **Privacy Enforcement**: Full isolation of private wishes across public listing, direct lookup, Morning Sky, Mirror echoes, and stranger saves.

## Stack
- **Frontend**: React 19 + TypeScript + Vite + React Router DOM
- **Backend**: Node.js + TypeScript + Express + Zod + pg
- **Database**: PostgreSQL 16 (local or Supabase)
- **Authentication**: Privacy-first anonymous cookie sessions (`othersky_sid`, no passwords, no email collection), with an optional recovery-phrase flow to find your Personal Sky again from another browser or device.

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
- **Drag** to pan and **scroll / pinch** to zoom — near stars shift and grow faster than distant ones. Leave it untouched for a few seconds and the sky drifts on its own.
- Click any star to view its wish, send light, save it, or consult **✦ Mirror** echoes.
- Use **"Find a wish…"** in the top bar to filter the sky down to stars matching a keyword.
- Click **"Leave a Wish"** to compose and release a wish as a new star into the universe, then keep the returned link to find it again.
- Use the top navigation bar to explore **Constellations**, the **Morning Sky**, and your **Personal Sky**. Opening a single constellation draws its stars connected into one shape.

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
Test Files  4 passed (4)
Tests       22 passed (22)
- App.test.tsx (6 tests)
- GalaxyCanvas.test.tsx (2 tests)
- PersonalSky.test.tsx (7 tests)
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
✔ regression: private wishes do not leak across public queries

tests 8 | pass 8 | fail 0
```

---

**Status:** Milestone 6.1 Complete  
**Last updated:** 2026-09-10  
