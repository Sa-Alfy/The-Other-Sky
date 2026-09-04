# Project Status — Milestone 5 Complete

## Current state
**Milestone 5: Personal Sky, Constellations, Mirror & Morning Sky**

All Phase 5 features specified in the project roadmap are implemented and verified:
- Migration `003_personal_sky.sql` executed (saved_wishes table, fulfillment_note column, tsvector search).
- Personal Sky (`/me`) with 3 tabs: My Wishes, Saved Wishes, Light Sent.
- Morning Sky (`/morning-sky`) celebrating fulfilled wishes and fulfillment notes.
- Constellations (`/constellations`) grouping wishes across 6 core categories.
- The Mirror (`/api/mirror` + `MirrorPanel`) for emotional resonance discovery.
- Wish Detail enhancements: Active Save toggle and Mirror button.
- 100% test pass rate: 7/7 server tests and 14/14 frontend tests passing. Build & lint clean.

## Detected stack
- **Frontend**: React 19, TypeScript, Vite, Vitest, Testing Library
- **Backend**: Node.js with Express, TypeScript, Zod, `pg`, `express-rate-limit`
- **Database**: PostgreSQL 16.1 (zip binaries at `C:\pg16\pgsql`, data at `C:\pg16\data`)
- **Styling**: Custom CSS with the existing dark, cinematic aesthetic

## Milestone 4 verification results

All commands were run on **2026-09-03** against a live PostgreSQL 16.1 instance with the full seeded dataset.

### Step 1 — Build and test suite (Postgres configured)

`server/.env` created with `DATABASE_URL=postgres://postgres@127.0.0.1:5432/the_other_sky`.
`server/src/db.ts` updated to call `dotenv.config()` before creating the pool so that `npm run db:migrate`, `npm run db:seed`, and `npm test` all read the `.env` file correctly.

```
> npm run db:reset           # migrate + seed
✓ All migrations completed successfully
✓ Created 72 wishes with interactions

> cd server && npm test
✔ spam screening flags obvious URLs and flooding (0.85ms)
✔ rate limiting blocks the sixth wish for one identity (1.69ms)
✔ rate-limit buckets are independent per identity (0.17ms)
ℹ tests 3  pass 3  fail 0  duration_ms 103

> cd frontend && npm run build
✓ built in 170ms   (tsc -b passed; no TypeScript errors)

> cd frontend && npm run lint
Found 0 warnings and 0 errors.

> cd frontend && npm test
✓ src/App.test.tsx (1 test)  Tests 1 passed
```

### Step 2 — Services boot

```
# PostgreSQL 16.1 started via:
C:\pg16\pgsql\bin\postgres.exe -D C:\pg16\data
# Log: "database system is ready to accept connections"

# Backend:
cd server && npm start
# Server running on http://localhost:3001
# Database: Connected to PostgreSQL

# Frontend:
cd frontend && npm run dev
# VITE v8.2.2  ready in 205 ms  →  http://localhost:5173/

curl http://localhost:3001/api/health  →  {"success":true,"data":{"status":"ok"}}
curl -I http://localhost:5173/          →  HTTP/1.1 200 OK
```

### Step 3a — Cookie rate-limit buckets are independent

Five wishes from bucket A all succeed (HTTP 201).
Sixth wish from bucket A → HTTP 429 `RATE_LIMITED`.
First wish from bucket B → HTTP 201 (independent bucket, unaffected).

```json
// 6th from A
{"success":false,"error":{"error":"Too many wishes created recently...","code":"RATE_LIMITED"}}
HTTP_STATUS: 429

// 1st from B
{"success":true,"data":{"id":"baa8e478-...","text":"Wish 1 from B independent","status":"approved",...}}
```

### Step 3b — Duplicate light is idempotent

Sending light twice from the same cookie to the same wish returns HTTP 200 both times,
but the `reactions` count stays the same (PostgreSQL `ON CONFLICT DO NOTHING` + `COUNT`).

```json
// 1st light  →  reactions: 11
// 2nd light  →  reactions: 11   (no double-count)
```

### Step 3c — Spam screening flags and excludes

URL wish → `status: "flagged"` in the creation response; absent from `GET /api/wishes`.
Repeat-character flood → `status: "flagged"`.
`GET /api/wishes` confirmed: no flagged wishes appear in the public list.

```json
{"success":true,"data":{"text":"Check out http://example.com for deals","status":"flagged",...}}
// Public list response does not contain "example.com" — PASS
```

### Step 3d — Three-reporter flagging threshold

- After 1 report: wish still `approved`, visible via `GET /api/wishes/:id`.
- After 2 reports: wish still `approved`.
- After 3rd unique reporter: wish becomes `flagged`; `GET /api/wishes/:id` returns `404 NOT_FOUND`.

