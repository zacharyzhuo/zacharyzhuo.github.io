import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { rubberBand } from '../lib/gesture.js'

// 觸發 refresh 的閾值（往下拖過此距離才算數）
const TRIGGER_THRESHOLD = 110
// 初始幾 px 不顯示 indicator；避免一般 scroll 起手就誤觸覺
const DEAD_ZONE = 18
// 第一次明顯位移內判斷方向；橫向 > 縱向就放棄
const DIRECTION_DECISION_MS = 80
// 起手必須打在頁面最上面這個區域內，避免從畫面中下方往下拉也觸發
const TOP_GRAB_ZONE_PX = 140
// 過閾值後的 rubber-band 上限（px）
const OVERPULL_RUBBER_CONSTANT = 60
// indicator 圖示相對拉動距離的上移量（拉 30px 內 indicator 停在頂端）
const INDICATOR_LAG_PX = 30
// refreshing 時 indicator 停駐位置
const REFRESHING_INDICATOR_Y = 24
// 放開後歸位 / 淡出的時長；timer 多留 20ms 緩衝給 transition 跑完
const SETTLE_MS = 200
const SETTLE_TIMER_MS = SETTLE_MS + 20
const INDICATOR_SETTLE_TRANSITION = `transform ${SETTLE_MS}ms var(--ease-out), opacity ${SETTLE_MS}ms ease`
const CONTENT_SETTLE_TRANSITION = `transform ${SETTLE_MS}ms var(--ease-out)`
// spinner 最短顯示時間，避免快取命中時一閃即逝
const MIN_REFRESH_MS = 300

/**
 * 下拉刷新手勢 hook：
 *   - 必須從頁面頂端 (scrollY === 0) + 觸點落在最上方 140px 內 + 縱向手勢
 *   - 死區 18px，閾值 110px；過閾值後用 rubber-band 阻尼（有上限）
 *   - 拖動中只用 ref 直接寫 DOM（indicator 的 transform/opacity、content 的 transform），
 *     不走 React state；state 只在「開始顯示 / 跨過閾值 / 放開」這幾個時間點更新
 *   - touchmove 為非 passive：確定是縱向下拉時 preventDefault，避免 iOS 原生頂端回彈疊加
 *   - 放開後 indicator / content 以 200ms ease-out 歸位（不瞬移）
 *   - enabled=false 時整個停用，給 sidebar / bottom sheet 開啟時用
 *
 * 回傳：
 *   - pullY：粗粒度 pull 距離（只在開始顯示、跨閾值、放開時更新；>0 表示拉動中，> triggerThreshold 表示放開會刷新）
 *   - refreshing：onRefresh 執行中
 *   - showIndicator：indicator 是否該掛載（含放開後淡出中）
 *   - indicatorRef：掛在 indicator 元素上，hook 逐幀寫 transform/opacity
 *   - contentRef（選用）：掛在要跟著下移的內容容器上，hook 逐幀寫 transform
 *
 * @param {() => Promise<void>} onRefresh
 * @param {{ enabled?: boolean }} [opts]
 */
