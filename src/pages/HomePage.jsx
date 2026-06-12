import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { useTrips } from '../hooks/useTrips.js'
import { usePullToRefresh } from '../hooks/usePullToRefresh.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { pickActiveTrip } from '../lib/tripDate.js'
import TripCard from '../components/home/TripCard.jsx'
import { HomeCardsSkeleton } from '../components/ui/Skeletons.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'

const LAST_TRIP_KEY = 'lastTripSlug'

export default function HomePage() {
  const { trips, loading, error, refresh } = useTrips()
  const { pullY, refreshing, triggerThreshold } = usePullToRefresh(refresh)
  const navigate = useNavigate()
  const location = useLocation()
  const redirectedRef = useRef(false)

  usePageMeta({ title: '行程列表' })

  // PWA / 直接訪問首頁時，根據「最後造訪」或「即將出發」的行程自動跳轉。
  // 帶 ?home=1 的進入點（從 trip page 主動返回）會跳過這個邏輯。
  useEffect(() => {
    if (redirectedRef.current) return
    if (loading || error) return

    const params = new URLSearchParams(location.search)
    if (params.get('home') === '1') {
      redirectedRef.current = true
      return
    }

    const lastSlug = (() => {
      try { return localStorage.getItem(LAST_TRIP_KEY) } catch { return null }
    })()

    const targetSlug =
      (lastSlug && trips.some(t => t.slug === lastSlug) ? lastSlug : null) ??
      pickActiveTrip(trips)

    if (targetSlug) {
      redirectedRef.current = true
      navigate(`/trip/${targetSlug}`, { replace: true })
    }
  }, [trips, loading, error, location.search, navigate])

  const showIndicator = pullY > 0 || refreshing
  const indicatorOpacity = refreshing ? 1 : Math.min(1, pullY / triggerThreshold)
  const indicatorRotation = refreshing ? 'animate-spin' : ''

  return (
    <div className="bg-washi min-h-screen safe-area-inset relative overflow-x-hidden">
      {/* Pull-to-refresh indicator：覆蓋在頂端，隨拉動距離淡入 */}
      {showIndicator && (
        <div
          className="absolute left-0 right-0 top-0 flex justify-center pointer-events-none z-10"
          style={{
            transform: `translateY(${refreshing ? 24 : Math.max(0, pullY - 30)}px)`,
            opacity: indicatorOpacity,
          }}
        >
          <div className="frosted-glass-button rounded-full p-3 text-muted">
            <RefreshCw size={20} className={indicatorRotation} />
          </div>
        </div>
      )}
      <div
        style={{ transform: `translateY(${pullY}px)` }}
        className={pullY === 0 ? 'transition-transform duration-200 ease-out' : ''}
      >
      {/* Header */}
      <header className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-serif font-bold text-jp-text">Trip Diaries</h1>
        <p className="text-sm text-muted font-serif mt-1">旅行記錄</p>
      </header>

      {/* Content */}
      <main className="px-4 pb-8">
        {loading && <HomeCardsSkeleton />}

        {error && (
          <ErrorState
            title="無法載入行程"
            message="請檢查網路連線，或下拉重新整理"
            actionLabel="重試"
            onAction={refresh}
          />
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {trips.map(trip => (
              <TripCard key={trip.slug} trip={trip} />
            ))}
            {trips.length === 0 && (
              <p className="text-center text-muted font-serif text-sm mt-12">尚無行程</p>
            )}
          </div>
        )}
      </main>
      </div>
    </div>
  )
}
