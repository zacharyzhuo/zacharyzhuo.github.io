import { describe, test, expect } from 'vitest'
import { resist, isPointInRect } from '../../lib/gesture.js'

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
