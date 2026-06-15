/**
 * 共用的旅程日期工具。
 *
 * 字串格式統一用 'YYYY/MM/DD'，比較直接用字串字典序就會等同日期序。
 */

export function formatToday() {
  const d = new Date()
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 把 'YYYY/MM/DD' 加上 N 天，回傳新的 'YYYY/MM/DD'。跨月、跨年由 Date 自動處理。
 *
 * @param {string} dateStr
 * @param {number} offset
 * @returns {string}
 */
export function addDaysToDateString(dateStr, offset) {
  if (!dateStr) return ''
  const parts = dateStr.split('/').map(Number)
  if (parts.length < 3 || parts.some(n => !Number.isFinite(n))) return ''
  const [y, m, d] = parts
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + offset)
  return formatYMD(date)
}

function formatYMD(d) {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 把 sheet 上常見的日期字串正規化成 'YYYY/MM/DD'。支援：
 *   '6/4'        → 用 tripDates 的年份補上
 *   '06/04'      → 同上
 *   '2026/6/4'   → 補零
 *   '2026/06/04' → 原樣 echo
 *
 * 跨年 trip（例如 12/30 - 1/2）：若 'M/D' 換上 start 年份後比 start 還早，自動 +1 年。
 *
 * @param {string} dateStr
 * @param {string} [tripDates]
 * @returns {string}
 */
export function resolveTripDate(dateStr, tripDates) {
  if (!dateStr || typeof dateStr !== 'string') return ''
  const parts = dateStr.trim().split('/').map(s => Number(s.trim()))
  if (parts.some(n => !Number.isFinite(n))) return ''

  if (parts.length === 3) {
    const [y, m, d] = parts
    return formatYMD(new Date(y, m - 1, d))
  }

  if (parts.length === 2) {
    const { start } = parseTripDates(tripDates)
    if (!start) return ''
    const [m, d] = parts
    const startSegs = start.split('/').map(Number)
    const startYear = startSegs[0]
    const startDate = new Date(startSegs[0], startSegs[1] - 1, startSegs[2])
    const candidate = new Date(startYear, m - 1, d)
    if (candidate < startDate) candidate.setFullYear(startYear + 1)
    return formatYMD(candidate)
  }

  return ''
}

/**
 * 計算某個日期是 trip 的第幾天（1-indexed）。
 *
 * @param {string} fullDate 'YYYY/MM/DD'
 * @param {string} [tripDates]
 * @returns {number|null}
 */
export function computeDayFromDate(fullDate, tripDates) {
  if (!fullDate) return null
  const { start } = parseTripDates(tripDates)
  if (!start) return null
  const fullSegs = fullDate.split('/').map(Number)
  const startSegs = start.split('/').map(Number)
  if (fullSegs.length !== 3 || startSegs.length !== 3) return null
  if (fullSegs.some(n => !Number.isFinite(n)) || startSegs.some(n => !Number.isFinite(n))) return null
  const a = new Date(fullSegs[0], fullSegs[1] - 1, fullSegs[2])
  const b = new Date(startSegs[0], startSegs[1] - 1, startSegs[2])
  return Math.round((a.getTime() - b.getTime()) / 86400000) + 1
}

/**
 * 解析行程日期字串：
 *   '2026/01/10 - 01/14' → { start: '2026/01/10', end: '2026/01/14' }
 *   '2026/12/30 - 2027/01/02' → { start: '2026/12/30', end: '2027/01/02' }
 *   '2026/03/05' → { start: '2026/03/05', end: '2026/03/05' }
 */
export function parseTripDates(dates) {
  if (!dates) return { start: '', end: '' }
  const parts = dates.split(/\s*-\s*/)
  const start = parts[0]?.trim() ?? ''
  const endRaw = parts[1]?.trim() ?? start

  if (!start) return { start: '', end: '' }
  const startSegs = start.split('/')
  const endSegs = endRaw.split('/')

  let end = endRaw
  if (endSegs.length === 1) end = `${startSegs[0]}/${startSegs[1]}/${endSegs[0]}`
  else if (endSegs.length === 2) end = `${startSegs[0]}/${endSegs[0]}/${endSegs[1]}`

  return { start, end }
}

/**
 * 'YYYY/MM/DD' → 'MM/DD · 週X' 給 DayBanner 用。
 *
 * @param {string} fullDate
 * @returns {string}
 */
export function formatDayLabel(fullDate) {
  if (!fullDate) return ''
  const parts = fullDate.split('/').map(Number)
  if (parts.length !== 3 || parts.some(n => !Number.isFinite(n))) return ''
  const [y, m, d] = parts
  const dow = ['日', '一', '二', '三', '四', '五', '六'][new Date(y, m - 1, d).getDay()]
  return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')} · 週${dow}`
}

/**
 * 根據今日日期決定預設選中的 day。
 *   - 今天剛好是某一天 → 那一天
 *   - 否則（旅程未開始 / 已結束 / 中間缺日）→ Day 1
 *
 * 旅程結束後落在 Day 1 是刻意設計：當作回顧模式，從頭看起比較直覺。
 *
 * @param {Array<{ day: number, date: string }>} days
 */
export function pickInitialDay(days) {
  if (!days || days.length === 0) return 1
  const todayStr = formatToday()
  const exact = days.find(d => d.date === todayStr)
  return exact ? exact.day : days[0].day
}

/**
 * 計算一個 trip 的狀態：active（進行中）/ upcoming（即將出發）/ past（已結束）。
 * 同時回傳跟「今天」的天數差（upcoming = 距出發；past = 距結束；active = 0）。
 *
 * @param {string} dates 'YYYY/MM/DD - MM/DD'
 * @returns {{ status: 'active'|'upcoming'|'past', daysToStart: number, daysFromEnd: number }}
 */
export function getTripStatus(dates) {
  const { start, end } = parseTripDates(dates)
  if (!start || !end) return { status: 'past', daysToStart: 0, daysFromEnd: 0 }

  const today = formatToday()
  const [ty, tm, td] = today.split('/').map(Number)
  const [sy, sm, sd] = start.split('/').map(Number)
  const [ey, em, ed] = end.split('/').map(Number)

  const todayMs = new Date(ty, tm - 1, td).getTime()
  const startMs = new Date(sy, sm - 1, sd).getTime()
  const endMs = new Date(ey, em - 1, ed).getTime()

  const DAY = 86400000
  const daysToStart = Math.round((startMs - todayMs) / DAY)
  const daysFromEnd = Math.round((todayMs - endMs) / DAY)

  if (todayMs >= startMs && todayMs <= endMs) return { status: 'active', daysToStart: 0, daysFromEnd: 0 }
  if (todayMs < startMs) return { status: 'upcoming', daysToStart, daysFromEnd: 0 }
  return { status: 'past', daysToStart: 0, daysFromEnd }
}

/**
 * 把 trips 分層成首頁版面用的兩區：
 *   - nowNext：進行中 + 即將出發（active 排最前，再按出發日近→遠）
 *   - pastByYear：已結束，按「出發年份」分組（年份新→舊；組內按結束日新→舊）
 *
 * 個人旅行記錄成長慢（一年幾趟），不需要重型篩選；分層 + 年份收納就夠。
 *
 * @param {Array<{ slug: string, dates: string }>} trips
 * @returns {{ nowNext: Array, pastByYear: Array<{ year: string, trips: Array }> }}
 */
export function groupTrips(trips) {
  if (!trips || trips.length === 0) return { nowNext: [], pastByYear: [] }

  const enriched = trips.map(t => {
    const { start, end } = parseTripDates(t.dates)
    const { status } = getTripStatus(t.dates)
    return { trip: t, start, end, status }
  })

  const nowNext = enriched
    .filter(e => e.status === 'active' || e.status === 'upcoming')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1
      return a.start.localeCompare(b.start) // 'YYYY/MM/DD' 字典序 = 日期序
    })
    .map(e => e.trip)

  const past = enriched
    .filter(e => e.status === 'past')
    .sort((a, b) => b.end.localeCompare(a.end)) // 最近結束的在前

  const byYear = new Map()
  for (const e of past) {
    const year = e.start.slice(0, 4) || '—'
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year).push(e.trip)
  }
  const pastByYear = [...byYear.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, trips]) => ({ year, trips }))

  return { nowNext, pastByYear }
}

/**
 * 從所有 trips 中挑「最相關」的一趟，給 PWA 啟動跳轉用。
 *   1. 今天落在某 trip 的日期區間 → 該 trip（旅行中）
 *   2. 否則挑「最近即將出發」的 trip（start > today）
 *   3. 都過期了 → null（停在 home）
 *
 * @param {Array<{ slug: string, dates: string }>} trips
 */
export function pickActiveTrip(trips) {
  if (!trips || trips.length === 0) return null
  const todayStr = formatToday()

  const withDates = trips
    .map(t => ({ ...t, ...parseTripDates(t.dates) }))
    .filter(t => t.start && t.end)

  const ongoing = withDates.find(t => todayStr >= t.start && todayStr <= t.end)
  if (ongoing) return ongoing.slug

  const upcoming = withDates
    .filter(t => t.start > todayStr)
    .sort((a, b) => a.start.localeCompare(b.start))[0]
  if (upcoming) return upcoming.slug

  return null
}
