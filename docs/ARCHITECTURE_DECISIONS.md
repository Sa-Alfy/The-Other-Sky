# Architecture Decisions

## Decision 1: Keep the first milestone prototype-first
Problem: The full product contains many future systems; building all of them at once would create too much complexity.

Decision: Build a minimal landing + galaxy prototype with mock wishes and a small API contract first.

Alternatives considered: heavy 3D engine, full database integration, advanced moderation flows.

Reason: The emotional experience and user flow are the first priority; the backend should support that rather than dominate it.

Consequences: The prototype remains understandable and easier for a student developer to maintain. Future infrastructure can be added once the interaction model is validated.

## Decision 2: Use in-memory data for now
Problem: Persistent storage is not required before the visual prototype is validated.

Decision: Keep the API backed by in-memory storage with clear data structures.

Alternatives considered: PostgreSQL immediately, JSON files, heavy mock service layer.

Reason: This reduces setup time and keeps the build moving while preserving a clean future migration path.

Consequences: Data resets on server restart, but the milestone remains aligned with the product spec and the planned sequence.
