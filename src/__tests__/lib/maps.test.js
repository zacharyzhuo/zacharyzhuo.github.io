import { describe, it, expect } from 'vitest'
import {
  parseLatLng,
  pointBucket,
  toMapPoints,
  haversineMeters,
  sortByDistance,
  routePoints,
  formatDistance,
  buildMapsUrl,
} from '../../lib/maps.js'

describe('parseLatLng', () => {
  it('parses valid lat/lng strings', () => {
    expect(parseLatLng({ lat: '35.6764', lng: '139.6993' })).toEqual({ lat: 35.6764, lng: 139.6993 })
  })
  it('trims whitespace', () => {
    expect(parseLatLng({ lat: ' 35.6 ', lng: ' 139.7 ' })).toEqual({ lat: 35.6, lng: 139.7 })
  })
  it('returns null when missing or non-numeric', () => {
    expect(parseLatLng({ lat: '', lng: '139.7' })).toBeNull()
    expect(parseLatLng({ lat: 'abc', lng: '139.7' })).toBeNull()
    expect(parseLatLng({})).toBeNull()
    expect(parseLatLng(null)).toBeNull()
  })
  it('rejects out-of-range and 0,0', () => {
    expect(parseLatLng({ lat: '999', lng: '139' })).toBeNull()
    expect(parseLatLng({ lat: '0', lng: '0' })).toBeNull()
  })
})

describe('pointBucket', () => {
  it('returns backup when _day is null/undefined (empty date)', () => {
    expect(pointBucket({ _day: null, type: 'food' })).toBe('backup')
    expect(pointBucket({ type: 'attraction' })).toBe('backup')
  })
  it('maps scheduled food/attraction/shopping by type', () => {
    expect(pointBucket({ _day: 1, type: 'food' })).toBe('food')
    expect(pointBucket({ _day: 2, type: 'attraction' })).toBe('attraction')
    expect(pointBucket({ _day: 3, type: 'shopping' })).toBe('shopping')
  })
  it('defaults empty type to attraction when scheduled', () => {
    expect(pointBucket({ _day: 1, type: '' })).toBe('attraction')
  })
  it('excludes scheduled transport/hotel (returns null)', () => {
    expect(pointBucket({ _day: 1, type: 'transport' })).toBeNull()
    expect(pointBucket({ _day: 1, type: 'hotel' })).toBeNull()
  })
})

describe('toMapPoints', () => {
  const rows = [
    { name: '明治神宮', type: 'attraction', _day: 1, _date: '2026/03/15', lat: '35.6764', lng: '139.6993', link: 'https://maps.app.goo.gl/x', address: '', time: '10:00', description: '森林神社' },
    { name: '一蘭', type: 'food', _day: 1, lat: '35.6608', lng: '139.6987', time: '12:30' },
    { name: '備選咖啡', type: 'food', _day: null, lat: '35.66', lng: '139.71' },
    { name: '無座標的點', type: 'food', _day: 1, lat: '', lng: '' },
    { name: '飯店', type: 'hotel', _day: 1, lat: '35.6', lng: '139.7' },
  ]
  it('keeps only rows with valid coords AND a non-null bucket', () => {
    const pts = toMapPoints(rows)
    expect(pts.map(p => p.name)).toEqual(['明治神宮', '一蘭', '備選咖啡'])
  })
  it('carries the right fields incl bucket and day', () => {
    const meiji = toMapPoints(rows)[0]
    expect(meiji).toMatchObject({
      name: '明治神宮', lat: 35.6764, lng: 139.6993, bucket: 'attraction',
      day: 1, time: '10:00', link: 'https://maps.app.goo.gl/x', desc: '森林神社',
    })
  })
  it('returns [] for non-array', () => {
    expect(toMapPoints(null)).toEqual([])
  })
})

describe('haversineMeters', () => {
  it('is ~0 for same point', () => {
    expect(haversineMeters({ lat: 35.66, lng: 139.7 }, { lat: 35.66, lng: 139.7 })).toBeCloseTo(0, 5)
  })
  it('approximates a known short distance', () => {
    const d = haversineMeters({ lat: 35.6764, lng: 139.6993 }, { lat: 35.6608, lng: 139.6987 })
    expect(d).toBeGreaterThan(1600)
    expect(d).toBeLessThan(1850)
  })
})

describe('sortByDistance', () => {
  it('sorts points by distance from origin and adds _dist', () => {
    const origin = { lat: 35.66, lng: 139.70 }
    const pts = [
      { name: 'far', lat: 35.70, lng: 139.74 },
      { name: 'near', lat: 35.661, lng: 139.701 },
    ]
    const sorted = sortByDistance(pts, origin)
    expect(sorted.map(p => p.name)).toEqual(['near', 'far'])
    expect(sorted[0]._dist).toBeGreaterThan(0)
  })
  it('does not mutate input', () => {
    const pts = [{ name: 'a', lat: 1, lng: 1 }]
    sortByDistance(pts, { lat: 0, lng: 0 })
    expect(pts[0]._dist).toBeUndefined()
  })
})

describe('routePoints', () => {
  const pts = [
    { name: 'B', day: 1, time: '12:30' },
    { name: 'A', day: 1, time: '09:00' },
    { name: 'noTime', day: 1, time: '' },
    { name: 'otherDay', day: 2, time: '08:00' },
  ]
  it('keeps only the given day, sorted by time, untimed last', () => {
    expect(routePoints(pts, 1).map(p => p.name)).toEqual(['A', 'B', 'noTime'])
  })
})

describe('formatDistance', () => {
  it('formats meters under 1km rounded to 10m', () => {
    expect(formatDistance(845)).toBe('850 m')
  })
  it('formats km with one decimal', () => {
    expect(formatDistance(1840)).toBe('1.8 km')
  })
})

describe('buildMapsUrl', () => {
  it('prefers an http(s) link (place page)', () => {
    expect(buildMapsUrl({ link: 'https://maps.app.goo.gl/abc', name: '一蘭', address: '渋谷' }))
      .toBe('https://maps.app.goo.gl/abc')
  })
  it('falls back to a name+address search query, not raw coords', () => {
    const url = buildMapsUrl({ link: '', name: '一蘭', address: '渋谷' })
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('一蘭 渋谷'))
  })
  it('returns empty string when nothing usable', () => {
    expect(buildMapsUrl({ link: '', name: '', address: '' })).toBe('')
    expect(buildMapsUrl(null)).toBe('')
  })
})
