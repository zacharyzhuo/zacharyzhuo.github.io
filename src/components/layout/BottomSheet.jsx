import { useState, useEffect, useRef, useId } from 'react'
import { X } from 'lucide-react'
import { useModalA11y } from '../../hooks/useModalA11y.js'
import { useCancelableTap } from '../../hooks/useCancelableTap.js'
import { resist } from '../../lib/gesture.js'

// 放開時取「最後 80ms」的尾端速度（非整段平均），甩一下就能關
const VELOCITY_WINDOW_MS = 80
const FLICK_VELOCITY = 0.11 // px/ms
const FLICK_MIN_TRAVEL = 24 // px：太短的甩動不算
const CLOSE_DISTANCE = 120 // px
const MIN_CLOSE_MS = 120
const MAX_CLOSE_MS = 300 // 與 index.css --dur-panel-close 同值
const DISMISS_FALLBACK_GRACE_MS = 150 // transitionend 後備收尾的寬限

// 讀目前實際的 translateY（含 transition 進行中的位置），讓中途抓住不會跳
function liveTranslateY(el) {
  if (!el || typeof DOMMatrixReadOnly === 'undefined') return 0
  const m = getComputedStyle(el).transform
  return m && m !== 'none' ? new DOMMatrixReadOnly(m).m42 : 0
}

