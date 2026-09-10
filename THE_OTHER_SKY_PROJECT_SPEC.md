# THE OTHER SKY
## Product Vision, Technical Specification, Development Plan & Roadmap

> **Working tagline:** *You don't come here to be seen. You come here to be heard.*

---

# 0. Purpose of This Document

This document is the source-of-truth specification for building **The Other Sky**, an anonymous, interactive universe where every star represents a human wish.

It is written to be handed directly to an AI coding agent or development team. The agent should treat this document as the product and engineering contract unless a newer explicit requirement supersedes it.

The goal is not merely to build a visually attractive star-field website. The goal is to create a quiet, emotionally resonant product where people anonymously leave wishes, discover wishes from strangers, feel less alone, and give one another symbolic light without turning the experience into a conventional social network.

---

# 1. Product Identity

## 1.1 Name

**The Other Sky**

## 1.2 Core idea

Every person carries wishes that other people may never hear.

The Other Sky turns those wishes into stars in a shared digital night sky.

A user can:

- enter the galaxy;
- explore anonymous wishes;
- discover related wishes and constellations;
- save wishes that resonate with them;
- send anonymous "light" to another wish;
- leave their own wish as a new star;
- optionally mark a wish as fulfilled later;
- maintain a private personal sky.

The product intentionally minimizes identity, competition, and social pressure.

## 1.3 Emotional objective

The desired user reaction is not simply:

> "This website looks cool."

It is:

> "I came here alone, found a stranger who felt something similar, and somehow felt less alone."

## 1.4 Product philosophy

### The Other Sky should feel:

- quiet;
- mysterious;
- intimate;
- beautiful;
- anonymous;
- human;
- contemplative;
- alive, but not noisy.

### It should not feel like:

- Instagram;
- TikTok;
- Reddit;
- a conventional anonymous confession board;
- a points/coins game;
- a generic 3D portfolio website;
- a public popularity ranking.

---

# 2. Core Product Principles

## Principle 1 — Anonymous by default

The wish is the primary object, not the person.

Do not encourage usernames, followers, profile pictures, public follower counts, or identity-based popularity.

Default attribution should be something like:

> Someone • 14 minutes ago

rather than a social-media-style identity.

## Principle 2 — Witnessing is more important than liking

The primary reaction should not be a generic like.

Use an interaction such as:

> **✦ Send Light**

A user is not saying "I like this." They are saying:

> "I saw this. I understand something about it. You are not entirely alone."

The receiving wish can display an aggregate such as:

> **237 people sent light**

but never expose a list of people who did so.

## Principle 3 — No forced positivity

Not every wish needs to be inspirational.

The product must have room for:

- grief;
- regret;
- uncertainty;
- loneliness;
- fear;
- unfinished goodbyes;
- difficult life transitions;
- ordinary hopes.

The system should never automatically convert vulnerable content into motivational content.

## Principle 4 — Discovery over optimization

Do not optimize primarily for session length, engagement, or viral behavior.

The discovery loop should feel organic:

> enter → wander → find something → feel → send light → discover another → perhaps leave a wish → leave

A short meaningful session is a successful session.

## Principle 5 — The universe is a living system

The galaxy should change gradually as new wishes enter the system and as users interact with them.

The visual layer is a representation of collective human expression, not merely a background animation.

## Principle 6 — Restraint is a feature

Avoid excessive UI, badges, popups, notifications, sound effects, counters, animations, and gamification.

The product should breathe.

---

# 3. Product Story

The conceptual story of the product:

People live under the same physical sky but often feel emotionally separated.

There is another sky — a digital one — containing the things people secretly hope for, fear, remember, and dream about.

Every wish becomes a star.

Some stars are bright.
Some are quiet.
Some belong to constellations.
Some become shooting stars.
Some eventually move into the **Morning Sky** when they come true.

The user is not entering a feed.

They are entering a universe.

---

# 4. Main Experience

## 4.1 Landing page

Do not begin with a conventional dashboard.

The first screen should be dark and atmospheric.

Suggested copy:

> # THE OTHER SKY
>
> There are things we want.
> Things we're afraid to say.
> Things we still believe might happen.
>
> **Put yours in the sky.**

Primary CTA:

> **✦ Enter the Galaxy**

Secondary CTA:

> **Leave a Wish**

The background should already hint that a larger universe exists beyond the landing page.

## 4.2 First-time entry

When the user enters, transition from the landing page into the galaxy.

Initial scene:

- deep-space background;
- sparse stars;
- subtle nebulae;
- gentle parallax;
- very slow movement;
- minimal controls.

A subtle text layer can say:

> **There are millions of wishes in this sky.**
>
> *Maybe one of them is yours.*

This message should eventually disappear rather than becoming permanent UI.

## 4.3 Exploring the galaxy

The galaxy is an interactive canvas.

Users should be able to:

- pan;
- zoom;
- hover/tap stars;
- click/tap a star to open its wish;
- discover clusters;
- move through different regions;
- search or filter only when they intentionally want to.

Desktop:

- mouse drag = pan;
- wheel = zoom;
- click star = inspect;
- double click = focus/zoom into star or constellation.

Mobile:

- one-finger drag = pan;
- pinch = zoom;
- tap = inspect;
- long press should be avoided unless clearly necessary.

## 4.4 Wish detail

Clicking a star should create a focused, calm detail state.

Example:

> *"I hope future me is happy."*
>
> **Someone • 2 hours ago**
>
> ✦ **Send Light**
>
> **184 people have sent light.**

Optional metadata:

- broad category;
- approximate age of wish;
- constellation association;
- fulfilled status if the owner chose to reveal it.

Do not expose private metadata.

## 4.5 Sending light

When a user sends light:

