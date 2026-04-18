import { useMemo } from 'react'

/**
 * 從 itinerary rows 萃取 days 列表（去重 + 排序 + 帶上日期）。
 *
 * @param {Array<{ day: string|number, date?: string }>} itinerary
 * @returns {Array<{ day: number, date: string }>}
 */
export function useDays(itinerary) {
  return useMemo(() => {
    if (!Array.isArray(itinerary) || itinerary.length === 0) return []
    return [...new Set(itinerary.map(r => Number(r.day)))]
      .filter(d => Number.isFinite(d))
      .sort((a, b) => a - b)
      .map(day => {
        const row = itinerary.find(r => Number(r.day) === day)
        return { day, date: row?.date ?? '' }
      })
  }, [itinerary])
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
