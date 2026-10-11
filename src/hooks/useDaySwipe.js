import { useRef, useEffect, useCallback } from 'react'
import { bump } from '../lib/haptic.js'
import { rubberBand, rubberBandInverse } from '../lib/gesture.js'
import { prefersReducedMotion } from '../lib/motion.js'

// 拖曳超過距離閾值，或「放開前尾段速度」超過速度閾值（且至少移動一小段）就 commit 切日
const SWIPE_DISTANCE_THRESHOLD = 50     // px
const SWIPE_VELOCITY_THRESHOLD = 0.11   // px/ms，以尾段時間窗量測
const SWIPE_MIN_FLICK_DISTANCE = 24     // px，純速度 commit 仍需的最小位移
const VELOCITY_WINDOW_MS = 80           // 放開速度的尾段時間窗
const SETTLE_MS = 300                   // commit 滑出 / 彈回的唯一時長來源
const SETTLE_TRANSITION = `transform ${SETTLE_MS}ms var(--ease-out)`
const EDGE_RUBBER_CONSTANT = 80         // 第一天 / 最後一天邊界 rubber-band 上限

// reduced motion：滑出 / 彈回瞬切（收尾仍走同一個 SETTLE_MS timer，只是期間無動畫）
const settleTransition = () => (prefersReducedMotion() ? 'none' : SETTLE_TRANSITION)

/**
 * 讀元素「當下視覺」的 translateX（含 transition 進行中的中間值）。
 * 無 transform 或環境不支援 DOMMatrixReadOnly（如 jsdom）時回 0。
 */
function readLiveTranslateX(el) {
  if (typeof DOMMatrixReadOnly === 'undefined') return 0
  const t = getComputedStyle(el).transform
  if (!t || t === 'none') return 0
  return new DOMMatrixReadOnly(t).m41
}

/**
 * 三欄輪播（prev / current / next）的左右滑動切日手勢。
 *
 * 結構：current panel 用 relative positioning 撐高度；prev / next 用 absolute
 * 放在左右兩側（right-full / left-full），不參與父容器高度計算 → 頁面高度永遠
 * 對齊「當天」內容，不會被最長的那天撐很高。
 *
 * 重點：
 *   - 手勢全程只用 ref + 直接寫 DOM transform，不走 React state（touchstart / 垂直捲動都不 re-render）
 *   - 可中斷：彈回或 commit 滑出途中再按下，從「當下視覺位置」接手跟手，不跳、不鎖輸入
 *   - 放開速度取最後 VELOCITY_WINDOW_MS 的尾段樣本（慢拖後甩一下也算 flick），方向以速度正負為準
 *   - 邊界（第一天往右 / 最後一天往左）用 rubber-band 漸增阻尼，有上限不硬停
 *   - commit 時跑滑出動畫 → 換內容 → 歸位（兩階段）；will-change 只在手勢 / 動畫期間掛
 *   - touchmove listener 只掛一次，最新 days/activeDay/enabled 用 ref 拿
 *
 * @param {{
 *   days: Array<{ day: number }>,
 *   activeDay: number,
 *   setActiveDay: (day: number) => void,
 *   enabled: boolean,
 * }} params
 */
