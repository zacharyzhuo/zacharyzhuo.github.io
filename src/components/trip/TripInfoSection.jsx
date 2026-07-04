import { useState, useRef, useEffect } from 'react'
import { Plane, Luggage, ExternalLink, Hotel, ClipboardList, Navigation, MapPin } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'
import SegmentedControl from '../ui/SegmentedControl.jsx'
import { useCancelableTap } from '../../hooks/useCancelableTap.js'
import { openExternal } from '../../lib/openExternal.js'
import { categoryInk } from '../../lib/categories.js'

// 登機證撕票口：在色帶下緣（y=44px，對應色帶高度 h-11）兩側挖「真的」半圓鏤空，
// 透出底層 BottomSheet 背景（用 mask，非貼色塊）。外層需另包 wrapper 保住投影（mask 會連陰影一起裁掉）。
const FLIGHT_NOTCH = 'radial-gradient(circle 9px at left 44px, transparent 8.5px, #000 9px), radial-gradient(circle 9px at right 44px, transparent 8.5px, #000 9px)'
const FLIGHT_NOTCH_STYLE = {
  WebkitMaskImage: FLIGHT_NOTCH,
  maskImage: FLIGHT_NOTCH,
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskComposite: 'source-in',
  maskComposite: 'intersect',
}

const INFO_TABS = [
  { key: 'flights', label: '航班資訊' },
  { key: 'prepare', label: '行前準備' },
  { key: 'hotel', label: '住宿資訊' },
]

function parseRoute(route) {
  if (!route) return { from: '', to: '' }
  const dashIdx = route.indexOf(' -> ')
  if (dashIdx !== -1) return { from: route.slice(0, dashIdx).trim(), to: route.slice(dashIdx + 4).trim() }
  const arrowIdx = route.indexOf('→')
  if (arrowIdx !== -1) return { from: route.slice(0, arrowIdx).trim(), to: route.slice(arrowIdx + 1).trim() }
  return { from: route, to: '' }
}

function parseTime(time) {
  if (!time) return { dep: '', arr: '' }
  const dashIdx = time.indexOf(' - ')
  if (dashIdx !== -1) return { dep: time.slice(0, dashIdx).trim(), arr: time.slice(dashIdx + 3).trim() }
  const arrowIdx = time.indexOf('→')
  if (arrowIdx !== -1) return { dep: time.slice(0, arrowIdx).trim(), arr: time.slice(arrowIdx + 1).trim() }
  return { dep: time, arr: '' }
}

