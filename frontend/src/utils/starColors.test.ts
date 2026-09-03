import { describe, expect, it } from 'vitest'
import { getStarTemperatureColor, getStarTwinkleProps, hashString } from './starColors'

describe('getStarTemperatureColor', () => {
  it('maps hue 0-60 to warm white/gold family with restrained saturation and lightness', () => {
    const testHues = [0, 15, 30, 45, 60]
    for (const hue of testHues) {
      const color = getStarTemperatureColor(hue)
      expect(color.h).toBeGreaterThanOrEqual(40)
      expect(color.h).toBeLessThanOrEqual(55)
      expect(color.s).toBeLessThanOrEqual(45)
      expect(color.l).toBeGreaterThanOrEqual(80)
    }
  })

  it('maps hue 61-150 to cool white family with restrained saturation and lightness', () => {
    const testHues = [61, 90, 120, 150]
    for (const hue of testHues) {
      const color = getStarTemperatureColor(hue)
      expect(color.h).toBeGreaterThanOrEqual(190)
      expect(color.h).toBeLessThanOrEqual(210)
      expect(color.s).toBeLessThanOrEqual(45)
      expect(color.l).toBeGreaterThanOrEqual(80)
    }
  })

  it('maps hue 151-260 to pale blue family with restrained saturation and lightness', () => {
    const testHues = [151, 180, 220, 260]
    for (const hue of testHues) {
      const color = getStarTemperatureColor(hue)
      expect(color.h).toBeGreaterThanOrEqual(200)
      expect(color.h).toBeLessThanOrEqual(225)
      expect(color.s).toBeLessThanOrEqual(45)
      expect(color.l).toBeGreaterThanOrEqual(80)
    }
  })

  it('maps hue 261-360 to soft rose-white family with restrained saturation and lightness', () => {
    const testHues = [261, 300, 330, 360]
    for (const hue of testHues) {
      const color = getStarTemperatureColor(hue)
      expect(color.h).toBeGreaterThanOrEqual(330)
      expect(color.h).toBeLessThanOrEqual(360)
      expect(color.s).toBeLessThanOrEqual(45)
      expect(color.l).toBeGreaterThanOrEqual(80)
    }
  })

  it('handles negative or >360 hues gracefully via modular arithmetic', () => {
    const c1 = getStarTemperatureColor(-30)
    const c2 = getStarTemperatureColor(330)
    expect(c1).toEqual(c2)

    const c3 = getStarTemperatureColor(405)
    const c4 = getStarTemperatureColor(45)
    expect(c3).toEqual(c4)
  })
})

describe('getStarTwinkleProps & hashString', () => {
  it('produces deterministic output for the same id', () => {
    const id = 'wish-abc-123'
    const twinkle1 = getStarTwinkleProps(id)
    const twinkle2 = getStarTwinkleProps(id)
    expect(twinkle1).toEqual(twinkle2)
    expect(hashString(id)).toBe(hashString(id))
  })

  it('produces period between 3000ms and 6000ms and phase between 0 and 2*PI', () => {
    const ids = ['wish-1', 'wish-2', 'wish-3', 'abc', 'xyz']
    for (const id of ids) {
      const { phase, period } = getStarTwinkleProps(id)
      expect(phase).toBeGreaterThanOrEqual(0)
      expect(phase).toBeLessThanOrEqual(Math.PI * 2)
      expect(period).toBeGreaterThanOrEqual(3000)
      expect(period).toBeLessThanOrEqual(6000)
    }
  })
})
