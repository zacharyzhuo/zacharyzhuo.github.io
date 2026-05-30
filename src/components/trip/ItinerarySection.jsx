import { Fragment, useState, useEffect, useRef, useMemo, useId } from 'react'
import { createPortal } from 'react-dom'
import {
  Camera, Utensils, ShoppingBag, Train, Hotel,
  ChevronRight, X, Navigation, BookOpen, Clock, MapPin
} from 'lucide-react'
import { useScrollLock } from '../../hooks/useScrollLock.js'
import { useModalA11y } from '../../hooks/useModalA11y.js'
import { formatToday } from '../../lib/tripDate.js'
import EmptyState from '../ui/EmptyState.jsx'

function formatNowHHMM() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 今日時間軸上「現在 HH:MM」紅線標記
function NowMarker({ time, innerRef }) {
  return (
    <div ref={innerRef} className="flex gap-4 px-6 -mt-2 mb-4">
      <div className="w-12 shrink-0 flex flex-col items-center">
        <span className="text-2xs font-serif font-bold text-jp-red leading-none tabular-nums tracking-tight">
          {time}
        </span>
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-2xs font-serif font-bold text-jp-red uppercase tracking-[0.2em] shrink-0">
          現在
        </span>
        <div className="flex-1 h-[1px] bg-jp-red/40" />
        <span className="w-2 h-2 rounded-full bg-jp-red shrink-0 animate-pulse shadow-[0_0_0_4px_rgba(185,54,50,0.15)]" />
      </div>
    </div>
  )
}
const TYPE_MAP = {
  transport:  { label: '交通', icon: Train, border: 'border-blue-200/40 text-blue-700 bg-blue-50/20 backdrop-blur-sm' },
  food:       { label: '美食', icon: Utensils, border: 'border-orange-200/40 text-orange-700 bg-orange-50/20 backdrop-blur-sm' },
  attraction: { label: '景點', icon: Camera, border: 'border-emerald-200/40 text-emerald-700 bg-emerald-50/20 backdrop-blur-sm' },
  shopping:   { label: '購物', icon: ShoppingBag, border: 'border-pink-200/40 text-pink-700 bg-pink-50/20 backdrop-blur-sm' },
  hotel:      { label: '住宿', icon: Hotel, border: 'border-purple-200/40 text-purple-700 bg-purple-50/20 backdrop-blur-sm' },
}

const SPOT_TYPE_ORDER = { food: 0, attraction: 1, shopping: 2 }

function getTypeInfo(type) {
  return TYPE_MAP[type] || TYPE_MAP['attraction']
}

