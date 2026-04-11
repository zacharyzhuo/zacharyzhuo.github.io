import { ShoppingBag, ExternalLink, Clock, Building2 } from 'lucide-react'

/**
 * @param {{ rows: Array<{ area: string, building: string, name: string, floor: string, hours: string, link: string, is_building: string }> }} props
 */
export default function ShoppingSection({ rows }) {
  if (rows.length === 0) {
    return <p className="text-center text-jp-sub font-sans text-sm mt-12">尚無購物清單</p>
  }

  // Group by area
  const byArea = rows.reduce((acc, row) => {
    const area = row.area || '其他'
    if (!acc[area]) acc[area] = []
    acc[area].push(row)
    return acc
  }, {})

  return (
    <div className="px-4 py-6 space-y-6">
      {Object.entries(byArea).map(([area, items]) => (
        <div key={area}>
          <h3 className="font-serif font-bold text-jp-text text-base px-1 mb-3">{area}</h3>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="bg-white/60 rounded-2xl p-5 border border-stone-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0">
                    {item.is_building === 'TRUE' ? (
                      <Building2 size={18} className="text-pink-400" />
                    ) : (
                      <ShoppingBag size={18} className="text-pink-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    {item.building && item.is_building !== 'TRUE' && (
                      <p className="text-xs text-stone-400 font-sans mb-0.5">{item.building}</p>
                    )}
                    <p className="font-serif font-bold text-jp-text">{item.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {item.floor && (
                        <span className="text-xs text-jp-sub font-sans">{item.floor}</span>
                      )}
                      {item.hours && (
                        <span className="flex items-center gap-1 text-xs text-stone-400 font-sans">
                          <Clock size={11} /> {item.hours}
                        </span>
                      )}
                    </div>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-jp-green font-sans touch-manipulation"
                      >
                        <ExternalLink size={11} />
                        Google Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
