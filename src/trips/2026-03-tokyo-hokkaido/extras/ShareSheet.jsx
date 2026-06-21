import { useRef, useState } from 'react'
import { Send, Search } from 'lucide-react'
import { SHARE_CONTACTS } from './data.js'
import ContactAvatar from './ContactAvatar.jsx'

/**
 * Instagram 風格分享面板，支援手勢下滑關閉。
 */
export default function ShareSheet({ isOpen, onClose }) {
  const sheetRef = useRef(null)
  const overlayRef = useRef(null)
  const dragRef = useRef(null)
  const [planePos, setPlanePos] = useState(null)

  const handleDragStart = (e) => {
    e.stopPropagation()
    dragRef.current = { startY: e.touches[0].clientY, dy: 0 }
    if (sheetRef.current) {
      sheetRef.current.style.animation = 'none'
      sheetRef.current.style.transition = 'none'
      sheetRef.current.style.transform = 'translateY(0)'
    }
  }

  const handleDragMove = (e) => {
    e.stopPropagation()
    if (!dragRef.current) return
    const dy = Math.max(0, e.touches[0].clientY - dragRef.current.startY)
    dragRef.current.dy = dy
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)`
    if (overlayRef.current) {
      const opacity = Math.max(0, 0.4 * (1 - dy / 300))
      overlayRef.current.style.backgroundColor = `rgba(0,0,0,${opacity})`
    }
  }

  const handleDragEnd = () => {
    if (!dragRef.current) return
    const dy = dragRef.current.dy
    dragRef.current = null
    if (dy > 80) {
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 0.25s ease'
        sheetRef.current.style.transform = 'translateY(100%)'
      }
      setTimeout(onClose, 250)
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 0.3s ease'
        sheetRef.current.style.transform = 'translateY(0)'
      }
      if (overlayRef.current) {
        overlayRef.current.style.transition = 'background-color 0.3s ease'
        overlayRef.current.style.backgroundColor = 'rgba(0,0,0,0.4)'
      }
    }
  }

  // 點擊頭像：取得點擊座標 → 觸發飛機動畫 → 關閉
  const handleContactClick = (e) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setPlanePos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    setTimeout(() => {
      setPlanePos(null)
      onClose()
    }, 700)
  }

  if (!isOpen) return null

  return (
    <>
      {/* 飛機動畫：fixed 定位在點擊位置，播完就消失 */}
      {planePos && (
        <div
          className="fixed z-[300] pointer-events-none animate-plane-fly"
          style={{ left: planePos.x - 12, top: planePos.y - 12 }}
        >
          <Send size={24} className="text-white" strokeWidth={2} />
        </div>
      )}

      <div
        ref={overlayRef}
        className="absolute inset-0 z-50 flex flex-col justify-end"
        onClick={onClose}
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      >
        <div
          ref={sheetRef}
          className="relative rounded-t-2xl overflow-hidden animate-share-slide-up"
          style={{ backgroundColor: '#262626' }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {/* 拖曳把手 */}
          <div className="flex justify-center pt-3 pb-4">
            <div className="w-10 h-1 rounded-full bg-white/30" />
          </div>

          {/* 搜尋列 */}
          <div className="px-4 pb-4">
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ backgroundColor: '#363636' }}
            >
              <Search size={16} className="text-white/50 flex-shrink-0" />
              <span className="text-white/50 text-sm font-sans">搜尋</span>
              <div className="flex-1" />
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: '#4a4a4a' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
                  <circle cx="8" cy="8" r="3" /><circle cx="16" cy="8" r="3" /><circle cx="8" cy="16" r="3" /><circle cx="16" cy="16" r="3" />
                </svg>
              </div>
            </div>
          </div>

          {/* 聯絡人 */}
          <div className="px-6 pb-6">
            <div className="flex flex-wrap gap-6">
              {SHARE_CONTACTS.map((contact) => (
                <ContactAvatar key={contact.name} contact={contact} onClick={handleContactClick} />
              ))}
            </div>
          </div>

          <div className="pb-[max(0.5rem,env(safe-area-inset-bottom))]" />
        </div>
      </div>
    </>
  )
}
