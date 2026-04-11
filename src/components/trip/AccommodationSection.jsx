import { Hotel, ExternalLink, Clock } from 'lucide-react'

/**
 * @param {{ rows: Array<{ day: string, name: string, address: string, check_in: string, check_out: string, link: string }> }} props
 */
export default function AccommodationSection({ rows }) {
  if (rows.length === 0) {
    return <p className="text-center text-jp-sub font-sans text-sm mt-12">尚無住宿資料</p>
  }

  return (
    <div className="px-4 py-6 space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="bg-white/60 rounded-2xl p-5 border border-stone-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Hotel size={18} className="text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-stone-400 font-sans mb-1">Day {row.day}</p>
              <p className="font-serif font-bold text-jp-text text-base">{row.name}</p>
              {row.address && (
                <p className="text-xs text-jp-sub font-sans mt-1">{row.address}</p>
              )}
              <div className="flex items-center gap-4 mt-2">
                {row.check_in && (
                  <span className="flex items-center gap-1 text-xs text-stone-400 font-sans">
                    <Clock size={11} /> IN {row.check_in}
                  </span>
                )}
                {row.check_out && (
                  <span className="flex items-center gap-1 text-xs text-stone-400 font-sans">
                    <Clock size={11} /> OUT {row.check_out}
                  </span>
                )}
              </div>
              {row.link && (
                <a
                  href={row.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-jp-green font-sans touch-manipulation"
                >
                  <ExternalLink size={11} />
                  查看地圖
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
