import { useState, useEffect, useRef, useId } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Home } from 'lucide-react'
import { env } from '../../lib/env.js'
import { useModalA11y } from '../../hooks/useModalA11y.js'
import { useCancelableTap } from '../../hooks/useCancelableTap.js'
import { resist } from '../../lib/gesture.js'
import ExchangeRate from './ExchangeRate.jsx'

// 放開時取「最後 80ms」的尾端速度（非整段平均）；側欄往左（負值）＝關閉方向
const VELOCITY_WINDOW_MS = 80
const FLICK_VELOCITY = 0.11 // px/ms
const FLICK_MIN_TRAVEL = 24 // px
const CLOSE_DISTANCE = 80 // px
const MIN_CLOSE_MS = 120
const MAX_CLOSE_MS = 300 // 與 index.css --dur-panel-close 同值
const DISMISS_FALLBACK_GRACE_MS = 150 // transitionend 後備收尾的寬限

// 讀目前實際的 translateX（含 transition 進行中的位置），讓中途抓住不會跳
function liveTranslateX(el) {
  if (!el || typeof DOMMatrixReadOnly === 'undefined') return 0
  const m = getComputedStyle(el).transform
  return m && m !== 'none' ? new DOMMatrixReadOnly(m).m41 : 0
}

export default function Sidebar({ isOpen, onClose, onSelect, sections, tripNameEn, countryCode }) {
  const navigate = useNavigate()
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  // dismissing：放開判定關閉後，從放開點直接滑出（不等 isOpen 變 false）；dismissMs = 依甩速算的關閉時長
  const [dismissing, setDismissing] = useState(false)
  const [dismissMs, setDismissMs] = useState(null)
  // closeCalledRef：本次開啟已呼叫過 onClose（navigate(-1)）；每次開啟只呼叫一次，避免連退兩頁
  const closeCalledRef = useRef(false)
  const samplesRef = useRef([])
  const baseRef = useRef(0)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const dragXRef = useRef(0)
  const isHorizontal = useRef(null)
  const onCloseRef = useRef(onClose)
  const sidebarRef = useRef(null)
  const titleId = useId()
  // 選單項：按下後滑出按鈕範圍才放開 = 取消（避免長按誤觸）。
  const tap = useCancelableTap()

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  // 與 BottomSheet 一致：ESC 關閉 + focus trap + 關閉後還原焦點（scroll-lock 由 TripPage 統一處理）
  useModalA11y(isOpen, onClose, sidebarRef)

  const resetDismiss = () => {
    setDismissing(false)
    setDismissMs(null)
    setDragX(0)
    dragXRef.current = 0
  }

  // 開啟時清掉拖拉狀態；關閉（isOpen → false）時結束 dismissing，改由一般關閉 class 接手（同一個終點，不會重跑動畫）
  useEffect(() => {
    resetDismiss()
    if (isOpen) {
      setIsDragging(false)
      closeCalledRef.current = false
    }
  }, [isOpen])

  // 後備：navigate(-1) 沒讓 isOpen 變 false 時，transform 動畫結束也要收尾
  useEffect(() => {
    if (!dismissing) return
    const el = sidebarRef.current
    if (!el) return
    let timer = null
    // 再寬限一下才收尾：reduced-motion 下 transition 只有 0.01ms，transitionend 可能比 popstate 先到，
    // 直接重置會讓面板先閃回開啟位置；正常情況 isOpen 會先變 false，effect cleanup 把 timer 清掉
    const onEnd = (e) => {
      if (e.target === el && e.propertyName === 'transform') timer = setTimeout(resetDismiss, DISMISS_FALLBACK_GRACE_MS)
    }
    el.addEventListener('transitionend', onEnd)
    return () => {
      el.removeEventListener('transitionend', onEnd)
      clearTimeout(timer)
    }
  }, [dismissing])

  useEffect(() => {
    const el = sidebarRef.current
    if (!el) return

    const onMove = (e) => {
      if (touchStartX.current === null) return
      const clientX = e.touches[0].clientX
      const dx = clientX - touchStartX.current
      const dy = e.touches[0].clientY - touchStartY.current

      // 第一次移動時判斷方向
      if (isHorizontal.current === null) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy)
      }

      if (!isHorizontal.current) return

      e.preventDefault()
      // baseRef：起手時側欄的實際位置（開啟/關閉動畫進行中被抓住）
      const total = dx + baseRef.current
      // 向左＝關閉方向，1:1 跟手；向右＝反方向，阻尼拉伸（放開彈回）
      const next = total < 0 ? total : resist(total)
      dragXRef.current = next
      setDragX(next)
      const now = Date.now()
      const samples = samplesRef.current
      samples.push({ pos: clientX, t: now })
      while (samples.length > 1 && now - samples[0].t > VELOCITY_WINDOW_MS) samples.shift()
    }

    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [])

  const onTouchStart = (e) => {
    // 關閉由歷史驅動（navigate(-1)），抓住無法取消；未開啟或已送出關閉後一律不接手
    if (!isOpen || closeCalledRef.current) return
    // 開啟動畫進行中被抓住：從目前實際位置接著拖，不跳
    const base = liveTranslateX(sidebarRef.current)
    baseRef.current = base
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    samplesRef.current = [{ pos: e.touches[0].clientX, t: Date.now() }]
    isHorizontal.current = null
    dragXRef.current = base
    setDragX(base)
    setIsDragging(true)
  }

  const onTouchEnd = () => {
    if (touchStartX.current === null) return
    // 放開當下再裁一次窗口：「快拖 → 停住 → 放開」時，最後一次 touchmove 留下的舊樣本不能算進尾端速度
    const now = Date.now()
    const samples = samplesRef.current.filter(s => now - s.t <= VELOCITY_WINDOW_MS)
    const first = samples[0]
    const last = samples[samples.length - 1]
    // 尾端速度 px/ms，負值＝往左（關閉方向）
    const v = samples.length > 1 ? (last.pos - first.pos) / Math.max(1, last.t - first.t) : 0
    // captured：側欄視覺位置（含起手 base），用於剩餘距離；travel：手指實際位移，用於關閉判定
    // （開啟動畫中途點一下，base 可能已超過門檻，不能因此零位移就關掉）
    const captured = dragXRef.current
    const travel = captured - baseRef.current
    touchStartX.current = null
    touchStartY.current = null
    isHorizontal.current = null
    // 只在「關閉方向（向左，travel < 0）」才觸發關閉；反方向快速拉不該關
    const isFlick = v < -FLICK_VELOCITY && travel < -FLICK_MIN_TRAVEL
    const shouldClose = travel < -CLOSE_DISTANCE || isFlick
    if (shouldClose && !closeCalledRef.current) {
      // 從放開點直接滑出，不先歸零（否則 isOpen 仍 true 的那幾幀會先彈回再被 navigate(-1) 關掉）
      closeCalledRef.current = true
      if (isFlick) {
        const remaining = Math.max(0, (sidebarRef.current?.offsetWidth ?? 0) + captured)
        setDismissMs(Math.round(Math.min(MAX_CLOSE_MS, Math.max(MIN_CLOSE_MS, remaining / -v))))
      }
      setIsDragging(false)
      setDismissing(true)
      onCloseRef.current()
    } else {
      setIsDragging(false)
      setDragX(0)
      dragXRef.current = 0
    }
  }

  const sidebarClass = [
    'fixed inset-y-0 left-0 w-64 z-50 transform',
    // 開啟用 Q 彈彈簧（overshoot 由單層延伸玻璃覆蓋，無縫），關閉維持乾淨 ease-out（時長走 --dur-panel-close token）
    isDragging
      ? ''
      : (dismissing || !isOpen)
        ? 'transition-transform duration-[var(--dur-panel-close)] ease-out'
        : 'transition-transform duration-500 ease-spring-soft',
    (dismissing || (dragX === 0 && !isOpen)) ? '-translate-x-full' : (dragX === 0 ? 'translate-x-0' : ''),
  ].filter(Boolean).join(' ')

  const sidebarStyle = dismissing
    ? (dismissMs ? { transitionDuration: `${dismissMs}ms` } : undefined)
    : (dragX !== 0 ? { transform: `translateX(${dragX}px)` } : undefined)

  return (
    <>
      <div
        className={`fixed inset-0 bg-transparent z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!isOpen}
        className={sidebarClass}
        style={sidebarStyle}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {/* 單一毛玻璃層：往左延伸超過停駐邊（-left-40），開啟 overshoot / 反向拉由「同一塊」玻璃覆蓋 → 無接縫。
            內容層疊在上面、不帶 backdrop。 */}
        <div className="glass-sidebar-frame relative h-full w-full">
          <div aria-hidden="true" className="glass-sidebar absolute inset-0 -left-40 pointer-events-none" />
          <div className="relative h-full w-full flex flex-col">
          <div className="p-6 flex justify-between items-center">
            <div>
              <p className="text-2xs tracking-[0.25em] uppercase text-muted font-serif font-medium mb-1">TRIP MENU</p>
              <h2 id={titleId} className="text-xl font-serif font-bold text-jp-text">行程選單</h2>
            </div>
            <button
              onPointerDown={tap.onPointerDown}
              onPointerUp={tap.onPointerUp}
              onClick={tap.guard(onClose)}
              className="p-3 frosted-glass-button rounded-full text-secondary touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="關閉選單"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain py-4">
            <nav className="space-y-2 px-4">
              {sections.map(({ key, label, subLabel, icon, iconStyle }) => (
                <button
                  key={key}
                  onPointerDown={tap.onPointerDown}
                  onPointerUp={tap.onPointerUp}
                  onClick={tap.guard(() => onSelect(key))}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/20 text-left group press-springy"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-jp-green"
                    style={iconStyle}
                  >
                    {icon}
                  </div>
                  <div>
                    <span className="block font-serif font-bold text-base text-jp-text">
                      {label}
                    </span>
                    <span className="block text-xs font-serif tracking-wide text-muted">
                      {subLabel}
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <ExchangeRate countryCode={countryCode} />

          <div className="px-4 pb-2 flex justify-center">
            <button
              onPointerDown={tap.onPointerDown}
              onPointerUp={tap.onPointerUp}
              onClick={tap.guard(() => {
                // 不呼叫 onClose()：它是 navigate(-1)，和下面的 push 同 tick 會互相打架
                // （go(-1) 非同步、push 同步，結果導航被抵消）。直接 replace 導向首頁，
                // 順便把 sidebar 的 panel entry 蓋掉：back 會回到行程頁本身而非開著的側欄。
                // ?home=1 告訴 HomePage 略過自動跳轉，避免無限循環
                navigate('/?home=1', { replace: true })
              })}
              className="frosted-tab-track press-springy font-serif text-xs text-muted flex items-center gap-1.5 touch-manipulation"
              style={{
                padding: '7px 16px',
                background: 'rgba(255, 255, 255, 0.2)',
                boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.06)',
              }}
              aria-label="返回行程列表"
            >
              <Home size={14} />
              <span>回行程列表</span>
            </button>
          </div>

          <div className="px-6 pb-6 pt-2 text-center">
            <p className="text-xs text-secondary font-serif tracking-widest uppercase opacity-70">
              {tripNameEn || 'Trip'}
            </p>
            <p className="text-2xs text-stone-400 font-mono mt-1 opacity-60" title={env.APP_VERSION}>
              v{env.APP_VERSION === 'dev' ? 'dev' : env.APP_VERSION.slice(0, 7)}
            </p>
          </div>
          </div>
        </div>
      </div>
    </>
  )
}
