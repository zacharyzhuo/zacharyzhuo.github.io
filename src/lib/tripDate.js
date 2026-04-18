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
 * 根據今日日期決定預設選中的 day。
 *   - 今天剛好是某一天 → 那一天
 *   - 旅程還沒開始 → Day 1
 *   - 旅程已結束 → 最後一天
 *
 * @param {Array<{ day: number, date: string }>} days
 */
export function pickInitialDay(days) {
  if (!days || days.length === 0) return 1
  const todayStr = formatToday()
  const exact = days.find(d => d.date === todayStr)
  if (exact) return exact.day
  const firstDate = days[0].date
  if (firstDate && todayStr < firstDate) return days[0].day
  return days[days.length - 1].day
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