1. a small particle originates from the user's current viewport/position;
2. it travels toward the selected star;
3. the receiving star brightens subtly;
4. the interaction completes with minimal UI;
5. a small confirmation may appear:

> **Someone sent a little light your way.**

For privacy, prevent users from seeing exactly who sent the light.

## 4.6 Leaving a wish

Primary flow:

> **What do you wish for?**

Large, distraction-free text area.

Optional controls:

- category;
- language;
- reveal/anonymous preference (anonymous should remain the default);
- allow future fulfillment update;
- save privately instead of releasing publicly.

Submission sequence:

1. user writes wish;
2. client performs basic validation;
3. server moderation pipeline runs;
4. server creates wish record;
5. client creates a cinematic release animation;
6. wish travels upward/outward;
7. wish becomes a star in the shared sky;
8. user's personal sky updates.

Suggested release copy:

> **Release it.**

Then:

> **Your wish is somewhere in this sky now.**
>
> *You may never know who finds it.*
>
> **But someone might.**

---

# 5. Major Product Systems

## 5.1 Galaxy

The galaxy is the primary navigation space.

Each public wish maps to a visual star entity.

Star properties may include:

- x coordinate;
- y coordinate;
- z/depth coordinate if using 3D;
- size;
- luminosity;
- hue family;
- twinkle rate;
- age;
- interaction intensity;
- constellation membership;
- state (active, archived, fulfilled, moderated, removed).

Important: visual properties must not reveal sensitive or hidden wish metadata.

## 5.2 Wish object

A wish is the fundamental content unit.

Conceptual model:

```text
Wish
├── id
├── encrypted/private ownership reference
├── anonymous public identifier
├── text
├── normalized/search representation
├── language
├── category
├── created_at
├── updated_at
├── visibility
├── moderation_status
├── fulfilled_status
├── fulfilled_at
├── star_visual_seed
├── star_position
├── constellation_id
├── light_count
└── archive_state
```

Exact schema should be refined during implementation.

## 5.3 Light system

A user can send light to a wish.

Rules:

- prevent accidental duplicate spam;
- apply rate limits;
- use idempotency;
- aggregate publicly rather than exposing user identities;
- preserve abuse prevention logs privately.

Potential initial rule:

> One active light reaction per user per wish per defined window.

This can be changed later.

## 5.4 Constellations

A constellation is a group of related wishes.

Initial implementation should NOT require perfect semantic AI clustering.

MVP approach:

- categories;
- keywords;
- embeddings or semantic similarity as an optional Phase 2/3 enhancement;
- periodic clustering job.

Examples:

- Beginnings
- Love
- Peace
- Family
- Dreams
- Healing
- Courage
- Things Left Unsaid
- Becoming

Important: constellation names generated by AI must pass safety/content rules and should not expose private inferences.

## 5.5 Shooting stars

A recently released wish may occasionally be represented as a shooting star during the discovery experience.

The shooting-star event must map to a real wish.

The animation should not create fake content that the user might mistake for a real submitted wish.

Possible rule:

- select from recent eligible public wishes;
- apply fairness so the same wishes are not repeatedly shown;
- cap exposure frequency;
- remove immediately if moderation status changes.

## 5.6 Morning Sky

The **Morning Sky** contains wishes voluntarily marked as fulfilled.

Example:

Original:

> "I hope I get into university."

Later:

> **It happened.**

The wish may transition visually from the main galaxy to a calmer, brighter space.

Rules:

- fulfillment is always voluntary;
- no system should infer fulfillment automatically from external events;
- preserve the original text;
- record fulfillment timestamp;
- optionally allow a short fulfillment note.

## 5.7 Quiet Side

The **Quiet Side** is a thematic region for wishes that are introspective, painful, or unresolved.

Do not use this as an automatic mental-health diagnosis system.

It can instead be:

- user-selected;
- theme-based;
- editorially curated;
- safely classified using a bounded taxonomy.

Important:

Never tell a user:

> "You are depressed."

or otherwise make clinical inferences.

## 5.8 Mirror

The Mirror connects a user's wish with similar public wishes.

Example:

User:

> "I'm scared I'm wasting my twenties."

Mirror:

> "I feel like everyone else is ahead of me."
>
> "I wish I knew where my life was going."
>
> "I want to stop comparing myself to everyone."

Possible output:

> **You're not the only one.**

The Mirror should prioritize emotional similarity without exposing identity.

## 5.9 Night Archive

A historical view of the sky.

Possible navigation:

- tonight;
- yesterday;
- this week;
- this month;
- since launch.

Do not store a full-resolution snapshot on every minor interaction.

Prefer generated daily/periodic aggregate snapshots plus deterministic reconstruction of visual state where practical.

## 5.10 Personal Sky

Authenticated users may have a private personal sky.

It can contain:

- their own wishes;
- saved wishes;
- wishes they sent light to;
- fulfillment history;
- private/unreleased wishes.

This is a private space.

Never expose it publicly by default.

---

# 6. What Makes The Product Different

The product should be designed around five nontraditional social mechanics:

### 1. Witnessing

"I saw your wish."

### 2. Resonance

"I wished for this too."

### 3. Light

"You are not invisible."

### 4. Constellations

"Many strangers are connected by the same human experience."

### 5. Fulfillment

"Sometimes the things we leave in the sky come true."

These are the core differentiators.

---

# 7. UX / Visual Direction

## 7.1 Visual language

Desired style:

- cinematic;
- minimal;
- dark;
- spacious;
- premium;
- subtle;
- tactile;
- celestial.

Avoid:

- heavy glassmorphism;
- excessive neon;
- generic purple gradient SaaS design;
- giant rounded cards everywhere;
- cluttered dashboards;
- loud success animations;
- gamified badges dominating the screen.

## 7.2 Color system

