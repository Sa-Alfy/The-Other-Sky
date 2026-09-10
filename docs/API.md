# API Documentation — The Other Sky

## Overview

The Other Sky API is a simple REST interface for managing wishes and interactions. All endpoints return JSON and support anonymous access (no authentication required).

## Base URL

```
Development:  http://localhost:3001
Production:   https://api.theothersky.com  (example)
```

## Authentication

**No user login required.** Access is anonymous.

Every request includes an opaque anonymous identifier:

```
GET /api/wishes?anonymous_id=1234567890-a1b2c3d4
```

The server generates a new ID if none is provided, and returns it in the `X-Anonymous-ID` response header:

```
X-Anonymous-ID: 1234567890-a1b2c3d4
```

**Client responsibility:** Store and reuse the anonymous ID in localStorage for session continuity.

## Response Format

All responses follow a consistent JSON structure:

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "text": "I hope future me is kinder to myself.",
    ...
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many wishes created recently. Please wait before creating another."
  }
}
```

**Error codes:**
- `INVALID_REQUEST` — Malformed request or validation failed
- `NOT_FOUND` — Resource doesn't exist
- `RATE_LIMITED` — Too many requests; wait before retrying
- `INTERNAL_ERROR` — Unexpected server error

---

## Endpoints

### GET /api/health
**Purpose:** Health check / availability test

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

**Status codes:** 200

---

### GET /api/wishes
**Purpose:** Retrieve all approved wishes

**Query Parameters:**
- `anonymous_id` (optional) — Session identifier

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "text": "I hope future me is peaceful.",
      "category": "hope",
      "status": "approved",
      "visibility": "public",
      "createdAt": "2026-09-02T14:30:00.000Z",
      "updatedAt": "2026-09-02T14:30:00.000Z",
      "reactions": 12,
      "x": 0.342,
      "y": 0.568,
      "z": 0,
      "size": 1.8,
      "brightness": 0.95,
      "hue": 45
    },
    ...
  ]
}
```

**Notes:**
- Only returns wishes with `status: "approved"`
- Results sorted by creation date (newest first)
- Limited to 500 wishes per request
- Reaction count aggregated from `wish_lights` table

**Status codes:** 200, 500

---

### GET /api/wishes/:id
**Purpose:** Retrieve a single wish by ID

**Path Parameters:**
- `id` (required) — Wish UUID

**Query Parameters:**
- `anonymous_id` (optional) — Session identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "text": "I hope future me is peaceful.",
    "category": "hope",
    "status": "approved",
    "visibility": "public",
    "createdAt": "2026-09-02T14:30:00.000Z",
    "updatedAt": "2026-09-02T14:30:00.000Z",
    "reactions": 12,
    "x": 0.342,
    "y": 0.568,
    "z": 0,
    "size": 1.8,
    "brightness": 0.95,
    "hue": 45
  }
}
```

**Error responses:**
- `404 NOT_FOUND` — Wish doesn't exist or is not approved

**Status codes:** 200, 404, 500

---

### POST /api/wishes
**Purpose:** Create a new wish

**Query Parameters:**
- `anonymous_id` (optional) — Session identifier (generated if not provided)

**Request Body:**
```json
{
  "text": "I hope future me is kinder to myself.",
  "category": "hope",
  "visibility": "public"
}
```

**Field Requirements:**
- `text` (required, string) — 3–280 characters
  - Trimmed of leading/trailing whitespace
  - Stored and returned as-is (never sanitized for rendering)
- `category` (optional, string) — Max 50 characters
  - Default: `"general"`
  - Suggested values: `hope`, `love`, `peace`, `healing`, `growth`, `clarity`
  - Not validated; any value accepted
- `visibility` (optional, enum) — `"public"` or `"private"`
  - Default: `"public"`
  - Currently not enforced; all wishes are visible

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "text": "I hope future me is kinder to myself.",
    "category": "hope",
    "status": "approved",
    "visibility": "public",
    "createdAt": "2026-09-02T14:30:00.000Z",
    "updatedAt": "2026-09-02T14:30:00.000Z",
    "reactions": 0,
    "x": 0.342,
    "y": 0.568,
    "z": 0,
    "size": 1.8,
    "brightness": 0.95,
    "hue": 45
  }
}
```

**Validation Errors:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Wish must be at least 3 characters"
  }
}
```

**Rate Limit Errors (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many wishes created recently. Please wait before creating another."
  }
}
```

**Limits:**
- 5 wishes per hour per anonymous user
- Limit tracked by `anonymous_id`

