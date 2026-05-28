import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar } from 'lucide-react'
import { prefetchSheet } from '../../hooks/useSheetData.js'
import { getTripStatus } from '../../lib/tripDate.js'

// Tier 1：主畫面馬上要的（itinerary 排程 + days 標題/banner）→ 立即併發
const CRITICAL_TABS = ['itinerary', 'days']
// Tier 2：旅程資訊 modal 預設展示（航班、住宿）→ idle 時抓
const SECONDARY_TABS = ['flights', 'accommodation']
// Tier 3：要點 sidebar 才看的（購物 / 美食 / 行李）→ 再 idle 一輪
const TERTIARY_TABS = ['shopping', 'food', 'checklist']

const scheduleIdle = (typeof window !== 'undefined' && window.requestIdleCallback)
  ? (cb) => window.requestIdleCallback(cb, { timeout: 1500 })
  : (cb) => setTimeout(cb, 200)

function prefetchTrip(sheetId) {
  if (!sheetId) return
  CRITICAL_TABS.forEach(tab => prefetchSheet(sheetId, tab))
  scheduleIdle(() => SECONDARY_TABS.forEach(tab => prefetchSheet(sheetId, tab)))
  scheduleIdle(() => TERTIARY_TABS.forEach(tab => prefetchSheet(sheetId, tab)))
}

function StatusPill({ status, daysToStart, daysFromEnd }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-jp-red/95 text-white text-[10px] font-serif font-bold uppercase tracking-widest shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        進行中
      </span>
    )
  }
  if (status === 'upcoming') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-100/90 text-amber-800 text-[10px] font-serif font-bold uppercase tracking-widest border border-amber-200/60">
        {daysToStart === 1 ? '明天出發' : `${daysToStart} 天後出發`}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-stone-200/80 text-stone-600 text-[10px] font-serif font-medium uppercase tracking-widest">
      回顧
    </span>
  )
}

/**
 * @param {{
 *   trip: { slug: string, name: string, dates: string, cover_image_url: string, sheet_id: string },
 *   variant?: 'hero' | 'normal' | 'compact',
 * }} props
 */
export default function TripCard({ trip, variant = 'normal' }) {
  const navigate = useNavigate()
  const { status, daysToStart, daysFromEnd } = getTripStatus(trip.dates)

  // active 一律 hero；upcoming（30 天內）也用 hero；其他維持原狀
  const effectiveVariant = variant === 'compact'
    ? 'compact'
    : status === 'active' || (status === 'upcoming' && daysToStart <= 30)
      ? 'hero'
      : status === 'past'
        ? 'compact'
        : 'normal'

  const heightClass = effectiveVariant === 'hero' ? 'h-72' : effectiveVariant === 'compact' ? 'h-44' : 'h-56'
  const cardOpacity = effectiveVariant === 'compact' ? 'opacity-85' : ''

  return (
    <button
      onClick={() => navigate(`/trip/${trip.slug}`)}
      onMouseEnter={() => prefetchTrip(trip.sheet_id)}
      onTouchStart={() => prefetchTrip(trip.sheet_id)}
      className={`w-full relative rounded-2xl overflow-hidden touch-manipulation group bg-stone-200 ${heightClass} ${cardOpacity}`}
      aria-label={`查看 ${trip.name} 行程`}
    >
      {/* Cover image */}
      {trip.cover_image_url ? (
        <img
          src={trip.cover_image_url}
          alt={trip.name}
          width={800}
          height={effectiveVariant === 'hero' ? 600 : 450}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-stone-200" />
      )}

      {/* Active trip：加一層紅色微光暈，視覺上「跳出來」 */}
      {status === 'active' && (
        <div className="absolute inset-0 ring-2 ring-jp-red/30 rounded-2xl pointer-events-none" />
      )}

      {/* Status pill 浮在右上角 */}
      <div className="absolute top-3 right-3 z-10">
        <StatusPill status={status} daysToStart={daysToStart} daysFromEnd={daysFromEnd} />
      </div>

      {/* Glass info overlay — bottom */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div
          className="rounded-xl p-4 text-left"
          style={{
            background: 'rgba(249,248,244,0.55)',
            backdropFilter: 'blur(12px) saturate(160%)',
            WebkitBackdropFilter: 'blur(12px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.35)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={14} className="text-jp-green flex-shrink-0" />
            <h3 className={`font-serif font-bold text-stone-900 leading-tight ${effectiveVariant === 'hero' ? 'text-xl' : 'text-lg'}`}>
              {trip.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-stone-700 flex-shrink-0" />
            <span className="text-xs text-stone-700 font-serif tabular-nums">{trip.dates}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
