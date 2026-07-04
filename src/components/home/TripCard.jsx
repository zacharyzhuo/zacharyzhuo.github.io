import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { prefetchSheet } from '../../hooks/useSheetData.js'
import { useCancelableTap } from '../../hooks/useCancelableTap.js'
import { getTripStatus, tripDays } from '../../lib/tripDate.js'

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

// 壓在圖上的文字：靠多層陰影撐可讀性（同 DayBanner 手法），不靠玻璃浮層
const TITLE_SHADOW = '0 1px 2px rgba(0,0,0,0.7), 0 2px 12px rgba(0,0,0,0.55)'
const DATE_SHADOW = '0 1px 3px rgba(0,0,0,0.8), 0 1px 8px rgba(0,0,0,0.5)'

function StatusPill({ status, daysToStart, dates }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-jp-red/95 text-white text-2xs font-serif font-bold uppercase tracking-widest shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        進行中
      </span>
    )
  }
  if (status === 'upcoming') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-100/90 text-amber-800 text-2xs font-serif font-bold uppercase tracking-widest border border-amber-200/60">
        {daysToStart === 1 ? '明天出發' : `${daysToStart} 天後出發`}
      </span>
    )
  }
  // 過往行程：顯示行程天數取代原本的「回顧」字樣；日期格式異常算不出來就不顯示 pill
  const days = tripDays(dates)
  if (days == null) return null
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-stone-200/90 text-stone-700 text-2xs font-serif font-medium uppercase tracking-widest">
      {days} 天
    </span>
  )
}

/**
 * 首頁行程卡。
 *   - feature：雜誌封面大卡（文字壓圖 + gradient scrim），給「進行中 / 即將出發」
 *   - index：水平索引條（小縮圖 + 文字），給「過往」按年份收納
 *
 * @param {{
 *   trip: { slug: string, name: string, dates: string, cover_image_url: string, sheet_id: string },
 *   variant?: 'feature' | 'index',
 * }} props
 */
export default function TripCard({ trip, variant = 'feature' }) {
  const tap = useCancelableTap()
  const { status, daysToStart } = getTripStatus(trip.dates)

  const handlers = {
    to: `/trip/${trip.slug}`,
    onPointerDown: tap.onPointerDown,
    onPointerUp: tap.onPointerUp,
    onClick: tap.guardLink(),
    onMouseEnter: () => prefetchTrip(trip.sheet_id),
    onTouchStart: () => prefetchTrip(trip.sheet_id),
    'aria-label': `查看 ${trip.name} 行程`,
  }

  // ── 索引條（過往）──
  if (variant === 'index') {
    return (
      <Link
        {...handlers}
        className="w-full relative flex items-stretch rounded-2xl overflow-hidden bg-washi shadow-[0_4px_12px_rgba(0,0,0,0.07)] press-springy touch-manipulation opacity-90"
      >
        <span className="w-[104px] flex-shrink-0 overflow-hidden bg-stone-200">
          {trip.cover_image_url ? (
            <img
              src={trip.cover_image_url}
              alt=""
              width={104}
              height={76}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
              style={{ filter: 'saturate(0.9)' }}
            />
          ) : (
            <span className="block w-full h-full bg-stone-200" />
          )}
        </span>
        <span className="flex-1 min-w-0 px-4 py-3.5 flex flex-col justify-center text-left">
          <span className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-serif font-bold text-jp-text text-base truncate">{trip.name}</span>
            <StatusPill status={status} daysToStart={daysToStart} dates={trip.dates} />
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted font-serif tabular-nums">
            <Calendar size={12} className="flex-shrink-0" />
            {trip.dates}
          </span>
          {trip.subtitle && (
            <span className="text-2xs text-muted font-serif truncate mt-1">{trip.subtitle}</span>
          )}
        </span>
      </Link>
    )
  }

  // ── 雜誌封面大卡（進行中 / 即將出發）──
  return (
    <Link
      {...handlers}
      className={`w-full relative block rounded-2xl overflow-hidden bg-stone-200 press-springy touch-manipulation group aspect-[3/2] ${status === 'active' ? 'trip-halo' : ''}`}
    >
      {trip.cover_image_url ? (
        <img
          src={trip.cover_image_url}
          alt={trip.name}
          width={800}
          height={534}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={status === 'past' ? { filter: 'saturate(0.85)' } : undefined}
        />
      ) : (
        <div className="absolute inset-0 bg-stone-200" />
      )}

      {/* gradient scrim：底部窄而濃，鎖住文字、保留中上段清透 */}
      <div className="absolute inset-0 trip-scrim pointer-events-none" />

      {/* Status pill 浮右上 */}
      <div className="absolute top-3 right-3 z-10">
        <StatusPill status={status} daysToStart={daysToStart} dates={trip.dates} />
      </div>

      {/* 文字壓底，無 block 浮層 */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-4 text-left">
        <h3 className="font-serif font-bold text-white text-xl leading-tight" style={{ textShadow: TITLE_SHADOW }}>
          {trip.name}
        </h3>
        <div className="flex items-center gap-1.5 mt-1 text-white/95 text-sm font-serif tabular-nums" style={{ textShadow: DATE_SHADOW }}>
          <Calendar size={13} className="flex-shrink-0" />
          {trip.dates}
        </div>
      </div>
    </Link>
  )
}