Base:

- near-black / deep-space backgrounds;
- very low-contrast surfaces;
- off-white typography;
- restrained star hues.

Do not hard-code a single bright accent as the only visual identity.

Stars can have subtle temperature variations while the interface remains restrained.

## 7.3 Typography

Primary requirements:

- highly readable;
- elegant;
- excellent mobile rendering;
- clear distinction between UI and poetic copy.

A possible pairing:

- modern sans-serif for UI;
- restrained serif or elegant display face for emotional statements.

Actual fonts can be decided during implementation.

## 7.4 Motion

Motion is part of the emotional experience.

Use:

- slow parallax;
- eased transitions;
- tiny star twinkles;
- particle travel for light;
- star creation/release animation;
- smooth camera movement.

Avoid:

- constant aggressive motion;
- motion that causes nausea;
- high-frequency flashing;
- unnecessary UI animations.

Honor `prefers-reduced-motion`.

## 7.5 Audio

Audio is optional and OFF by default.

Potential ambient layer:

- subtle atmospheric drone;
- sparse crystalline textures;
- no melody that becomes annoying quickly.

The user must have obvious mute controls.

No surprise audio autoplay.

---

# 8. Accessibility Requirements

Accessibility is a product requirement, not a later polish item.

Implement:

- keyboard navigation where practical;
- visible focus states;
- readable contrast;
- reduced-motion mode;
- screen-reader labels for controls;
- accessible wish text;
- non-canvas fallback for browsing wishes;
- text alternatives for critical content;
- touch targets suitable for mobile;
- no critical meaning conveyed only through star color.

Because the galaxy may be WebGL/canvas-based, provide an accessible semantic layer for selected/current content.

A user should be able to read and interact with a wish without being forced to understand 3D navigation.

---

# 9. Platform Strategy

## Phase 1 target

**Responsive web application**

Desktop + mobile browser.

Do not start with native iOS/Android apps.

## Recommended initial architecture

### Frontend

- React
- TypeScript
- Vite or equivalent modern bundler
- Tailwind CSS or another utility/design-system approach
- WebGL rendering via Three.js or React Three Fiber, if 3D is selected

### Backend

- FastAPI or equivalent TypeScript/Node backend
- PostgreSQL
- Redis for caching/rate limiting/ephemeral state if needed
- Object storage only if assets/user uploads require it

### Authentication

Start with anonymous session support.

Later optionally add:

- magic link;
- OAuth;
- passkey;

but authentication should not be required just to explore the public sky.

### Deployment

Use a managed cloud deployment for frontend and backend.

The exact provider is intentionally implementation-dependent.

---

# 10. Recommended System Architecture

```text
                    ┌───────────────────────────┐
                    │        Browser            │
                    │ React + UI + Galaxy/WebGL │
                    └─────────────┬─────────────┘
                                  │ HTTPS / WebSocket optional
                                  ▼
                    ┌───────────────────────────┐
                    │       API / Backend       │
                    │ Auth / Wishes / Light     │
                    │ Moderation / Search       │
                    └───────┬─────────┬─────────┘
                            │         │
                  ┌─────────▼───┐ ┌──▼──────────┐
                  │ PostgreSQL  │ │    Redis    │
                  │ source data │ │ rate/cache  │
                  └─────────────┘ └─────────────┘
                            │
                    ┌───────▼────────┐
                    │ Async Workers  │
                    │ clustering     │
                    │ moderation     │
                    │ archive jobs   │
                    └────────────────┘
```

Important architectural rule:

> **PostgreSQL is the durable source of truth.**

Redis should never be the only place where a public wish or fulfillment record exists.

---

# 11. Frontend Architecture

Suggested structure:

```text
src/
├── app/
│   ├── routes/
│   ├── providers/
│   └── app-shell/
├── components/
│   ├── ui/
│   ├── galaxy/
│   ├── wish/
│   ├── constellation/
│   └── navigation/
├── features/
│   ├── explore/
│   ├── submit-wish/
│   ├── mirror/
│   ├── morning-sky/
│   ├── archive/
│   └── personal-sky/
├── lib/
│   ├── api/
│   ├── analytics/
│   ├── moderation/
│   └── utils/
├── state/
└── styles/
```

Keep rendering logic separate from product logic.

The galaxy renderer should not own business rules such as moderation, light eligibility, or fulfillment.

---

# 12. Galaxy Rendering Strategy

A major technical risk is rendering potentially hundreds of thousands of stars smoothly.

Do NOT render every star as a normal React DOM element.

Recommended approach:

- WebGL rendering;
- instanced rendering or GPU-friendly point rendering;
- spatial indexing;
- level-of-detail;
- viewport-based loading;
- deterministic star seeds;
- clustering at low zoom;
- detail rendering at high zoom.

Concept:

```text
Low zoom
    ↓
Density map / grouped particles
    ↓
Medium zoom
    ↓
Star clusters
    ↓
High zoom
    ↓
Individual interactive stars
```

## Performance target

Initial target:

- 60 FPS on reasonably modern desktop devices;
- usable interaction on mid-range mobile devices;
- graceful degradation on low-end devices.

Do not optimize only for a developer workstation.

## Render budgets

Define explicit budgets during implementation:

- visible star count;
- texture count;
- draw calls;
- particle count;
- animation update frequency;
- memory usage.

Measure these instead of guessing.

---

# 13. Galaxy Data Loading

Do not send the entire universe to the browser.

Use spatial/viewport queries.

Possible API shape:

```http
GET /api/galaxy?centerX=...&centerY=...&zoom=...&limit=...
```

Response should contain only the stars/constellations relevant to the current viewport and zoom level.

For large-scale deployment, consider:

