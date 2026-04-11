import { useTrips } from '../hooks/useTrips.js'
import TripCard from '../components/home/TripCard.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'

export default function HomePage() {
  const { trips, loading, error } = useTrips()

  return (
    <div className="bg-jp-bg min-h-screen safe-area-inset">
      {/* Header */}
      <header className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-serif font-bold text-jp-text">Trip Diaries</h1>
        <p className="text-sm text-jp-sub font-serif mt-1">旅行記錄</p>
      </header>

      {/* Content */}
      <main className="px-4 pb-8">
        {loading && <LoadingSpinner />}

        {error && (
          <div className="flex flex-col items-center gap-4 mt-12 text-center px-6">
            <p className="text-jp-sub font-serif text-sm">無法載入行程資料</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-jp-green text-white rounded-xl font-serif text-sm touch-manipulation"
            >
              重試
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {trips.map(trip => (
              <TripCard key={trip.slug} trip={trip} />
            ))}
            {trips.length === 0 && (
              <p className="text-center text-jp-sub font-serif text-sm mt-12">尚無行程</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
