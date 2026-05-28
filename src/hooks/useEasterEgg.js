import { useState, useRef, useCallback } from 'react'

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

    setActivated(true)
    clickCount.current = 0
    const btn = document.querySelector(`[data-day="${day}"]`)
    if (btn) {
      const rect = btn.getBoundingClientRect()
      setHeartPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    }
    setOpen(true)
  }, [extras])

  const reset = useCallback(() => {
    setOpen(false)
    clickCount.current = 0
    setActivated(false)
    setHeartPosition(null)
  }, [])

  return { open, heartPosition, activated, handleDayClick, reset }
}