function buildGoogleMapsUrl(address, name) {
  const query = address || name || ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function sortSpots(spots) {
  return [...spots].sort(
    (a, b) => (SPOT_TYPE_ORDER[a.type] ?? 99) - (SPOT_TYPE_ORDER[b.type] ?? 99)
  )
}

function SpotItem({ spot }) {
  const { label, border } = getTypeInfo(spot.type)
  const url = spot.link?.startsWith('http')
    ? spot.link
    : buildGoogleMapsUrl(spot.address, spot.name)

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-stone-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-2xs px-1.5 py-0.5 border rounded font-serif font-bold shrink-0 uppercase tracking-wider ${border}`}>
            {label}
          </span>
          <span className="font-serif font-bold text-jp-text text-sm leading-snug truncate">
            {spot.name}
          </span>
        </div>
        {spot.description && (
          <p className="text-xs text-stone-500 font-serif leading-relaxed line-clamp-1 pl-[2px]">
            {spot.description}
          </p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); window.open(url, '_blank') }}
        className="shrink-0 p-2 frosted-glass-button rounded-lg text-stone-500 touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
        aria-label={`${spot.name} Google Maps`}
      >
        <Navigation size={14} />
      </button>
    </div>
  )
}

function DetailModal({ row, spots, onClose }) {
  const [displayRow, setDisplayRow] = useState(null)
  const [displaySpots, setDisplaySpots] = useState([])
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const pillRef = useRef(null)
  const sheetRef = useRef(null)
  const touchStartY = useRef(null)
  const touchStartTime = useRef(null)
  const dragYRef = useRef(0)
  const onCloseRef = useRef(onClose)
  const titleId = useId()

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (row) { setDisplayRow(row); setDisplaySpots(spots) }
  }, [row, spots])

  const isOpen = !!row

  useModalA11y(isOpen, onClose, sheetRef)

  useEffect(() => {
    if (isOpen) { setDragY(0); dragYRef.current = 0; setIsDragging(false) }
  }, [isOpen])

  useScrollLock(isOpen)

  // Non-passive touchmove on pill so preventDefault blocks page scroll.
  // 依賴 isOpen：首次 mount 時 return null（無選取項目），pillRef.current 為 null，
  // 需等到 modal 開啟、元素實際渲染後才能掛上 listener。
  useEffect(() => {
    if (!isOpen) return
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
  }, [isOpen])

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
    'fixed inset-x-0 bottom-0 z-50 transform',
    isDragging ? '' : 'transition-transform duration-300 ease-out',
    dragY === 0 ? (isOpen ? 'translate-y-0' : 'translate-y-full') : '',
  ].filter(Boolean).join(' ')

  const current = row || displayRow
  const currentSpots = row ? spots : displaySpots
  // 注意：不能在這裡早 return null，否則第一次點開時 sheet div 直接 mount 在 translate-y-0，
  // 沒有「translate-y-full → translate-y-0」的起點可以動，CSS transition 不會觸發。
  // 改為：殼永遠 render（預設 translate-y-full 藏在畫面外），內容才依 current 條件渲染。
  const typeInfo = current ? getTypeInfo(current.type) : null
  const navUrl = current
    ? (current.link?.startsWith('http')
        ? current.link
        : buildGoogleMapsUrl(current.address, current.name))
    : ''

  // Portal 到 body 以跳過祖先 transform（day swipe 容器永遠掛 translate3d，
  // 會讓 fixed 元素改成相對該容器，導致 modal 被切掉 / 看起來高度很低）。
  return createPortal(
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
        style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
      >
        <div className="glass-bottom-sheet min-h-[40vh] max-h-[85vh] flex flex-col relative overflow-hidden">
        {current && (
          <>

          {/* Drag pill handle */}
          <div
            ref={pillRef}
            className="flex justify-center pt-3 pb-2 touch-manipulation select-none flex-shrink-0"
            onTouchStart={onPillTouchStart}
            onTouchEnd={onPillTouchEnd}
          >
            <div className="w-10 h-1 rounded-full bg-stone-300/60" />
          </div>

          <button
            onClick={onClose}
            className="absolute top-8 right-6 z-20 p-3 frosted-glass-button rounded-full text-stone-500 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉詳情"
          >
            <X size={20} />
          </button>

          <div className="overflow-y-auto overscroll-contain px-8 pb-24 flex-1 pt-4">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 border text-xs tracking-widest font-bold font-serif uppercase rounded ${typeInfo.border}`}>
                {typeInfo.label}
              </span>
              <span className="font-serif text-xl text-stone-600 tabular-nums">{current.time}</span>
            </div>

            <h2 id={titleId} className="text-2xl font-serif font-bold text-jp-text mb-3 leading-tight mt-2 pr-12">
              {current.name}
            </h2>

            <div className="flex items-center gap-2 text-sm text-stone-600 mb-5 font-serif leading-relaxed">
              <MapPin size={14} className="text-jp-green shrink-0" />
              {current.address || '查看地圖位置'}
            </div>

            <div className="space-y-8">
              {current.note && (
                <div>
                  <h3 className="font-bold text-jp-text mb-2 flex items-center gap-2 text-base font-serif">
                    <BookOpen size={14} />
                    關於此處
                  </h3>
                  <p className="text-jp-text leading-relaxed font-serif text-base opacity-90 whitespace-pre-line">
                    {current.note}
                  </p>
                </div>
              )}

              {currentSpots.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-[1px] w-3 bg-stone-300" />
                    <h3 className="font-bold text-jp-text text-sm font-serif tracking-wide shrink-0">
                      街道亮點
                    </h3>
                    <span className="text-xs text-stone-400 font-serif shrink-0 tabular-nums">
                      {currentSpots.length} 個
                    </span>
                    <div className="h-[1px] flex-1 bg-stone-200" />
                  </div>
                  <div>
                    {currentSpots.map((spot) => (
                      <SpotItem key={`${spot.type}:${spot.name}`} spot={spot} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 底部浮動 Google Maps 導航 CTA */}
          <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center px-4 safe-area-bottom pointer-events-none">
            <button
              onClick={() => window.open(navUrl, '_blank')}
              className="frosted-tab-track press-springy pointer-events-auto shadow-2xl font-serif text-stone-600 flex items-center gap-2"
              style={{
                padding: '12px 32px',
                background: 'rgba(255, 255, 255, 0.45)',
                boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.7), 0 8px 24px rgba(0,0,0,0.15)',
              }}
              aria-label={`開啟 ${current.name} 的 Google Maps 導航`}
            >
              <Navigation size={16} />
              Google Maps 導航
            </button>
          </div>
          </>
        )}
        </div>
      </div>
    </>,
    document.body
  )
}

