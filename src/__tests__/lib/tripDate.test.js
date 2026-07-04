import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import {
  parseTripDates,
  addDaysToDateString,
  resolveTripDate,
  computeDayFromDate,
  pickInitialDay,
  pickActiveTrip,
  formatToday,
  groupTrips,
  bannerLabel,
  tripDays,
} from '../../lib/tripDate.js'

describe('parseTripDates', () => {
  it('parses range with shortened end', () => {
    expect(parseTripDates('2026/06/04 - 06/10')).toEqual({
      start: '2026/06/04',
      end: '2026/06/10',
    })
  })

  it('parses cross-year range', () => {
    expect(parseTripDates('2026/12/30 - 2027/01/02')).toEqual({
      start: '2026/12/30',
      end: '2027/01/02',
    })
  })

  it('parses single-day trip', () => {
    expect(parseTripDates('2026/03/05')).toEqual({
      start: '2026/03/05',
      end: '2026/03/05',
    })
  })

  it('returns empty for falsy input', () => {
    expect(parseTripDates('')).toEqual({ start: '', end: '' })
    expect(parseTripDates(undefined)).toEqual({ start: '', end: '' })
  })

  it('expands MM/DD end into start year', () => {
    expect(parseTripDates('2026/06/04 - 06/10')).toEqual({
      start: '2026/06/04',
      end: '2026/06/10',
    })
  })

  it('expands DD-only end using start year/month', () => {
    expect(parseTripDates('2026/06/04 - 10')).toEqual({
      start: '2026/06/04',
      end: '2026/06/10',
    })
  })
})

describe('addDaysToDateString', () => {
  it('adds offset 0 unchanged', () => {
    expect(addDaysToDateString('2026/06/04', 0)).toBe('2026/06/04')
  })

  it('adds positive offset', () => {
    expect(addDaysToDateString('2026/06/04', 6)).toBe('2026/06/10')
  })

  it('handles month rollover', () => {
    expect(addDaysToDateString('2026/01/30', 5)).toBe('2026/02/04')
  })

  it('handles year rollover', () => {
    expect(addDaysToDateString('2026/12/30', 5)).toBe('2027/01/04')
  })

  it('pads single-digit month/day', () => {
    expect(addDaysToDateString('2026/3/1', 0)).toBe('2026/03/01')
  })

  it('returns empty for invalid input', () => {
    expect(addDaysToDateString('', 1)).toBe('')
    expect(addDaysToDateString('foo/bar/baz', 1)).toBe('')
    expect(addDaysToDateString('2026/06', 1)).toBe('')
  })
})

describe('resolveTripDate', () => {
  const tripDates = '2026/06/04 - 06/10'

  it('returns YYYY/MM/DD unchanged (with padding)', () => {
    expect(resolveTripDate('2026/06/04', tripDates)).toBe('2026/06/04')
    expect(resolveTripDate('2026/6/4', tripDates)).toBe('2026/06/04')
  })

  it('expands M/D with start year', () => {
    expect(resolveTripDate('6/4', tripDates)).toBe('2026/06/04')
    expect(resolveTripDate('06/10', tripDates)).toBe('2026/06/10')
  })

  it('handles cross-year trip: short date before start gets bumped to next year', () => {
    const crossYear = '2026/12/30 - 2027/01/02'
    expect(resolveTripDate('12/31', crossYear)).toBe('2026/12/31')
    expect(resolveTripDate('1/1', crossYear)).toBe('2027/01/01')
    expect(resolveTripDate('1/2', crossYear)).toBe('2027/01/02')
  })

  it('returns empty for empty / invalid input', () => {
    expect(resolveTripDate('', tripDates)).toBe('')
    expect(resolveTripDate(undefined, tripDates)).toBe('')
    expect(resolveTripDate('abc', tripDates)).toBe('')
    expect(resolveTripDate(123, tripDates)).toBe('')
  })

  it('returns empty for short date when tripDates missing', () => {
    expect(resolveTripDate('6/4', '')).toBe('')
    expect(resolveTripDate('6/4', undefined)).toBe('')
  })

  it('still works for full date when tripDates missing', () => {
    expect(resolveTripDate('2026/06/04', '')).toBe('2026/06/04')
  })
})

describe('computeDayFromDate', () => {
  const tripDates = '2026/06/04 - 06/10'

  it('start date is day 1', () => {
    expect(computeDayFromDate('2026/06/04', tripDates)).toBe(1)
  })

  it('subsequent dates increment correctly', () => {
    expect(computeDayFromDate('2026/06/05', tripDates)).toBe(2)
    expect(computeDayFromDate('2026/06/10', tripDates)).toBe(7)
  })

  it('handles cross-year', () => {
    const crossYear = '2026/12/30 - 2027/01/02'
    expect(computeDayFromDate('2026/12/30', crossYear)).toBe(1)
    expect(computeDayFromDate('2027/01/01', crossYear)).toBe(3)
    expect(computeDayFromDate('2027/01/02', crossYear)).toBe(4)
  })

  it('returns null for invalid input', () => {
    expect(computeDayFromDate('', tripDates)).toBeNull()
    expect(computeDayFromDate('foo', tripDates)).toBeNull()
  })

  it('returns null when tripDates missing', () => {
    expect(computeDayFromDate('2026/06/04', '')).toBeNull()
  })
})

