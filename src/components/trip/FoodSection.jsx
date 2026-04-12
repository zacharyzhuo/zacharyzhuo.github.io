import { useState, useMemo, useRef, useEffect } from 'react'
import { Navigation, Clock } from 'lucide-react'

/**
 * @param {{ rows: Array<{ name: string, area?: string, category?: string, hours?: string, note?: string, link?: string, time?: string, address?: string }> }} props
 */
export default function FoodSection({ rows }) {
  const areas = useMemo(
    () => [...new Set(rows.map(r => r.area).filter(Boolean))],
    [rows]
  )
  const [activeArea, setActiveArea] = useState(() => areas[0] ?? '')
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0 })
  }, [activeArea])

  if (rows.length === 0) {
    return (
      <p className="text-center text-stone-500 font-serif text-sm py-6 px-4">尚無美食清單</p>
    )
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
        className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-8 pb-32 space-y-6 pt-2"
      >
        <h2 className="text-2xl font-serif font-bold text-jp-text pt-8 pb-2 pr-12">美食清單</h2>
        <div className="space-y-8">
          {Object.entries(byCategory).map(([category, items]) => (
            <div key={category}>
              {category && (
                <h3 className="text-xs font-bold text-stone-600 uppercase tracking-widest mb-4 pb-2">
                  {category}
                </h3>
              )}
              <div className="space-y-4">
                {items.map((row, i) => (
                  <div
                    key={`${activeArea}-${category}-${i}`}
                    className="bg-white rounded-xl p-5 border border-stone-100 group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-jp-text font-serif text-lg leading-tight">{row.name}</h4>
                        {(row.hours || row.time) && (
                          <span className="text-xs text-stone-500 font-serif mt-1 flex items-center gap-1">
                            <Clock size={12} /> {row.hours || row.time}
                          </span>
                        )}
                      </div>
                      {row.link && (
                        <a
                          href={row.link}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 bg-stone-50 rounded-full text-stone-400 hover:text-jp-green hover:bg-green-50 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                          onClick={e => e.stopPropagation()}
                        >
                          <Navigation size={16} />
                        </a>
                      )}
                    </div>
                    {(row.note || row.desc || row.address) && (
                      <p className="text-sm text-stone-500 leading-relaxed font-serif">
                        {row.note || row.desc || row.address}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {areas.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center px-4 safe-area-bottom pointer-events-none">
          <div className="liquid-tab-track scrollbar-hide pointer-events-auto shadow-2xl">
            {areas.map(area => (
              <button
                key={area}
                onClick={e => {
                  e.stopPropagation()
                  setActiveArea(area)
                }}
                className={`liquid-tab-btn font-serif px-8 ${activeArea === area ? 'active' : ''}`}
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
