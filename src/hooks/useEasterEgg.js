import { useState, useRef, useCallback, useEffect } from 'react'
import { success } from '../lib/haptic.js'

// 連續快速點擊閾值
const REQUIRED_CLICKS = 9
const CLICK_GAP_MS = 2000

/**
 * 求婚彩蛋觸發邏輯：在 extras.easterEggDay 上連續快速點擊 N 次。
 *
 * @param {{ extras: { easterEggDay?: number } | null }} params
 */
export function useEasterEgg({ extras }) {
  const [open, setOpen] = useState(false)
  const [heartPosition, setHeartPosition] = useState(null)
  const [activated, setActivated] = useState(false)
  // 開窗起跑後把 DayNav 的愛心 icon 藏起來（窗本身就是那顆愛心）
  const [heartHidden, setHeartHidden] = useState(false)
  const clickCount = useRef(0)
  const lastClickTime = useRef(0)

  /**
   * 接收 DayNav 的 day click 事件。
   * @param {number} day
   * @param {number} previousActiveDay
   */
  const handleDayClick = useCallback((day, previousActiveDay) => {
    if (!extras || day !== extras.easterEggDay) return

    // 切到別天就重置計數
    if (previousActiveDay !== day) {
      clickCount.current = 0
      lastClickTime.current = 0
      return
    }

    const now = Date.now()
    const newCount = (now - lastClickTime.current > CLICK_GAP_MS) ? 1 : clickCount.current + 1
    clickCount.current = newCount
    lastClickTime.current = now

    if (newCount < REQUIRED_CLICKS) return

    // 愛心出現的同一幀打較強 haptic（因果、同步：apple-design §13）
    success()
    setActivated(true)
    clickCount.current = 0
    const btn = document.querySelector(`[data-day="${day}"]`)
    if (btn) {
      const rect = btn.getBoundingClientRect()
      setHeartPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    }
    setOpen(true)
  }, [extras])

  const hideHeart = useCallback(() => setHeartHidden(true), [])

  // icon 真的畫出來後，用 icon 自己的矩形再量一次中心（第 9 下量的是格子中心；
  // 兩者理論上重合，這裡是保險：之後 1.1s 內任何 sticky / 捲動造成的偏移都以 icon 為準）
  useEffect(() => {
    if (!activated || !extras) return
    const icon = document.querySelector(`[data-day="${extras.easterEggDay}"] svg`)
    if (!icon) return
    const rect = icon.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return
    setHeartPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
  }, [activated, extras])

  const reset = useCallback(() => {
    setOpen(false)
    clickCount.current = 0
    setActivated(false)
    setHeartHidden(false)
    setHeartPosition(null)
  }, [])

  return { open, heartPosition, activated, heartHidden, hideHeart, handleDayClick, reset }
}
