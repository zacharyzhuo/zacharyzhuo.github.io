import { Plane, ExternalLink } from 'lucide-react'

/**
 * @param {{
 *   flights: Array<{ date: string, route: string, time: string, flight_no: string }>,
 *   trip: { name: string, dates: string }
 * }} props
 */
export default function FlightSection({ flights, trip }) {
  return (
    <div className="px-4 py-6 space-y-4">
      {/* Trip Info Header */}
      <div className="bg-white/60 rounded-2xl p-5 border border-stone-100">
        <h2 className="font-serif font-bold text-jp-text text-lg mb-1">{trip.name}</h2>
        <p className="text-sm text-jp-sub font-sans">{trip.dates}</p>
      </div>

      {/* Flight Cards */}
      {flights.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-serif font-bold text-jp-text px-1">航班資訊</h3>
          {flights.map((f, i) => (
            <div key={i} className="bg-white/60 rounded-2xl p-5 border border-stone-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <Plane size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="font-sans text-xs text-stone-400">{f.date}</p>
                  <p className="font-serif font-bold text-jp-text">{f.route}</p>
                </div>
              </div>
              <p className="text-sm font-sans text-jp-sub">{f.time}</p>
              <p className="text-sm font-sans text-stone-400 mt-1">{f.flight_no}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
