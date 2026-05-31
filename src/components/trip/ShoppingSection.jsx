import { useState, useMemo, useRef, useEffect } from 'react'
import { ShoppingBag, Clock, Navigation } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'
import SegmentedControl from '../ui/SegmentedControl.jsx'
import { categoryChipStyle } from '../../lib/categories.js'

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

/** 樓層索引 tag（購物色玻璃 chip）：有樓層顯示樓層，無樓層顯示一顆色點，min-width 維持對齊。 */
function FloorTag({ floor }) {
  return (
    <span
      className="shrink-0 min-w-[2.25rem] flex items-center justify-center px-2 py-1 rounded-lg border backdrop-blur-sm font-serif font-bold text-sm tabular-nums leading-none"
      style={categoryChipStyle('shopping')}
    >
      {floor || <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
    </span>
  )
}

function StandaloneCard({ item }) {
  return (
    <div className="glass-card relative rounded-xl px-4 py-3 overflow-hidden">
      <div className="flex items-center gap-3">
        {/* 樓層索引 tag 當左錨點（取代原本重複的袋子 icon） */}
        <FloorTag floor={item.floor} />

        <div className="flex-1 min-w-0">
          <p className="font-bold text-jp-text font-serif text-base leading-snug">{item.name}</p>
          {item.hours && (
            <div className="flex items-center gap-1 text-xs text-stone-600 font-serif mt-1 tabular-nums">
              <Clock size={11} /> {item.hours}
            </div>
          )}
        </div>

        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 frosted-glass-button rounded-full text-stone-600 transition-colors touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
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
    <div className="glass-card relative rounded-xl px-4 py-3 overflow-hidden">
      {/* Building header（無 icon，識別色交給下方樓層 tag） */}
      <div className="flex justify-between items-center gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-jp-text font-serif text-base leading-snug">{building.name}</h3>
          {building.hours && (
            <span className="text-xs text-stone-600 font-serif mt-1 flex tabular-nums items-center gap-1">
              <Clock size={12} /> {building.hours}
            </span>
          )}
        </div>
        {building.link && (
          <a
            href={building.link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 frosted-glass-button rounded-full text-stone-600 transition-colors touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
            onClick={e => e.stopPropagation()}
            aria-label={`查看 ${building.name} 的位置`}
          >
            <Navigation size={15} />
          </a>
        )}
      </div>

      {/* 子店：樓層 tag 起頭的清單 */}
      {building.shops.length > 0 && (
        <div className="mt-3 pt-3 border-t border-stone-200/70 space-y-2.5">
          {building.shops.map((shop, i) => (
            <div key={i} className="flex items-center gap-3">
              <FloorTag floor={shop.floor} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-stone-700 font-serif leading-snug">{shop.name}</p>
                {shop.hours && (
                  <div className="flex items-center gap-1 text-xs text-stone-600 font-serif mt-0.5 tabular-nums">
                    <Clock size={12} /> {shop.hours}
                  </div>
                )}
              </div>
              {shop.link && (
                <a
                  href={shop.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 frosted-glass-button rounded-full text-stone-600 touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
                  onClick={e => e.stopPropagation()}
                  aria-label={`查看 ${shop.name} 的位置`}
                >
                  <Navigation size={15} />
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
  const areaTabs = useMemo(() => areas.map(a => ({ key: a, label: a })), [areas])
  const [activeArea, setActiveArea] = useState(() => areas[0] ?? '')
  const scrollRef = useRef(null)

  // 資料非同步載入後，若尚未選中任何 tab 則自動選中第一個
  useEffect(() => {
    if (!activeArea && areas.length > 0) {
      setActiveArea(areas[0])
    }
  }, [areas, activeArea])

  // filtered 要 memo，否則每次 render 都是新 array ref，下面的 grouped useMemo 永遠 miss
  const filtered = useMemo(
    () => activeArea ? rows.filter(r => r.area === activeArea) : rows,
    [activeArea, rows]
  )
  const grouped = useMemo(() => groupItems(filtered), [filtered])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0 })
  }, [activeArea])


  if (rows.length === 0) {
    return <EmptyState icon={ShoppingBag} title="尚無逛街清單" hint="填好 shopping tab（建築 + 樓層 + 店家），這裡會自動分群。" />
  }

  return (
    <div className="flex flex-col relative h-full">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide px-8 pb-24 space-y-3 pt-2"
      >
        <h2 className="text-2xl font-serif font-bold text-jp-text pt-8 pb-2 pr-12">逛街清單</h2>
        {grouped.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="這個區域還沒有店" hint="切到其他區看看，或回去 shopping tab 加幾筆。" />
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
          <SegmentedControl
            tabs={areaTabs}
            value={activeArea}
            onChange={setActiveArea}
            itemClassName="px-5"
            ariaLabel="逛街分區"
          />
        </div>
      )}
    </div>
  )
}
