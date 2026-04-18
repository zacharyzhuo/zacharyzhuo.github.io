import { useEffect, useRef, useState } from 'react'

/**
 * 下拉刷新手勢 hook：
 *   - 監聽 document level 的 touch events
 *   - 必須從 scrollTop=0 開始，向下拖才會觸發
 *   - 超過 80px 釋放 → 呼叫 onRefresh()
 *
 * 回傳：
 *   - pullY：當前 pull 距離，UI 可用來下移內容 / 顯示 indicator
 *   - refreshing：onRefresh 執行中
 *
 * @param {() => Promise<void>} onRefresh
 */
export function usePullToRefresh(onRefresh) {
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startYRef = useRef(null)
  const pullYRef = useRef(0)
  const onRefreshRef = useRef(onRefresh)

  useEffect(() => { onRefreshRef.current = onRefresh }, [onRefresh])

  useEffect(() => {
    const onTouchStart = (e) => {
      if (window.scrollY > 0) return
      startYRef.current = e.touches[0].clientY
      pullYRef.current = 0
    }

    const onTouchMove = (e) => {
      if (startYRef.current === null) return
      const dy = e.touches[0].clientY - startYRef.current
      if (dy > 0 && window.scrollY === 0) {
        // 80px 內 1:1 跟手；超過後 0.4x damping，給「拉到底」的感覺
        const damped = dy < 80 ? dy : 80 + (dy - 80) * 0.4
        pullYRef.current = damped
        setPullY(damped)
      } else if (dy < -5) {
        // 反向滑：放棄，讓正常 scroll 接管
        startYRef.current = null
        pullYRef.current = 0
        setPullY(0)
      }
    }

    const onTouchEnd = async () => {
      if (startYRef.current === null) return
      const captured = pullYRef.current
      startYRef.current = null
      pullYRef.current = 0
      setPullY(0)

      if (captured > 80) {
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

  return { pullY, refreshing }
}
