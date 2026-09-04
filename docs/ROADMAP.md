# Product & Technical Roadmap — The Other Sky

Reference: [`THE_OTHER_SKY_PROJECT_SPEC.md`](../THE_OTHER_SKY_PROJECT_SPEC.md)

---

## Completed Milestones

### Phase 0: Foundation ✓
- Repository setup, TypeScript strict configuration, environment variable structure
- Frontend React 19 + Vite skeleton and Express backend skeleton
- PostgreSQL database connection pool and migration runner

### Phase 1: Core Galaxy Prototype ✓
- Procedural star generation and temperature color mapping
- 2D Canvas galaxy renderer with smooth camera pan/zoom lerping
- Twinkle animation and `prefers-reduced-motion` support
- Accessible semantic list fallback for screen readers

### Phase 2: Real Wish Persistence ✓
- PostgreSQL schema for users, wishes, and stars
- REST endpoints for wish creation and retrieval
- Anonymous cookie session identification (`othersky_sid`)
- Real-time star coordinate generation on wish release

### Phase 3: Witnessing & Light System ✓
- `POST /api/wishes/:id/light` endpoint with database-level deduplication (`UNIQUE(wish_id, user_id)`)
- In-memory rate limiting per user identity
- Client-side light pulse particle animation
- Aggregated witnessing count (*"237 people have sent light"*)

### Phase 4: Safety & Moderation ✓
- Automated spam screening (URL regex, repeated character flooding)
- Community reporting mechanism with 3-reporter automatic flagging threshold
- `moderation_events` table tracking actions, reason codes, and reviewer metadata
- Bearer-token protected admin queue and moderation endpoints (`/api/admin/queue`, `/api/admin/wishes/:id/moderate`)

### Phase 5: Personal Sky, Constellations, Mirror & Morning Sky ✓
- Migration `003_personal_sky.sql` (saved_wishes table, fulfillment_note column, tsvector search vector)
- React Router DOM navigation (`/`, `/sky`, `/me`, `/morning-sky`, `/constellations`, `/constellations/:slug`)
- **Personal Sky** (`/me`): 3-tab private sanctuary (My Wishes, Saved Wishes, Light Sent) with voluntary fulfillment workflow
- **Morning Sky** (`/morning-sky`): Dawn view celebrating fulfilled wishes (*"It happened."*)
- **Constellations** (`/constellations`): Shared patterns across 6 categories (Hope, Love, Peace, Healing, Growth, Clarity)
- **The Mirror** (`/api/mirror`): Full-text semantic search connecting similar wishes (*"You're not the only one."*)
- Wish detail Save / Unsave toggle and deep-link closing fix

---

## Upcoming Milestones

### Phase 6: Semantic Clustering & Embedding Refinements
- Semantic embeddings for advanced constellation boundaries
- Dynamic constellation naming and auto-grouping

### Phase 7: Historical Night Archive (Phase 8 in Spec)
- Daily galaxy snapshots and historical sky time travel
- Archive compression and temporal state reconstruction

### Phase 8: Living Sky & Real-time Events (Phase 9 in Spec)
- Real shooting stars mapped to newly submitted wishes
- Optional WebSocket or SSE stream for live star births

### Phase 9: Public Launch Hardening (Phase 10 in Spec)
- Production Redis distributed rate-limiting
- CDN caching for spatial galaxy regions
- Backup & disaster recovery runbooks
- Dedicated Admin moderation dashboard UI
