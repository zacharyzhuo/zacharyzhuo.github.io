import { useState, useEffect, useRef, useId } from 'react'
import { X } from 'lucide-react'
import { useModalA11y } from '../../hooks/useModalA11y.js'
import { useCancelableTap } from '../../hooks/useCancelableTap.js'
import { resist } from '../../lib/gesture.js'

export default function BottomSheet({ isOpen, onClose, title, children, noScroll = false, noStickyTitle = false, tall = false }) {
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const headerDragRef = useRef(null)
  const contentScrollRef = useRef(null)
  const sheetRef = useRef(null)
  const touchStartY = useRef(null)
  const touchStartTime = useRef(null)
  const dragYRef = useRef(0)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const tap = useCancelableTap()

  useModalA11y(isOpen, onClose, sheetRef)
  // 用來追蹤這次 touch 是不是「從 content 頂端開始往下拉 = 拖關」的情境
  const contentDragActiveRef = useRef(false)

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  // Reset drag state when sheet opens
  useEffect(() => {
    if (isOpen) { setDragY(0); dragYRef.current = 0; setIsDragging(false) }
  }, [isOpen])

  // Header（pill + 標題列）區整片都可以拖；non-passive 才能 preventDefault
  useEffect(() => {
    const el = headerDragRef.current
    if (!el) return

    const onMove = (e) => {
      if (touchStartY.current === null) return
      const delta = e.touches[0].clientY - touchStartY.current
      e.preventDefault()
      // 往下＝關閉方向，1:1 跟手；往上＝反方向，阻尼拉伸（放開彈回）
      const next = delta > 0 ? delta : resist(delta)
      dragYRef.current = next
      setDragY(next)
    }

    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [])

  // 可捲動內容：捲到頂時繼續往下拉，視為拖關手勢
  useEffect(() => {
    const el = contentScrollRef.current
    if (!el) return

    const onTouchStart = (e) => {
      // 只有在內容已捲到頂時，才有可能進入「拖關」模式
      if (el.scrollTop > 0) return
      touchStartY.current = e.touches[0].clientY
      touchStartTime.current = Date.now()
      contentDragActiveRef.current = true
    }

    const onTouchMove = (e) => {
      if (!contentDragActiveRef.current || touchStartY.current === null) return
      const delta = e.touches[0].clientY - touchStartY.current
      if (delta > 0 && el.scrollTop === 0) {
        e.preventDefault()
        if (!isDragging) setIsDragging(true)
        dragYRef.current = delta
        setDragY(delta)
      } else if (delta < 0) {
        // 向上滑：交還給原生 scroll
        contentDragActiveRef.current = false
        touchStartY.current = null
      }
    }

    const onTouchEnd = (e) => {
      if (!contentDragActiveRef.current) return
      contentDragActiveRef.current = false
      handleDragRelease(e)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    // touchend 需 non-passive：拖關成立時 preventDefault 擋 iOS synthetic click（見 handleDragRelease）
    el.addEventListener('touchend', onTouchEnd, { passive: false })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [isDragging])

  const handleDragRelease = (e) => {
    if (touchStartY.current === null) return
    const elapsed = Math.max(1, Date.now() - touchStartTime.current)
    const velocity = dragYRef.current / elapsed
    const captured = dragYRef.current
    touchStartY.current = null
    setIsDragging(false)
    setDragY(0)
    dragYRef.current = 0
    if (captured > 120 || velocity > 0.5) {
      // 擋掉 iOS 在 touchend 後補發的 synthetic click（sheet 滑走後會誤點底下內容）
      if (e?.cancelable) e.preventDefault()
      onCloseRef.current()
    }
  }

  const onHeaderTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
    touchStartTime.current = Date.now()
    setIsDragging(true)
  }

  const sheetClass = [
    // max-w-2xl mx-auto：桌面寬螢幕置中收窄（inset-x-0 + max-width + margin:auto 置中技巧），行動裝置滿版不受影響
    'fixed inset-x-0 bottom-0 z-50 max-w-2xl mx-auto',
    // 開啟用 Q 彈彈簧（overshoot 由單層延伸玻璃覆蓋，無縫），關閉維持乾淨 ease-out
    isDragging ? '' : (isOpen ? 'transition-transform duration-500 ease-spring-soft' : 'transition-transform duration-300 ease-out'),
    // sheet-hidden：關閉動畫結束後 visibility 隱藏，避免 Safari 工具列透出貼在視窗底線的圓角頂緣
    dragY === 0 ? (isOpen ? 'translate-y-0' : 'translate-y-full sheet-hidden') : '',
  ].filter(Boolean).join(' ')

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
        style={dragY !== 0 ? { transform: `translateY(${dragY}px)` } : undefined}
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
            <div ref={contentScrollRef} className="overflow-y-auto overscroll-contain px-8 pb-10 space-y-4 flex-1 pt-2">
              {children}
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  )
}