export function useDaySwipe({ days, activeDay, setActiveDay, enabled }) {
  const containerRef = useRef(null)
  const carouselRef = useRef(null)

  const startRef = useRef(null)        // { x, y, time }
  const baseXRef = useRef(0)           // 手指落下時 carousel 的 translateX
  const dxRef = useRef(0)              // 目前視覺位移
  const samplesRef = useRef([])        // 尾段速度樣本 { x, t }
  const horizontalRef = useRef(null)
  const settleTimerRef = useRef(null)
  const phaseRef = useRef('idle')      // 'idle' | 'dragging' | 'settling' | 'committing'

  // 用 refs 鎖住最新值，listener 才不用因為 days/activeDay/enabled 變動就重掛
  const daysRef = useRef(days)
  const activeDayRef = useRef(activeDay)
  const enabledRef = useRef(enabled)
  const setActiveDayRef = useRef(setActiveDay)
  useEffect(() => { daysRef.current = days }, [days])
  useEffect(() => { activeDayRef.current = activeDay }, [activeDay])
  useEffect(() => { enabledRef.current = enabled }, [enabled])
  useEffect(() => { setActiveDayRef.current = setActiveDay }, [setActiveDay])

  // 卸載時清掉未跑完的 settle timer
  useEffect(() => () => clearTimeout(settleTimerRef.current), [])

  // 彈回中心（未達閾值、或中斷後放棄水平手勢）
  const snapBack = useCallback(() => {
    const el = carouselRef.current
    if (!el) { phaseRef.current = 'idle'; return }
    phaseRef.current = 'settling'
    el.style.transition = settleTransition()
    el.style.transform = 'translateX(0)'
    clearTimeout(settleTimerRef.current)
    settleTimerRef.current = setTimeout(() => {
      el.style.transition = ''
      el.style.willChange = ''
      phaseRef.current = 'idle'
    }, SETTLE_MS)
  }, [])

  const onTouchStart = useCallback((e) => {
    if (!enabledRef.current || daysRef.current.length <= 1) return
    const el = carouselRef.current
    if (!el) return

    // 彈回 / commit 滑出途中被按住：不鎖輸入，從當下視覺位置接手。
    // commit 的換內容在 settle 才發生，所以三欄排版仍有效，直接從 baseX 續拖即可。
    // 教學 peek 期間 phase 仍是 idle、但掛著 inline transition → 也要讀當下位置，否則抓住會跳回 0
    clearTimeout(settleTimerRef.current)
    settleTimerRef.current = null
    const animating = phaseRef.current !== 'idle' || el.style.transition !== ''
    const baseX = animating ? readLiveTranslateX(el) : 0
    // 邊界中斷：baseX 已是 rubber-band 後的視覺值，若直接當 raw 起點，
    // onMove 會再 rubberBand 一次（雙重阻尼）→ 第一幀跳位。存回反算的 raw overshoot，
    // 畫面仍停在視覺 baseX。
    const days = daysRef.current
    const idx = days.findIndex(d => d.day === activeDayRef.current)
    const atEdge = animating && ((idx === 0 && baseX > 0) || (idx === days.length - 1 && baseX < 0))
    baseXRef.current = atEdge ? rubberBandInverse(baseX, EDGE_RUBBER_CONSTANT) : baseX
    dxRef.current = baseX
    el.style.transition = 'none'
    el.style.transform = `translateX(${baseX}px)`
    el.style.willChange = 'transform'

    const t = e.touches[0]
    const now = Date.now()
    startRef.current = { x: t.clientX, y: t.clientY, time: now }
    samplesRef.current = [{ x: t.clientX, t: now }]
    horizontalRef.current = null
    phaseRef.current = 'dragging'
  }, [])

  // 非 passive 的 touchmove 才能 preventDefault 阻止頁面捲動
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onMove = (e) => {
      if (phaseRef.current !== 'dragging' || !startRef.current) return
      const el = carouselRef.current
      const touch = e.touches[0]
      const dx = touch.clientX - startRef.current.x
      const dy = touch.clientY - startRef.current.y

      // 第一個有位移的 touchmove 就決定方向，水平則立刻 preventDefault。
      // 不可等累積到某個門檻才判定：iOS Safari 若前幾個 touchmove 沒被 cancel，
      // 會把手勢交給原生捲動，之後的 preventDefault 全被忽略 → 左右滑完全失效。
      // 垂直拖就放棄，讓頁面正常捲動（不動 React state）
      if (horizontalRef.current === null) {
        if (dx === 0 && dy === 0) return
        horizontalRef.current = Math.abs(dx) > Math.abs(dy)
        if (!horizontalRef.current) {
          startRef.current = null
          // 若是中斷動畫後才放棄，carousel 停在半路 → 彈回中心
          if (baseXRef.current !== 0) {
            snapBack()
          } else {
            phaseRef.current = 'idle'
            if (el) {
              el.style.transition = ''
              el.style.willChange = ''
            }
          }
          return
        }
      }

      e.preventDefault()

      // 邊界 rubber-band：第一天往右拉、最後一天往左拉時漸增阻尼
      const days = daysRef.current
      const idx = days.findIndex(d => d.day === activeDayRef.current)
      const raw = baseXRef.current + dx
      const atEdge = (idx === 0 && raw > 0) || (idx === days.length - 1 && raw < 0)
      const visual = atEdge ? rubberBand(raw, EDGE_RUBBER_CONSTANT) : raw
      dxRef.current = visual
      if (el) el.style.transform = `translateX(${visual}px)`

      const now = Date.now()
      const samples = samplesRef.current
      samples.push({ x: touch.clientX, t: now })
      while (samples.length > 0 && now - samples[0].t > VELOCITY_WINDOW_MS) samples.shift()
    }

    container.addEventListener('touchmove', onMove, { passive: false })
    return () => container.removeEventListener('touchmove', onMove)
  }, [snapBack])

  const onTouchEnd = useCallback(() => {
    if (phaseRef.current !== 'dragging') return
    startRef.current = null
    horizontalRef.current = null
    const el = carouselRef.current
    const dx = dxRef.current

    // 尾段速度：以放開時刻為準修剪時間窗；手指停住不動再放開 → 樣本 ≤1 → 速度 0
    const now = Date.now()
    const samples = samplesRef.current.filter(s => now - s.t <= VELOCITY_WINDOW_MS)
    samplesRef.current = []
    let v = 0
    if (samples.length > 1) {
      const first = samples[0]
      const last = samples[samples.length - 1]
      v = (last.x - first.x) / Math.max(1, last.t - first.t)
    }

    if (!el || dx === 0) {
      phaseRef.current = 'idle'
      if (el) {
        el.style.transition = ''
        el.style.willChange = ''
      }
      return
    }

    const days = daysRef.current
    const idx = days.findIndex(d => d.day === activeDayRef.current)

    const flick = Math.abs(v) >= SWIPE_VELOCITY_THRESHOLD && Math.abs(dx) >= SWIPE_MIN_FLICK_DISTANCE
    const far = Math.abs(dx) >= SWIPE_DISTANCE_THRESHOLD
    // 甩的方向與位移方向相反（往右拖後往左甩）→ 視為反悔，彈回
    const reversed = flick && Math.sign(v) !== Math.sign(dx)
    // +1 = 手指往右 = 上一天；-1 = 往左 = 下一天
    const dir = flick ? Math.sign(v) : Math.sign(dx)
    const nextIdx = idx - dir
    const canCommit = (flick || far) && !reversed && nextIdx >= 0 && nextIdx < days.length

    if (!canCommit) {
      snapBack()
      return
    }

    bump()
    phaseRef.current = 'committing'
    el.style.transition = settleTransition()
    el.style.transform = `translateX(${dir * window.innerWidth}px)`
    // 動畫跑完才換內容 + 歸零（無 transition）
    settleTimerRef.current = setTimeout(() => {
      settleTimerRef.current = null
      el.style.transition = 'none'
      setActiveDayRef.current(days[nextIdx].day)
      el.style.transform = 'translateX(0)'
      requestAnimationFrame(() => requestAnimationFrame(() => {
        // 換內容後的兩幀內若又被按住，交給新手勢管理，不要覆寫
        if (phaseRef.current !== 'committing') return
        el.style.transition = ''
        el.style.willChange = ''
        phaseRef.current = 'idle'
      }))
    }, SETTLE_MS)
  }, [snapBack])

  // 一次性教學動畫：把 carousel 短暫向左 peek 一下再彈回，暗示「可以左右滑」
  const peek = useCallback(() => {
    if (prefersReducedMotion()) return
    const el = carouselRef.current
    if (!el || phaseRef.current !== 'idle') return // 用戶正在滑 / 動畫中就不打擾
    el.style.transition = 'transform 600ms var(--ease-spring-soft)'
    el.style.transform = 'translateX(-56px)'
    setTimeout(() => {
      if (!carouselRef.current || phaseRef.current !== 'idle') return
      carouselRef.current.style.transform = 'translateX(0)'
      setTimeout(() => {
        if (carouselRef.current && phaseRef.current === 'idle') carouselRef.current.style.transition = ''
      }, 600)
    }, 700)
  }, [])

  return {
    containerProps: {
      ref: containerRef,
      onTouchStart,
      onTouchEnd,
      onTouchCancel: onTouchEnd,
      // 垂直捲動交給原生（頁面照常捲），水平手勢保留給 swipe。
      // 沒有這個，iOS 在可捲動頁面上會先把手勢仲裁成垂直捲動，
      // 之後 touchmove 的 preventDefault 被忽略 → 內容多的天數左右滑失效。
      style: { touchAction: 'pan-y' },
    },
    carouselRef,
    // transform 全由手勢直接寫在 carouselRef.current.style；這裡保持靜態
    carouselStyle: { position: 'relative' },
    // 保留欄位維持 API 相容（transition 改為 inline 控制）
    carouselClassName: '',
    peek,
  }
}
