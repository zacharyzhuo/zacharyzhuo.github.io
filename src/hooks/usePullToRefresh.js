import { useEffect, useRef, useState } from 'react'

// 觸發 refresh 的閾值（往下拖過此距離才算數）
const TRIGGER_THRESHOLD = 110
// 初始幾 px 不顯示 indicator；避免一般 scroll 起手就誤觸覺
const DEAD_ZONE = 18
// 第一次明顯位移內判斷方向；橫向 > 縱向就放棄
const DIRECTION_DECISION_MS = 80
// 起手必須打在頁面最上面這個區域內，避免從畫面中下方往下拉也觸發
const TOP_GRAB_ZONE_PX = 140

/**
 * 下拉刷新手勢 hook：
 *   - 必須從頁面頂端 (scrollY === 0) + 觸點落在最上方 140px 內 + 縱向手勢
 *   - 死區 18px，閾值 110px（原本 80px 太敏感）
 *   - enabled=false 時整個停用，給 sidebar / bottom sheet 開啟時用
 *
 * 回傳：
 *   - pullY：當前 pull 距離（已扣掉 dead zone）
 *   - refreshing：onRefresh 執行中
 *
 * @param {() => Promise<void>} onRefresh
 * @param {{ enabled?: boolean }} [opts]
 */
export function usePullToRefresh(onRefresh, opts = {}) {
  const { enabled = true } = opts
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const startRef = useRef(null) // { x, y, time, decided: 'vertical'|'horizontal'|null }
  const pullYRef = useRef(0)

  const onRefreshRef = useRef(onRefresh)
  const enabledRef = useRef(enabled)
  useEffect(() => { onRefreshRef.current = onRefresh }, [onRefresh])
  useEffect(() => { enabledRef.current = enabled }, [enabled])

  useEffect(() => {
    const reset = () => {
      startRef.current = null
      pullYRef.current = 0
      setPullY(0)
    }

    const onTouchStart = (e) => {
      if (!enabledRef.current) return
      if (window.scrollY > 0) return
      const t = e.touches[0]
      if (t.clientY > TOP_GRAB_ZONE_PX) return // 起手位置太低 → 不認
      startRef.current = { x: t.clientX, y: t.clientY, time: Date.now(), decided: null }
      pullYRef.current = 0
    }

    const onTouchMove = (e) => {
      const s = startRef.current
      if (!s || !enabledRef.current) return
      const t = e.touches[0]
      const dx = t.clientX - s.x
      const dy = t.clientY - s.y

      // 還沒判斷方向 → 先看是不是縱向
      if (s.decided === null) {
        const moved = Math.hypot(dx, dy)
        if (moved < 10 && Date.now() - s.time < DIRECTION_DECISION_MS) return
        // 橫向比縱向明顯，或往上滑（dy < 0），放棄這次手勢
        if (Math.abs(dx) > Math.abs(dy) || dy < 0) {
          startRef.current = null
          return
        }
        s.decided = 'vertical'
      }

      if (dy <= DEAD_ZONE || window.scrollY > 0) {
        // 仍在死區內或頁面已捲走 → 不顯示 indicator
        pullYRef.current = 0
        if (pullY !== 0) setPullY(0)
        return
      }

      // dy 超過死區後從 0 開始算；過閾值後加強阻尼
      const effective = dy - DEAD_ZONE
      const damped = effective < TRIGGER_THRESHOLD
        ? effective
        : TRIGGER_THRESHOLD + (effective - TRIGGER_THRESHOLD) * 0.35
      pullYRef.current = damped
      setPullY(damped)
    }

    const onTouchEnd = async () => {
      const s = startRef.current
      if (!s) { reset(); return }
      const captured = pullYRef.current
      reset()
      if (captured > TRIGGER_THRESHOLD) {
        setRefreshing(true)
        try { await onRefreshRef.current?.() }
        finally { setRefreshing(false) }
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    document.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [])

  return { pullY, refreshing, triggerThreshold: TRIGGER_THRESHOLD }
}
