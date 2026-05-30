import { describe, test, expect } from 'vitest'
import { resist } from '../../lib/gesture.js'

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