function FlightsTab({ flights }) {
  if (flights.length === 0) {
    return <EmptyState icon={Plane} title="尚無航班資訊" hint="把出發/回程班機填到 flights tab，這裡會自動排好。" />
  }

  return (
    <div>
      <h3 className="text-base font-bold text-secondary uppercase tracking-widest mb-4 flex items-center gap-2 font-serif">
        <Plane size={18} aria-hidden="true" /> 航班資訊
      </h3>
      <div className="space-y-4">
        {flights.map((f, i) => {
          const { from, to } = parseRoute(f.route)
          const { dep, arr } = parseTime(f.time)

          return (
            // wrapper 只負責投影（mask 會裁掉陰影，故投影掛在沒被 mask 的外層）
            <div key={i} className="rounded-2xl" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
            <div className="glass-card relative rounded-2xl overflow-hidden" style={FLIGHT_NOTCH_STYLE}>
              {/* 登機證色帶：transport 半透明淡色 + 深色字（清透版，不再大面積實心）。h-11=44px 對應撕票口 y */}
              <div
                className="flex justify-between items-center px-5 h-11"
                style={{ backgroundColor: `${categoryInk('transport')}33`, color: categoryInk('transport') }}
              >
                <span className="font-serif font-bold tracking-wide flex items-center gap-2">
                  <Plane size={15} className="rotate-90" aria-hidden="true" />
                  {f.flight_no}
                </span>
                <span className="font-serif font-bold text-sm tabular-nums opacity-75">{f.date}</span>
              </div>

              {/* 撕票虛線（兩端的鏤空由卡片 mask 挖出）；stone-400 較明顯的虛線 */}
              <div className="border-t border-dashed border-stone-400" />

              <div className="p-5">
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <div className="text-2xl font-serif font-bold text-jp-text">{dep}</div>
                    <div className="text-sm text-secondary font-serif">{from}</div>
                  </div>
                  {/* 航線：端點/線/飛機用 transport 色（currentColor） */}
                  <div className="flex items-center" style={{ color: categoryInk('transport') }} aria-hidden="true">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-current" />
                    <div className="w-12 h-[1px] bg-current opacity-50" />
                    <Plane size={18} className="rotate-90" />
                    <div className="w-12 h-[1px] bg-current opacity-50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-current" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-serif font-bold text-jp-text">{arr}</div>
                    <div className="text-sm text-secondary font-serif">{to}</div>
                  </div>
                </div>
                {(f.carry_on || f.checked_bag) && (
                  <div className="mt-4 pt-4 border-t border-jp-green/20">
                    <div className="flex items-start gap-2">
                      <Luggage size={16} className="text-muted mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <div className="text-sm text-secondary leading-relaxed whitespace-pre-line font-serif">
                        {[
                          f.carry_on && `手提行李：${f.carry_on}`,
                          f.checked_bag && `托運行李：${f.checked_bag}`,
                        ].filter(Boolean).join('\n')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * 行前準備：資料驅動，讀 trip sheet 的 prepare tab（欄位 label / description / url）。
 * 每筆 render 成一張連結卡片；無資料則顯示空狀態。
 *
 * @param {{ items: Array<{ label: string, description?: string, url?: string }> }} props
 */
function PrepareTab({ items }) {
  const tap = useCancelableTap()

  if (!items || items.length === 0) {
    return <EmptyState icon={ClipboardList} title="尚無行前準備項目" hint="在這趟行程的 prepare tab 填入簽證、入境表單、eSIM 等連結，這裡就會列出來。" />
  }

  return (
    <div>
      <h3 className="text-base font-bold text-secondary uppercase tracking-widest mb-4 flex items-center gap-2 font-serif">
        <ClipboardList size={18} aria-hidden="true" /> 行前準備
      </h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <button
            key={`${item.label}-${i}`}
            onPointerDown={tap.onPointerDown}
            onPointerUp={tap.onPointerUp}
            onClick={tap.guard(() => openExternal(item.url))}
            className="glass-card press-springy w-full p-5 rounded-2xl text-left relative overflow-hidden touch-manipulation min-h-[48px] flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-jp-green/60"
            aria-label={`開啟 ${item.label}`}
          >
            <div className="min-w-0">
              <h4 className="text-lg font-serif font-bold text-jp-text mb-0.5 leading-snug">{item.label}</h4>
              {item.description && <p className="text-sm text-muted font-serif leading-relaxed">{item.description}</p>}
            </div>
            {item.url && <ExternalLink size={20} className="text-jp-green shrink-0" aria-hidden="true" />}
          </button>
        ))}
      </div>
    </div>
  )
}

function HotelTab({ accommodation }) {
  const tap = useCancelableTap()
  if (accommodation.length === 0) {
    return <EmptyState icon={Hotel} title="尚無住宿資訊" hint="把飯店或 Airbnb 填到 accommodation tab，這裡會列出來。" />
  }

  return (
    <div>
      <h3 className="text-base font-bold text-secondary uppercase tracking-widest mb-4 flex items-center gap-2 font-serif">
        <Hotel size={18} aria-hidden="true" /> 住宿資訊
      </h3>
      <div className="space-y-6">
        {accommodation.map((h, i) => (
          <div key={i}>
            {h.region && (
              <h4 className="text-sm font-bold text-secondary mb-3 pl-1 font-serif">{h.region}</h4>
            )}
            <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
              {/* 編輯排版：eyebrow（子型別 + STAY · 入住日）→ 大標 → 地址 → 髮絲線入住資訊 */}
              <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                <span className="text-sm font-serif font-bold" style={{ color: categoryInk('hotel') }}>
                  {h.type === 'hotel' ? '飯店' : h.type === 'airbnb' ? 'Airbnb' : '住宿'}
                </span>
                <span
                  className="text-2xs font-serif font-bold uppercase tracking-[0.25em]"
                  style={{ color: categoryInk('hotel'), opacity: 0.6 }}
                >
                  STAY{h.date ? ` · ${h.date}` : ''}
                </span>
              </div>

              <h5 className="font-serif font-bold text-jp-text text-2xl leading-tight mb-2">{h.name}</h5>

              {h.address && (
                <div className="flex items-center gap-1.5 text-sm text-muted font-serif">
                  <MapPin size={13} className="shrink-0" style={{ color: categoryInk('hotel') }} aria-hidden="true" />
                  <span className="min-w-0">{h.address}</span>
                </div>
              )}

              {(h.check_in || h.check_out) && (
                <>
                  <div className="flex items-center gap-2 mt-5 mb-3">
                    <span className="text-2xs font-serif font-bold uppercase tracking-[0.2em] text-muted shrink-0">入住資訊</span>
                    <div className="h-[1px] flex-1 bg-hairline" />
                  </div>
                  {/* 兩欄等寬 + 置中分隔線：呈現置中、平衡感（同預覽的 in/out 面板） */}
                  <div className="flex items-stretch rounded-xl border border-white/30 bg-white/30 px-5 py-3 text-sm font-serif text-secondary">
                    {h.check_in && (
                      <div className="flex-1 text-center">
                        <span className="block text-2xs text-muted uppercase font-serif tracking-widest mb-1">Check-in</span>
                        <span className="text-base text-jp-text font-bold font-serif tabular-nums">{h.check_in}</span>
                      </div>
                    )}
                    {h.check_in && h.check_out && <div className="w-[1px] bg-hairline mx-4" />}
                    {h.check_out && (
                      <div className="flex-1 text-center">
                        <span className="block text-2xs text-muted uppercase font-serif tracking-widest mb-1">Check-out</span>
                        <span className="text-base text-jp-text font-bold font-serif tabular-nums">{h.check_out}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {h.note && (
                <p className="text-sm text-secondary mt-4 font-serif leading-relaxed whitespace-pre-line">{h.note}</p>
              )}

              {h.link && (
                <div className="flex justify-center mt-5">
                  <button
                    onPointerDown={tap.onPointerDown}
                    onPointerUp={tap.onPointerUp}
                    onClick={tap.guard(() => openExternal(h.link))}
                    className="frosted-tab-track press-springy shadow-2xl font-serif text-secondary flex items-center gap-2 touch-manipulation"
                    style={{
                      padding: '12px 32px',
                      background: 'rgba(255, 255, 255, 0.45)',
                      boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.7), 0 8px 24px rgba(0,0,0,0.15)',
                    }}
                    aria-label="查看住宿位置"
                  >
                    <Navigation size={16} aria-hidden="true" />
                    Google Maps 導航
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TripInfoSection({ flights, accommodation, prepare }) {
  const [activeTab, setActiveTab] = useState('flights')
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0 })
  }, [activeTab])

  return (
    <div className="flex flex-col relative h-full">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide px-8 pb-24 pt-2 space-y-8"
      >
        <h2 className="text-2xl font-serif font-bold text-jp-text pt-8 pb-2 pr-12">旅程資訊</h2>
        {activeTab === 'flights' && <FlightsTab flights={flights} />}
        {activeTab === 'prepare' && <PrepareTab items={prepare} />}
        {activeTab === 'hotel' && <HotelTab accommodation={accommodation} />}
      </div>

      <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center px-4 safe-area-bottom pointer-events-none">
        <SegmentedControl
          tabs={INFO_TABS}
          value={activeTab}
          onChange={setActiveTab}
          itemClassName="px-5"
          ariaLabel="旅程資訊分頁"
        />
      </div>
    </div>
  )
}
