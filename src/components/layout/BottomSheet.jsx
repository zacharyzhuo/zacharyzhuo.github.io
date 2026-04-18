import { useState, useEffect, useRef, useId } from 'react'
import { X } from 'lucide-react'
import { useModalA11y } from '../../hooks/useModalA11y.js'

export default function BottomSheet({ isOpen, onClose, title, children, noScroll = false, noStickyTitle = false }) {
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
      if (delta > 0) {
        e.preventDefault()
        dragYRef.current = delta
        setDragY(delta)
      }
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

    const onTouchEnd = () => {
      if (!contentDragActiveRef.current) return
      contentDragActiveRef.current = false
      handleDragRelease()
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [isDragging])

  const handleDragRelease = () => {
    if (touchStartY.current === null) return
    const elapsed = Math.max(1, Date.now() - touchStartTime.current)
    const velocity = dragYRef.current / elapsed
    const captured = dragYRef.current
    touchStartY.current = null
    setIsDragging(false)
    setDragY(0)
    dragYRef.current = 0
    if (captured > 120 || velocity > 0.5) onCloseRef.current()
  }

  const onHeaderTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
    touchStartTime.current = Date.now()
    setIsDragging(true)
  }

  const sheetClass = [
    'fixed inset-x-0 bottom-0 z-50',
    isDragging ? '' : 'transition-transform duration-300 ease-out',
    dragY === 0 ? (isOpen ? 'translate-y-0' : 'translate-y-full') : '',
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
        className={sheetClass}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
      >
        <div className="glass-bottom-sheet h-[79vh] flex flex-col relative">

          {/* Drag handle 區：pill + 標題列整片皆可拖；hitbox 從 pill 的 4px 擴大到整個 header（約 56px+） */}
          <div
            ref={headerDragRef}
            className="touch-manipulation select-none cursor-grab active:cursor-grabbing"
            onTouchStart={onHeaderTouchStart}
            onTouchEnd={handleDragRelease}
            onTouchCancel={handleDragRelease}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-stone-300/60" />
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
            onClick={onClose}
            className="absolute top-8 right-6 z-20 p-3 liquid-glass-button rounded-full text-stone-500 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉"
          >
            <X size={20} />
          </button>

          {noScroll ? (
            <div className="flex-1 min-h-0">{children}</div>
          ) : (
            <div ref={contentScrollRef} className="overflow-y-auto px-8 pb-10 space-y-4 flex-1 pt-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
