# Milestone 2 — Quick Reference & Setup Guide

## Status
✓ **COMPLETE** — All 25 implementation steps finished and verified

**Verification Date:** 2026-09-02  
**TypeScript Compilation:** ✓ No errors  
**Frontend:** ✓ Compiles  
**Backend:** ✓ Compiles

---

## Quick Start (5 minutes)

### 1. Database Setup
```bash
# Create database
createdb the_other_sky

# Create .env in project root
cat > .env << EOF
DATABASE_URL=postgresql://localhost/the_other_sky
PORT=3001
NODE_ENV=development
EOF
```

### 2. Install & Seed
```bash
# From project root
npm install

# Migrate schema
npm run db:migrate

# Seed with ~72 wishes
npm run db:seed
```

### 3. Run
```bash
npm run dev
```

Open http://localhost:5173 and verify:
- Galaxy loads with stars ✓
- Click star → wish displays ✓
- Send Light → counter updates ✓
- Refresh → data persists ✓
- Create wish → becomes star ✓

---

## Key Implementation Details

### Database
- **Host:** PostgreSQL (local or Supabase)
- **Schema:** 4 tables (users, wishes, stars, wish_lights)
- **Migrations:** Automatic with `npm run db:migrate`
- **Seed:** ~72 wishes with interactions

### Backend
- **Session:** Anonymous ID per browser (localStorage)
- **Rate Limit:** 5 wishes/hr, 20 lights/hr per user
- **Deduplication:** Send Light deduplicated by (wish_id, user_id)
- **Error Handling:** Safe messages; no SQL/credentials exposed

### Frontend
- **Session Storage:** Anonymous ID in localStorage
- **Error States:** Dismissible error messages
- **Loading States:** "Loading the sky..." indicator

---

## Important Files

### Created
- `server/db/migrations/001_initial_schema.sql` — Schema
- `server/src/db.ts` — Connection pool
- `server/src/storageDb.ts` — Query layer
- `server/src/runMigrations.ts` — Migration runner
- `server/src/seedDb.ts` — Seed script
- `MILESTONE_2_COMPLETE.md` — Full report
- `docs/DATABASE.md` — Schema guide

### Modified
- `server/src/index.ts` — PostgreSQL backend
- `frontend/src/App.tsx` — Session + errors
- `frontend/src/App.css` — Error/loading UI
- `README.md` — Setup instructions

---

## Common Commands

```bash
# Development
npm run dev                    # Both servers
npm run dev:frontend           # Frontend only
npm run dev:server             # Backend only

# Database
npm run db:migrate             # Run migrations
npm run db:seed                # Seed data
npm run db:reset               # Reset + reseed

# Build
npm run build                  # Production build
npm run lint                   # Code style check

# Backend specific
cd server
npm run build                  # Compile TypeScript
```

---

## Troubleshooting

### "Database does not exist"
```bash
createdb the_other_sky
```

### "Connection refused"
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Test: `psql -U postgres -d the_other_sky -c "SELECT 1;"`

### "Module not found: pg"
```bash
cd server && npm install
```

### "Port 3001 already in use"
- Change PORT in .env
- Or: `kill $(lsof -t -i:3001)`

### Data not persisting
- Verify migrations ran: `npm run db:migrate`
- Check seed worked: `npm run db:seed`
- Confirm DATABASE_URL in .env

---

## What Changed from Milestone 1

| Aspect | M1 | M2 |
|--------|----|----|
| Storage | In-memory array | PostgreSQL |
| Persistence | Lost on restart | Permanent |
| Duplicate Lights | Possible | Prevented (DB constraint) |
| Rate Limiting | None | 5/hr wishes, 20/hr lights |
| Session Tracking | None | Anonymous ID |
| Error Handling | Basic | Safe + detailed logs |
| Frontend Changes | None | Session + error UI |

**User Experience:** Identical visual appearance

---

## Architecture Overview

```
Browser
  ↓ HTTP/JSON
Express API (localhost:3001)
  ↓ SQL (parameterized)
PostgreSQL
  ↓
Persistent Data
```

**Key Flow:**
```
POST /api/wishes?anonymous_id=123
  ↓
Get/create user (user_id = UUID)
  ↓
Rate limit check
  ↓
Transaction: INSERT wish + star
  ↓
Return response + X-Anonymous-ID header
  ↓
Frontend stores ID in localStorage
```

---

## Security Checklist

- ✓ XSS: React escapes text by default
- ✓ SQL Injection: Parameterized queries (pg library)
- ✓ Rate Limiting: Per-user per-action
- ✓ Deduplication: Database constraint
- ✓ Error Messages: Safe (no SQL exposed)
- ✓ Privacy: No email/name/IP stored
- ✓ CORS: Enabled for localhost

---

## Next Steps (Milestone 3)

- Real constellation data integration
- Spatial queries for region loading
- Pagination or infinite scroll
- Performance optimization
- Caching strategy

---

## Documentation

See these files for full details:

- **[README.md](../README.md)** — Setup & running
- **[docs/API.md](../docs/API.md)** — Endpoint reference
- **[docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)** — System design
- **[docs/DATABASE.md](../docs/DATABASE.md)** — Schema & maintenance
- **[MILESTONE_2_COMPLETE.md](../MILESTONE_2_COMPLETE.md)** — Full report

---

## Support

Common issues resolved in docs/DATABASE.md:
- Local vs. Supabase setup
- Migration troubleshooting
- Rate limit configuration
- Backup strategies

---

**Status: Ready for Milestone 3**

Last updated: 2026-09-02
