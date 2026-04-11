import { useState, useEffect } from 'react'
import {
  MapPin, Camera, Utensils, ShoppingBag, Train, Hotel,
  ChevronRight, X, Navigation, BookOpen, Clock
} from 'lucide-react'

const TYPE_MAP = {
  transport: { label: '交通', icon: Train, border: 'border-blue-200 text-blue-700 bg-blue-50' },
  flight:    { label: '航班', icon: Train, border: 'border-blue-200 text-blue-700 bg-blue-50' },
  food:      { label: '美食', icon: Utensils, border: 'border-orange-200 text-orange-700 bg-orange-50' },
  sightseeing: { label: '景點', icon: Camera, border: 'border-emerald-200 text-emerald-700 bg-emerald-50' },
  shopping:  { label: '購物', icon: ShoppingBag, border: 'border-pink-200 text-pink-700 bg-pink-50' },
  hotel:     { label: '住宿', icon: Hotel, border: 'border-purple-200 text-purple-700 bg-purple-50' },
  activity:  { label: '活動', icon: MapPin, border: 'border-stone-200 text-stone-500 bg-stone-50' },
}

function getTypeInfo(type) {
  return TYPE_MAP[type] || { label: type || '其他', icon: MapPin, border: 'border-stone-200 text-stone-500 bg-stone-50' }
}

function buildGoogleMapsUrl(address, name) {
  const query = address || name || ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function DetailModal({ row, onClose }) {
  const [displayRow, setDisplayRow] = useState(null)

  useEffect(() => {
    if (row) setDisplayRow(row)
  }, [row])

  const isOpen = !!row

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const current = row || displayRow
  if (!current) return null
  const { label, border } = getTypeInfo(current.type)
  const navUrl = current.link?.startsWith('http')
    ? current.link
    : buildGoogleMapsUrl(current.address, current.name)

  return (
    <>
      <div
        className={`fixed inset-0 bg-transparent z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="glass-bottom-sheet min-h-[60vh] max-h-[79vh] flex flex-col relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 p-3 liquid-glass-button rounded-full text-stone-500 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉詳情"
          >
            <X size={20} />
          </button>

          <div className="overflow-y-auto px-8 pb-10 flex-1 pt-8">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 border text-xs tracking-widest font-bold font-serif uppercase rounded ${border}`}>
                {label}
              </span>
              <span className="font-serif text-xl text-stone-600">{current.time}</span>
            </div>

            <h2 className="text-2xl font-serif font-bold text-jp-text mb-2 leading-tight mt-2 pr-12">
              {current.name}
            </h2>

            <div className="flex items-center gap-2 text-sm text-stone-600 mb-8 font-serif">
              <MapPin size={14} />
              {current.address || '查看地圖位置'}
            </div>

            <div className="space-y-8">
              {current.note && (
                <div>
                  <h3 className="font-bold text-jp-text mb-2 flex items-center gap-2 text-base font-serif">
                    <BookOpen size={14} />
                    關於此處
                  </h3>
                  <p className="text-jp-text leading-relaxed font-serif text-base opacity-90 whitespace-pre-line">
                    {current.note}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-4 mt-12 pt-4 pb-4 px-8 safe-area-bottom">
            <button
              onClick={() => window.open(navUrl, '_blank')}
              className="w-full liquid-glass-button text-stone-600 py-4 rounded-xl font-serif tracking-wide flex items-center justify-center gap-2 touch-manipulation min-h-[48px]"
              aria-label={`開啟 ${current.name} 的 Google Maps 導航`}
            >
              <Navigation size={16} />
              Google Maps 導航
            </button>
            <div className="h-4" />
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * @param {{ rows: Array<{ time: string, name: string, type: string, address: string, link: string, note: string }> }} props
 */
export default function ItinerarySection({ rows }) {
  const [selectedRow, setSelectedRow] = useState(null)

  if (rows.length === 0) {
    return (
      <p className="text-center text-jp-sub font-serif text-sm mt-12">此天尚無行程資料</p>
    )
  }

  return (
    <>
      <div className="mt-2">
        {rows.map((row, i) => {
          const { label, icon: Icon, border } = getTypeInfo(row.type)
          const isLast = i === rows.length - 1

          return (
            <div key={i} className="flex gap-4 px-6 group cursor-pointer" onClick={() => setSelectedRow(row)}>
              <div className="w-16 shrink-0 flex flex-col items-center pt-1">
                <span className="text-lg font-serif font-bold text-jp-text leading-none">{row.time}</span>
                {!isLast && <div className="w-[1px] bg-stone-200 flex-1 my-2" />}
              </div>

              <div className="flex-1 pb-8">
                <div className="bg-white rounded-lg p-4 border border-stone-100 active:scale-[0.98] transition-transform duration-200 h-full flex flex-col touch-manipulation">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs tracking-wider uppercase px-2 py-0.5 rounded border font-serif font-bold ${border}`}>
                      {label}
                    </span>
                  </div>

                  <h4 className="text-lg font-serif font-bold text-jp-text mb-1 leading-snug">{row.name}</h4>
                  {row.note && (
                    <p className="text-sm text-stone-500 line-clamp-3 font-serif mb-2 leading-relaxed opacity-80">
                      {row.note}
                    </p>
                  )}

                  {row.hours && (
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 font-serif mb-3 bg-stone-50 w-fit px-2 py-1 rounded">
                      <Clock size={12} />
                      <span>{row.hours}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-stone-400 font-serif mt-auto pt-2">
                    <Icon size={16} />
                    <span className="truncate text-stone-500 opacity-70 flex-1">
                      {row.address || '查看地圖位置'}
                    </span>
                    <ChevronRight size={12} className="ml-auto shrink-0 opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <DetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />
    </>
  )
}
