/**
 * 行程地圖純函式。地圖點一律來自 itinerary tab 的 normalized row
 * （含 `_day`/`_date`，見 hooks/useTripDerived.js）+ 新增的 `lat`/`lng` 欄。
 */

const EARTH_RADIUS_M = 6371000

/** 解析 row 的 lat/lng；無效（缺值 / 非數字 / 超界 / 0,0）回 null。 */
export function parseLatLng(row) {
  const latStr = String(row?.lat ?? '').trim()
  const lngStr = String(row?.lng ?? '').trim()
  if (!latStr || !lngStr) return null
  const lat = Number(latStr)
  const lng = Number(lngStr)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  if (lat === 0 && lng === 0) return null
  return { lat, lng }
}

/**
 * 把 normalized itinerary row 分到地圖 bucket：
 *  - 空 date（_day 為 null/undefined）→ 'backup'（不分 type）
 *  - 有 date → 依 type：food / attraction / shopping
 *  - 空 type 視為 attraction（與 categories.js 預設一致）
 *  - transport / hotel → null（探索地圖不顯示）
 */
export function pointBucket(row) {
  if (!row) return null
  if (row._day === null || row._day === undefined) return 'backup'
  const type = row.type || 'attraction'
  if (type === 'food' || type === 'attraction' || type === 'shopping') return type
  return null
}

/** 把 normalized itinerary 轉成地圖點（只留「有座標」且「bucket 非 null」者）。 */
export function toMapPoints(normalized) {
  if (!Array.isArray(normalized)) return []
  return normalized.reduce((acc, row) => {
    const coords = parseLatLng(row)
    const bucket = pointBucket(row)
    if (!coords || !bucket) return acc
    acc.push({
      id: `${row.name || ''}-${row._day ?? 'x'}-${row.time || ''}-${coords.lat}-${coords.lng}`,
      name: row.name || '',
      lat: coords.lat,
      lng: coords.lng,
      bucket,
      type: row.type || 'attraction',
      link: row.link || '',
      address: row.address || '',
      desc: row.description || row.note || '',
      time: row.time || '',
      day: row._day ?? null,
    })
    return acc
  }, [])
}

/** 兩點間 haversine 距離（公尺）。 */
export function haversineMeters(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(s))
}

/** 依離 origin 距離排序（不可變；每點補上 `_dist`）。 */
export function sortByDistance(points, origin) {
  return points
    .map((p) => ({ ...p, _dist: haversineMeters(origin, p) }))
    .sort((a, b) => a._dist - b._dist)
}

function timeKey(t) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t || '').trim())
  if (!m) return Number.MAX_SAFE_INTEGER
  return Number(m[1]) * 60 + Number(m[2])
}

/** 某一天的點，按 time 升序（無 time 排最後）。 */
export function routePoints(points, day) {
  return points
    .filter((p) => p.day === day)
    .slice()
    .sort((a, b) => timeKey(a.time) - timeKey(b.time))
}

/** 距離顯示：<1km 取整到 10m，否則 km 一位小數。 */
export function formatDistance(m) {
  if (!Number.isFinite(m)) return ''
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`
}

/**
 * food / shopping 清單列 → 地圖點。清單點無日期（day=null）→ 只進探索模式，不進路線。
 * bucket 固定為呼叫端指定（'food' 或 'shopping'）。
 */
export function listToMapPoints(rows, bucket) {
  if (!Array.isArray(rows)) return []
  return rows.reduce((acc, row) => {
    const coords = parseLatLng(row)
    if (!coords) return acc
    const name = row.name || ''
    acc.push({
      id: `${bucket}-${name}-${coords.lat}-${coords.lng}`,
      name,
      lat: coords.lat,
      lng: coords.lng,
      bucket,
      type: bucket,
      link: row.link || '',
      address: row.address || '',
      desc: row.desc || row.note || '',
      time: '',
      day: null,
    })
    return acc
  }, [])
}

const locationKey = (p) => `${p.bucket}-${p.lat.toFixed(5)}-${p.lng.toFixed(5)}`

/**
 * 合併 itinerary 點與清單點：itinerary 點全留（保留 day，能進路線）；清單點若與既有點
 * 同 bucket 同座標（5 位小數）則去重 —— 涵蓋 list-vs-itinerary 與 list-vs-list 重複。
 * 注意：itinerary 點彼此不去重（同一旅館的早餐/午餐視為各自的停留）。
 */
export function mergeMapPoints(itineraryPoints, listPoints) {
  const seen = new Set(itineraryPoints.map(locationKey))
  const extra = []
  for (const p of listPoints) {
    const key = locationKey(p)
    if (seen.has(key)) continue
    seen.add(key)
    extra.push(p)
  }
  return [...itineraryPoints, ...extra]
}

/**
 * Google Maps 導航連結：
 *  1. 優先用 http(s) 的 `link`（地點頁，有介紹/評論）
 *  2. 退用 name + address 的搜尋字串（仍落在地點頁，非裸座標）
 *  3. 兩者皆無 → ''（呼叫端不顯示連結）
 */
export function buildMapsUrl(point) {
  if (!point) return ''
  const link = String(point.link || '').trim()
  if (/^https?:\/\//.test(link)) return link
  const query = [point.name, point.address].map((s) => String(s || '').trim()).filter(Boolean).join(' ')
  if (!query) return ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