describe('pickInitialDay', () => {
  const days = [
    { day: 1, date: '2026/06/04' },
    { day: 2, date: '2026/06/05' },
    { day: 3, date: '2026/06/06' },
  ]

  function stubToday(yyyymmdd) {
    const [y, m, d] = yyyymmdd.split('/').map(Number)
    vi.useFakeTimers()
    vi.setSystemTime(new Date(y, m - 1, d))
  }

  afterAll(() => {
    vi.useRealTimers()
  })

  it('today matches a trip day → return that day', () => {
    stubToday('2026/06/05')
    expect(pickInitialDay(days)).toBe(2)
  })

  it('today before trip → return day 1', () => {
    stubToday('2026/05/01')
    expect(pickInitialDay(days)).toBe(1)
  })

  it('today after trip → return day 1 (review mode)', () => {
    stubToday('2026/07/01')
    expect(pickInitialDay(days)).toBe(1)
  })

  it('empty days → return 1', () => {
    expect(pickInitialDay([])).toBe(1)
    expect(pickInitialDay(null)).toBe(1)
    expect(pickInitialDay(undefined)).toBe(1)
  })
})

describe('pickActiveTrip', () => {
  const trips = [
    { slug: 'past-trip', dates: '2025/01/01 - 01/05' },
    { slug: 'ongoing', dates: '2026/06/01 - 06/30' },
    { slug: 'future-soon', dates: '2026/07/01 - 07/10' },
    { slug: 'future-far', dates: '2027/01/01 - 01/10' },
  ]

  function stubToday(yyyymmdd) {
    const [y, m, d] = yyyymmdd.split('/').map(Number)
    vi.useFakeTimers()
    vi.setSystemTime(new Date(y, m - 1, d))
  }

  afterAll(() => {
    vi.useRealTimers()
  })

  it('ongoing trip wins when today is in range', () => {
    stubToday('2026/06/15')
    expect(pickActiveTrip(trips)).toBe('ongoing')
  })

  it('picks closest upcoming trip when no ongoing', () => {
    stubToday('2026/08/01')
    expect(pickActiveTrip(trips)).toBe('future-far')
  })

  it('picks first upcoming when multiple future trips', () => {
    stubToday('2026/05/01')
    expect(pickActiveTrip(trips)).toBe('ongoing')
  })

  it('returns null when all trips are past', () => {
    stubToday('2030/01/01')
    expect(pickActiveTrip(trips)).toBeNull()
  })

  it('returns null for empty input', () => {
    expect(pickActiveTrip([])).toBeNull()
    expect(pickActiveTrip(null)).toBeNull()
  })
})

describe('formatToday', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 4))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('returns padded YYYY/MM/DD', () => {
    expect(formatToday()).toBe('2026/06/04')
  })
})

describe('groupTrips', () => {
  function stubToday(yyyymmdd) {
    const [y, m, d] = yyyymmdd.split('/').map(Number)
    vi.useFakeTimers()
    vi.setSystemTime(new Date(y, m - 1, d))
  }
  afterAll(() => {
    vi.useRealTimers()
  })

  const trips = [
    { slug: 'past-2025-a', dates: '2025/11/02 - 11/07' },
    { slug: 'active', dates: '2026/06/12 - 06/18' },
    { slug: 'past-2026', dates: '2026/03/05 - 03/12' },
    { slug: 'upcoming-far', dates: '2026/09/01 - 09/05' },
    { slug: 'upcoming-near', dates: '2026/08/11 - 08/20' },
    { slug: 'past-2025-b', dates: '2025/04/04 - 04/06' },
  ]

  it('nowNext: active first, then upcoming by start ascending', () => {
    stubToday('2026/06/15')
    const { nowNext } = groupTrips(trips)
    expect(nowNext.map(t => t.slug)).toEqual(['active', 'upcoming-near', 'upcoming-far'])
  })

  it('pastByYear: years descending, trips within a year by end descending', () => {
    stubToday('2026/06/15')
    const { pastByYear } = groupTrips(trips)
    expect(pastByYear.map(g => g.year)).toEqual(['2026', '2025'])
    expect(pastByYear[0].trips.map(t => t.slug)).toEqual(['past-2026'])
    expect(pastByYear[1].trips.map(t => t.slug)).toEqual(['past-2025-a', 'past-2025-b'])
  })

  it('returns empty structure for empty / nullish input', () => {
    expect(groupTrips([])).toEqual({ nowNext: [], pastByYear: [] })
    expect(groupTrips(null)).toEqual({ nowNext: [], pastByYear: [] })
  })
})

describe('bannerLabel', () => {
  it('returns 今日行程 when the banner date is today', () => {
    expect(bannerLabel('2026/06/04', 2, '2026/06/04')).toBe('今日行程')
  })

  it('returns DAY N when the banner date is not today', () => {
    expect(bannerLabel('2026/06/05', 3, '2026/06/04')).toBe('DAY 3')
  })

  it('handles cross-year comparisons (same M/D, different year is not today)', () => {
    expect(bannerLabel('2025/06/04', 1, '2026/06/04')).toBe('DAY 1')
    expect(bannerLabel('2027/01/01', 5, '2027/01/01')).toBe('今日行程')
  })

  it('falls back to DAY N when date is missing', () => {
    expect(bannerLabel('', 4, '2026/06/04')).toBe('DAY 4')
    expect(bannerLabel(undefined, 4, '2026/06/04')).toBe('DAY 4')
  })
})

describe('tripDays', () => {
  it('computes inclusive day count for a shortened-end range', () => {
    expect(tripDays('2026/01/10 - 01/14')).toBe(5)
  })

  it('computes inclusive day count across a year boundary', () => {
    expect(tripDays('2024/12/28 - 2025/01/05')).toBe(9)
  })

  it('returns 1 for a single-day trip', () => {
    expect(tripDays('2026/03/05')).toBe(1)
  })

  it('returns null for malformed / empty input', () => {
    expect(tripDays('')).toBeNull()
    expect(tripDays(undefined)).toBeNull()
    expect(tripDays('not a date')).toBeNull()
  })
})