- spatial database indexing;
- geohash-like spatial partitioning;
- server-side tiles;
- precomputed galaxy cells;
- CDN caching for mostly static galaxy regions.

---

# 14. Data Model — Initial Version

Use PostgreSQL.

## users

```text
id UUID PRIMARY KEY
created_at TIMESTAMPTZ
last_seen_at TIMESTAMPTZ
status TEXT
```

## anonymous_sessions

```text
id UUID PRIMARY KEY
user_id UUID NULL
created_at TIMESTAMPTZ
expires_at TIMESTAMPTZ
ip_hash TEXT NULL
user_agent_hash TEXT NULL
```

Never store raw IP addresses unless there is a strong operational/legal requirement and an explicit retention policy.

## wishes

```text
id UUID PRIMARY KEY
owner_user_id UUID NULL
text_ciphertext TEXT or TEXT depending on privacy architecture
language TEXT
category TEXT NULL
visibility TEXT
moderation_status TEXT
fulfillment_status TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
fulfilled_at TIMESTAMPTZ NULL
removed_at TIMESTAMPTZ NULL
```

## wish_stars

```text
wish_id UUID PRIMARY KEY
x DOUBLE PRECISION
 y DOUBLE PRECISION
z DOUBLE PRECISION NULL
size REAL
luminosity REAL
color_seed INTEGER
animation_seed INTEGER
```

## light_reactions

```text
id UUID PRIMARY KEY
wish_id UUID
user_id UUID NULL
session_id UUID NULL
created_at TIMESTAMPTZ
```

Add a uniqueness/rate-limit strategy appropriate to the authentication model.

## saved_wishes

```text
user_id UUID
wish_id UUID
created_at TIMESTAMPTZ
PRIMARY KEY (user_id, wish_id)
```

## constellations

```text
id UUID PRIMARY KEY
name TEXT
slug TEXT
description TEXT NULL
created_at TIMESTAMPTZ
status TEXT
```

## constellation_members

```text
constellation_id UUID
wish_id UUID
score REAL NULL
created_at TIMESTAMPTZ
PRIMARY KEY (constellation_id, wish_id)
```

## moderation_events

```text
id UUID PRIMARY KEY
wish_id UUID
action TEXT
reason_code TEXT
created_at TIMESTAMPTZ
reviewer_id UUID NULL
metadata JSONB NULL
```

Do not expose moderation metadata to ordinary users.

---

# 15. Privacy Architecture

Privacy must be designed before launch.

## Public data

Potentially visible:

- wish text;
- broad category;
- relative age/time;
- aggregate light count;
- constellation membership.

## Private data

Keep private:

- account identity;
- saved wishes;
- personal sky;
- moderation history;
- abuse prevention metadata;
- internal risk scores;
- administrative notes.

## Identity separation

Avoid storing a public profile identity directly on every wish.

Use an internal owner reference and an anonymous public representation.

## Data retention

Define explicit retention policies for:

- sessions;
- abuse logs;
- deleted wishes;
- moderation events;
- analytics;
- IP-derived security data.

Do not collect data merely because it might be useful someday.

---

# 16. Safety & Moderation

An anonymous public content platform requires moderation from the first public beta.

This is not optional.

## Minimum moderation pipeline

```text
Wish submission
      ↓
Input validation
      ↓
Abuse/rate-limit checks
      ↓
Automated content screening
      ↓
Decision
 ┌────┼─────────────┐
 │    │             │
allow review      reject
 │    │
 ▼    ▼
publish queue
```

## Content categories to handle

At minimum define policies for:

- harassment;
- threats;
- hate/extremist content;
- sexual exploitation content;
- doxxing/personal data;
- spam;
- fraud/scams;
- graphic violence;
- self-harm content;
- content involving minors;
- illegal activity solicitation.

The exact policy and model/provider may vary, but the application should support moderation status and human review.

## Self-harm / crisis content

The platform should not attempt to act as a therapist or emergency service.

It should have a safety policy for high-risk content, including appropriate intervention messaging and escalation paths where warranted.

Never encourage users to rely on anonymous strangers for emergency intervention.

## Reporting

Any public wish should be reportable.

Suggested flow:

> Report this wish
>
> [Harassment]
> [Hate]
> [Threat]
> [Sexual content]
> [Personal information]
> [Self-harm concern]
> [Spam]
> [Something else]

The reporting UI should be quiet and simple.

---

# 17. Anti-Abuse & Anti-Spam

Anonymous systems are vulnerable to abuse.

Implement:

- request rate limits;
- per-session limits;
- per-account limits where applicable;
- abuse heuristics;
- duplicate-content detection;
- automated reporting thresholds;
- moderation queues;
- IP-derived abuse signals only where necessary;
- bot mitigation for suspicious automated activity.

Never rely solely on frontend restrictions.

All important limits must be enforced server-side.

---

# 18. Authentication Strategy

## Explore without account

A person should be able to enter the galaxy without creating an account.

## Create a personal identity only when needed

Authentication becomes useful for:

- preserving personal wishes;
- saving wishes;
- maintaining personal sky across devices;
- fulfillment updates;
- managing reports.

The public product should remain browseable anonymously.

---

# 19. API Surface — Initial Proposal

## Public / low-risk

```http
GET /api/galaxy
GET /api/wishes/:id
GET /api/constellations
GET /api/constellations/:id
GET /api/mirror
GET /api/archive/:date
```

## User actions

```http
POST /api/wishes
POST /api/wishes/:id/light
POST /api/wishes/:id/save
DELETE /api/wishes/:id/save
POST /api/wishes/:id/report
POST /api/wishes/:id/fulfill
```

## Authentication

```http
POST /api/auth/anonymous
POST /api/auth/upgrade
POST /api/auth/logout
GET /api/me
GET /api/me/sky
```

