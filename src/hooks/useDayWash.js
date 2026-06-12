import { useEffect } from 'react'
import { washColorsForDay } from '../lib/wash.js'

const WASH_PROPS = ['--wash-a', '--wash-b', '--wash-c', '--wash-d']

/**
 * 當日分類連動染：依當天行程的分類組成設定 body 的 --wash-a/b/c/d，
 * 換天時由 index.css 的 @property transition 做 0.9s crossfade。
 * rows 為空（無行程的天）或離開行程頁時移除變數 → 回到 CSS 預設水彩。
 *
 * @param {Array<{ type?: string }>} rows 當天（active day）的 itinerary rows
 */
export function useDayWash(rows) {
  useEffect(() => {
    const colors = washColorsForDay(rows)
    const { style } = document.body
    if (colors) {
      WASH_PROPS.forEach((prop, i) => style.setProperty(prop, colors[i]))
    } else {
      WASH_PROPS.forEach((prop) => style.removeProperty(prop))
    }
    return () => WASH_PROPS.forEach((prop) => style.removeProperty(prop))
  }, [rows])
}
