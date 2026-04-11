import { Plane, Luggage } from 'lucide-react'

function parseRoute(route) {
  if (!route) return { from: '', to: '' }
  const sep = route.includes('→') ? '→' : '→'
  const idx = route.indexOf(sep)
  if (idx === -1) {
    // Try " - " separator
    const dashIdx = route.indexOf(' - ')
    if (dashIdx !== -1) {
      return { from: route.slice(0, dashIdx).trim(), to: route.slice(dashIdx + 3).trim() }
    }
    return { from: route, to: '' }
  }
  return { from: route.slice(0, idx).trim(), to: route.slice(idx + 1).trim() }
}

function parseTime(time) {
  if (!time) return { dep: '', arr: '' }
  const sep = time.includes('→') ? '→' : '→'
  const idx = time.indexOf(sep)
  if (idx === -1) {
    const dashIdx = time.indexOf(' - ')
    if (dashIdx !== -1) {
      return { dep: time.slice(0, dashIdx).trim(), arr: time.slice(dashIdx + 3).trim() }
    }
    return { dep: time, arr: '' }
  }
  return { dep: time.slice(0, idx).trim(), arr: time.slice(idx + 1).trim() }
}

/**
 * @param {{
 *   flights: Array<{ date: string, route: string, time: string, flight_no: string }>,
 *   trip: { name: string, dates: string }
 * }} props
 */
export default function FlightSection({ flights, trip }) {
  if (flights.length === 0) {
    return <p className="text-center text-jp-sub font-serif text-sm mt-12">尚無航班資訊</p>
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2 px-1">
        <Plane size={14} className="text-jp-sub" />
        <span className="text-xs font-serif text-jp-sub tracking-widest">航班資訊</span>
      </div>

      {flights.map((f, i) => {
        const { from, to } = parseRoute(f.route)
        const { dep, arr } = parseTime(f.time)

        return (
          <div key={i} className="bg-white/70 rounded-2xl p-5 border border-stone-100">
            {/* Date badge + flight no */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-serif font-bold px-3 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                {f.date}
              </span>
              <span className="text-sm font-serif text-jp-sub">{f.flight_no}</span>
            </div>

            {/* Route diagram */}
            <div className="flex items-center gap-2">
              {/* Departure */}
              <div className="min-w-0">
                {dep && (
                  <p className="text-2xl font-serif font-bold text-jp-text leading-none">{dep}</p>
                )}
                <p className="text-xs font-serif text-jp-sub mt-1 truncate">{from}</p>
              </div>

              {/* Connector */}
              <div className="flex-1 flex items-center gap-1 mx-1">
                <div className="w-2 h-2 rounded-full border-2 border-stone-300 flex-shrink-0" />
                <div className="flex-1 border-t border-dashed border-stone-300" />
                <Plane size={13} className="text-stone-400 flex-shrink-0 -rotate-0" />
                <div className="flex-1 border-t border-dashed border-stone-300" />
                <div className="w-2 h-2 rounded-full bg-stone-300 flex-shrink-0" />
              </div>

              {/* Arrival */}
              <div className="min-w-0 text-right">
                {arr && (
                  <p className="text-2xl font-serif font-bold text-jp-text leading-none">{arr}</p>
                )}
                <p className="text-xs font-serif text-jp-sub mt-1 truncate">{to}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