Exact API conventions may change, but keep endpoints resource-oriented and predictable.

---

# 20. Real-Time vs Polling

Do NOT introduce WebSockets merely because the galaxy is interactive.

For MVP, polling or event refresh may be sufficient.

WebSockets can be introduced when there is a clear need for:

- live star births;
- live light events;
- synchronized galaxy events;
- real-time global counters.

A beautiful product does not require unnecessary infrastructure complexity.

---

# 21. Analytics

Analytics should measure product health without undermining anonymity.

Useful aggregate events:

```text
landing_viewed
entered_galaxy
wish_viewed
wish_created
light_sent
wish_saved
mirror_opened
constellation_opened
archive_opened
wish_reported
wish_fulfilled
session_completed
```

Do not store wish text in analytics events.

Do not build invasive user profiles.

Useful metrics:

- percentage of visitors who enter the galaxy;
- percentage who explore at least one wish;
- percentage who send light;
- percentage who leave a wish;
- average meaningful exploration depth;
- report rate;
- moderation rejection rate;
- return rate;
- performance metrics.

Avoid optimizing primarily for raw time-on-site.

---

# 22. SEO / Shareability

The interactive galaxy itself is not the primary SEO object.

Create crawlable static pages for:

- The Other Sky landing page;
- concept/story pages;
- public constellation pages where safe;
- curated thematic collections.

For sharing:

A user should optionally be able to share a wish via a generated link without revealing private identity.

Example preview:

> **"I hope future me is happy."**
>
> A wish from The Other Sky.

Never include hidden internal metadata in social previews.

---

# 23. MVP Definition

The MVP should be significantly smaller than the full vision.

## MVP MUST include

1. Landing page.
2. Interactive star-field/galaxy.
3. Public anonymous wishes.
4. Wish creation.
5. Wish detail view.
6. Send Light interaction.
7. Basic moderation/reporting.
8. Basic anonymous session identity.
9. PostgreSQL persistence.
10. Mobile-responsive experience.
11. Accessible fallback for reading wishes.
12. Admin moderation interface or operational moderation workflow.
13. Rate limiting.
14. Basic observability/error logging.
15. Production deployment.

## MVP SHOULD include

- basic categories;
- saved wishes for signed-in users;
- initial constellation clusters;
- basic personal sky.

## MVP MUST NOT require

- sophisticated AI-generated constellations;
- full 3D universe simulation;
- complex WebSockets;
- native apps;
- elaborate social accounts;
- gamification;
- public leaderboards.

---

# 24. Phase Roadmap

## Phase 0 — Product & Technical Foundation

### Goal
Turn the idea into a runnable, testable skeleton.

### Tasks

- finalize naming and visual direction;
- define repository structure;
- define environment strategy;
- configure TypeScript/linting/formatting;
- create frontend shell;
- create backend shell;
- configure PostgreSQL;
- configure migrations;
- configure environment variables;
- configure CI;
- configure basic error tracking/logging;
- document local development.

### Deliverable

A clean repository that runs locally and deploys a minimal health-check application.

### Exit criteria

```text
Frontend starts.
Backend starts.
Database connects.
Migration runs.
CI passes.
Production environment is reachable.
```

---

# Phase 1 — Core Galaxy Prototype

### Goal
Prove that the central interaction is technically and aesthetically viable.

### Build

- procedural star generator;
- camera movement;
- zoom/pan;
- star selection;
- wish mock data;
- wish detail overlay;
- basic responsive controls;
- performance instrumentation.

Do NOT connect the real database yet if doing so slows visual experimentation.

### Exit criteria

A user can enter a convincing sky and click stars without performance problems.

The prototype must feel emotionally close to the intended final experience.

---

# Phase 2 — Real Wish System

### Goal
Replace mock stars with real persisted wishes.

### Build

- PostgreSQL schema;
- wish creation endpoint;
- wish retrieval endpoint;
- moderation status;
- server validation;
- anonymous sessions;
- star position generation;
- galaxy viewport loading;
- wish detail UI.

### Exit criteria

A user can submit a wish and see the resulting star in the shared galaxy.

---

# Phase 3 — Light System

### Goal
Create the first meaningful social interaction.

### Build

- Send Light API;
- duplicate protection;
- rate limits;
- light animation;
- aggregate light count;
- optimistic UI with server reconciliation.

### Exit criteria

Two separate sessions can interact with the same wish, while neither can identify the other.

---

# Phase 4 — Safety & Moderation

### Goal
Make public sharing safe enough for controlled beta.

### Build

- automated moderation integration or rule pipeline;
- report system;
- moderation queue;
- admin authentication;
- removal workflow;
- audit logs;
- rate limiting;
- abuse monitoring;
- privacy policies;
- data retention policies.

### Exit criteria

A reported wish can be reviewed and removed without directly manipulating the production database.

---

# Phase 5 — Personal Sky

### Goal
Give users a private place without turning the product into social media.

### Build

- account upgrade/authentication;
- own wishes;
- saved wishes;
- light history;
- private wishes;
- fulfillment controls;
- personal galaxy view.

### Exit criteria

A user can return later and recover their personal sky.

---

# Phase 6 — Constellations & Mirror

### Goal
Turn isolated wishes into collective patterns.

### Build

Start simple:

- taxonomy-based categories;
- keyword relationships;
- deterministic grouping.

Then add optional semantic similarity:

- embeddings;
- clustering jobs;
- similarity scoring;
- moderation-aware exclusion.

Build Mirror from the same similarity infrastructure.

### Exit criteria

A user can discover meaningful clusters of wishes without manually browsing thousands of stars.

---

# Phase 7 — Morning Sky & Fulfillment

### Goal
Introduce hope through user-reported outcomes.

### Build

