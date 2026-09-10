# Architecture

## System Overview

The Other Sky is a three-tier system:

```
┌─────────────────────────────────┐
│   React Frontend (Vite)         │
│   - Landing page                │
│   - Galaxy/starfield            │
│   - Wish composer               │
│   - Send light interaction      │
└──────────┬──────────────────────┘
           │ HTTP (JSON)
           │
┌──────────▼──────────────────────┐
│   Express.js Backend API        │
│   - Session management          │
│   - Rate limiting               │
│   - Input validation            │
│   - Error handling              │
└──────────┬──────────────────────┘
           │ SQL queries
           │
┌──────────▼──────────────────────┐
│   PostgreSQL Database           │
│   - Users (anonymous sessions)  │
│   - Wishes (text + metadata)    │
│   - Stars (visual placement)    │
│   - Wish Lights (reactions)     │
└─────────────────────────────────┘
```

## Key Design Principles

### 1. Anonymous by Design
- No user accounts, passwords, or email collection
- Each browser gets an opaque `anonymous_id` (random, untrackable)
- Session persists in `localStorage` (client-side)
- Backend tracks anonymous identity only for rate limiting and deduplication

### 2. Content as Text
- Wishes are plain text (280 character limit)
- No media uploads, no rich formatting
- React escapes all text content automatically (prevents XSS)
- Database stores text as-is, never executes it

### 3. Persistence Without Accounts
- Wishes persist in database after creation
- Each wish linked to creator's `user_id` (UUID, never exposed to frontend)
- Users cannot modify or delete their wishes (intentional: privacy + simplicity)
- "Send Light" interactions deduplicated per anonymous user per wish

### 4. Simple Moderation Model
- Wishes have `status` field: `pending | approved | rejected | flagged`
- MVP: all new wishes created as `approved` immediately
- Future: admin review queue before visibility
- API only returns `approved` wishes to frontend

### 5. Rate Limiting (Abuse Prevention)
- In-memory rate limiter (MVP; suitable for single-server)
- Limits per `anonymous_id`:
  - Create wish: 5 per hour
  - Send light: 20 per hour
- Prevents spam without requiring login
- Clear error responses when limits exceeded

## Frontend Architecture

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS

```
src/
  App.tsx           ← Main component
  App.css           ← Styling (custom + Tailwind)
  main.tsx          ← React entry point
  index.css         ← Global reset
  assets/           ← Images, icons (future)
```

**Key Features:**
- Manages anonymous session in `localStorage`
- All API calls include `anonymous_id` query parameter
- Handles loading/error states gracefully
- No state management library (React hooks sufficient for MVP)
- Responsive mobile-first CSS
- Accessibility: ARIA labels, semantic HTML, keyboard nav, prefers-reduced-motion

**Session Management:**
```typescript
// Client stores and reuses anonymous ID
const anonymousId = localStorage.getItem('othersky_anonymous_id')
  ?? generateFromServer()

// Passes in every API call
fetch(`/api/wishes?anonymous_id=${anonymousId}`)
```

## Backend Architecture

**Stack:** Node.js + Express + TypeScript + PostgreSQL (pg library)

```
src/
  index.ts          ← Express server & routes
  db.ts             ← PostgreSQL connection pool
  storageDb.ts      ← Query layer (wishes, stars, lights)
  types.ts          ← TypeScript type definitions
  utils.ts          ← Helpers (anonymous ID generation, error handling)
  runMigrations.ts  ← Migration runner
  seedDb.ts         ← Development seed script

db/
  migrations/
    001_initial_schema.sql
```

**Request Flow:**

```
GET /api/wishes
  ↓
Express middleware → extract/create anonymous_id
  ↓
Route handler → call listWishes()
  ↓
storageDb.listWishes() → SELECT from database
  ↓
Hydrate response (join wishes + stars + reaction counts)
  ↓
Return JSON → frontend
```

**Key Files:**

