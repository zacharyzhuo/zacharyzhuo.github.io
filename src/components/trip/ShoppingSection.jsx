import { useState, useMemo, useRef, useEffect } from 'react'
import { ShoppingBag, Clock, Navigation } from 'lucide-react'

/**
 * Flat CSV rows → grouped display units.
 *
 * Row rules (from Google Sheets):
 *  - building === ''  : standalone shop → own card
 *  - building !== ''  : belongs to that building → grouped under one card
 *
 * The first row that introduces a new building name becomes the building header
 * (its name/hours/link represent the building itself; floor is ignored).
 * Subsequent rows with the same building name are sub-shops.
 */
function groupItems(rows) {
  const groups = []
  const buildingMap = {}

  rows.forEach(row => {
    if (!row.building) {
      // Standalone shop
      groups.push({ type: 'standalone', ...row })
    } else {
      if (!buildingMap[row.building]) {
        // First time we see this building — create the group
        const g = {
          type: 'building',
          name: row.building,
          hours: row.hours,
          link: row.link,
          shops: [],
        }
        buildingMap[row.building] = g
        groups.push(g)
      }
      // Add this row as a shop inside the building
      buildingMap[row.building].shops.push(row)
    }
  })

  return groups
}

function StandaloneCard({ item }) {
  return (
    <div className="glass-card relative rounded-xl px-4 py-3 overflow-hidden">
      <div className="flex items-center gap-3">
        {/* 左側 icon */}
        <div className="p-1.5 bg-pink-50 text-pink-500 rounded-full shrink-0">
          <ShoppingBag size={14} />
        </div>

        {/* 中間：名稱 + 樓層/時間 */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-jp-text font-serif text-sm leading-snug">{item.name}</p>
          {(item.floor || item.hours) && (
            <div className="flex items-center gap-2 text-xs text-stone-500 font-serif mt-1">
              {item.floor && (
                <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600 font-medium text-[11px]">{item.floor}</span>
              )}
              {item.hours && (
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {item.hours}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 右側導航按鈕 */}
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="p-2.5 liquid-glass-button rounded-full text-stone-500 transition-colors touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
            onClick={e => e.stopPropagation()}
            aria-label={`查看 ${item.name} 的位置`}
          >
            <Navigation size={15} />
          </a>
        )}
      </div>
    </div>
  )
}

function BuildingCard({ building }) {
  return (
    <div className="glass-card relative rounded-xl p-5 overflow-hidden">
      {/* Building header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pink-50 text-pink-500 rounded-full shrink-0">
            <ShoppingBag size={16} />
          </div>
          <div>
            <h3 className="font-bold text-jp-text font-serif text-lg leading-none">{building.name}</h3>
            {building.hours && (
              <span className="text-xs text-stone-500 font-serif mt-1 flex items-center gap-1">
                <Clock size={12} /> {building.hours}
              </span>
            )}
          </div>
        </div>
        {building.link && (
          <a
            href={building.link}
            target="_blank"
            rel="noreferrer"
            className="p-3 liquid-glass-button rounded-full text-stone-500 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center ml-2 shrink-0"
            onClick={e => e.stopPropagation()}
            aria-label={`查看 ${building.name} 的位置`}
          >
            <Navigation size={16} />
          </a>
        )}
      </div>

      {/* Sub-shops with left border accent */}
      {building.shops.length > 0 && (
        <div className="mt-4 space-y-3 pl-2 border-l-2 border-stone-100">
          {building.shops.map((shop, i) => (
            <div key={i} className="flex justify-between items-center group">
              <div>
                <p className="font-bold text-sm text-stone-700 font-serif">{shop.name}</p>
                <div className="flex items-center gap-2 text-xs text-stone-500 font-serif mt-0.5">
                  {shop.floor && (
                    <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-600 font-medium">{shop.floor}</span>
                  )}
                  {shop.hours && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {shop.hours}
                    </span>
                  )}
                </div>
              </div>
              {shop.link && (
                <a
                  href={shop.link}
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-40 group-hover:opacity-100 group-hover:text-jp-green transition-all p-2 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center ml-2 shrink-0"
                  onClick={e => e.stopPropagation()}
                  aria-label={`查看 ${shop.name} 的位置`}
                >
                  <Navigation size={14} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * @param {{ rows: Array<{ area: string, building: string, name: string, floor: string, hours: string, link: string }> }} props
 */
export default function ShoppingSection({ rows }) {
  const areas = useMemo(
    () => [...new Set(rows.map(r => r.area).filter(Boolean))],
    [rows]
  )
  const [activeArea, setActiveArea] = useState(() => areas[0] ?? '')
  const scrollRef = useRef(null)

  const filtered = activeArea ? rows.filter(r => r.area === activeArea) : rows
  const grouped = useMemo(() => groupItems(filtered), [filtered])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0 })
  }, [activeArea])

  if (rows.length === 0) {
    return <p className="text-center text-stone-500 font-serif text-sm py-6">尚無購物清單</p>
  }

  return (
    <div className="flex flex-col relative h-full">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-8 pb-24 space-y-3 pt-2"
      >
        <h2 className="text-2xl font-serif font-bold text-jp-text pt-8 pb-2 pr-12">逛街清單</h2>
        {grouped.length === 0 ? (
          <p className="text-stone-500 font-serif text-sm py-6 text-center">尚無清單</p>
        ) : (
          grouped.map((g, i) =>
            g.type === 'building'
              ? <BuildingCard key={`b-${i}`} building={g} />
              : <StandaloneCard key={`s-${i}`} item={g} />
          )
        )}
      </div>

      {areas.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center px-4 safe-area-bottom pointer-events-none">
          <div className="liquid-tab-track scrollbar-hide pointer-events-auto shadow-2xl">
            {areas.map(area => (
              <button
                key={area}
                onClick={e => {
                  e.stopPropagation()
                  setActiveArea(area)
                }}
                className={`liquid-tab-btn font-serif px-5 ${activeArea === area ? 'active' : ''}`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