- fulfill action;
- fulfillment note;
- Morning Sky scene;
- transition animation;
- fulfilled archive;
- date metadata.

### Exit criteria

A wish can move from active to fulfilled without losing its history.

---

# Phase 8 — Night Archive

### Goal
Make the universe historical.

### Build

- daily galaxy snapshots;
- historical counters;
- date navigation;
- archive rendering;
- snapshot compression/storage strategy.

### Exit criteria

Users can explore how the sky changes over time.

---

# Phase 9 — Global / Living Sky

### Goal
Make the universe feel alive without creating noise.

### Possible features

- recent shooting stars;
- subtle live star births;
- anonymous global activity indicators;
- daily sky summaries;
- ambient collective themes.

Do not add these until the foundational product is stable.

---

# Phase 10 — Public Launch

### Launch checklist

Infrastructure:

- production database backups;
- disaster recovery procedure;
- monitoring;
- alerting;
- rate limits;
- CDN/caching;
- security headers;
- HTTPS;
- secrets management;
- database migrations;
- rollback procedure.

Product:

- complete onboarding;
- moderation operations;
- reporting workflow;
- privacy controls;
- terms/community guidelines;
- accessibility audit;
- mobile QA;
- browser QA;
- performance testing.

Content:

- seeded constellation examples if appropriate;
- launch copy;
- empty states;
- safety messaging;
- help/about page.

---

# 25. Suggested Sprint Order

A coding agent should implement in this order.

```text
1. Repository + environments
2. Frontend shell
3. Backend shell
4. Database + migrations
5. Galaxy renderer prototype
6. Star selection
7. Wish schema/API
8. Wish submission UI
9. Real star placement
10. Wish detail
11. Light system
12. Anonymous sessions
13. Moderation/reporting
14. Admin moderation
15. Responsive/mobile polish
16. Accessibility
17. Performance optimization
18. Personal Sky
19. Categories
20. Constellations
21. Mirror
22. Fulfillment / Morning Sky
23. Archive
24. Live/special effects
25. Production hardening
26. Closed beta
27. Public launch
```

Do not jump to AI clustering before the basic product loop is reliable.

---

# 26. Development Method for an AI Coding Agent

The coding agent must work incrementally.

## Before changing code

1. Inspect the existing repository.
2. Identify the current stack.
3. Identify existing architecture.
4. Identify what is already implemented.
5. Do not replace working infrastructure unnecessarily.
6. Create a concise implementation plan.

## While coding

For each feature:

1. define acceptance criteria;
2. implement the smallest coherent slice;
3. run type checks;
4. run lint;
5. run unit tests;
6. run integration tests when applicable;
7. inspect the UI visually;
8. measure performance for rendering changes;
9. document important architectural decisions.

## After each phase

Produce:

- what changed;
- files changed;
- tests run;
- known issues;
- next recommended phase.

The agent must not claim completion without verification.

---

# 27. Testing Strategy

## Unit tests

Test:

- wish validation;
- star coordinate generation;
- light eligibility;
- rate limits;
- moderation state transitions;
- fulfillment transitions;
- permission checks.

## Integration tests

Test:

- submit wish → database → galaxy query;
- send light → aggregate count;
- report wish → moderation queue;
- remove wish → galaxy exclusion;
- fulfill wish → Morning Sky;
- anonymous session lifecycle.

## End-to-end tests

Critical journey:

```text
Landing
  ↓
Enter Galaxy
  ↓
Explore
  ↓
Open Wish
  ↓
Send Light
  ↓
Write Wish
  ↓
Submit
  ↓
See New Star
```

## Visual testing

Test:

- desktop;
- tablet;
- mobile;
- reduced motion;
- low-performance device simulation;
- different viewport sizes;
- high-DPI displays.

---

# 28. Performance Strategy

## Biggest risks

1. Too many stars.
2. Too many draw calls.
3. Excessive particle animations.
4. React re-rendering the scene.
5. Huge payloads.
6. Expensive semantic search on every interaction.
7. Mobile GPU overload.

## Required practices

- separate React UI from render loop;
- use GPU instancing/point clouds where appropriate;
- batch data;
- spatially partition galaxy data;
- cache stable galaxy regions;
- debounce search/filter interactions;
- move expensive processing to background jobs;
- use Web Workers where beneficial;
- avoid unnecessary animation allocations;
- monitor memory.

---

# 29. Security Requirements

Implement from the beginning:

- server-side input validation;
- output encoding;
- parameterized SQL;
- CSRF strategy where relevant;
- secure cookies where used;
- CORS restrictions;
- security headers;
- content security policy where practical;
- secret management;
- dependency scanning;
- admin MFA where supported;
- authorization checks on every private endpoint;
- rate limiting;
- abuse logging.

Never:

- expose database credentials;
- expose admin secrets to the client;
- trust a client-provided user ID;
- trust client-provided moderation status;
- allow client-controlled light counts;
- store private identity data in public wish payloads.

---

# 30. Environment Variables

Example categories:

```text
DATABASE_URL=
REDIS_URL=
APP_BASE_URL=
API_BASE_URL=
AUTH_SECRET=
SESSION_SECRET=
MODERATION_PROVIDER_KEY=
ANALYTICS_KEY=
STORAGE_BUCKET=
```

Never commit real secrets.

Provide `.env.example` with placeholders only.

---

# 31. Admin Console

The admin interface should initially be functional rather than beautiful.

Core screens:

### Moderation queue

- new reports;
- flagged wishes;
- review status;
- actions.

### Wish details

- text;
- creation time;
- moderation status;
- report reasons;
- internal abuse signals;
- action history.

### System health

- API health;
- database health;
- queue health;
- error rate;
- request rate;
- moderation backlog.

### Analytics

Aggregate only.

