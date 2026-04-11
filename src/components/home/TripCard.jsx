import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar } from 'lucide-react'

/**
 * @param {{ trip: { slug: string, name: string, dates: string, cover_image_url: string } }} props
 */
export default function TripCard({ trip }) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/trip/${trip.slug}`)}
      className="w-full relative rounded-2xl overflow-hidden h-56 touch-manipulation group"
      aria-label={`查看 ${trip.name} 行程`}
    >
      {/* Cover image */}
      {trip.cover_image_url ? (
        <img
          src={trip.cover_image_url}
          alt={trip.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-stone-200" />
      )}

      {/* Glass info overlay — bottom */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="liquid-glass-button rounded-xl p-4 text-left">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={14} className="text-jp-green flex-shrink-0" />
            <h3 className="font-serif font-bold text-jp-text text-lg leading-tight">{trip.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-stone-400 flex-shrink-0" />
            <span className="text-xs text-stone-500 font-serif">{trip.dates}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
