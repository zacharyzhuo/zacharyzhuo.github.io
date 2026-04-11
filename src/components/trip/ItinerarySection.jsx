import {
  Plane, Hotel, Utensils, Camera, ShoppingBag, Train, MapPin, ExternalLink, Clock
} from 'lucide-react'

const TYPE_ICON = {
  flight: Plane,
  hotel: Hotel,
  food: Utensils,
  sightseeing: Camera,
  shopping: ShoppingBag,
  transport: Train,
}

const TYPE_COLOR = {
  flight: 'bg-blue-50 text-blue-500',
  hotel: 'bg-purple-50 text-purple-500',
  food: 'bg-orange-50 text-orange-500',
  sightseeing: 'bg-green-50 text-green-600',
  shopping: 'bg-pink-50 text-pink-500',
  transport: 'bg-gray-50 text-gray-500',
}

/**
 * @param {{ rows: Array<{ time: string, name: string, type: string, address: string, link: string, note: string }> }} props
 */
export default function ItinerarySection({ rows }) {
  if (rows.length === 0) {
    return <p className="text-center text-jp-sub font-sans text-sm mt-12">此天尚無行程資料</p>
  }

  return (
    <div className="px-4 py-6 space-y-3">
      {rows.map((row, i) => {
        const Icon = TYPE_ICON[row.type] ?? MapPin
        const colorClass = TYPE_COLOR[row.type] ?? 'bg-stone-50 text-stone-500'

        return (
          <div key={i} className="bg-white/60 rounded-2xl p-5 border border-stone-100">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {row.time && (
                    <span className="flex items-center gap-1 text-xs text-stone-400 font-sans">
                      <Clock size={11} />
                      {row.time}
                    </span>
                  )}
                </div>
                <p className="font-serif font-bold text-jp-text text-base leading-snug">{row.name}</p>
                {row.address && (
                  <p className="text-xs text-jp-sub font-sans mt-1 truncate">{row.address}</p>
                )}
                {row.note && (
                  <p className="text-xs text-stone-400 font-sans mt-2 leading-relaxed">{row.note}</p>
                )}
                {row.link && (
                  <a
                    href={row.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-jp-green font-sans touch-manipulation"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink size={11} />
                    Google Maps
                  </a>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