Do not create a surveillance dashboard for individual users.

---

# 32. Initial Design Components

Create a reusable component system around:

```text
Button
IconButton
TextButton
Modal
Sheet
Toast
Tooltip
Input
Textarea
WishCard
WishDetail
StarTooltip
ConstellationPanel
GalaxyControls
SearchPanel
FilterPanel
ReportDialog
LightAnimation
LoadingState
EmptyState
ErrorState
```

Galaxy-specific components should not leak into ordinary UI components.

---

# 33. Routes

Suggested routes:

```text
/
/sky
/wish/:id
/constellation/:slug
/mirror
/morning-sky
/archive
/me
/me/sky
/about
/guidelines
/privacy
/terms
/admin
```

The exact route structure can be simplified for MVP.

---

# 34. Empty / Edge States

Design these intentionally.

## No wishes yet

> **The sky is quiet tonight.**
>
> *Be the first to leave a star.*

## Search found nothing

> **No wish like this found its way here yet.**

## Wish removed

> **This star is no longer visible.**

Do not reveal private moderation reasons.

## Network disconnected

> **The sky is temporarily out of reach.**

Provide retry.

## Rate limit

Do not expose technical jargon.

> **Take a breath. Try again in a little while.**

---

# 35. Seed / Demo Data

Before public launch, create safe synthetic data for development.

Example wishes:

```text
"I hope I become someone I'm proud of."
"I want to see the ocean someday."
"I hope tomorrow feels lighter."
"I want to build something that outlives me."
"I hope my family stays healthy and happy."
"I wish I had told them how much they meant to me."
"Someday I want to look back and know I tried."
"I want to start again without being afraid."
```

Do not seed real people's sensitive stories into production.

---

# 36. AI Features — Where They Belong

AI should support the product, not become the product.

## Good uses

- semantic similarity for Mirror;
- constellation clustering;
- moderation assistance;
- language detection;
- translation of metadata/categories;
- duplicate/spam detection.

## Bad uses

Do not use AI to:

- rewrite people's wishes without explicit permission;
- invent emotional interpretations and present them as fact;
- diagnose mental health;
- create fake wishes that look real;
- manipulate vulnerable users toward engagement;
- rank humans by emotional value.

The original user-written wish should remain the canonical content.

---

# 37. Internationalization

The platform should be built with internationalization in mind even if launch starts with one language.

Store:

- original text;
- detected language;
- normalized search representation.

Do not assume every wish is English.

The visual system can remain language-neutral.

---

# 38. Localization Philosophy

The emotional copy should not be over-translated mechanically.

Examples like:

> "You are not the only one."

should sound natural in each target language rather than literal.

Categories should also be localized.

---

# 39. Notifications

Do not start with notifications.

A future notification could be:

> **Someone sent light to your wish.**

But users should never receive spammy engagement notifications.

Possible controls:

- off;
- occasional digest;
- meaningful events only.

Never send a notification for every individual light reaction.

---

# 40. Monetization Philosophy

Do not introduce monetization into the MVP.

The emotional environment is easily damaged by intrusive monetization.

Potential long-term ethical options:

- optional supporter membership;
- patron-style support;
- cosmetic personal-sky themes;
- donations to keep the project alive.

Avoid:

- selling personal wish data;
- advertising based on emotional content;
- paid visibility of wishes;
- paying for light;
- buying popularity.

Core principle:

> **A person's hope must never become an auction.**

---

# 41. Product Metrics That Actually Matter

Primary health metrics:

### Resonance rate

How often someone finds a wish meaningful enough to send light.

### Wish completion rate

Percentage of started wish submissions that successfully become stars.

### Discovery quality

Percentage of sessions where users open at least one wish.

### Repeat meaningful use

Whether users return to discover or leave wishes again.

### Moderation health

Reports, false-positive rate, harmful-content exposure, and response time.

### Performance health

Frame rate, first load, interaction latency, crash/error rate.

Do not set success criteria purely around:

- time spent;
- clicks;
- ad impressions;
- daily active users.

---

# 42. Launch Strategy

Use controlled rollout.

## Stage 1 — Private development

Only synthetic data.

## Stage 2 — Internal testing

Small trusted group.

Test:

- moderation;
- abuse;
- performance;
- mobile;
- accessibility.

## Stage 3 — Closed beta

Limited invite or controlled public exposure.

Monitor:

- harmful content;
- spam;
- GPU performance;
- database cost;
- user confusion.

## Stage 4 — Public beta

Expand gradually.

## Stage 5 — Full launch

Only after moderation operations and infrastructure are proven.

---

# 43. What NOT to Build Early

The coding agent should explicitly resist scope creep.

Do not start with:

- native mobile apps;
- complex 3D physics;
- multiplayer avatars;
- DMs;
- public profiles;
- follower systems;
- comments;
- competitive leaderboards;
- NFT/blockchain concepts;
- cryptocurrency;
- complex economy systems;
- AI-generated poetry replacing user wishes;
- giant admin analytics suites;
- unnecessary microservices.

The first proof should be:

> **Does one person enter the sky, discover a stranger's wish, feel something, send light, and leave their own star?**

If that works, the product has a foundation.

---

# 44. Definition of Done — MVP

The MVP is done only when all of the following are true:

### Product

- [ ] Landing page communicates the idea within seconds.
- [ ] User can enter the sky without account creation.
- [ ] User can explore stars.
- [ ] User can read wishes.
- [ ] User can send light.
- [ ] User can submit a wish.
- [ ] User's wish becomes a visible star.
- [ ] User can report harmful content.

### Engineering

- [ ] Production database is backed up.
- [ ] Migrations are reproducible.
- [ ] API authentication/authorization is correct.
- [ ] Rate limits work server-side.
- [ ] No secrets are shipped to frontend bundles.
- [ ] Error handling is implemented.
- [ ] Logging/observability exists.
- [ ] CI passes.

