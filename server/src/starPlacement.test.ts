import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { findStarPlacement, generateStarDepth, MIN_STAR_DISTANCE } from './starPlacement.js';

describe('findStarPlacement — blue-noise Poisson-disc sampling', () => {
  it('returns x and y within expected canvas bounds', () => {
    const { x, y } = findStarPlacement([]);
    assert.ok(x >= 0.07 && x <= 0.97, `x=${x} out of safe bounds [0.07, 0.97]`);
    assert.ok(y >= 0.04 && y <= 0.94, `y=${y} out of safe bounds [0.04, 0.94]`);
  });

  it('respects minimum distance from all existing stars', () => {
    // Seed a grid of existing stars
    const existing: Array<{ x: number; y: number }> = [];
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        existing.push({ x: 0.10 + col * 0.15, y: 0.10 + row * 0.15 });
      }
    }

    // Run enough placements to get a good sample
    let violations = 0;
    for (let trial = 0; trial < 50; trial++) {
      const { x, y } = findStarPlacement(existing);
      for (const star of existing) {
        const d = Math.hypot(star.x - x, star.y - y);
        if (d < MIN_STAR_DISTANCE) violations++;
      }
    }
    // Violations are possible only via the crowded-sky fallback path.
    // With 36 grid stars on a 0.07–0.97 canvas, fallback is uncommon.
    // Allow up to 5 fallback violations across 50 trials (10%).
    assert.ok(violations <= 5, `Too many MIN_STAR_DISTANCE violations: ${violations}`);
  });

  it('does not throw when the canvas is completely saturated (graceful fallback)', () => {
    // Pack stars densely to force every candidate to fail the distance check
    const dense: Array<{ x: number; y: number }> = [];
    const step = MIN_STAR_DISTANCE * 0.5;
    for (let x = 0.07; x <= 0.97; x += step) {
      for (let y = 0.04; y <= 0.94; y += step) {
        dense.push({ x: Number(x.toFixed(3)), y: Number(y.toFixed(3)) });
      }
    }
    assert.doesNotThrow(() => findStarPlacement(dense));
  });
});

describe('generateStarDepth — magnitude-skewed depth distribution', () => {
  it('always returns z within [0.10, 1.00]', () => {
    for (let i = 0; i < 500; i++) {
      const z = generateStarDepth();
      assert.ok(z >= 0.10 && z <= 1.00, `z=${z} out of expected range [0.10, 1.00]`);
    }
  });

  it('approximately respects 60/30/10 distribution (far/mid/near)', () => {
    const N = 3000;
    let far = 0, mid = 0, near = 0;
    for (let i = 0; i < N; i++) {
      const z = generateStarDepth();
      if (z < 0.40) far++;
      else if (z < 0.70) mid++;
      else near++;
    }
    const farPct = far / N;
    const midPct = mid / N;
    const nearPct = near / N;

    // Allow ±12% tolerance around targets (60%, 30%, 10%)
    assert.ok(farPct >= 0.48 && farPct <= 0.72, `far layer ${(farPct * 100).toFixed(1)}% not near 60%`);
    assert.ok(midPct >= 0.18 && midPct <= 0.42, `mid layer ${(midPct * 100).toFixed(1)}% not near 30%`);
    assert.ok(nearPct >= 0.00 && nearPct <= 0.22, `near layer ${(nearPct * 100).toFixed(1)}% not near 10%`);
  });
});