**Notes:**
- Star placement (x, y, z, size, brightness, hue) generated randomly
- `status` always set to `"approved"` (MVP simplified workflow)
- `reactions` starts at 0
- Server includes anonymous ID in response header if generated

**Status codes:** 201, 400, 429, 500

---

### POST /api/wishes/:id/light
**Purpose:** Send light (reaction) to a wish

**Path Parameters:**
- `id` (required) — Wish UUID

**Query Parameters:**
- `anonymous_id` (optional) — Session identifier

**Request Body:**
```json
{
  "wishId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "text": "I hope future me is peaceful.",
    "category": "hope",
    "status": "approved",
    "visibility": "public",
    "createdAt": "2026-09-02T14:30:00.000Z",
    "updatedAt": "2026-09-02T14:30:00.000Z",
    "reactions": 13,
    "x": 0.342,
    "y": 0.568,
    "z": 0,
    "size": 1.8,
    "brightness": 0.95,
    "hue": 45
  }
}
```

**Deduplication:**
- If the same anonymous user sends light to the same wish multiple times, only the first counts
- Subsequent requests return the wish with the same reaction count (no increment)
- No error is raised; response is identical to first request

**Rate Limit Errors (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too much light sent recently. Please wait before sending more."
  }
}
```

**Limits:**
- 20 light reactions per hour per anonymous user
- Limit tracked by `anonymous_id`

**Error Responses:**
- `400 INVALID_REQUEST` — Missing or invalid request
- `404 NOT_FOUND` — Wish doesn't exist
- `429 RATE_LIMITED` — Too many requests

**Notes:**
- Always returns the full updated wish object
- Reaction count reflects all unique anonymous users who've sent light, not total sends
- Sending light twice from same user doesn't double-count

**Status codes:** 200, 400, 404, 429, 500

---

### POST /api/me/recovery-phrase
**Purpose:** Generate a one-time 4-word cryptographic recovery phrase for the caller's anonymous identity. Plaintext phrase is returned only once and never logged or retrievable again.

**Headers:**
- Cookie: `othersky_sid=<session_token>` (required)

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "phrase": "dawn-lantern-cedar-fable"
  }
}
```

**Conflict (409 Conflict):**
Returned if the session already has an active recovery phrase:
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "A recovery phrase has already been generated for this Personal Sky."
  }
}
```

**Status codes:** 201, 401, 409, 500

---

### POST /api/me/recover
**Purpose:** Reattach an existing anonymous identity and Personal Sky to a new browser/session using the 4-word recovery phrase.

**Rate limit:** 5 attempts per IP per hour (`429 Too Many Requests`).

**Request Body:**
```json
{
  "phrase": "dawn-lantern-cedar-fable"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "recovered": true
  }
}
```
*Note: Sets the `othersky_sid` HTTP-only cookie to the matched user's identity.*

**Error response (401 Unauthorized):**
Generic message returned for any invalid, unknown, or malformed phrase to prevent attacker enumeration:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid recovery phrase."
  }
}
```

**Status codes:** 200, 401, 429, 500

---

## Client Implementation Example

### React/TypeScript

```typescript
// Session management
const ANONYMOUS_ID_KEY = 'othersky_anonymous_id'

function getOrCreateAnonymousId(): string {
  let id = localStorage.getItem(ANONYMOUS_ID_KEY)
  if (!id) {
    // Will be set by server on first request
    id = `temp-${Date.now()}`
  }
  return id
}

function storeAnonymousId(id: string) {
  localStorage.setItem(ANONYMOUS_ID_KEY, id)
}

// API helper
async function apiCall(endpoint: string, options?: RequestInit) {
  const anonymousId = getOrCreateAnonymousId()
  const url = new URL(endpoint)
  url.searchParams.set('anonymous_id', anonymousId)

  const response = await fetch(url.toString(), {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })

  // Store ID from response header
  const headerId = response.headers.get('X-Anonymous-ID')
  if (headerId && headerId !== anonymousId) {
    storeAnonymousId(headerId)
  }

  return response.json()
}

// Usage
const wishes = await apiCall('/api/wishes')
const created = await apiCall('/api/wishes', {
  method: 'POST',
  body: JSON.stringify({ text: 'My wish...', category: 'hope' }),
})
const result = await apiCall(`/api/wishes/${wishId}/light`, {
  method: 'POST',
  body: JSON.stringify({ wishId }),
})
```

---

## Rate Limiting

Both endpoints are rate-limited per anonymous user:

