# Project Status — Milestone 4 Complete

## Current state
**Milestone 4: End-to-End Verification (Postgres + Browser)**

All pending Milestone 3 verification items are now closed with real evidence.
Milestone 4 is complete. Phase 5 features (Personal Sky, Constellations, Mirror, Morning Sky) have not started.

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

## Known limitations (unchanged from Milestone 3)
- The in-memory primary rate limiter resets when the server restarts; Redis is a production follow-up
- Admin moderation uses one shared bearer token; no admin UI yet
- Canvas rendering is 2D; WebGL/instancing deferred until star counts justify it
- Pagination and spatial loading are not yet implemented
- No accounts, personal sky, constellations, categories filtering, Mirror, or Morning Sky yet

## Verification status
- ✓ Milestone 3.1 build/test fixes committed (commit `9db838a`)
- ✓ `npm run build` (frontend) — zero TypeScript or build errors
- ✓ `npm run lint` (frontend oxlint) — 0 warnings, 0 errors
- ✓ Milestone 3.4 clean frontend install — plain `npm install` succeeds with `@testing-library/dom@10.4.1`
- ✓ `npm test` (frontend Vitest) — 3 files, 10/10 tests pass
- ✓ `npm test` (server) — 3/3 pass against real PostgreSQL 16.1
- ✓ Cookie rate-limit buckets — independently enforced, 5-wish cap confirmed
- ✓ Duplicate light — idempotent via DB unique constraint
- ✓ Spam screening — URL and flood patterns auto-flagged, excluded from public list
- ✓ Report threshold — 3 unique reporters flag a wish (1 and 2 do not)
- ✓ Admin auth — 401 without token, 200 with correct Bearer token
- ✓ Admin moderate — approve/reject changes wish status and public visibility
- ✓ Browser UI — landing, galaxy canvas, keyboard nav, wish panel, wish form all work
- ✓ Browser accessibility — semantic HTML, aria-labels on buttons, zero console errors

### Milestone 3.4 — Clean-install pipeline

Verified on 2026-09-04 from fresh dependency directories:

```text
frontend: npm install, npm run build, npm run lint, npm test — all passed
server:   npm install, npm run build, npm test — all passed
```

The frontend fix adds `@testing-library/dom` as a devDependency for the Testing
Library peer requirements. No Vitest version change or `.npmrc` workaround was needed; plain `npm install` completed successfully.
needed; plain `npm install` completed successfully.

Frontend canvas tests still print jsdom `HTMLCanvasElement.getContext()`
not-implemented warnings. Those tests verify mounting and non-throwing behavior,
not real canvas rendering or interaction; browser verification remains the source
of truth for those behaviors.

## How to run

```bash
# Start PostgreSQL (if not already running)
C:\pg16\pgsql\bin\postgres.exe -D C:\pg16\data

# In server/
npm install
npm run db:migrate
npm run db:seed
npm start          # or: npm run dev

# In frontend/
npm install
npm run dev
```

Set `ADMIN_TOKEN` in `server/.env` for admin endpoints. Set `FRONTEND_ORIGIN` when the frontend is not at `http://localhost:5173`.

## Next implementation milestone
**Milestone 5 — Phase 5 product features**

Milestone 4 verification is signed off. The next work follows the project specification:
Personal Sky, Constellations, Mirror, and Morning Sky features.
