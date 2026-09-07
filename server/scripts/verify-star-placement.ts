/**
 * verify-star-placement.ts
 *
 * Objective comparison of independent-uniform vs blue-noise Poisson-disc
 * star placement. Generates 150 points by each method, computes nearest-
 * neighbor distance for every point, and reports:
 *
 *   mean (μ), standard deviation (σ), coefficient of variation (CV = σ/μ),
 *   minimum and maximum nearest-neighbor distance.
 *
 * Blue-noise should exhibit a notably lower CV and a higher minimum distance
 * (confirming no crammed pairs) compared to the uniform method.
 *
 * Run:  npx tsx server/scripts/verify-star-placement.ts
 */

import { findStarPlacement, MIN_STAR_DISTANCE } from '../src/starPlacement';

const N = 150;

// --------------------------------------------------------------------------
// Method A — old independent uniform random placement
// --------------------------------------------------------------------------
function generateUniform(count: number): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    pts.push({
      x: Number((Math.random() * 0.9 + 0.07).toFixed(3)),
      y: Number((Math.random() * 0.9 + 0.04).toFixed(3)),
    });
  }
  return pts;
}

// --------------------------------------------------------------------------
// Method B — new blue-noise Poisson-disc sampling
// --------------------------------------------------------------------------
function generateBlueNoise(count: number): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    const pt = findStarPlacement(pts);
    pts.push(pt);
  }
  return pts;
}

// --------------------------------------------------------------------------
// Statistics helpers
// --------------------------------------------------------------------------
function nearestNeighborDistances(pts: Array<{ x: number; y: number }>): number[] {
  return pts.map((p, i) => {
    let minD = Infinity;
    for (let j = 0; j < pts.length; j++) {
      if (i === j) continue;
      const d = Math.hypot(pts[j].x - p.x, pts[j].y - p.y);
      if (d < minD) minD = d;
    }
    return minD;
  });
}

function stats(values: number[]): { mean: number; std: number; cv: number; min: number; max: number } {
  const n = values.length;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  return {
    mean,
    std,
    cv: std / mean,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function fmt(v: number) {
  return v.toFixed(5);
}

// --------------------------------------------------------------------------
// Run
// --------------------------------------------------------------------------
console.log(`\nGenerating ${N} points by each method...\n`);

const uniform = generateUniform(N);
const blueNoise = generateBlueNoise(N);

const uniformNND = nearestNeighborDistances(uniform);
const blueNoiseNND = nearestNeighborDistances(blueNoise);

const uStats = stats(uniformNND);
const bStats = stats(blueNoiseNND);

const col = (s: string, w = 14) => s.padStart(w);

console.log(
  [
    col('Metric'),
    col('Uniform (old)'),
    col('Blue-noise (new)'),
    col('Better'),
  ].join('  ')
);
console.log('-'.repeat(66));

const rows: [string, number, number, 'lower' | 'higher'][] = [
  ['Mean (μ)',  uStats.mean, bStats.mean, 'higher'],
  ['Std dev (σ)', uStats.std, bStats.std, 'lower'],
  ['CV (σ/μ)', uStats.cv, bStats.cv, 'lower'],
  ['Min NN dist', uStats.min, bStats.min, 'higher'],
  ['Max NN dist', uStats.max, bStats.max, 'lower'],
];

for (const [label, u, b, prefer] of rows) {
  const winner = prefer === 'lower' ? (b < u ? '✓ blue-noise' : '✗ uniform') : (b > u ? '✓ blue-noise' : '✗ uniform');
  console.log(
    [
      col(label),
      col(fmt(u)),
      col(fmt(b)),
      col(winner),
    ].join('  ')
  );
}

console.log('');
console.log(`MIN_STAR_DISTANCE enforced: ${MIN_STAR_DISTANCE}`);
console.log(`Blue-noise actual min NN:   ${fmt(bStats.min)} (should be ≥ ${MIN_STAR_DISTANCE} minus fallback noise)`);
console.log('');
console.log('Interpretation:');
console.log('  Lower CV → more consistent spacing (no crammed pairs, no huge voids).');
console.log('  Higher min NN → confirms the distance constraint is holding.');
console.log('');