```json
// After 3rd report:
{"success":false,"error":{"code":"NOT_FOUND","message":"Wish not found."}}
```

### Step 3e/3f — Admin authorization

No token → HTTP 401 `UNAUTHORIZED`.  
Correct `Authorization: Bearer test-admin-token` → HTTP 200, queue returned with all flagged wishes.

```json
// No token
{"success":false,"error":{"code":"UNAUTHORIZED","message":"Admin authorization required."}}

// With token — queue includes 4 flagged items (spam + report-threshold wish)
{"success":true,"data":[...4 flagged wishes...]}
```

Admin `POST /api/admin/wishes/:id/moderate` with `{"action":"approve"}` re-approves the wish;
`GET /api/wishes/:id` subsequently returns HTTP 200.

### Step 4 — Browser and accessibility verification

Tested via browser subagent at `http://localhost:5173/`.

| Check | Result |
|---|---|
| Landing screen shows "Enter the Sky" button | ✅ PASS |
| Canvas galaxy / star field renders | ✅ PASS |
| Tab key moves focus through star buttons | ✅ PASS |
| Focused star opens wish panel on Enter/click | ✅ PASS |
| Wish panel shows text, light count, Send Light button | ✅ PASS |
| Send Light increments reaction count | ✅ PASS |
| "Leave a Wish" opens modal with labelled form | ✅ PASS |
| Wish submission adds new star to sky | ✅ PASS |
| Semantic `<button>` with `aria-label` on star buttons | ✅ PASS |
| Zero JS errors in DevTools console | ✅ PASS |

## Milestone 5 Verification Results

All tests run on **2026-09-05** against PostgreSQL 16.1:

```
# Server tests:
> cd server && npm test
✔ spam screening flags obvious URLs and flooding
✔ rate limiting blocks the sixth wish for one identity
✔ rate-limit buckets are independent per identity
✔ save and unsave wish updates saved collection
✔ voluntary wish fulfillment and Morning Sky retrieval
✔ constellations list categories with counts and descriptions
✔ mirror returns related wishes excluding source wish
ℹ tests 7 | pass 7 | fail 0

# Frontend tests:
> cd frontend && npm test
Test Files  3 passed (3)
Tests       15 passed (15)
- App.test.tsx (6 tests)
- GalaxyCanvas.test.tsx (2 tests)
- starColors.test.ts (7 tests)

# Frontend build & lint:
> cd frontend && npm run build
✓ built in 849ms (tsc -b passed; no errors)

> cd frontend && npm run lint
Found 0 warnings and 0 errors.
```

### Milestone 5 Feature Verification Checklist

| Feature | Endpoint / Component | Result |
|---|---|---|
| Personal Sky (`/me`) | `GET /api/me/sky`, `PersonalSky.tsx` | ✅ PASS |
| Save Wish | `POST /api/wishes/:id/save` | ✅ PASS |
| Unsave Wish | `DELETE /api/wishes/:id/save` | ✅ PASS |
| Voluntary Fulfillment | `POST /api/wishes/:id/fulfill` | ✅ PASS |
| Morning Sky (`/morning-sky`) | `GET /api/morning-sky`, `MorningSky.tsx` | ✅ PASS |
| Constellations | `GET /api/constellations`, `Constellations.tsx` | ✅ PASS |
| Category Filtering | `GET /api/wishes?category=...` | ✅ PASS |
| The Mirror | `GET /api/mirror?wishId=...`, `MirrorPanel.tsx` | ✅ PASS |
| Deep-link Close Fix | URL parameter sync on card close | ✅ PASS |

## Known limitations
- The in-memory primary rate limiter resets when the server restarts; Redis is a production follow-up
- Admin moderation uses one shared bearer token; no dedicated admin dashboard UI yet
- Canvas rendering is 2D; WebGL/instancing deferred until star counts justify it
- Spatial viewport tile queries deferred until wish count exceeds 10k

## Verification status
- ✓ Milestone 5 complete and verified
- ✓ `npm run build` (frontend) — zero TypeScript or build errors (849ms)
- ✓ `npm run lint` (frontend oxlint) — 0 warnings, 0 errors
- ✓ `npm test` (frontend Vitest) — 3 files, 15/15 tests pass
- ✓ `npm test` (server) — 7/7 pass against real PostgreSQL 16.1
- ✓ Database migration `003_personal_sky.sql` executed
- ✓ Full-text search `tsvector` trigger and GIN index active

## Next implementation milestone
**Milestone 6 — Semantic Clustering, Spatial Loading & Admin UI**
- Semantic embeddings for advanced constellation boundaries
- Viewport bounding-box queries (`GET /api/galaxy?centerX=...`)
- Dedicated administrative moderation dashboard UI
