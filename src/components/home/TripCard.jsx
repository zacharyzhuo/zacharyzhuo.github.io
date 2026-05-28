import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar } from 'lucide-react'
import { prefetchSheet } from '../../hooks/useSheetData.js'

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

/**
 * @param {{ trip: { slug: string, name: string, dates: string, cover_image_url: string, sheet_id: string } }} props
 */
export default function TripCard({ trip }) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/trip/${trip.slug}`)}
      onMouseEnter={() => prefetchTrip(trip.sheet_id)}
      onTouchStart={() => prefetchTrip(trip.sheet_id)}
      className="w-full relative rounded-2xl overflow-hidden h-56 touch-manipulation group bg-stone-200"
      aria-label={`查看 ${trip.name} 行程`}
    >
      {/* Cover image */}
      {trip.cover_image_url ? (
        <img
          src={trip.cover_image_url}
          alt={trip.name}
          width={800}
          height={450}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-stone-200" />
      )}

      {/* Glass info overlay — bottom */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="rounded-xl p-4 text-left" style={{ background: 'rgba(249,248,244,0.55)', backdropFilter: 'blur(12px) saturate(160%)', WebkitBackdropFilter: 'blur(12px) saturate(160%)', border: '1px solid rgba(255,255,255,0.35)' }}>
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={14} className="text-jp-green flex-shrink-0" />
            <h3 className="font-serif font-bold text-stone-900 text-lg leading-tight">{trip.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-stone-700 flex-shrink-0" />
            <span className="text-xs text-stone-700 font-serif">{trip.dates}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
