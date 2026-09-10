export interface StarColor {
  h: number
  s: number
  l: number
}

/**
 * Maps raw hue (0-360) into one of four restrained star-temperature families:
 * - hue 0-60:   warm white/gold family (e.g. hsl(45, 35%, 88%))
 * - hue 61-150: cool white family      (e.g. hsl(200, 15%, 92%))
 * - hue 151-260: pale blue family      (e.g. hsl(210, 45%, 85%))
 * - hue 261-360: soft rose-white family(e.g. hsl(340, 25%, 88%))
 *
 * Saturation is strictly kept <= 45% and lightness >= 80% so stars read as faint tints of white.
 */
export function getStarTemperatureColor(hue: number): StarColor {
  const raw = ((hue % 360) + 360) % 360
  const normalizedHue = raw === 0 && hue !== 0 && hue % 360 === 0 ? 360 : raw

  if (normalizedHue <= 60) {
    // Warm white / gold family
    const ratio = normalizedHue / 60
    return {
      h: Math.round(42 + ratio * 8), // 42-50
      s: Math.round(30 + ratio * 8), // 30-38%
      l: Math.round(86 + ratio * 3), // 86-89%
    }
  }

  if (normalizedHue <= 150) {
    // Cool white family
    const ratio = (normalizedHue - 61) / 89
    return {
      h: Math.round(195 + ratio * 10), // 195-205
      s: Math.round(12 + ratio * 6),   // 12-18%
      l: Math.round(90 + ratio * 3),   // 90-93%
    }
  }

  if (normalizedHue <= 260) {
    // Pale blue family
    const ratio = (normalizedHue - 151) / 109
    return {
      h: Math.round(208 + ratio * 8), // 208-216
      s: Math.round(38 + ratio * 7),  // 38-45%
      l: Math.round(84 + ratio * 3),  // 84-87%
    }
  }

  // Soft rose-white family (261-360)
  const ratio = (normalizedHue - 261) / 99
  return {
    h: Math.round(335 + ratio * 12), // 335-347
    s: Math.round(20 + ratio * 7),   // 20-27%
    l: Math.round(86 + ratio * 3),   // 86-89%
  }
}

/**
 * Deterministic hash from string ID to 32-bit integer.
 */
export function hashString(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export interface StarTwinkleProps {
  phase: number // 0 to 2*PI
  period: number // 3000ms to 6000ms
}

/**
 * Provides a stable phase and period for each star so its twinkle is consistent across renders.
 */
export function getStarTwinkleProps(wishId: string): StarTwinkleProps {
  const hash = hashString(wishId)
  const phase = ((hash % 1000) / 1000) * Math.PI * 2
  const period = 3000 + ((hash >>> 10) % 3000) // 3000ms - 6000ms
  return { phase, period }
}