/**
 * @param {{
 *   rows: Array,
 *   dayDate?: string  // 此 panel 對應的完整日期 'YYYY/MM/DD'，等於今天時插入「現在」標記
 * }} props
 * rows 包含主行程 row（無 parent）以及子項目 row（有 parent = 父 row 的 name）
 */
export default function ItinerarySection({ rows, dayDate }) {
  const [selected, setSelected] = useState(null)
  const [now, setNow] = useState(formatNowHHMM)
  const nowMarkerRef = useRef(null)
  const isToday = dayDate && dayDate === formatToday()

  // 每分鐘 tick 一次，讓「現在」線會慢慢往下移
  useEffect(() => {
    if (!isToday) return
    const t = setInterval(() => setNow(formatNowHHMM()), 60_000)
    return () => clearInterval(t)
  }, [isToday])

  const mainRows = useMemo(() => rows.filter(r => !r.parent), [rows])

  // 「現在」標記插在第一個未開始 row 之前；全部都過了就放最後
  const nowIdx = useMemo(() => {
    if (!isToday) return -1
    const idx = mainRows.findIndex(r => r.time && r.time > now)
    return idx === -1 ? mainRows.length : idx
  }, [isToday, mainRows, now])

  // 切到今天的當天，自動 scroll 到「現在」標記
  useEffect(() => {
    if (!isToday || !nowMarkerRef.current) return
    const id = setTimeout(() => {
      nowMarkerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 200)
    return () => clearTimeout(id)
  }, [isToday, dayDate])

  const spotsByParent = useMemo(
    () =>
      rows
        .filter(r => r.parent)
        .reduce((acc, r) => {
          if (!acc[r.parent]) acc[r.parent] = []
          acc[r.parent].push(r)
          return acc
        }, {}),
    [rows]
  )

  if (mainRows.length === 0) {
    return <EmptyState icon={Camera} title="此天尚無行程" hint="到 Google Sheets 的 itinerary 加幾筆，這裡就會出現時間軸。" />
  }

  return (
    <>
      <div className="mt-2">
        {mainRows.map((row, i) => {
          const { label, icon: Icon, border } = getTypeInfo(row.type)
          const isLast = i === mainRows.length - 1
          const spots = sortSpots(spotsByParent[row.name] ?? [])
          const isPastRow = isToday && row.time && row.time < now

          return (
            <Fragment key={`${row.time}:${row.name}`}>
              {nowIdx === i && <NowMarker time={now} innerRef={nowMarkerRef} />}
            <div
              className={`flex gap-4 px-6 group ${isPastRow ? 'opacity-50' : ''}`}
            >
              <div className="w-12 shrink-0 flex flex-col items-center pt-1">
                <span className="text-sm font-serif font-medium text-jp-text leading-none tabular-nums tracking-tight">{row.time}</span>
                {!isLast && <div className="w-[1px] bg-stone-200 flex-1 my-2" />}
              </div>

              <div className="flex-1 min-w-0 pb-8">
                <button
                  type="button"
                  onClick={() => { setSelected({ row, spots }) }}
                  aria-label={`${row.time} ${row.name} 詳情`}
                  className="glass-card press-springy relative rounded-2xl p-4 h-full w-full flex flex-col text-left touch-manipulation overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-jp-green/60"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs tracking-wider uppercase px-2 py-0.5 rounded border font-serif font-bold ${border}`}>
                      {label}
                    </span>
                  </div>

                  <h4 className="text-lg font-serif font-bold text-jp-text mb-1 leading-snug">{row.name}</h4>
                  {row.description && (
                    <p className="text-sm text-stone-500 line-clamp-3 font-serif mb-2 leading-relaxed opacity-80">
                      {row.description}
                    </p>
                  )}

                  {row.hours && (
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 font-serif mb-3 bg-white/40 backdrop-blur-sm border border-white/50 w-fit px-2 py-1 rounded-full tabular-nums">
                      <Clock size={12} />
                      <span>{row.hours}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-stone-400 font-serif mt-auto pt-2 min-w-0">
                    <Icon size={16} />
                    <span className="truncate text-stone-500 opacity-70 flex-1 min-w-0">
                      {row.address || '查看地圖位置'}
                    </span>
                    {spots.length > 0 && (
                      <span className="text-xs text-amber-600 font-bold font-serif shrink-0 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {spots.length} 個亮點
                      </span>
                    )}
                    <ChevronRight size={12} className="ml-1 shrink-0 opacity-50" />
                  </div>
                </button>
              </div>
            </div>
            </Fragment>
          )
        })}
        {/* 全部時間都過了 → 把「現在」標記放在最後 */}
        {isToday && nowIdx === mainRows.length && <NowMarker time={now} innerRef={nowMarkerRef} />}
      </div>

      <DetailModal
        row={selected?.row ?? null}
        spots={selected?.spots ?? []}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
