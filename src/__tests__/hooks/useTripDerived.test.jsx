import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  useNormalizedItinerary,
  useNormalizedDays,
  useDays,
  useFoodItems,
} from '../../hooks/useTripDerived.js'

const TRIP_DATES = '2026/06/04 - 06/10'

describe('useNormalizedItinerary', () => {
  it('returns empty for null/undefined/empty input', () => {
    expect(renderHook(() => useNormalizedItinerary(null, TRIP_DATES)).result.current).toEqual([])
    expect(renderHook(() => useNormalizedItinerary(undefined, TRIP_DATES)).result.current).toEqual([])
    expect(renderHook(() => useNormalizedItinerary([], TRIP_DATES)).result.current).toEqual([])
  })

  it('computes _day + _date from short date format', () => {
    const itinerary = [
      { date: '6/4', name: 'A' },
      { date: '6/10', name: 'B' },
    ]
    const { result } = renderHook(() => useNormalizedItinerary(itinerary, TRIP_DATES))
    expect(result.current).toEqual([
      { date: '6/4', name: 'A', _day: 1, _date: '2026/06/04' },
      { date: '6/10', name: 'B', _day: 7, _date: '2026/06/10' },
    ])
  })

  it('falls back to row.day when date missing (backward compat)', () => {
    const itinerary = [
      { day: '3', name: 'no-date row' },
    ]
    const { result } = renderHook(() => useNormalizedItinerary(itinerary, TRIP_DATES))
    expect(result.current[0]._day).toBe(3)
    expect(result.current[0]._date).toBe('')
  })

  it('date takes precedence over day when both present', () => {
    const itinerary = [
      { day: '99', date: '6/4', name: 'X' },
    ]
    const { result } = renderHook(() => useNormalizedItinerary(itinerary, TRIP_DATES))
    expect(result.current[0]._day).toBe(1)
  })

  it('returns _day=null for rows with neither valid date nor day', () => {
    const itinerary = [
      { name: 'orphan' },
    ]
    const { result } = renderHook(() => useNormalizedItinerary(itinerary, TRIP_DATES))
    expect(result.current[0]._day).toBeNull()
  })
})

describe('useNormalizedDays', () => {
  it('computes _day from date column', () => {
    const daysData = [
      { date: '6/4', title: '宿霧' },
      { date: '6/7', title: '薄荷島' },
    ]
    const { result } = renderHook(() => useNormalizedDays(daysData, TRIP_DATES))
    expect(result.current).toEqual([
      { date: '6/4', title: '宿霧', _day: 1, _date: '2026/06/04' },
      { date: '6/7', title: '薄荷島', _day: 4, _date: '2026/06/07' },
    ])
  })

  it('falls back to row.day if no date (legacy schema)', () => {
    const daysData = [{ day: '2', title: 'legacy' }]
    const { result } = renderHook(() => useNormalizedDays(daysData, TRIP_DATES))
    expect(result.current[0]._day).toBe(2)
  })
})

describe('useDays', () => {
  it('returns distinct sorted days with computed dates from tripDates', () => {
    const normalized = [
      { _day: 2, _date: '2026/06/05' },
      { _day: 1, _date: '2026/06/04' },
      { _day: 2, _date: '2026/06/05' }, // dup
      { _day: 3, _date: '2026/06/06' },
    ]
    const { result } = renderHook(() => useDays(normalized, TRIP_DATES))
    expect(result.current).toEqual([
      { day: 1, date: '2026/06/04' },
      { day: 2, date: '2026/06/05' },
      { day: 3, date: '2026/06/06' },
    ])
  })

  it('filters out rows with _day=null', () => {
    const normalized = [
      { _day: 1, _date: '2026/06/04' },
      { _day: null, _date: '' },
      { _day: 2, _date: '2026/06/05' },
    ]
    const { result } = renderHook(() => useDays(normalized, TRIP_DATES))
    expect(result.current.map(d => d.day)).toEqual([1, 2])
  })

  it('falls back to _date when tripDates missing (legacy)', () => {
    const normalized = [
      { _day: 1, _date: '2026/06/04' },
    ]
    const { result } = renderHook(() => useDays(normalized, ''))
    expect(result.current[0].date).toBe('2026/06/04')
  })
})

describe('useFoodItems', () => {
  it('returns food array when food has rows', () => {
    const food = [{ name: 'Sushi' }]
    const itinerary = [{ name: 'should-not-use', type: 'food' }]
    const { result } = renderHook(() => useFoodItems(food, itinerary))
    expect(result.current).toEqual(food)
  })

  it('falls back to itinerary rows with type=food when food is empty', () => {
    const itinerary = [
      { name: '早餐', type: 'food' },
      { name: '景點', type: 'attraction' },
      { name: '購物', type: 'shopping' },
    ]
    const { result } = renderHook(() => useFoodItems([], itinerary))
    expect(result.current).toEqual([{ name: '早餐', type: 'food' }])
  })

  it('handles null inputs gracefully', () => {
    const { result } = renderHook(() => useFoodItems(null, null))
    expect(result.current).toEqual([])
  })
})
