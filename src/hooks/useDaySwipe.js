import { useState, useRef, useEffect, useCallback } from 'react'
import { bump } from '../lib/haptic.js'

// 拖曳超過 50px 或速度超過 0.5px/ms 就 commit 切日
const SWIPE_DISTANCE_THRESHOLD = 50
const SWIPE_VELOCITY_THRESHOLD = 0.5

/**
 * 三欄輪播（prev / current / next）的左右滑動切日手勢。
 *
 * 結構：current panel 用 relative positioning 撐高度；prev / next 用 absolute
 * 放在左右兩側（right-full / left-full），不參與父容器高度計算 → 頁面高度永遠
 * 對齊「當天」內容，不會被最長的那天撐很高。
 *
 * 重點：
 *   - 拖動中直接操作 DOM transform，不走 state，避免每幀 re-render
 *   - touchmove listener 只掛一次，最新 days/activeDay/enabled 用 ref 拿
 *   - commit 時跑滑出動畫 → 換內容 → 歸位（兩階段）
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

  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isCarouselAnimating, setIsCarouselAnimating] = useState(false)

  const dragXRef = useRef(0)
  const dragStartRef = useRef(null)
  const dragHorizontalRef = useRef(null)
  // commit 後（滑出動畫進行中）鎖住，避免第二次 swipe 在動畫跑到一半時搶跑
  const animatingRef = useRef(false)

  // 用 refs 鎖住最新值，listener 才不用因為 days/activeDay/enabled 變動就重掛
  const daysRef = useRef(days)
  const activeDayRef = useRef(activeDay)
  const enabledRef = useRef(enabled)
  const setActiveDayRef = useRef(setActiveDay)
  useEffect(() => { daysRef.current = days }, [days])
  useEffect(() => { activeDayRef.current = activeDay }, [activeDay])
  useEffect(() => { enabledRef.current = enabled }, [enabled])
  useEffect(() => { setActiveDayRef.current = setActiveDay }, [setActiveDay])

  const onTouchStart = useCallback((e) => {
    if (!enabledRef.current || daysRef.current.length <= 1 || animatingRef.current) return
    const t = e.touches[0]
    dragStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() }
    dragHorizontalRef.current = null
    dragXRef.current = 0
    setIsDragging(true)
    setDragX(0)
  }, [])

  // 非 passive 的 touchmove 才能 preventDefault 阻止頁面捲動
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onMove = (e) => {
      if (!dragStartRef.current) return
      const dx = e.touches[0].clientX - dragStartRef.current.x
      const dy = e.touches[0].clientY - dragStartRef.current.y

      // 第一次明顯移動決定方向；垂直拖就放棄，讓頁面正常捲動
      if (dragHorizontalRef.current === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        dragHorizontalRef.current = Math.abs(dx) > Math.abs(dy)
        if (!dragHorizontalRef.current) {
          dragStartRef.current = null
          setIsDragging(false)
          return
        }
      }

      e.preventDefault()

      // 邊界阻尼：第一天往右拉、最後一天往左拉時 0.3x damping
      const days = daysRef.current
      const idx = days.findIndex(d => d.day === activeDayRef.current)
      let damped = dx
      if ((idx === 0 && dx > 0) || (idx === days.length - 1 && dx < 0)) {
        damped = dx * 0.3
      }
      dragXRef.current = damped
      if (carouselRef.current) {
        carouselRef.current.style.transform = `translateX(${damped}px)`
      }
    }

    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!dragStartRef.current) {
      setIsDragging(false)
      return
    }
    const dx = dragXRef.current
    const elapsed = Math.max(1, Date.now() - dragStartRef.current.time)
    const velocity = Math.abs(dx) / elapsed
    const days = daysRef.current
    const idx = days.findIndex(d => d.day === activeDayRef.current)

    dragStartRef.current = null
    dragHorizontalRef.current = null
    dragXRef.current = 0

    const passDistance = Math.abs(dx) >= SWIPE_DISTANCE_THRESHOLD
    const passVelocity = velocity >= SWIPE_VELOCITY_THRESHOLD && Math.abs(dx) > 10

    const commitTo = (nextIdx, direction) => {
      bump()
      animatingRef.current = true
      setIsDragging(false)
      setDragX(direction * window.innerWidth)
      // 動畫跑完才換內容 + 歸零（無 transition）
      setTimeout(() => {
        setIsCarouselAnimating(true)
        setActiveDayRef.current(days[nextIdx].day)
        setDragX(0)
        requestAnimationFrame(() => requestAnimationFrame(() => {
          setIsCarouselAnimating(false)
          animatingRef.current = false
        }))
      }, 300)
    }

    if (passDistance || passVelocity) {
      if (dx < 0 && idx < days.length - 1) {
        commitTo(idx + 1, -1)
        return
      } else if (dx > 0 && idx > 0) {
        commitTo(idx - 1, 1)
        return
      }
    }

    // 未達閾值：彈回中心
    const snapEl = carouselRef.current
    if (snapEl && dx !== 0) {
      snapEl.style.transition = 'transform 300ms ease-out'
      snapEl.style.transform = 'translateX(0)'
      setTimeout(() => {
        if (carouselRef.current) carouselRef.current.style.transition = ''
        setIsDragging(false)
      }, 300)
    } else {
      setIsDragging(false)
    }
  }, [])

  // 一次性教學動畫：把 carousel 短暫向左 peek 一下再彈回，暗示「可以左右滑」
  const peek = useCallback(() => {
    const el = carouselRef.current
    if (!el || dragStartRef.current) return // 用戶正在滑就不打擾
    el.style.transition = 'transform 600ms cubic-bezier(0.34, 1.4, 0.64, 1)'
    el.style.transform = 'translateX(-56px)'
    setTimeout(() => {
      if (!carouselRef.current) return
      carouselRef.current.style.transform = 'translateX(0)'
      setTimeout(() => {
        if (carouselRef.current) carouselRef.current.style.transition = ''
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
    carouselStyle: {
      position: 'relative',
      transform: `translateX(${dragX}px)`,
      willChange: 'transform',
    },
    carouselClassName: (!isDragging && !isCarouselAnimating) ? 'transition-transform duration-300 ease-out' : '',
    peek,
  }
}
