# Project Status - Milestone 3 Complete

## Current state
**Milestone 3: Security, Abuse Prevention & Rendering Correctness**

Milestone 3 implementation is committed and pushed to `origin/master` as `dacd99e`. The project now has server-bound anonymous sessions, a minimum moderation pipeline, canvas-based galaxy rendering, and executable test configuration.

The product's dark, quiet, anonymous emotional experience remains intact. Phase 5 features such as Personal Sky, Constellations, Mirror, and Morning Sky have not started.

## Detected stack
- **Frontend**: React 19, TypeScript, Vite, Vitest, Testing Library
- **Backend**: Node.js with Express, TypeScript, Zod, `pg`, `express-rate-limit`
- **Database**: PostgreSQL 12+ with connection pooling and migrations
- **Styling**: Custom CSS with the existing dark, cinematic aesthetic

## Milestone 3 implementation

### Anonymous identity and abuse prevention
- Server-issued `othersky_sid` cookie with HttpOnly, SameSite=Lax, and production Secure settings
- Client no longer sends or controls `anonymous_id`; API calls use `credentials: 'include'`
- CORS is restricted to the configured frontend origin and allows credentials
- Wish and Send Light limits use the server-bound anonymous identity
- IP backstop limits are applied to `POST /api/wishes` and `POST /api/wishes/:id/light`
- Existing database uniqueness keeps Send Light idempotent per anonymous identity

### Moderation
- Obvious spam, URL, and repeated-character flooding heuristics flag wishes at creation
- Normal wishes are auto-approved; flagged wishes are excluded from public results
- Added `POST /api/wishes/:id/report` with a three-report flagging threshold
- Added `GET /api/admin/queue` and `POST /api/admin/wishes/:id/moderate`
- Admin endpoints require `Authorization: Bearer $ADMIN_TOKEN`
- Added `server/db/migrations/002_moderation_events.sql`
- Public list and single-wish queries return approved wishes only

### Galaxy rendering and accessibility
- Stars render through one 2D canvas rather than one DOM button per star
- Canvas click hit-testing selects the nearest star within its interaction radius
- Resize handling, selected-star highlighting, and reduced-motion styling are preserved
- A visually hidden semantic button list keeps every wish keyboard- and assistive-technology-accessible
- The list query no longer has the old `LIMIT 500`; WebGL/instancing remains deferred for much larger skies

### Tests and scripts
- Root `npm test` runs server tests before frontend tests
- Server tests cover spam screening and independent identity rate-limit buckets
- Frontend Vitest smoke test confirms the landing screen exposes `Enter the Sky`
- Frontend test setup uses jsdom and Testing Library

## Known limitations
- The in-memory primary rate limiter resets when the server restarts; Redis remains a production follow-up
- Admin moderation currently uses one shared bearer token and has no admin UI
- Automated moderation is intentionally heuristic and requires moderator review of flagged content
- Canvas rendering is 2D; WebGL/instancing is deferred until star counts justify it
- Pagination and spatial loading are not yet implemented
- No accounts, personal sky, constellations, categories filtering, Mirror, or Morning Sky features have started

## Verification status
- ✓ Milestone 3 changes committed and pushed to GitHub
- ✓ Whitespace validation passed with `git diff --check`
- ✓ Tracked `server/server.log` removed and `server.log` added to `.gitignore`
- ✓ Root, frontend, and server test scripts are configured
- Pending: run the full local `npm run build`, `npm run lint`, and `npm test` suite against the configured PostgreSQL environment
- Pending: exercise cookie buckets, duplicate light, reports, admin authorization, keyboard navigation, and browser accessibility checks

## How to run

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

For admin moderation, set `ADMIN_TOKEN` in the server environment. Set `FRONTEND_ORIGIN` when the frontend is not served from `http://localhost:5173`.

## Next implementation milestone
**Milestone 4 - Verification and performance preparation**

Before starting later product phases, complete the pending Milestone 3 browser and PostgreSQL verification. The next product work should follow the roadmap and project specification; do not add Phase 5 features as part of this hardening milestone.
