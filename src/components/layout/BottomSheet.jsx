import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function BottomSheet({ isOpen, onClose, title, children, noScroll = false, noStickyTitle = false }) {
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const pillRef = useRef(null)
  const touchStartY = useRef(null)
  const touchStartTime = useRef(null)
  const dragYRef = useRef(0)
  const onCloseRef = useRef(onClose)

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  // Reset drag state when sheet opens
  useEffect(() => {
    if (isOpen) { setDragY(0); dragYRef.current = 0; setIsDragging(false) }
  }, [isOpen])

  // Non-passive touchmove so we can preventDefault and block page scroll
  useEffect(() => {
    const el = pillRef.current
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

  const onPillTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
    touchStartTime.current = Date.now()
    setIsDragging(true)
  }

  const onPillTouchEnd = () => {
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

  const sheetClass = [
    'fixed inset-x-0 bottom-0 z-50',
    isDragging ? '' : 'transition-transform duration-300 ease-out',
    dragY === 0 ? (isOpen ? 'translate-y-0' : 'translate-y-full') : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      <div
        className={`fixed inset-0 bg-transparent z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        className={sheetClass}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
      >
        <div className={`glass-bottom-sheet flex flex-col relative ${noScroll ? 'h-[79vh]' : 'min-h-[60vh] max-h-[79vh]'}`}>

          {/* Drag pill handle */}
          <div
            ref={pillRef}
            className="flex justify-center pt-3 pb-2 touch-manipulation select-none"
            onTouchStart={onPillTouchStart}
            onTouchEnd={onPillTouchEnd}
          >
            <div className="w-10 h-1 rounded-full bg-stone-300/60" />
          </div>

          <button
            onClick={onClose}
            className="absolute top-8 right-6 z-20 p-3 liquid-glass-button rounded-full text-stone-500 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉"
          >
            <X size={20} />
          </button>

          {noScroll ? (
            <>
              {!noStickyTitle && (
                <div className="px-8 pt-4 pb-4 flex-shrink-0">
                  <h2 className="text-2xl font-serif font-bold text-jp-text pr-12">{title}</h2>
                </div>
              )}
              <div className="flex-1 min-h-0">{children}</div>
            </>
          ) : (
            <div className="overflow-y-auto px-8 pb-10 space-y-4 flex-1 pt-4">
              <h2 className="text-2xl font-serif font-bold text-jp-text mb-4 pr-12">{title}</h2>
              {children}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
