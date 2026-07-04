import { useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { useTrips } from '../hooks/useTrips.js'
import { usePullToRefresh } from '../hooks/usePullToRefresh.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { pickActiveTrip, groupTrips } from '../lib/tripDate.js'
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

  const { nowNext, pastByYear } = useMemo(() => groupTrips(trips), [trips])
  const isEmpty = nowNext.length === 0 && pastByYear.length === 0

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
        className={`max-w-2xl mx-auto ${pullY === 0 ? 'transition-transform duration-200 ease-out' : ''}`}
      >
      {/* Header：與 trip page 一致 — 英文 caps eyebrow 在上、中文大標在下 */}
      <header className="px-6 pt-8 pb-6">
        <p className="text-xs tracking-[0.25em] uppercase text-stone-400 font-serif font-medium mb-2">Trip Diaries</p>
        <h1 className="text-3xl font-serif font-bold text-jp-text tracking-[0.04em]">旅行記錄</h1>
      </header>

      {/* Content */}
      <main id="main" tabIndex={-1} className="px-4 pb-8">
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
          <div className="space-y-8">
            {nowNext.length > 0 && (
              <section>
                <div className="flex items-center gap-2.5 mb-3.5 px-1">
                  <span className="text-2xs tracking-[0.3em] uppercase text-jp-green font-serif font-bold">Now &amp; Next</span>
                  <span className="flex-1 h-px bg-jp-green/25" />
                </div>
                <div className="space-y-4">
                  {nowNext.map(trip => (
                    <TripCard key={trip.slug} trip={trip} variant="feature" />
                  ))}
                </div>
              </section>
            )}

            {pastByYear.map((group) => (
              <section key={group.year}>
                <div className="flex items-center gap-3 mb-3 px-1">
                  <span className="text-2xl font-serif font-bold text-jp-text tracking-wide leading-none">{group.year}</span>
                  <span className="text-2xs tracking-[0.3em] uppercase text-muted font-serif font-bold">Past</span>
                  <span className="flex-1 h-px bg-hairline" />
                  <span className="text-xs text-muted font-serif">{group.trips.length} 趟</span>
                </div>
                <div className="space-y-3">
                  {group.trips.map((trip) => (
                    <TripCard key={trip.slug} trip={trip} variant="index" />
                  ))}
                </div>
              </section>
            ))}

            {isEmpty && (
              <p className="text-center text-muted font-serif text-sm mt-12">尚無行程</p>
            )}
          </div>
        )}
      </main>
      </div>
    </div>
  )
}
