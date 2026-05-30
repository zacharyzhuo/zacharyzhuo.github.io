import { describe, it, expect } from 'vitest'
import { resolveCurrency, convert, formatRate, DIRECTIONS } from '../../lib/currency.js'

describe('resolveCurrency', () => {
  it('maps known country codes to ISO 4217 currency', () => {
    expect(resolveCurrency('JP')).toBe('JPY')
    expect(resolveCurrency('KR')).toBe('KRW')
    expect(resolveCurrency('TH')).toBe('THB')
    expect(resolveCurrency('TW')).toBe('TWD')
  })

  it('is case-insensitive and trims whitespace', () => {
    expect(resolveCurrency('jp')).toBe('JPY')
    expect(resolveCurrency('  kr  ')).toBe('KRW')
  })

  it('returns null for unknown country code', () => {
    expect(resolveCurrency('XX')).toBeNull()
  })

  it('returns null for empty / nullish input', () => {
    expect(resolveCurrency('')).toBeNull()
    expect(resolveCurrency(null)).toBeNull()
    expect(resolveCurrency(undefined)).toBeNull()
  })
})

describe('convert', () => {
  const rate = 5.0765 // 1 TWD = 5.0765 JPY

  it('toTwd converts 100 foreign to TWD', () => {
    expect(convert(rate, DIRECTIONS.TO_TWD)).toBeCloseTo(19.7, 1)
  })

  it('toForeign returns rate as-is (1 TWD in foreign)', () => {
    expect(convert(rate, DIRECTIONS.TO_FOREIGN)).toBeCloseTo(5.08, 2)
  })

  it('returns null for non-positive or non-finite rate', () => {
    expect(convert(0, DIRECTIONS.TO_TWD)).toBeNull()
    expect(convert(-1, DIRECTIONS.TO_FOREIGN)).toBeNull()
    expect(convert(NaN, DIRECTIONS.TO_TWD)).toBeNull()
  })
})

describe('formatRate', () => {
  it('uses fewer decimals as magnitude grows', () => {
    expect(formatRate(19.74)).toBe('19.7')
    expect(formatRate(5.0765)).toBe('5.08')
    expect(formatRate(123.4)).toBe('123')
    expect(formatRate(0.031821)).toBe('0.0318')
  })

  it('returns empty string for non-finite values', () => {
    expect(formatRate(NaN)).toBe('')
    expect(formatRate(Infinity)).toBe('')
  })
})
