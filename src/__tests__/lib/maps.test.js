import { describe, it, expect } from 'vitest'
import {
  parseLatLng,
  pointBucket,
  toMapPoints,
  haversineMeters,
  sortByDistance,
  routePoints,
  nextFocusIndex,
  formatDistance,
  buildMapsUrl,
  listToMapPoints,
  shoppingToMapPoints,
  mergeMapPoints,
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
    { name: '機場', type: 'transport', _day: 1, lat: '35.55', lng: '139.78', time: '08:00' },
  ]
  it('keeps rows with valid coords; transport/hotel with day become route-only points', () => {
    const pts = toMapPoints(rows)
    expect(pts.map(p => p.name)).toEqual(['明治神宮', '一蘭', '備選咖啡', '飯店', '機場'])
  })
  it('flags transport/hotel-with-day as routeOnly (bucket = type); others not routeOnly', () => {
    const byName = Object.fromEntries(toMapPoints(rows).map(p => [p.name, p]))
    expect(byName['飯店']).toMatchObject({ bucket: 'hotel', routeOnly: true })
    expect(byName['機場']).toMatchObject({ bucket: 'transport', routeOnly: true })
    expect(byName['明治神宮'].routeOnly).toBe(false)
    expect(byName['備選咖啡']).toMatchObject({ bucket: 'backup', routeOnly: false })
  })
  it('carries the right fields incl bucket and day', () => {
    const meiji = toMapPoints(rows)[0]
    expect(meiji).toMatchObject({
      name: '明治神宮', lat: 35.6764, lng: 139.6993, bucket: 'attraction', routeOnly: false,
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

describe('nextFocusIndex', () => {
  it('from overview: next→first, prev→last', () => {
    expect(nextFocusIndex(null, 1, 7)).toBe(0)
    expect(nextFocusIndex(null, -1, 7)).toBe(6)
  })
  it('steps ±1 when focused', () => {
    expect(nextFocusIndex(2, 1, 7)).toBe(3)
    expect(nextFocusIndex(2, -1, 7)).toBe(1)
  })
  it('clamps at both ends (no wrap)', () => {
    expect(nextFocusIndex(6, 1, 7)).toBe(6)
    expect(nextFocusIndex(0, -1, 7)).toBe(0)
  })
  it('returns null when no points', () => {
    expect(nextFocusIndex(null, 1, 0)).toBeNull()
    expect(nextFocusIndex(2, 1, 0)).toBeNull()
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

describe('listToMapPoints', () => {
  it('maps list rows with coords to the given bucket, day null', () => {
    const rows = [
      { name: 'Zubuchon', lat: '10.3115', lng: '123.9181', link: 'https://x', description: 'lechon' },
      { name: 'No coords', lat: '', lng: '' },
    ]
    const pts = listToMapPoints(rows, 'food')
    expect(pts).toHaveLength(1)
    expect(pts[0]).toMatchObject({ name: 'Zubuchon', bucket: 'food', type: 'food', day: null, link: 'https://x', desc: 'lechon' })
  })
  it('carries hours when filled (empty string when not)', () => {
    const pts = listToMapPoints([
      { name: '一蘭', lat: '33.59', lng: '130.40', hours: '24h' },
      { name: '無時間', lat: '33.60', lng: '130.41' },
    ], 'food')
    expect(pts[0].hours).toBe('24h')
    expect(pts[1].hours).toBe('')
  })
  it('returns [] for non-array', () => { expect(listToMapPoints(null, 'food')).toEqual([]) })
})

describe('shoppingToMapPoints', () => {
  it('aggregates same-building rows into one point: title = building, members = store names', () => {
    const rows = [
      { building: 'Mina Tenjin', name: '3COINS＋', floor: 'B1F', hours: '10:00 - 20:00', lat: '33.592837', lng: '130.3983198', link: 'https://maps/3coins' },
      { building: 'Mina Tenjin', name: 'UNIQLO', floor: '1F-2F' },
      { building: 'Mina Tenjin', name: 'GU', floor: '3F' },
    ]
    const pts = shoppingToMapPoints(rows)
    expect(pts).toHaveLength(1)
    expect(pts[0]).toMatchObject({
      name: 'Mina Tenjin', bucket: 'shopping', day: null,
      lat: 33.592837, lng: 130.3983198, hours: '10:00 - 20:00', link: 'https://maps/3coins',
    })
    expect(pts[0].members).toEqual([
      { name: '3COINS＋', floor: 'B1F' },
      { name: 'UNIQLO', floor: '1F-2F' },
      { name: 'GU', floor: '3F' },
    ])
  })
  it('defensive: coords on a non-first row of the building still puts the building on the map', () => {
    const rows = [
      { building: 'PARCO', name: 'BEAMS', floor: '1F' },
      { building: 'PARCO', name: 'HARE', floor: '3F', lat: '33.5909', lng: '130.3984' },
    ]
    const pts = shoppingToMapPoints(rows)
    expect(pts).toHaveLength(1)
    expect(pts[0]).toMatchObject({ name: 'PARCO', lat: 33.5909, lng: 130.3984 })
  })
  it('defensive: duplicate coords on several rows of the same building still aggregate to one point', () => {
    const rows = [
      { building: 'AMU', name: 'BEAMS', floor: '3F', lat: '33.5899', lng: '130.4206' },
      { building: 'AMU', name: 'MUJI', floor: '6F', lat: '33.5899', lng: '130.4206' },
    ]
    const pts = shoppingToMapPoints(rows)
    expect(pts).toHaveLength(1)
    expect(pts[0].members.map((m) => m.name)).toEqual(['BEAMS', 'MUJI'])
  })
  it('building-meta row (name === building, no floor) feeds header but is not a member', () => {
    const rows = [
      { building: '博多阪急', name: '博多阪急', floor: '', hours: '10:00 - 20:00', description: 'EMS 寄回首選', lat: '33.59', lng: '130.42' },
      { building: '博多阪急', name: 'BEAMS', floor: '3F' },
    ]
    const pts = shoppingToMapPoints(rows)
    expect(pts[0]).toMatchObject({ name: '博多阪急', hours: '10:00 - 20:00', desc: 'EMS 寄回首選' })
    expect(pts[0].members).toEqual([{ name: 'BEAMS', floor: '3F' }])
  })
  it('name === building WITH floor is a member (whole-building store spanning floors)', () => {
    const rows = [
      { building: 'ZARA', name: 'ZARA', floor: '1F-3F', lat: '33.5883', lng: '130.3964' },
    ]
    const pts = shoppingToMapPoints(rows)
    expect(pts[0].members).toEqual([{ name: 'ZARA', floor: '1F-3F' }])
  })
  it('standalone stores (no building) stay as single points with hours and no members', () => {
    const rows = [
      { building: '', name: 'HOKA', hours: '11:00 - 20:00', lat: '33.5907', lng: '130.3975' },
    ]
    const pts = shoppingToMapPoints(rows)
    expect(pts[0]).toMatchObject({ name: 'HOKA', hours: '11:00 - 20:00' })
    expect(pts[0].members).toEqual([])
  })
  it('merges points at identical 5dp coords (standalone absorbed into same-coord building)', () => {
    const rows = [
      { building: 'KITTE', name: 'UNIQLO', floor: '8F', lat: '33.5888254', lng: '130.4193965' },
      { building: '', name: '同址獨立店', lat: '33.5888254', lng: '130.4193965' },
    ]
    const pts = shoppingToMapPoints(rows)
    expect(pts).toHaveLength(1)
    expect(pts[0].name).toBe('KITTE')
    expect(pts[0].members.map((m) => m.name)).toEqual(['UNIQLO', '同址獨立店'])
  })
  it('building with no coords on any row does not go on the map', () => {
    const rows = [
      { building: '大名區', name: '獨立店家A', floor: '' },
      { building: '大名區', name: '獨立店家B', floor: '' },
    ]
    expect(shoppingToMapPoints(rows)).toEqual([])
  })
  it('returns [] for non-array', () => { expect(shoppingToMapPoints(null)).toEqual([]) })
})

describe('mergeMapPoints', () => {
  it('keeps all itinerary points and drops list points colliding by bucket+coords', () => {
    const itin = [{ id: 'a', name: 'A', bucket: 'food', lat: 10.30982, lng: 123.91942, day: 1 }]
    const list = [
      { id: 'b', name: 'A-dup', bucket: 'food', lat: 10.309820, lng: 123.919420, day: null },
      { id: 'c', name: 'C', bucket: 'shopping', lat: 10.31, lng: 123.92, day: null },
    ]
    const merged = mergeMapPoints(itin, list)
    expect(merged.map((p) => p.name)).toEqual(['A', 'C'])
  })
  it('dedups list vs list at same bucket+coords (5dp)', () => {
    const list = [
      { id: 'b', name: 'B', bucket: 'food', lat: 9.5, lng: 123.7, day: null },
      { id: 'b2', name: 'B2', bucket: 'food', lat: 9.500001, lng: 123.700004, day: null },
    ]
    expect(mergeMapPoints([], list).map((p) => p.name)).toEqual(['B'])
  })
  it('does NOT merge two itinerary points at same coords (different meals/days kept)', () => {
    const itin = [
      { id: 'x1', name: 'Breakfast', bucket: 'food', lat: 10.30982, lng: 123.91942, day: 2 },
      { id: 'x2', name: 'Breakfast', bucket: 'food', lat: 10.30982, lng: 123.91942, day: 4 },
    ]
    expect(mergeMapPoints(itin, []).map((p) => p.name)).toEqual(['Breakfast', 'Breakfast'])
  })
  it('route-only itinerary points do NOT dedup same-coord list points (accommodation stays for explore)', () => {
    const itin = [{ id: 'h', name: 'Hotel(itin)', bucket: 'hotel', lat: 10.3, lng: 123.9, day: 1, routeOnly: true }]
    const list = [{ id: 'a', name: 'Hotel(acc)', bucket: 'hotel', lat: 10.3, lng: 123.9, day: null }]
    expect(mergeMapPoints(itin, list).map((p) => p.name)).toEqual(['Hotel(itin)', 'Hotel(acc)'])
  })
})