export default function BottomSheet({ isOpen, onClose, title, children, noScroll = false, noStickyTitle = false, tall = false }) {
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  // dismissing：放開判定關閉後，從放開點直接滑出（不等 isOpen 變 false）；dismissMs = 依甩速算的關閉時長
  const [dismissing, setDismissing] = useState(false)
  const [dismissMs, setDismissMs] = useState(null)
  // closeCalledRef：本次開啟已呼叫過 onClose（navigate(-1)）；每次開啟只呼叫一次，避免連退兩頁
  const closeCalledRef = useRef(false)
  const samplesRef = useRef([])
  const baseRef = useRef(0)
  const headerDragRef = useRef(null)
  const sheetRef = useRef(null)
  const touchStartY = useRef(null)
  const dragYRef = useRef(0)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const tap = useCancelableTap()

  useModalA11y(isOpen, onClose, sheetRef)

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  const resetDismiss = () => {
    setDismissing(false)
    setDismissMs(null)
    setDragY(0)
    dragYRef.current = 0
  }

  // 開啟時清掉拖拉狀態；關閉（isOpen → false）時結束 dismissing，改由一般關閉 class 接手（同一個終點，不會重跑動畫）
  useEffect(() => {
    resetDismiss()
    if (isOpen) {
      setIsDragging(false)
      closeCalledRef.current = false
    }
  }, [isOpen])

  // 後備：navigate(-1) 沒讓 isOpen 變 false（例如回到別的 route 前的空窗），transform 動畫結束時也要收尾
  useEffect(() => {
    if (!dismissing) return
    const el = sheetRef.current
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

  // Header（pill + 標題列）區整片都可以拖；non-passive 才能 preventDefault
  useEffect(() => {
    const el = headerDragRef.current
    if (!el) return

    const onMove = (e) => {
      if (touchStartY.current === null) return
      const clientY = e.touches[0].clientY
      // baseRef：起手時面板的實際位置（開啟/關閉動畫進行中被抓住）
      const delta = clientY - touchStartY.current + baseRef.current
      e.preventDefault()
      // 往下＝關閉方向，1:1 跟手；往上＝反方向，阻尼拉伸（放開彈回）
      const next = delta > 0 ? delta : resist(delta)
      dragYRef.current = next
      setDragY(next)
      const now = Date.now()
      const samples = samplesRef.current
      samples.push({ pos: clientY, t: now })
      while (samples.length > 1 && now - samples[0].t > VELOCITY_WINDOW_MS) samples.shift()
    }

    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [])

  const handleDragRelease = (e) => {
    if (touchStartY.current === null) return
    // 放開當下再裁一次窗口：「快拖 → 停住 → 放開」時，最後一次 touchmove 留下的舊樣本不能算進尾端速度
    const now = Date.now()
    const samples = samplesRef.current.filter(s => now - s.t <= VELOCITY_WINDOW_MS)
    const first = samples[0]
    const last = samples[samples.length - 1]
    // 尾端速度 px/ms，正值＝往下（關閉方向）
    const v = samples.length > 1 ? (last.pos - first.pos) / Math.max(1, last.t - first.t) : 0
    // captured：面板視覺位置（含起手 base），用於剩餘距離；travel：手指實際位移，用於關閉判定
    // （開啟動畫中途點一下，base 可能已超過門檻，不能因此零位移就關掉）
    const captured = dragYRef.current
    const travel = captured - baseRef.current
    touchStartY.current = null
    const isFlick = v > FLICK_VELOCITY && travel > FLICK_MIN_TRAVEL
    const shouldClose = travel > CLOSE_DISTANCE || isFlick
    if (shouldClose && !closeCalledRef.current) {
      // 從放開點直接滑出，不先歸零（否則 isOpen 仍 true 的那幾幀會先彈回頂再被 navigate(-1) 關掉）
      closeCalledRef.current = true
      if (isFlick) {
        const remaining = Math.max(0, (sheetRef.current?.offsetHeight ?? 0) - captured)
        setDismissMs(Math.round(Math.min(MAX_CLOSE_MS, Math.max(MIN_CLOSE_MS, remaining / v))))
      }
      setIsDragging(false)
      setDismissing(true)
      // 擋掉 iOS 在 touchend 後補發的 synthetic click（sheet 滑走後會誤點底下內容）
      if (e?.cancelable) e.preventDefault()
      onCloseRef.current()
    } else {
      setIsDragging(false)
      setDragY(0)
      dragYRef.current = 0
    }
  }

  const onHeaderTouchStart = (e) => {
    // 關閉由歷史驅動（navigate(-1)），抓住無法取消；未開啟或已送出關閉後一律不接手
    if (!isOpen || closeCalledRef.current) return
    // 開啟動畫進行中被抓住：從目前實際位置接著拖，不跳
    const base = liveTranslateY(sheetRef.current)
    baseRef.current = base
    touchStartY.current = e.touches[0].clientY
    samplesRef.current = [{ pos: e.touches[0].clientY, t: Date.now() }]
    dragYRef.current = base
    setDragY(base)
    setIsDragging(true)
  }

  const sheetClass = [
    // max-w-2xl mx-auto：桌面寬螢幕置中收窄（inset-x-0 + max-width + margin:auto 置中技巧），行動裝置滿版不受影響
    'fixed inset-x-0 bottom-0 z-50 max-w-2xl mx-auto',
    // 開啟用 Q 彈彈簧（overshoot 由單層延伸玻璃覆蓋，無縫），關閉維持乾淨 ease-out（時長走 --dur-panel-close token）
    isDragging
      ? ''
      : (dismissing || !isOpen)
        ? 'transition-transform duration-[var(--dur-panel-close)] ease-out'
        : 'transition-transform duration-500 ease-spring-soft',
    (dismissing || (dragY === 0 && !isOpen)) ? 'translate-y-full' : (dragY === 0 ? 'translate-y-0' : ''),
    // sheet-hidden：關閉動畫結束後 visibility 隱藏，避免 Safari 工具列透出貼在視窗底線的圓角頂緣
    (!isOpen && !dismissing && dragY === 0) ? 'sheet-hidden' : '',
  ].filter(Boolean).join(' ')

  const sheetStyle = dismissing
    ? (dismissMs ? { transitionDuration: `${dismissMs}ms` } : undefined)
    : (dragY !== 0 ? { transform: `translateY(${dragY}px)` } : undefined)

  return (
    <>
      <div
        aria-hidden="true"
        className={`fixed inset-0 bg-transparent z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!isOpen}
        tabIndex={-1}
        className={sheetClass}
        style={sheetStyle}
      >
        {/* 單一毛玻璃層：往下延伸超過停駐邊（-bottom-56），開啟 overshoot / 反向拉都由「同一塊」
            玻璃覆蓋 → 構造上無接縫（取代舊的 glass-overshoot-fill 貼塊）。內容層疊在上面、不帶 backdrop。
            tall 高度 = 切齊頁面 header icon（漢堡 / 地圖鈕）下緣：safe-area-top + pt-8(32px) + 鈕高 48px = safe + 5rem。 */}
        <div className={`glass-sheet-frame relative ${tall ? 'h-[calc(100dvh_-_env(safe-area-inset-top)_-_5rem)]' : 'h-[79vh]'}`}>
          <div aria-hidden="true" className="glass-bottom-sheet absolute inset-0 -bottom-56 pointer-events-none" />
          <div className="relative h-full flex flex-col">

          {/* Drag handle 區：pill + 標題列整片皆可拖；hitbox 從 pill 的 4px 擴大到整個 header（約 56px+）。
              noScroll（滿版內容）時內容墊在底下，header 抬 z 讓 pill 浮在內容上，
              pill 用較深色換取在淺色內容（地圖圖磚 / 卡片）上的可見度。 */}
          <div
            ref={headerDragRef}
            className={`touch-manipulation select-none cursor-grab active:cursor-grabbing ${noScroll ? 'relative z-[660]' : ''}`}
            onTouchStart={onHeaderTouchStart}
            onTouchEnd={handleDragRelease}
            onTouchCancel={handleDragRelease}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className={`w-10 h-1 rounded-full ${noScroll ? 'bg-stone-400/70' : 'bg-stone-300/60'}`} />
            </div>
            {noScroll && !noStickyTitle && (
              <div className="px-8 pt-2 pb-4 flex-shrink-0">
                <h2 id={titleId} className="text-2xl font-serif font-bold text-jp-text pr-12">{title}</h2>
              </div>
            )}
            {!noScroll && (
              <div className="px-8 pt-2 pb-2">
                <h2 id={titleId} className="text-2xl font-serif font-bold text-jp-text pr-12">{title}</h2>
              </div>
            )}
            {/* noScroll + noStickyTitle 模式下標題由子元件自行渲染，這裡放隱形 label 給 aria-labelledby 用 */}
            {noScroll && noStickyTitle && (
              <span id={titleId} className="sr-only">{title}</span>
            )}
          </div>

          <button
            onPointerDown={tap.onPointerDown}
            onPointerUp={tap.onPointerUp}
            onClick={tap.guard(onClose)}
            className="absolute top-8 right-6 z-[1100] p-3 frosted-glass-button rounded-full text-muted touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉"
          >
            <X size={20} />
          </button>

          {noScroll ? (
            /* 滿版內容鋪到 sheet 頂（含把手背後），消除把手與內容間的玻璃縫；
               捲動內容會滑進 pill 底下、裁在與 glass 同弧度的圓角內。 */
            <div className="absolute inset-0 overflow-hidden rounded-t-[2rem]">{children}</div>
          ) : (
            <div className="overflow-y-auto overscroll-contain px-8 pb-10 space-y-4 flex-1 pt-2">
              {children}
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  )
}