export function usePullToRefresh(onRefresh, opts = {}) {
  const { enabled = true } = opts
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [settling, setSettling] = useState(false)

  const indicatorRef = useRef(null)
  const contentRef = useRef(null)

  const startRef = useRef(null) // { x, y, time, decided: 'vertical'|'horizontal'|null }
  const pullYRef = useRef(0)
  const activeRef = useRef(false) // indicator 已因本次手勢掛載（coarse pullY > 0）
  const crossedRef = useRef(false) // 目前是否已過閾值
  const refreshingRef = useRef(false)
  const settleTimerRef = useRef(null)
  const mountedRef = useRef(true)

  const onRefreshRef = useRef(onRefresh)
  const enabledRef = useRef(enabled)
  useEffect(() => { onRefreshRef.current = onRefresh }, [onRefresh])
  useEffect(() => { enabledRef.current = enabled }, [enabled])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearTimeout(settleTimerRef.current)
    }
  }, [])

  const showIndicator = pullY > 0 || refreshing || settling

  // indicator 剛掛載時補寫一次目前位置（掛載前那一幀的寫入因 ref 為 null 而落空）
  useLayoutEffect(() => {
    if (!showIndicator || !activeRef.current || refreshingRef.current) return
    const el = indicatorRef.current
    if (!el) return
    const y = pullYRef.current
    el.style.transform = `translateY(${Math.max(0, y - INDICATOR_LAG_PX)}px)`
    el.style.opacity = String(Math.min(1, y / TRIGGER_THRESHOLD))
  }, [showIndicator])

  useEffect(() => {
    // 逐幀寫 DOM：indicator 位置 / 透明度、content 位移
    const writeIndicator = (y) => {
      const ind = indicatorRef.current
      if (ind) {
        ind.style.transform = `translateY(${Math.max(0, y - INDICATOR_LAG_PX)}px)`
        ind.style.opacity = String(Math.min(1, y / TRIGGER_THRESHOLD))
      }
      const content = contentRef.current
      if (content) content.style.transform = `translateY(${y}px)`
    }

    const setTransitions = () => {
      if (indicatorRef.current) indicatorRef.current.style.transition = INDICATOR_SETTLE_TRANSITION
      if (contentRef.current) contentRef.current.style.transition = CONTENT_SETTLE_TRANSITION
    }

    const clearTransitions = () => {
      if (indicatorRef.current) indicatorRef.current.style.transition = ''
      if (contentRef.current) contentRef.current.style.transition = ''
    }

    // 歸位完成：拔掉 transition、清掉 content 的 transform（避免常駐 transform 成為 fixed 子元素的 containing block）
    const finishSettle = () => {
      clearTransitions()
      if (contentRef.current && !activeRef.current) contentRef.current.style.transform = ''
    }

    const onTouchStart = (e) => {
      if (!enabledRef.current || refreshingRef.current) return
      if (window.scrollY > 0) return
      const t = e.touches[0]
      if (t.clientY > TOP_GRAB_ZONE_PX) return // 起手位置太低 → 不認
      // 歸位途中再按下 → 拔掉 transition，讓接下來的拖動直接跟手
      clearTransitions()
      startRef.current = { x: t.clientX, y: t.clientY, time: Date.now(), decided: null }
      pullYRef.current = 0
      crossedRef.current = false
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
        // 仍在死區內或頁面已捲走 → indicator 退回 0（手指還按著也要即時跟著退）
        if (pullYRef.current !== 0) {
          pullYRef.current = 0
          writeIndicator(0)
        }
        return
      }

      // 確定是頂端縱向下拉 → 接管，擋掉 iOS 原生頂端回彈
      if (e.cancelable) e.preventDefault()

      // dy 超過死區後從 0 開始算；過閾值後用 rubber-band 阻尼
      const effective = dy - DEAD_ZONE
      const damped = effective < TRIGGER_THRESHOLD
        ? effective
        : TRIGGER_THRESHOLD + rubberBand(effective - TRIGGER_THRESHOLD, OVERPULL_RUBBER_CONSTANT)
      pullYRef.current = damped
      writeIndicator(damped)

      // 粗粒度 state：只在開始顯示、跨過閾值時更新（不逐幀 re-render）
      const crossed = damped > TRIGGER_THRESHOLD
      if (!activeRef.current || crossed !== crossedRef.current) {
        activeRef.current = true
        crossedRef.current = crossed
        setPullY(pullYRef.current)
      }
    }

    const onTouchEnd = async () => {
      const s = startRef.current
      startRef.current = null
      if (!s || !activeRef.current) return
      const captured = pullYRef.current
      pullYRef.current = 0
      activeRef.current = false
      crossedRef.current = false

      setTransitions()
      setSettling(true)
      setPullY(0)

      if (captured <= TRIGGER_THRESHOLD) {
        // 未達閾值：淡出 + 歸位，跑完才卸載 indicator
        writeIndicator(0)
        clearTimeout(settleTimerRef.current)
        settleTimerRef.current = setTimeout(() => {
          finishSettle()
          if (mountedRef.current) setSettling(false)
        }, SETTLE_TIMER_MS)
        return
      }

      // 過閾值：indicator 停到 24px 轉圈、content 歸位
      clearTimeout(settleTimerRef.current)
      const ind = indicatorRef.current
      if (ind) {
        ind.style.transform = `translateY(${REFRESHING_INDICATOR_Y}px)`
        ind.style.opacity = '1'
      }
      if (contentRef.current) contentRef.current.style.transform = 'translateY(0px)'
      refreshingRef.current = true
      setRefreshing(true)
      try {
        await Promise.all([
          onRefreshRef.current?.(),
          new Promise(r => setTimeout(r, MIN_REFRESH_MS)),
        ])
      } catch (err) {
        // 刷新失敗由各資料 hook 的 error state 呈現，這裡只負責收掉 spinner
        console.error('[usePullToRefresh] refresh failed', err)
      } finally {
        if (mountedRef.current) {
          setTransitions()
          const el = indicatorRef.current
          if (el) {
            el.style.transform = 'translateY(0px)'
            el.style.opacity = '0'
          }
          settleTimerRef.current = setTimeout(() => {
            finishSettle()
            refreshingRef.current = false
            if (mountedRef.current) {
              setRefreshing(false)
              setSettling(false)
            }
          }, SETTLE_TIMER_MS)
        } else {
          refreshingRef.current = false
        }
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    document.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [])

  return {
    pullY,
    refreshing,
    showIndicator,
    triggerThreshold: TRIGGER_THRESHOLD,
    indicatorRef,
    contentRef,
  }
}