### Safety

- [ ] Moderation pipeline exists.
- [ ] Admin can review reports.
- [ ] Admin can remove content.
- [ ] Abuse controls exist.
- [ ] Privacy policy exists.
- [ ] Community guidelines exist.

### UX

- [ ] Mobile works.
- [ ] Reduced motion works.
- [ ] Keyboard/accessibility basics work.
- [ ] No critical information is inaccessible because of WebGL.

### Performance

- [ ] Galaxy remains usable on target mobile hardware.
- [ ] Large star counts are handled without DOM explosion.
- [ ] API payloads are bounded.
- [ ] Loading states are polished.

---

# 45. Suggested Repository Documentation

Create these files in the real repository:

```text
README.md
ARCHITECTURE.md
PRODUCT.md
SECURITY.md
PRIVACY.md
MODERATION.md
CONTRIBUTING.md
.env.example
```

This specification can serve as the initial source for PRODUCT.md.

---

# 46. Agent Instructions

The following instructions are specifically for an AI coding agent operating on this project.

## Instruction A — Preserve intent

The visual galaxy is not the purpose. Human connection is the purpose.

Do not make technical choices that maximize visual complexity while reducing usability, accessibility, or performance.

## Instruction B — Build in vertical slices

Prefer complete flows over isolated infrastructure.

For example, implement:

> submit wish → store → moderate → render star → open wish

before building elaborate constellation infrastructure.

## Instruction C — Verify everything

After meaningful changes, run:

- type checking;
- linting;
- tests;
- production build;
- targeted browser checks.

## Instruction D — Do not invent requirements

When a detail is unspecified, choose the simplest architecture consistent with this document.

Do not add features merely because they are technically interesting.

## Instruction E — Protect anonymity

Whenever a new feature is proposed, ask internally:

> Does this accidentally turn an anonymous wish into a public identity?

If yes, redesign it.

## Instruction F — Treat moderation as core infrastructure

Never postpone content moderation until immediately before launch.

## Instruction G — Keep the product quiet

Default toward less UI, fewer interruptions, and slower transitions.

## Instruction H — Avoid irreversible architecture decisions too early

Keep the initial system modular enough to evolve without prematurely introducing distributed complexity.

---

# 47. First Implementation Task for the Agent

When the agent receives this document and the repository is empty or mostly empty, the first task should be:

## Build the foundation and a visual proof-of-concept.

### Deliverables

1. Initialize the frontend application.
2. Initialize the backend application.
3. Add PostgreSQL migration tooling.
4. Create a minimal `wish` schema.
5. Build the `/` landing page.
6. Build `/sky`.
7. Create a procedural galaxy renderer with synthetic wishes.
8. Make stars clickable.
9. Build a wish-detail panel.
10. Make the experience responsive.
11. Add reduced-motion support.
12. Add basic tests.
13. Add `README.md` instructions.
14. Add `.env.example`.
15. Verify a production build.

Do not implement Mirror, Morning Sky, Archive, AI clustering, or complex authentication in this first task.

The first milestone is aesthetic + technical validation of the central loop.

---

# 48. First Milestone Acceptance Test

A fresh user should be able to do this:

```text
Open The Other Sky
      ↓
Understand the concept
      ↓
Enter the galaxy
      ↓
Pan through stars
      ↓
Click a star
      ↓
Read a stranger's wish
      ↓
Send Light
      ↓
Close the wish
      ↓
Write their own wish
      ↓
Release it
      ↓
Watch it become a star
```

The experience should take less than a few minutes and still leave a clear emotional impression.

---

# 49. Future Possibilities

These are deliberately postponed ideas, not MVP commitments.

## Global moment

> **Right now, 842 people are making a wish.**

## Wish anniversaries

A user may receive a reminder:

> **A year ago, you left this star.**

## Collective events

A temporary constellation may form around a major shared human theme.

## Seasonal skies

The visual sky can subtly change with seasons/time without changing core meaning.

## Personal constellation

A user's own wishes can form a private constellation.

## Time capsule wishes

A user may choose:

> **Open this wish one year from now.**

## Anonymous kindness chain

One wish receives light, which inspires another person to leave a hopeful wish, creating a chain without public identities.

These should only be implemented if they strengthen the core experience.

---

# 50. Final Product Definition

**The Other Sky is an anonymous digital night sky made from human wishes.**

People enter without needing to perform an identity.

They wander through stars that contain real human hopes.

They can pause on a stranger's wish.

They can send light.

They can discover that people around the world are wishing for many of the same things.

They can leave a small piece of themselves behind.

Some wishes will stay unresolved.
Some will disappear into quiet.
Some will find constellations.
Some will eventually come true.

The product should preserve one simple emotional truth:

> **We are all under the same sky, even when our lives feel very far apart.**

And the final interaction should always remain simple:

> **Leave a star. Find a stranger. Send a little light.**

---

# 51. Build Priority Summary

When tradeoffs occur, use this priority order:

```text
1. Safety
2. Privacy / anonymity
3. Core emotional experience
4. Reliability
5. Accessibility
6. Performance
7. Simplicity / maintainability
8. Visual polish
9. Advanced AI features
10. Extra engagement features
```

If a proposed feature conflicts with a higher-priority principle, reject or redesign the feature.

---

# 52. End State Vision

The long-term ambition is for The Other Sky to feel less like a product and more like a place people visit.

A quiet digital place people return to late at night.

A place where someone can anonymously write:

> *"I hope it gets better."*

and somewhere in the galaxy, another stranger can read it, send a little light, and move on knowing they were not the only person awake with that thought.

That is the product.

Everything else is implementation.