### `index.ts` (Express Server)
- Route definitions
- Request/response handling
- Error handling (never leak SQL/credentials)
- Anonymous session middleware
- Zod schema validation

### `db.ts` (Database Connection)
- Connection pool management
- Query execution with error logging
- Transaction support (for multi-step operations)
- Slow query detection

### `storageDb.ts` (Query Layer)
- `listWishes()` — Get all approved wishes with reactions
- `getWishById(id)` — Fetch single wish
- `createWish(input, anonymousId)` — Insert wish + star (with rate limiting)
- `addLight(wishId, anonymousId)` — Record Send Light (with deduplication)
- In-memory rate limit store
- Response hydration (converts DB rows to API schema)

### `runMigrations.ts` (Schema Management)
- Automatic migration discovery and execution
- Tracks which migrations have been run
- Idempotent (safe to run multiple times)

### `seedDb.ts` (Development Data)
- Generates ~72 wishes from predefined pool
- Creates interaction records
- Clears and repopulates database

## Database Schema

See [DATABASE.md](DATABASE.md) for detailed schema documentation.

**Tables:**
- `users` — Anonymous sessions
- `wishes` — Wish text & metadata
- `stars` — Visual star placement
- `wish_lights` — Send Light reactions (deduplicated)
- `_migrations` — Schema version tracking

**Key Constraints:**
- `wishes.status` ensures only valid states
- `wish_lights(wish_id, user_id)` UNIQUE prevents duplicate lights
- Foreign keys with CASCADE delete maintain referential integrity

## API Contract

See [API.md](API.md) for detailed endpoint documentation.

**Endpoints:**
```
GET    /api/health            ← Health check
GET    /api/wishes            ← List all wishes
GET    /api/wishes/:id        ← Get single wish
POST   /api/wishes            ← Create new wish
POST   /api/wishes/:id/light  ← Send light reaction
```

**Response Format (all endpoints):**
```json
{
  "success": true|false,
  "data": {...},              // On success
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }                           // On error
}
```

## Error Handling

**Backend:**
- Catches all database errors
- Never leaks SQL, connection strings, or stack traces
- Returns safe, user-friendly error messages
- Logs full errors internally for debugging

**Frontend:**
- Displays calm error UI at top of screen
- User can dismiss error and retry
- Shows loading states during API calls
- Handles network timeouts gracefully

## Security Considerations

### What We Protect Against:
- **XSS:** React escapes text by default; no `dangerouslySetInnerHTML`
- **SQL Injection:** Uses parameterized queries (pg library handles this)
- **CSRF:** CORS enabled; API is GET/POST only, no state mutation via URL
- **Rate Limiting:** Prevents wish/light spam via anonymous tracking
- **Duplicate Lights:** Database constraint + ON CONFLICT clause

### What We Don't (MVP Scope):
- HTTPS is recommended for production but not enforced in code
- No API authentication (anonymous by design)
- No database encryption at rest (Supabase provides this)
- No analytics/tracking (intentional privacy choice)

## Performance Considerations

### Current (MVP):
- Rate limiter in-memory (resets on server restart)
- Pagination not implemented (assumes < 10k wishes)
- No caching layer
- Indexes added to frequently-queried columns

### Future:
- Redis for rate limiting (scales across servers)
- Pagination/infinite scroll for wish list
- Star spatial index for fast region queries
- Read replicas for scaling reads

## Deployment

**Development:**
- `npm run dev` on each service
- `.env` file with `DATABASE_URL`

**Production:**
See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Environment variables
- Database hosting (Supabase recommended for MVP)
- Server hosting options
- SSL/TLS setup
- Backup strategy

## Testing

Not yet implemented. Planned for future phases.

Expected test coverage:
- Database: CRUD operations
- API: valid/invalid requests, rate limiting, error cases
- Security: XSS, SQL injection, duplicate deduplication
- Frontend: component rendering, user interactions

---

**Last Updated:** Milestone 2  
**Status:** Database integration complete

