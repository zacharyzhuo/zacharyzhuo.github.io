import { useMemo } from 'react'
import { addDaysToDateString, computeDayFromDate, parseTripDates, resolveTripDate } from '../lib/tripDate.js'

/**
 * 把 itinerary row 正規化：補上 `_day`（1-indexed 數字）與 `_date`（'YYYY/MM/DD'）。
 *
 * 來源優先序：
 *   1. row.date + tripDates → 解析成完整日期再算出 day
 *   2. row.day（舊資料相容；沒有 date 欄時走這條）
 *
 * 沒填 date 也沒填 day 的 row 會被標成 _day=null，自動從日期分組裡剔除。
 *
 * @param {Array} itinerary
 * @param {string} [tripDates]
 */
export function useNormalizedItinerary(itinerary, tripDates) {
  return useMemo(() => {
    if (!Array.isArray(itinerary)) return []
    return itinerary.map(r => {
      const resolved = resolveTripDate(r.date, tripDates)
      let day = null
      if (resolved) {
        const computed = computeDayFromDate(resolved, tripDates)
        if (Number.isFinite(computed)) day = computed
      }
      if (day === null && r.day !== undefined && r.day !== '') {
        const n = Number(r.day)
        if (Number.isFinite(n)) day = n
      }
      return { ...r, _day: day, _date: resolved || '' }
    })
  }, [itinerary, tripDates])
}

/**
 * 從 normalized itinerary 萃取 days 列表（去重 + 排序 + 帶上完整日期）。
 *
 * @param {Array<{ _day: number|null, _date: string }>} normalized
 * @param {string} [tripDates]
 * @returns {Array<{ day: number, date: string }>}
 */
export function useDays(normalized, tripDates) {
  return useMemo(() => {
    if (!Array.isArray(normalized) || normalized.length === 0) return []
    const { start } = parseTripDates(tripDates)
    const distinct = [...new Set(
      normalized.map(r => r._day).filter(d => Number.isFinite(d))
    )].sort((a, b) => a - b)
    return distinct.map(day => {
      const fromStart = start ? addDaysToDateString(start, day - 1) : ''
      if (fromStart) return { day, date: fromStart }
      const row = normalized.find(r => r._day === day && r._date)
      return { day, date: row?._date ?? '' }
    })
  }, [normalized, tripDates])
}

/**
 * `days` tab 的 rows 也跟 itinerary 一樣補上 `_day`（從 date 推算；無 date 時 fallback 到 row.day）。
 *
 * @param {Array} daysData
 * @param {string} [tripDates]
 */
export function useNormalizedDays(daysData, tripDates) {
  return useMemo(() => {
    if (!Array.isArray(daysData)) return []
    return daysData.map(r => {
      const resolved = resolveTripDate(r.date, tripDates)
      let day = null
      if (resolved) {
        const computed = computeDayFromDate(resolved, tripDates)
        if (Number.isFinite(computed)) day = computed
      }
      if (day === null && r.day !== undefined && r.day !== '') {
        const n = Number(r.day)
        if (Number.isFinite(n)) day = n
      }
      return { ...r, _day: day, _date: resolved || '' }
    })
  }, [daysData, tripDates])
}

/**
 * Food section 的資料來源：優先用獨立的 food sheet；若無資料則 fallback 到 itinerary 中
 * type === 'food' 的 row。
 *
 * @param {Array} food
 * @param {Array} itinerary
 */
export function useFoodItems(food, itinerary) {
  return useMemo(
    () =>
      Array.isArray(food) && food.length > 0
        ? food
        : (itinerary || []).filter(r => r.type === 'food'),
    [food, itinerary]
  )
}
