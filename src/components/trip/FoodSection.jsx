import { useState, useMemo, useRef, useEffect } from 'react'
import { Navigation, Clock, Utensils } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'
import SegmentedControl from '../ui/SegmentedControl.jsx'
import { categoryInk } from '../../lib/categories.js'

/**
 * @param {{ rows: Array<{ name: string, area?: string, category?: string, hours?: string, note?: string, link?: string, time?: string, address?: string }> }} props
 */
export default function FoodSection({ rows }) {
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

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0 })
  }, [activeArea])

  if (rows.length === 0) {
    return <EmptyState icon={Utensils} title="尚無美食清單" hint="填好 food tab，或在 itinerary 標 type=food 也會自動帶過來。" />
  }

  const hasAreas = areas.length > 0
  const filtered = hasAreas && activeArea ? rows.filter(r => r.area === activeArea) : rows

  const hasCategories = filtered.some(r => r.category)
  const byCategory = hasCategories
    ? filtered.reduce((acc, row) => {
        const cat = row.category || '其他'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(row)
        return acc
      }, {})
    : { '': filtered }

  return (
    <div className="flex flex-col relative h-full">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide px-8 pb-24 space-y-6 pt-2"
      >
        <h2 className="text-2xl font-serif font-bold text-jp-text pt-8 pb-2 pr-12">美食清單</h2>
        <div className="space-y-8">
          {Object.entries(byCategory).map(([category, items]) => (
            <div key={category}>
              {category && (
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="font-serif font-bold text-jp-text text-base">{category}</span>
                  <span className="text-2xs text-muted font-serif">{items.length} 項</span>
                  <span className="flex-1 h-px bg-hairline" />
                </div>
              )}
              <div className="space-y-4">
                {items.map((row, i) => (
                  <div
                    key={`${activeArea}-${category}-${i}`}
                    className="glass-card relative rounded-xl p-5 group overflow-hidden flex gap-4"
                  >
                    {/* 左側縮圖（資料驅動：row.image 有值才顯示） */}
                    {row.image && (
                      <img
                        src={row.image}
                        alt=""
                        width={64}
                        height={64}
                        loading="lazy"
                        decoding="async"
                        className="w-16 h-16 rounded-xl object-cover shrink-0 bg-stone-200"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-jp-text font-serif text-lg leading-tight flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: categoryInk('food') }} aria-hidden="true" />
                            {row.name}
                          </h3>
                          {(row.hours || row.time) && (
                            <span className="text-sm text-secondary font-serif mt-1 flex items-center gap-1.5 tabular-nums">
                              <Clock size={13} className="shrink-0" aria-hidden="true" /> {row.hours || row.time}
                            </span>
                          )}
                        </div>
                        {row.link && (
                          <a
                            href={row.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 frosted-glass-button rounded-full text-secondary transition-colors touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0 ml-2"
                            onClick={e => e.stopPropagation()}
                            aria-label={`查看 ${row.name} 的位置`}
                          >
                            <Navigation size={15} />
                          </a>
                        )}
                      </div>
                      {(row.note || row.description || row.address) && (
                        <p className="text-sm text-secondary leading-relaxed font-serif">
                          {row.note || row.description || row.address}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {areas.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center px-4 safe-area-bottom pointer-events-none">
          <SegmentedControl
            tabs={areaTabs}
            value={activeArea}
            onChange={setActiveArea}
            itemClassName="px-8"
            ariaLabel="美食分區"
          />
        </div>
      )}
    </div>
  )
}
