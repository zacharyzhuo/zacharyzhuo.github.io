import { useState, useRef, useEffect } from 'react'
import { Plane, Luggage, ExternalLink, Hotel, ClipboardList, Navigation } from 'lucide-react'

const INFO_TABS = [
  { key: 'flights', label: '航班資訊' },
  { key: 'prepare', label: '行前準備' },
  { key: 'hotel', label: '住宿資訊' },
]

const AIRPORT_NAMES = {
  TPE: '台北', NRT: '成田', HND: '羽田', HKD: '函館', CTS: '新千歲',
}

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
    return <p className="text-center text-stone-600 font-serif text-sm mt-12">尚無航班資訊</p>
  }

  return (
    <div>
      <h3 className="text-base font-bold text-stone-600 uppercase tracking-widest mb-4 flex items-center gap-2 font-serif">
        <Plane size={18} /> 航班資訊
      </h3>
      <div className="space-y-4">
        {flights.map((f, i) => {
          const { from, to } = parseRoute(f.route)
          const { dep, arr } = parseTime(f.time)

          return (
            <div key={i} className="glass-card relative p-5 rounded-2xl overflow-hidden">
              <div className="flex justify-between items-center mb-4 border-b border-[#5C6E58]/20 pb-2">
                <span className="text-sm font-bold border border-blue-200 text-blue-700 bg-blue-50 px-2 py-1 rounded font-serif">
                  {f.date}
                </span>
                <span className="text-sm font-bold text-jp-green font-serif">{f.flight_no}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-center">
                  <div className="text-2xl font-serif font-bold text-jp-text">{dep}</div>
                  <div className="text-sm text-stone-600 font-serif">
                    {from} {AIRPORT_NAMES[from] || ''}
                  </div>
                </div>
                <div className="flex flex-col items-center text-stone-400">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full border border-stone-400" />
                    <div className="w-12 h-[1px] bg-stone-400" />
                    <Plane size={18} className="rotate-90 text-stone-400" />
                    <div className="w-12 h-[1px] bg-stone-400" />
                    <div className="w-3 h-3 rounded-full bg-stone-400" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-serif font-bold text-jp-text">{arr}</div>
                  <div className="text-sm text-stone-600 font-serif">
                    {to} {AIRPORT_NAMES[to] || ''}
                  </div>
                </div>
              </div>
              {(f.carry_on || f.checked_bag) && (
                <div className="mt-4 pt-4 border-t border-[#5C6E58]/20">
                  <div className="flex items-start gap-2">
                    <Luggage size={16} className="text-stone-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-stone-600 leading-relaxed whitespace-pre-line font-serif">
                      {[
                        f.carry_on && `手提行李：${f.carry_on}`,
                        f.checked_bag && `托運行李：${f.checked_bag}`,
                      ].filter(Boolean).join('\n')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PrepareTab({ destinationCountry }) {
  const isJapan = destinationCountry === 'JP'

  if (!isJapan) {
    return (
      <div>
        <h3 className="text-base font-bold text-stone-600 uppercase tracking-widest mb-4 flex items-center gap-2 font-serif">
          <ClipboardList size={18} /> 行前準備
        </h3>
        <p className="text-center text-stone-600 font-serif text-sm mt-12">尚無行前準備項目</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-base font-bold text-stone-600 uppercase tracking-widest mb-4 flex items-center gap-2 font-serif">
        <ClipboardList size={18} /> 行前準備
      </h3>
      <button
        onClick={() => window.open('https://vjw-lp.digital.go.jp/zh-hant/', '_blank')}
        className="w-full bg-[#6B9080] text-white p-6 rounded-2xl hover:brightness-105 transition-all text-left group relative overflow-hidden touch-manipulation min-h-[48px]"
        aria-label="開啟 Visit Japan Web 網站"
      >
        <div className="absolute right-[-10px] top-[-10px] opacity-10 rotate-12">
          <Plane size={100} />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h4 className="text-xl font-serif font-bold mb-1">Visit Japan Web</h4>
            <p className="text-sm opacity-80 font-serif tracking-wide">入境日本必備・提前填寫申報</p>
          </div>
          <ExternalLink size={24} className="opacity-80 group-hover:opacity-100" />
        </div>
      </button>
    </div>
  )
}

function HotelTab({ accommodation }) {
  if (accommodation.length === 0) {
    return <p className="text-center text-stone-600 font-serif text-sm mt-12">尚無住宿資訊</p>
  }

  return (
    <div>
      <h3 className="text-base font-bold text-stone-600 uppercase tracking-widest mb-4 flex items-center gap-2 font-serif">
        <Hotel size={18} /> 住宿資訊
      </h3>
      <div className="space-y-6">
        {accommodation.map((h, i) => (
          <div key={i}>
            {h.region && (
              <h4 className="text-sm font-bold text-stone-600 mb-3 pl-1 font-serif">{h.region}</h4>
            )}
            <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className={`text-sm font-bold border px-2 py-1 rounded mb-3 inline-block font-serif ${
                    h.type === 'hotel'
                      ? 'border-purple-200 text-purple-700 bg-purple-50'
                      : h.type === 'airbnb'
                      ? 'border-pink-200 text-pink-700 bg-pink-50'
                      : 'border-stone-200 text-stone-600 bg-stone-50'
                  }`}>
                    {h.type === 'hotel' ? '飯店' : h.type === 'airbnb' ? 'Airbnb' : '住宿'}
                  </span>
                  <h5 className="font-serif font-bold text-jp-text text-xl leading-tight mb-2">{h.name}</h5>
                  {h.address && (
                    <p className="text-sm text-stone-600 font-serif mb-4">{h.address}</p>
                  )}

                  {(h.check_in || h.check_out) && (
                    <div className="flex gap-6 mb-4 text-sm font-serif text-stone-600 bg-white/30 p-3 rounded-lg border border-white/40">
                      {h.check_in && (
                        <div>
                          <span className="block text-sm text-stone-600 uppercase font-serif tracking-wider mb-1">Check-in</span>
                          <span className="text-sm text-stone-600 font-serif">{h.check_in}</span>
                        </div>
                      )}
                      {h.check_in && h.check_out && <div className="w-[1px] bg-stone-200" />}
                      {h.check_out && (
                        <div>
                          <span className="block text-sm text-stone-600 uppercase font-serif tracking-wider mb-1">Check-out</span>
                          <span className="text-sm text-stone-600 font-serif">{h.check_out}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {h.note && (
                    <p className="text-sm text-stone-600 mb-2 font-serif leading-relaxed">{h.note}</p>
                  )}

                  {h.link && (
                    <a
                      href={h.link}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full liquid-glass-button text-stone-600 py-3 rounded-xl font-serif tracking-wide flex items-center justify-center gap-2 mt-4 touch-manipulation min-h-[44px]"
                      aria-label="查看住宿位置"
                    >
                      <Navigation size={16} />
                      Google Maps 導航
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TripInfoSection({ flights, accommodation, destinationCountry }) {
  const [activeTab, setActiveTab] = useState('flights')
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0 })
  }, [activeTab])

  return (
    <div className="flex flex-col relative h-full">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-8 pb-24 pt-2 space-y-8"
      >
        <h2 className="text-2xl font-serif font-bold text-jp-text pt-8 pb-2 pr-12">旅程資訊</h2>
        {activeTab === 'flights' && <FlightsTab flights={flights} />}
        {activeTab === 'prepare' && <PrepareTab destinationCountry={destinationCountry} />}
        {activeTab === 'hotel' && <HotelTab accommodation={accommodation} />}
      </div>

      <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center px-4 safe-area-bottom pointer-events-none">
        <div className="liquid-tab-track scrollbar-hide pointer-events-auto shadow-2xl">
          {INFO_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={e => {
                e.stopPropagation()
                setActiveTab(tab.key)
              }}
              className={`liquid-tab-btn font-serif px-5 ${activeTab === tab.key ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
