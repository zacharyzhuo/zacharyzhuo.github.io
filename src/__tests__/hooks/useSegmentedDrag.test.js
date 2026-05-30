import { describe, test, expect } from 'vitest'
import { rubberBand, nearestIndex, isOverflowing } from '../../hooks/useSegmentedDrag.js'

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
    const constant = 60
    expect(rubberBand(100000, constant)).toBeLessThan(constant)
    expect(rubberBand(100000, constant)).toBeGreaterThan(constant * 0.99)
  })

  test('is monotonic increasing in overshoot', () => {
    expect(rubberBand(80)).toBeGreaterThan(rubberBand(40))
  })
})

describe('nearestIndex', () => {
  const centers = [20, 60, 100]

  test('picks the closest center', () => {
    expect(nearestIndex(22, centers)).toBe(0)
    expect(nearestIndex(58, centers)).toBe(1)
    expect(nearestIndex(95, centers)).toBe(2)
  })

  test('clamps to ends beyond the range', () => {
    expect(nearestIndex(-100, centers)).toBe(0)
    expect(nearestIndex(9999, centers)).toBe(2)
  })

  test('on a tie picks the earlier index', () => {
    // 40 is equidistant from 20 and 60
    expect(nearestIndex(40, centers)).toBe(0)
  })
})

describe('isOverflowing', () => {
  test('false when content fits', () => {
    expect(isOverflowing(300, 320)).toBe(false)
    expect(isOverflowing(320, 320)).toBe(false)
  })

  test('tolerates 1px sub-pixel slack', () => {
    expect(isOverflowing(321, 320)).toBe(false)
  })

  test('true when content clearly exceeds container', () => {
    expect(isOverflowing(400, 320)).toBe(true)
  })
})
