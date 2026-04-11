import { useState, useMemo, useRef, useEffect } from 'react'
import { ShoppingBag, Clock, Navigation } from 'lucide-react'

/**
 * @param {{ rows: Array<{ area: string, building: string, name: string, floor: string, hours: string, link: string, is_building: string }> }} props
 */
export default function ShoppingSection({ rows }) {
  const areas = useMemo(
    () => [...new Set(rows.map(r => r.area).filter(Boolean))],
    [rows]
  )
  const [activeArea, setActiveArea] = useState(() => areas[0] ?? '')
  const scrollRef = useRef(null)

  const items = activeArea ? rows.filter(r => r.area === activeArea) : rows

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
        className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-8 pb-32 space-y-4 pt-2"
      >
        {items.length === 0 ? (
          <p className="text-stone-500 font-serif text-sm py-6 text-center">尚無清單</p>
        ) : (
          items.map((item, i) => (
            <div key={`${activeArea}-${i}`} className="bg-white rounded-xl p-5 border border-stone-100">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-pink-50 text-pink-500 rounded-full">
                    <ShoppingBag size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-jp-text font-serif text-lg leading-none">{item.name}</h3>
                    {item.is_building === 'TRUE' && item.hours && (
                      <span className="text-xs text-stone-500 font-serif mt-1 flex items-center gap-1">
                        <Clock size={12} /> {item.hours}
                      </span>
                    )}
                  </div>
                </div>
                {item.is_building !== 'TRUE' && item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-stone-50 rounded-full text-stone-400 hover:text-jp-green hover:bg-green-50 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                    onClick={e => e.stopPropagation()}
                  >
                    <Navigation size={16} />
                  </a>
                )}
              </div>

              {item.is_building !== 'TRUE' && (item.floor || item.hours) && (
                <div className="mt-2 flex items-center gap-3 text-xs text-stone-500 font-serif pl-11">
                  {item.floor && (
                    <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-600 font-medium">{item.floor}</span>
                  )}
                  {item.hours && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {item.hours}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
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
