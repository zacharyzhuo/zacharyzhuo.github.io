import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Send, Search } from 'lucide-react'
import { SHARE_CONTACTS } from './data.js'
import ContactAvatar from './ContactAvatar.jsx'
import { resist } from '../../../lib/gesture.js'
import { prefersReducedMotion } from '../../../lib/motion.js'

const ENTER_TRANSITION = 'transform 0.3s var(--ease-out)'
const EXIT_MS = 250
const EXIT_TRANSITION = `transform ${EXIT_MS / 1000}s var(--ease-out)`
const SNAP_BACK_TRANSITION = 'transform 0.3s var(--ease-out)'
const DISMISS_DISTANCE_PX = 80
// 甩動關閉：放開前 80ms 內速度 > 0.11 px/ms 且至少拉了 24px
const VELOCITY_WINDOW_MS = 80
const DISMISS_VELOCITY = 0.11
const DISMISS_MIN_PX = 24
// 背景遮罩隨拖拉淡出的距離
const BACKDROP_FADE_PX = 300

// reduced motion：進場 / 退場 / 彈回 / 遮罩淡入淡出一律瞬切（退場的 onClose timer 照舊）
const motion = (transition) => (prefersReducedMotion() ? 'none' : transition)

// 讀出 sheet 當下實際的 translateY（進場動畫中途被抓住時從現位置接手）
function currentTranslateY(el) {
  if (typeof DOMMatrixReadOnly === 'undefined') return 0
  const t = getComputedStyle(el).transform
  if (!t || t === 'none') return 0
  try {
    return new DOMMatrixReadOnly(t).m42
  } catch {
    return 0
  }
}

/**
 * Instagram 風格分享面板，支援手勢下滑關閉。
 */
export default function ShareSheet({ isOpen, onClose }) {
  const sheetRef = useRef(null)
  const backdropRef = useRef(null)
  const dragRef = useRef(null)
  const closingRef = useRef(false)
  const [planePos, setPlanePos] = useState(null)

  // 進場：先在 paint 前定在畫面外，再用 double-rAF 確保起始狀態已繪製後才 transition 滑上來
  // （transition 而非 keyframe：抓住時改寫 transform 不會被 animation 蓋掉）
  useLayoutEffect(() => {
    if (!isOpen) return
    closingRef.current = false
    const sheet = sheetRef.current
    const backdrop = backdropRef.current
    if (sheet) {
      sheet.style.transition = 'none'
      sheet.style.transform = 'translateY(100%)'
    }
    if (backdrop) {
      backdrop.style.transition = 'none'
      backdrop.style.opacity = '1'
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const sheet = sheetRef.current
        if (!sheet || dragRef.current) return
        sheet.style.transition = motion(ENTER_TRANSITION)
        sheet.style.transform = 'translateY(0)'
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [isOpen])

  // 滑下關閉：拖拉放開、甩動、點背景共用同一條退場
  const dismiss = () => {
    if (closingRef.current) return
    closingRef.current = true
    if (sheetRef.current) {
      sheetRef.current.style.transition = motion(EXIT_TRANSITION)
      sheetRef.current.style.transform = 'translateY(100%)'
    }
    if (backdropRef.current) {
      backdropRef.current.style.transition = motion(`opacity ${EXIT_MS / 1000}s var(--ease-out)`)
      backdropRef.current.style.opacity = '0'
    }
    setTimeout(onClose, EXIT_MS)
  }

  const handleDragStart = (e) => {
    e.stopPropagation()
    if (closingRef.current) return
    const sheet = sheetRef.current
    const base = sheet ? currentTranslateY(sheet) : 0
    const y = e.touches[0].clientY
    dragRef.current = { startY: y, base, offset: base, samples: [{ y, t: performance.now() }] }
    if (sheet) {
      sheet.style.transition = 'none'
      sheet.style.transform = `translateY(${base}px)`
    }
    if (backdropRef.current) backdropRef.current.style.transition = 'none'
  }

  const handleDragMove = (e) => {
    e.stopPropagation()
    const drag = dragRef.current
    if (!drag) return
    const y = e.touches[0].clientY
    const offset = drag.base + (y - drag.startY)
    drag.offset = offset
    const now = performance.now()
    drag.samples = drag.samples.filter((p) => now - p.t <= VELOCITY_WINDOW_MS)
    drag.samples.push({ y, t: now })
    // 往上超過停駐位置：rubber-band 阻尼，不再硬卡在 0
    const shown = offset < 0 ? resist(offset) : offset
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${shown}px)`
    if (backdropRef.current) {
      // 只寫 opacity（compositor-only），不再每幀改 backgroundColor
      backdropRef.current.style.opacity = String(Math.max(0, 1 - Math.max(0, offset) / BACKDROP_FADE_PX))
    }
  }

  const handleDragEnd = () => {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    const now = performance.now()
    const recent = drag.samples.filter((p) => now - p.t <= VELOCITY_WINDOW_MS)
    let velocity = 0
    if (recent.length >= 2) {
      const dt = recent[recent.length - 1].t - recent[0].t
      if (dt > 0) velocity = (recent[recent.length - 1].y - recent[0].y) / dt
    }
    // 用手指實際位移判定（扣掉起手 base）：進場動畫中途點一下，base 可能已超過門檻，不能零位移就關掉
    const travel = drag.offset - drag.base
    if (travel > DISMISS_DISTANCE_PX || (velocity > DISMISS_VELOCITY && travel > DISMISS_MIN_PX)) {
      dismiss()
      return
    }
    if (sheetRef.current) {
      sheetRef.current.style.transition = motion(SNAP_BACK_TRANSITION)
      sheetRef.current.style.transform = 'translateY(0)'
    }
    if (backdropRef.current) {
      backdropRef.current.style.transition = motion('opacity 0.3s var(--ease-out)')
      backdropRef.current.style.opacity = '1'
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
        className="absolute inset-0 z-50 flex flex-col justify-end"
        onClick={dismiss}
      >
        {/* 背景遮罩獨立一層：拖拉時只改它的 opacity，才不會連 sheet 一起變透明 */}
        <div
          ref={backdropRef}
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          aria-hidden="true"
        />
        <div
          ref={sheetRef}
          className="relative w-full max-w-2xl mx-auto rounded-t-2xl overflow-hidden"
          style={{ backgroundColor: '#262626', transform: 'translateY(100%)' }}
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
