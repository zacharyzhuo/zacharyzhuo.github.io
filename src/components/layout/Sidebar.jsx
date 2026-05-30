import { useState, useEffect, useRef, useId } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Home } from 'lucide-react'
import { env } from '../../lib/env.js'
import { useModalA11y } from '../../hooks/useModalA11y.js'
import { useCancelableTap } from '../../hooks/useCancelableTap.js'
import { resist } from '../../lib/gesture.js'

export default function Sidebar({ isOpen, onClose, onSelect, sections, tripNameEn }) {
  const navigate = useNavigate()
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const touchStartTime = useRef(null)
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

  useEffect(() => {
    if (isOpen) { setDragX(0); dragXRef.current = 0; setIsDragging(false) }
  }, [isOpen])

  useEffect(() => {
    const el = sidebarRef.current
    if (!el) return

    const onMove = (e) => {
      if (touchStartX.current === null) return
      const dx = e.touches[0].clientX - touchStartX.current
      const dy = e.touches[0].clientY - touchStartY.current

      // 第一次移動時判斷方向
      if (isHorizontal.current === null) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy)
      }

      if (!isHorizontal.current) return

      e.preventDefault()
      // 向左＝關閉方向，1:1 跟手；向右＝反方向，阻尼拉伸（放開彈回）
      const next = dx < 0 ? dx : resist(dx)
      dragXRef.current = next
      setDragX(next)
    }

    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [])

  const onTouchStart = (e) => {
    if (!isOpen) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchStartTime.current = Date.now()
    isHorizontal.current = null
    setIsDragging(true)
  }

  const onTouchEnd = () => {
    if (touchStartX.current === null) return
    const elapsed = Math.max(1, Date.now() - touchStartTime.current)
    const velocity = Math.abs(dragXRef.current) / elapsed
    const captured = dragXRef.current
    touchStartX.current = null
    touchStartY.current = null
    isHorizontal.current = null
    setIsDragging(false)
    setDragX(0)
    dragXRef.current = 0
    // 只在「關閉方向（向左，captured < 0）」才觸發關閉；反方向快速拉不該關
    if (captured < -80 || (velocity > 0.5 && captured < 0)) onCloseRef.current()
  }

  const sidebarClass = [
    'fixed inset-y-0 left-0 w-64 z-50 transform',
    // 開啟用 Q 彈彈簧（overshoot 由單層延伸玻璃覆蓋，無縫），關閉維持乾淨 ease-out
    isDragging ? '' : (isOpen ? 'transition-transform duration-500 ease-spring-soft' : 'transition-transform duration-300 ease-out'),
    dragX === 0 ? (isOpen ? 'translate-x-0' : '-translate-x-full') : '',
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
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!isOpen}
        className={sidebarClass}
        style={dragX !== 0 ? { transform: `translateX(${dragX}px)` } : undefined}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* 單一毛玻璃層：往左延伸超過停駐邊（-left-40），開啟 overshoot / 反向拉由「同一塊」玻璃覆蓋 → 無接縫。
            內容層疊在上面、不帶 backdrop。 */}
        <div className="relative h-full w-full">
          <div aria-hidden="true" className="glass-sidebar absolute inset-0 -left-40 pointer-events-none" />
          <div className="relative h-full w-full flex flex-col">
          <div className="p-6 flex justify-between items-center">
            <h2 id={titleId} className="text-xl font-serif font-bold text-jp-text">Trip Menu</h2>
            <button
              onClick={onClose}
              className="p-3 frosted-glass-button rounded-full text-stone-600 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="關閉選單"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain py-4">
            <nav className="space-y-2 px-4">
              {sections.map(({ key, label, subLabel, icon, color }) => (
                <button
                  key={key}
                  onPointerDown={tap.onPointerDown}
                  onPointerUp={tap.onPointerUp}
                  onClick={tap.guard(() => { onSelect(key); onClose() })}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/20 transition-colors text-left group press-springy"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color ?? 'bg-white/30 text-jp-green'}`}>
                    {icon}
                  </div>
                  <div>
                    <span className="block font-serif font-bold text-base text-jp-text">
                      {label}
                    </span>
                    <span className="block text-xs font-serif tracking-wide text-stone-500">
                      {subLabel}
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <div className="px-4 pb-2">
            <button
              onClick={() => {
                onClose()
                // ?home=1 告訴 HomePage 略過自動跳轉，避免無限循環
                navigate('/?home=1')
              }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl frosted-glass-button text-stone-600 font-serif text-sm touch-manipulation min-h-[44px]"
              aria-label="返回行程列表"
            >
              <Home size={16} />
              <span>回行程列表</span>
            </button>
          </div>

          <div className="px-6 pb-6 pt-2 text-center">
            <p className="text-xs text-stone-600 font-serif tracking-widest uppercase opacity-70">
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
