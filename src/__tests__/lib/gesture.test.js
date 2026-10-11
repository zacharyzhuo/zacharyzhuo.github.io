import { describe, test, expect } from 'vitest'
import { resist, isPointInRect, rubberBand, rubberBandInverse } from '../../lib/gesture.js'

describe('resist', () => {
  test('returns 0 for no movement', () => {
    expect(resist(0)).toBe(0)
  })

  test('preserves sign', () => {
    expect(resist(50)).toBeGreaterThan(0)
    expect(resist(-50)).toBeLessThan(0)
  })

  test('damps magnitude below the raw delta', () => {
    expect(resist(100)).toBeLessThan(100)
    expect(Math.abs(resist(-100))).toBeLessThan(100)
  })

  test('never exceeds max even for huge pulls', () => {
    expect(resist(100000, 80)).toBeLessThan(80)
    expect(resist(100000, 80)).toBeGreaterThan(80 * 0.99)
  })

  test('is monotonic increasing in delta', () => {
    expect(resist(120)).toBeGreaterThan(resist(60))
  })
})

describe('isPointInRect', () => {
  const rect = { left: 10, right: 110, top: 20, bottom: 60 }

  test('true for a point inside', () => {
    expect(isPointInRect(50, 40, rect)).toBe(true)
  })

  test('true on the edges (inclusive)', () => {
    expect(isPointInRect(10, 20, rect)).toBe(true)
    expect(isPointInRect(110, 60, rect)).toBe(true)
  })

  test('false when outside on any axis', () => {
    expect(isPointInRect(5, 40, rect)).toBe(false)   // left of
    expect(isPointInRect(120, 40, rect)).toBe(false) // right of
    expect(isPointInRect(50, 10, rect)).toBe(false)  // above
    expect(isPointInRect(50, 70, rect)).toBe(false)  // below
  })
})

describe('rubberBand', () => {
  test('returns 0 for no overshoot', () => {
    expect(rubberBand(0)).toBe(0)
  })

  test('preserves sign of overshoot', () => {
    expect(rubberBand(50)).toBeGreaterThan(0)
    expect(rubberBand(-50)).toBeLessThan(0)
  })

  test('damps magnitude below the raw overshoot', () => {
    expect(rubberBand(100)).toBeLessThan(100)
    expect(Math.abs(rubberBand(-100))).toBeLessThan(100)
  })

  test('is bounded by the constant even for huge overshoot', () => {
    const constant = 80
    expect(rubberBand(100000, constant)).toBeLessThan(constant)
    expect(rubberBand(-100000, constant)).toBeGreaterThan(-constant)
    expect(rubberBand(100000, constant)).toBeGreaterThan(constant * 0.99)
  })

  test('is monotonic increasing in overshoot', () => {
    expect(rubberBand(80)).toBeGreaterThan(rubberBand(40))
    expect(rubberBand(-80)).toBeLessThan(rubberBand(-40))
  })
})

describe('rubberBandInverse', () => {
  test('0 對應 0', () => {
    expect(rubberBandInverse(0, 80)).toBe(0)
  })

  test('round-trip：rubberBand(rubberBandInverse(v)) === v（正負皆然）', () => {
    for (const v of [1, 10, 40, 79, -1, -10, -40, -79]) {
      expect(rubberBand(rubberBandInverse(v, 80), 80)).toBeCloseTo(v, 9)
    }
  })

  test('反向 round-trip：rubberBandInverse(rubberBand(raw)) === raw', () => {
    for (const raw of [5, 120, 500, -5, -120, -500]) {
      expect(rubberBandInverse(rubberBand(raw, 60), 60)).toBeCloseTo(raw, 6)
    }
  })

  test('|v| ≥ constant 時夾成同號的大有限值', () => {
    expect(Number.isFinite(rubberBandInverse(80, 80))).toBe(true)
    expect(rubberBandInverse(80, 80)).toBeGreaterThan(1000)
    expect(rubberBandInverse(-90, 80)).toBeLessThan(-1000)
  })
})
