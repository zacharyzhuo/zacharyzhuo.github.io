import { describe, test, expect } from 'vitest'
import { washColorsForDay } from '../../lib/wash.js'
import { CATEGORIES, BRAND_WASH } from '../../lib/categories.js'

const rgba = (rgb, a) => `rgba(${rgb}, ${a})`

describe('washColorsForDay', () => {
  test('returns null when rows are empty or missing', () => {
    expect(washColorsForDay([])).toBeNull()
    expect(washColorsForDay(null)).toBeNull()
    expect(washColorsForDay(undefined)).toBeNull()
  })

  test('three or more categories: [c1, c2, c3, c1] by count', () => {
    // Arrange: food x2 dominant, then transport, then shopping
    const rows = [
      { type: 'food' },
      { type: 'food' },
      { type: 'transport' },
      { type: 'shopping' },
    ]

    // Act
    const colors = washColorsForDay(rows)

    // Assert
    expect(colors).toEqual([
      rgba(CATEGORIES.food.wash, 0.42),
      rgba(CATEGORIES.transport.wash, 0.36),
      rgba(CATEGORIES.shopping.wash, 0.34),
      rgba(CATEGORIES.food.wash, 0.34),
    ])
  })

  test('two categories alternate: [c1, c2, c1, c2]', () => {
    const rows = [{ type: 'transport' }, { type: 'transport' }, { type: 'hotel' }]

    const colors = washColorsForDay(rows)

    expect(colors).toEqual([
      rgba(CATEGORIES.transport.wash, 0.42),
      rgba(CATEGORIES.hotel.wash, 0.36),
      rgba(CATEGORIES.transport.wash, 0.34),
      rgba(CATEGORIES.hotel.wash, 0.34),
    ])
  })

  test('single category pairs with brand wash', () => {
    const rows = [{ type: 'food' }]

    const colors = washColorsForDay(rows)

    expect(colors).toEqual([
      rgba(CATEGORIES.food.wash, 0.42),
      rgba(BRAND_WASH, 0.36),
      rgba(CATEGORIES.food.wash, 0.34),
      rgba(BRAND_WASH, 0.34),
    ])
  })

  test('unknown or empty type falls back to attraction (same as timeline)', () => {
    const rows = [{ type: 'mystery' }, {}]

    const colors = washColorsForDay(rows)

    expect(colors[0]).toBe(rgba(CATEGORIES.attraction.wash, 0.42))
  })

  test('tie-break keeps first-seen order', () => {
    const rows = [{ type: 'shopping' }, { type: 'food' }]

    const colors = washColorsForDay(rows)

    expect(colors[0]).toBe(rgba(CATEGORIES.shopping.wash, 0.42))
    expect(colors[1]).toBe(rgba(CATEGORIES.food.wash, 0.36))
  })
})