| Endpoint | Limit | Window | Error Response |
|----------|-------|--------|-----------------|
| POST /api/wishes | 5 | 1 hour | 429 RATE_LIMITED |
| POST /api/wishes/:id/light | 20 | 1 hour | 429 RATE_LIMITED |

**How it works:**
1. Server tracks request count per `anonymous_id` per action
2. When limit is exceeded, returns 429 with error message
3. Client should display calm message to user
4. Limit resets after window expires

**Frontend UI:**
- Show error message
- Recommend waiting a bit before retrying
- No angry tone or penalties

---

## Milestone 5 Endpoints

### POST /api/wishes/:id/save
**Purpose:** Save a wish to the current anonymous session's private collection.

**Status codes:**
- `200` — Wish successfully saved: `{"success": true, "data": {"saved": true}}`
- `404` — Wish not found

---

### DELETE /api/wishes/:id/save
**Purpose:** Remove a saved wish from the current anonymous session's collection.

**Status codes:**
- `200` — Wish successfully unsaved: `{"success": true, "data": {"saved": false}}`

---

### GET /api/me/sky
**Purpose:** Retrieve the Personal Sky for the current session.

**Response:**
```json
{
  "success": true,
  "data": {
    "ownWishes": [ ... ],
    "savedWishes": [ ... ],
    "lightedWishes": [ ... ]
  }
}
```

---

### POST /api/wishes/:id/fulfill
**Purpose:** Voluntarily mark a wish as fulfilled (restricted to the original creator).

**Request Body:**
```json
{
  "note": "Optional reflection about what happened (max 280 chars)"
}
```

**Status codes:**
- `200` — Wish marked as fulfilled; returns updated Wish object
- `403` — Forbidden: requestor is not the creator of this wish
- `404` — Wish not found

---

### GET /api/morning-sky
**Purpose:** Retrieve all approved wishes that have been fulfilled, ordered by fulfillment date descending.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "text": "I hope tomorrow is gentler.",
      "fulfilledAt": "2026-09-04T12:00:00.000Z",
      "fulfillmentNote": "It is finally on the wall.",
      ...
    }
  ]
}
```

---

### GET /api/constellations
**Purpose:** Retrieve all constellations (categories) with connected star counts and descriptions.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "hope",
      "name": "Hope",
      "slug": "hope",
      "description": "Quiet beacons reaching toward tomorrow.",
      "wishCount": 18
    }, ...
  ]
}
```

---

### GET /api/constellations/:slug
**Purpose:** Retrieve all approved wishes belonging to a specific constellation category.

---

### GET /api/mirror?wishId=:id
**Purpose:** Discover emotionally resonant wishes similar to the given wish using PostgreSQL full-text search (`tsvector` + `plainto_tsquery`) and category fallback.

**Response:**
```json
{
  "success": true,
  "data": {
    "relatedWishes": [ ... ],
    "message": "You're not the only one."
  }
}
```

---

## Error Handling

### HTTP Status Codes
- `200` — Success
- `201` — Created (POST /api/wishes)
- `400` — Bad request (validation failed)
- `401` — Unauthorized (admin endpoints)
- `403` — Forbidden (e.g. attempting to fulfill someone else's wish)
- `404` — Not found
- `429` — Too many requests (rate limited)
- `500` — Server error

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

### Important: Safe Error Messages
- **Never exposed:** SQL statements, connection strings, stack traces
- **Always safe:** User-friendly, non-technical messages
- **Logged internally:** Full error details logged server-side for debugging

---

## Wish Data Schema

### Wish Object
```typescript
type Wish = {
  id: string                    // UUID
  text: string                  // 3–280 chars, plain text
  category: string              // e.g., "hope", "love", "peace", "healing", "growth", "clarity"
  status: 'approved' | 'pending' | 'rejected' | 'flagged'
  visibility: 'public' | 'private'
  createdAt: string             // ISO 8601 timestamp
  updatedAt: string             // ISO 8601 timestamp
  fulfilledAt?: string | null   // ISO 8601 timestamp when marked fulfilled
  fulfillmentNote?: string | null // Optional user reflection on fulfillment (max 280 chars)
  reactions: number             // Count of unique Send Light interactions
  x: number                     // 0.0 to 1.0 (normalized)
  y: number                     // 0.0 to 1.0 (normalized)
  z: number                     // 0.0 to 1.0 (depth, currently 0)
  size: number                  // Relative star size (1.0 to ~3.0)
  brightness: number            // 0.0 to 1.0 (glow intensity)
  hue: number                   // 0–360 (HSL color)
}
```

---

**Last Updated:** Milestone 5  
**Version:** 2.0

