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

/**
 * 把 normalized itinerary 轉成地圖點（只留有座標者）。
 * `transport` / `hotel` 且有日期 → 標 `routeOnly`：只進「路線」模式（整天動線含
 * 機場 / 港口 / 飯店），不進「探索」（交通非探索點；住宿改由 accommodation tab 供探索）。
 * bucket 用其 type 著色（transport 藍鼠 / hotel 藤鼠）。其餘照 pointBucket。
 */
export function toMapPoints(normalized) {
  if (!Array.isArray(normalized)) return []
  return normalized.reduce((acc, row) => {
    const coords = parseLatLng(row)
    if (!coords) return acc
    const hasDay = row._day !== null && row._day !== undefined
    const type = row.type || 'attraction'
    const routeOnly = hasDay && (type === 'transport' || type === 'hotel')
    const bucket = routeOnly ? type : pointBucket(row)
    if (!bucket) return acc
    acc.push({
      id: `${row.name || ''}-${row._day ?? 'x'}-${row.time || ''}-${coords.lat}-${coords.lng}`,
      name: row.name || '',
      lat: coords.lat,
      lng: coords.lng,
      bucket,
      routeOnly,
      type: row.type || 'attraction',
      link: row.link || '',
      address: row.address || '',
      desc: row.description || row.note || '',
      hours: row.hours || '',
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

/**
 * 路線 stepper 的下一個 focus index。
 *  - `current === null`（總覽）→ next 跳第一點(0)、prev 跳最後一點(total-1)
 *  - 已聚焦 → ±1，兩端 clamp（不跨界、不 wrap）
 *  - total <= 0 → null（沒有可聚焦的點）
 * @param {number|null} current 目前聚焦 index（null = 總覽）
 * @param {1|-1} dir 1=前進 / -1=後退
 * @param {number} total 該天點數
 * @returns {number|null}
 */
export function nextFocusIndex(current, dir, total) {
  if (!Number.isFinite(total) || total <= 0) return null
  if (current === null || current === undefined) return dir > 0 ? 0 : total - 1
  const next = current + (dir > 0 ? 1 : -1)
  return Math.max(0, Math.min(total - 1, next))
}

/** 距離顯示：<1km 取整到 10m，否則 km 一位小數。 */
export function formatDistance(m) {
  if (!Number.isFinite(m)) return ''
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`
}

/**
 * food / accommodation 清單列 → 地圖點。清單點無日期（day=null）→ 只進探索模式，不進路線。
 * bucket 固定為呼叫端指定（'food' 或 'hotel'）。shopping 改用 shoppingToMapPoints（一棟一點聚合）。
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
      desc: row.description || row.note || '',
      hours: row.hours || '',
      time: '',
      day: null,
    })
    return acc
  }, [])
}

/**
 * shopping tab → 地圖點，**一棟建築聚合成一點**（popup 標題 = building、
 * 內文列同棟店家名單）。資料慣例：同棟的第一筆列填 building + lat/lng，
 * 其餘列座標留白。防呆（實際資料不一定照慣例）：
 *  - 座標不在第一筆 → 群組內任一筆有座標即可上圖（取第一個有效座標）
 *  - 同棟多筆重複填座標 → 仍聚合成一點（多餘座標忽略）
 *  - 不同點座標相同（5 位小數）→ 合併成一點、店家名單聯集（含獨立店被吸入同址建築）
 *  - building-meta 列（name === building 且無 floor，同 ShoppingSection.groupItems）
 *    只餵標頭的 hours/link/description，不列入店家名單
 * 無 building 的獨立店維持單點。清單點 day=null → 只進探索模式。
 */
export function shoppingToMapPoints(rows) {
  if (!Array.isArray(rows)) return []

  // 1) 依 building 分組（保持首見順序）；獨立店各自成組
  const groups = new Map()
  rows.forEach((row, i) => {
    const building = String(row?.building ?? '').trim()
    const name = String(row?.name ?? '').trim()
    if (!building && !name) return
    const key = building ? `b:${building}` : `s:${name}:${i}`
    if (!groups.has(key)) groups.set(key, { title: building || name, isBuilding: !!building, rows: [] })
    groups.get(key).rows.push(row)
  })

  // 2) 每組 → 一個點（組內無任何座標則不上圖）
  const points = []
  for (const g of groups.values()) {
    let coords = null
    for (const row of g.rows) {
      coords = parseLatLng(row)
      if (coords) break
    }
    if (!coords) continue
    const isMeta = (row) =>
      g.isBuilding && String(row?.name ?? '').trim() === g.title && !String(row?.floor ?? '').trim()
    const headerRow = g.rows.find(isMeta) || g.rows[0]
    const members = g.isBuilding
      ? g.rows
          .filter((row) => !isMeta(row))
          .map((row) => ({ name: String(row?.name ?? '').trim(), floor: String(row?.floor ?? '').trim() }))
          .filter((m) => m.name)
      : []
    points.push({
      id: `shopping-${g.title}-${coords.lat}-${coords.lng}`,
      name: g.title,
      lat: coords.lat,
      lng: coords.lng,
      bucket: 'shopping',
      type: 'shopping',
      link: headerRow.link || '',
      address: headerRow.address || '',
      desc: headerRow.description || headerRow.note || '',
      hours: headerRow.hours || '',
      members,
      time: '',
      day: null,
    })
  }

  // 3) 同座標（5 位小數）合併：先到者當標頭，後到者整組降為店家名單
  const merged = []
  const idxByCoord = new Map()
  for (const p of points) {
    const ck = `${p.lat.toFixed(5)}-${p.lng.toFixed(5)}`
    const at = idxByCoord.get(ck)
    if (at === undefined) {
      idxByCoord.set(ck, merged.length)
      merged.push(p)
      continue
    }
    const base = merged[at]
    const incoming = [{ name: p.name, floor: '' }, ...p.members].filter(
      (m) => m.name && m.name !== base.name && !base.members.some((b) => b.name === m.name)
    )
    merged[at] = {
      ...base,
      members: [...base.members, ...incoming],
      desc: base.desc || p.desc,
      hours: base.hours || p.hours,
      link: base.link || p.link,
    }
  }
  return merged
}

const locationKey = (p) => `${p.bucket}-${p.lat.toFixed(5)}-${p.lng.toFixed(5)}`

/**
 * 合併 itinerary 點與清單點：itinerary 點全留（保留 day，能進路線）；清單點若與既有點
 * 同 bucket 同座標（5 位小數）則去重 —— 涵蓋 list-vs-itinerary 與 list-vs-list 重複。
 * 注意：itinerary 點彼此不去重（同一旅館的早餐/午餐視為各自的停留）。
 */
export function mergeMapPoints(itineraryPoints, listPoints) {
  // route-only 點（itinerary 的交通/住宿）不當去重種子：否則會把 accommodation tab
  // 的同址住宿點去掉，導致探索模式看不到住宿。
  const seen = new Set(itineraryPoints.filter((p) => !p.routeOnly).map(locationKey))
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
