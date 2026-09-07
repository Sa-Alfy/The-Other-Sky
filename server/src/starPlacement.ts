/**
 * starPlacement.ts
 *
 * Blue-noise (dart-throwing Poisson-disc) star placement with soft galactic
 * density bias and magnitude-skewed depth layer generation.
 *
 * Background: independent uniform random placement produces visible clumps and
 * voids purely by chance. Poisson-disc sampling enforces a minimum inter-point
 * distance so the result looks evenly and organically spread — the standard
 * technique for procedural starfields, particle systems, and terrain scatter.
 */

/** Minimum Euclidean distance between any two stars in normalised (0–1) space.
 *  At 0.035 the canvas comfortably holds ~600–800 stars before crowding occurs.
 *  Reduce to ~0.025 if the sky fills up and fallback warnings appear in logs. */
export const MIN_STAR_DISTANCE = 0.035;

/** Maximum placement attempts before graceful crowded-sky fallback. */
const MAX_PLACEMENT_ATTEMPTS = 30;

/** Canvas safe margins (matching the original uniform-random bounds). */
const X_MIN = 0.07;
const X_MAX = 0.97;
const Y_MIN = 0.04;
const Y_MAX = 0.94;

/** Generate a single uniform-random candidate coordinate within safe margins. */
function generateCandidate(): { x: number; y: number } {
  const x = Number((Math.random() * (X_MAX - X_MIN) + X_MIN).toFixed(3));
  const y = Number((Math.random() * (Y_MAX - Y_MIN) + Y_MIN).toFixed(3));
  return { x, y };
}

/**
 * Soft galactic density bias.
 *
 * Real skies have denser and sparser regions — a soft diagonal band (like a
 * Milky Way structure) centered roughly along y ≈ 0.25 + 0.5·x gives the sky
 * organic structure without dominating it. Points in the band core get 100%
 * acceptance; points at the canvas edges get ~55% acceptance, keeping the whole
 * canvas populated but with a gentle concentration toward the band.
 *
 * Returns a weight in (0, 1]. Called after the minimum-distance check passes,
 * so acceptance is: Math.random() < densityWeight(x, y).
 */
function densityWeight(x: number, y: number): number {
  // Band centre as a function of x — gentle diagonal
  const bandCentreY = 0.25 + 0.5 * x;
  const distFromBand = Math.abs(y - bandCentreY);
  // Gaussian-like falloff; sigma ≈ 0.30 keeps the effect subtle
  const sigma = 0.30;
  const gaussian = Math.exp(-(distFromBand * distFromBand) / (2 * sigma * sigma));
  // Clamp so outlying regions still have 55% acceptance — never force voids
  return 0.55 + 0.45 * gaussian;
}

/**
 * Find a blue-noise placement for a new star given the existing star positions.
 *
 * Uses dart-throwing rejection sampling:
 *  1. Generate a candidate (x, y).
 *  2. Reject if any existing star is closer than MIN_STAR_DISTANCE.
 *  3. Accept with probability proportional to galactic density weight.
 *  4. Retry up to MAX_PLACEMENT_ATTEMPTS times.
 *  5. On exhaustion: fall back to the last candidate rather than blocking wish
 *     creation. If this fallback starts triggering often, reduce MIN_STAR_DISTANCE
 *     or expand the usable canvas area.
 *
 * NOTE: This queries all existing approved-public (x, y) on every insert —
 * O(n) per wish creation. Acceptable at current scale (few hundred stars);
 * would need spatial indexing (e.g. a grid or quadtree) past ~5 000 stars.
 */
export function findStarPlacement(
  existingStars: ReadonlyArray<{ x: number; y: number }>
): { x: number; y: number } {
  let lastCandidate = generateCandidate();

  for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
    const candidate = generateCandidate();
    lastCandidate = candidate;

    // Reject if too close to any existing star
    const tooClose = existingStars.some(
      (star) =>
        Math.hypot(star.x - candidate.x, star.y - candidate.y) < MIN_STAR_DISTANCE
    );
    if (tooClose) continue;

    // Accept with galactic density probability
    const weight = densityWeight(candidate.x, candidate.y);
    if (Math.random() < weight) {
      return candidate;
    }
    // Density-rejected: retry (don't fall through to fallback yet)
  }

  // Crowded-sky fallback — never block wish creation
  return lastCandidate;
}

/**
 * Assign a depth layer (z) to a new star, mirroring the magnitude distribution
 * of real stars: most visible stars are dim and far, a few are notably bright
 * and near.
 *
 *  ~60% — far layer    z ∈ [0.10, 0.40]  small, dim, slow parallax
 *  ~30% — mid layer    z ∈ [0.40, 0.70]  medium
 *  ~10% — near layer   z ∈ [0.70, 1.00]  large, bright, strong parallax
 */
export function generateStarDepth(): number {
  const roll = Math.random();
  if (roll < 0.60) {
    // Far layer
    return Number((0.10 + Math.random() * 0.30).toFixed(3));
  } else if (roll < 0.90) {
    // Mid layer
    return Number((0.40 + Math.random() * 0.30).toFixed(3));
  } else {
    // Near layer
    return Number((0.70 + Math.random() * 0.30).toFixed(3));
  }
}
