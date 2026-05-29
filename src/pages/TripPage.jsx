import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Menu, Info, ClipboardList, ShoppingBag, Utensils, RefreshCw } from 'lucide-react'
import { useTrips } from '../hooks/useTrips.js'
import { useSheetData } from '../hooks/useSheetData.js'
import { useScrollLock } from '../hooks/useScrollLock.js'
import { usePullToRefresh } from '../hooks/usePullToRefresh.js'
import { useDaySwipe } from '../hooks/useDaySwipe.js'
import { useEasterEgg } from '../hooks/useEasterEgg.js'
import { pickInitialDay, formatDayLabel } from '../lib/tripDate.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { useDays, useFoodItems, useNormalizedDays, useNormalizedItinerary } from '../hooks/useTripDerived.js'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import Sidebar from '../components/layout/Sidebar.jsx'
import BottomSheet from '../components/layout/BottomSheet.jsx'
import DayNav from '../components/trip/DayNav.jsx'
import DayBanner from '../components/trip/DayBanner.jsx'
import ItinerarySection from '../components/trip/ItinerarySection.jsx'
// 各 modal section 體積較大且初始畫面看不到 → 用 React.lazy + 條件渲染做 code split
const TripInfoSection = lazy(() => import('../components/trip/TripInfoSection.jsx'))
const ShoppingSection = lazy(() => import('../components/trip/ShoppingSection.jsx'))
const ChecklistSection = lazy(() => import('../components/trip/ChecklistSection.jsx'))
const FoodSection = lazy(() => import('../components/trip/FoodSection.jsx'))

const LAST_TRIP_KEY = 'lastTripSlug'

const MENU_ITEMS = [
  { key: 'info',      label: '旅程資訊', subLabel: 'Flight & Info',  icon: <Info size={20} />,          color: 'bg-blue-50/80 text-blue-600' },
  { key: 'checklist', label: '行李清單', subLabel: 'Packing List',   icon: <ClipboardList size={22} />, color: 'bg-green-50/80 text-green-600' },
  { key: 'shopping',  label: '逛街清單', subLabel: 'Shopping Map',   icon: <ShoppingBag size={22} />,   color: 'bg-pink-50/80 text-pink-600' },
  { key: 'food',      label: '美食清單', subLabel: 'Food List',      icon: <Utensils size={22} />,      color: 'bg-orange-50/80 text-orange-600' },
]

function getYearMonth(dates) {
  return dates?.match(/^(\d{4}\/\d{2})/)?.[1] ?? ''
}

function slugToEnglish(slug) {
  const base = slug.replace(/-\d{4}-\d{2}$/, '').replace(/-/g, ' ')
  return base.toUpperCase() + ' TRIP'
}

function getTripNameEn(trip, slug) {
  const fromCms = trip?.name_en?.trim()
  if (fromCms) return fromCms.toUpperCase().endsWith(' TRIP')
    ? fromCms.toUpperCase()
    : `${fromCms.toUpperCase()} TRIP`
  return slugToEnglish(slug)
}

export default function TripPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { trips, loading: tripsLoading } = useTrips()
  const trip = trips.find(t => t.slug === slug)

  const [activeDay, setActiveDay] = useState(1)
  const initialDayPickedRef = useRef(false)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeModal, setActiveModal] = useState(null)
  const [extras, setExtras] = useState(null)

  // 各 sheet tab data
  const flightsHook = useSheetData(trip?.sheet_id, 'flights')
  const itineraryHook = useSheetData(trip?.sheet_id, 'itinerary')
  const accommodationHook = useSheetData(trip?.sheet_id, 'accommodation')
  const shoppingHook = useSheetData(trip?.sheet_id, 'shopping')
  const checklistHook = useSheetData(trip?.sheet_id, 'checklist')
  const foodHook = useSheetData(trip?.sheet_id, 'food')
  const daysHook = useSheetData(trip?.sheet_id, 'days')

  const { data: flights, loading: flightsLoading } = flightsHook
  const { data: itinerary, loading: itineraryLoading } = itineraryHook
  const { data: accommodation } = accommodationHook
  const { data: shopping } = shoppingHook
  const { data: checklist } = checklistHook
  const { data: food } = foodHook
  const { data: daysData } = daysHook

  // Pull-to-refresh：清快取後重抓所有 trip sheets
  const refreshAllSheets = useCallback(async () => {
    await Promise.all([
      flightsHook.refresh(),
      itineraryHook.refresh(),
      accommodationHook.refresh(),
      shoppingHook.refresh(),
      checklistHook.refresh(),
      foodHook.refresh(),
      daysHook.refresh(),
    ])
  }, [
    flightsHook.refresh, itineraryHook.refresh, accommodationHook.refresh,
    shoppingHook.refresh, checklistHook.refresh, foodHook.refresh, daysHook.refresh,
  ])
  const { pullY, refreshing, triggerThreshold } = usePullToRefresh(refreshAllSheets, {
    // sidebar / modal / 彩蛋打開時停掉 pull-to-refresh，避免跟拖曳關閉手勢衝突
    enabled: !sidebarOpen && !activeModal,
  })

  // Trip-specific extras（求婚彩蛋）lazy load
  useEffect(() => {
    if (!slug) { setExtras(null); return }
    let cancelled = false
    import(`../trips/${slug}/extras.jsx`)
      .then(m => { if (!cancelled) setExtras(m.default) })
      .catch(() => { if (!cancelled) setExtras(null) })
    return () => { cancelled = true }
  }, [slug])

  // 記下最後造訪 trip，PWA 啟動時 HomePage 會用來自動跳轉
  useEffect(() => {
    if (!slug) return
    initialDayPickedRef.current = false
    try { localStorage.setItem(LAST_TRIP_KEY, slug) } catch { /* ignore */ }
  }, [slug])

  const easterEgg = useEasterEgg({ extras })

  useScrollLock(sidebarOpen || !!activeModal || easterEgg.open)

  usePageMeta({
    title: trip ? `${trip.name}｜${trip.dates || ''}`.replace(/｜$/, '') : '行程',
    description: trip ? `${trip.name} ${trip.dates || ''} 旅行記錄`.trim() : undefined,
    image: trip?.cover_image_url || undefined,
  })

  const normalizedItinerary = useNormalizedItinerary(itinerary, trip?.dates)
  const normalizedDays = useNormalizedDays(daysData, trip?.dates)
  const days = useDays(normalizedItinerary, trip?.dates)

  // 第一次拿到 itinerary 時自動跳「今天」對應的 day（user 手動切過後不再覆蓋）
  useEffect(() => {
    if (initialDayPickedRef.current || days.length === 0) return
    setActiveDay(pickInitialDay(days))
    initialDayPickedRef.current = true
  }, [days])

  // 三欄輪播：prev / current / next 的 metadata + itinerary
  const activeDayIdx = useMemo(() => days.findIndex(d => d.day === activeDay), [days, activeDay])
  const prevDayObj = activeDayIdx > 0 ? days[activeDayIdx - 1] : null
  const nextDayObj = activeDayIdx < days.length - 1 ? days[activeDayIdx + 1] : null

  const findDayMeta = (day) => normalizedDays.find(r => r._day === day) ?? null
  const filterDayItinerary = (day) => normalizedItinerary.filter(r => r._day === day)

  const activeDayMeta = useMemo(() => findDayMeta(activeDay), [normalizedDays, activeDay])
  const prevDayMeta = useMemo(() => prevDayObj ? findDayMeta(prevDayObj.day) : null, [normalizedDays, prevDayObj])
  const nextDayMeta = useMemo(() => nextDayObj ? findDayMeta(nextDayObj.day) : null, [normalizedDays, nextDayObj])
  const dayItinerary = useMemo(() => filterDayItinerary(activeDay), [normalizedItinerary, activeDay])
  const prevDayItinerary = useMemo(() => prevDayObj ? filterDayItinerary(prevDayObj.day) : [], [normalizedItinerary, prevDayObj])
  const nextDayItinerary = useMemo(() => nextDayObj ? filterDayItinerary(nextDayObj.day) : [], [normalizedItinerary, nextDayObj])

  const foodItems = useFoodItems(food, itinerary)

  // 左右滑動切日手勢
  const swipe = useDaySwipe({
    days,
    activeDay,
    setActiveDay,
    enabled: !sidebarOpen && !activeModal,
  })

  // 一次性 swipe 教學：第一次造訪有 ≥ 2 天的 trip 時 peek 一下下個 panel
  // 必須放在 const swipe 宣告之後，否則 minified bundle 會 TDZ
  const SWIPE_HINT_KEY = 'swipeHintShown:v1'
  useEffect(() => {
    if (days.length <= 1) return
    let alreadyShown = false
    try { alreadyShown = localStorage.getItem(SWIPE_HINT_KEY) === '1' } catch { /* ignore */ }
    if (alreadyShown) return
    const id = setTimeout(() => {
      swipe.peek()
      try { localStorage.setItem(SWIPE_HINT_KEY, '1') } catch { /* ignore */ }
    }, 800)
    return () => clearTimeout(id)
  }, [days.length, swipe])

  if (tripsLoading || flightsLoading || itineraryLoading) {
    return <div className="bg-jp-bg min-h-screen safe-area-inset"><LoadingSpinner /></div>
  }

  if (!trip) {
    return (
      <div className="bg-jp-bg min-h-screen safe-area-inset flex flex-col items-center justify-center">
        <ErrorState
          title="找不到此行程"
          message="可能網址有誤或行程已下架"
          actionLabel="回行程列表"
          onAction={() => navigate('/?home=1')}
        />
      </div>
    )
  }

  const yearMonth = getYearMonth(trip.dates)
  const tripNameEn = getTripNameEn(trip, slug)
  const showPullIndicator = pullY > 0 || refreshing
  const pullIndicatorOpacity = refreshing ? 1 : Math.min(1, pullY / triggerThreshold)

  return (
    <div className="min-h-screen bg-jp-bg text-jp-text font-serif pb-12 safe-area-inset relative">
      {/* Pull-to-refresh indicator：floating，不平移內容（避免干擾 day swipe transform） */}
      {showPullIndicator && (
        <div
          className="fixed left-0 right-0 top-0 flex justify-center pointer-events-none z-30"
          style={{
            transform: `translateY(${refreshing ? 24 : Math.max(0, pullY - 30)}px)`,
            opacity: pullIndicatorOpacity,
          }}
        >
          <div className="liquid-glass-button rounded-full p-3 text-stone-500">
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </div>
        </div>
      )}

      <div>
        {/* Header */}
        <div className="relative pt-8 pb-4 px-6 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 liquid-glass-button rounded-full text-stone-500 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="開啟選單"
          >
            <Menu size={24} />
          </button>
          <div className="flex flex-col items-center flex-1 px-4">
            {yearMonth && (
              <p className="text-[11px] tracking-[0.3em] uppercase text-stone-400 mb-2 font-serif font-medium">{yearMonth}</p>
            )}
            <p className="text-xs tracking-[0.15em] uppercase text-stone-400 mb-3 font-serif font-medium">
              {tripNameEn.replace(' TRIP', ' Trip')}
            </p>
            <h1 className="text-2xl font-bold tracking-[0.1em] text-jp-text leading-tight">{trip.name}旅行</h1>
          </div>
          <div className="w-10" />
        </div>

        {/* Day Nav */}
        {days.length > 0 && (
          <DayNav
            days={days}
            activeDay={activeDay}
            onSelect={(day) => {
              const prevActive = activeDay
              setActiveDay(day)
              easterEgg.handleDayClick(day, prevActive)
            }}
            easterEggDay={extras?.easterEggDay}
            easterEggIcon={easterEgg.activated && extras ? <extras.HeartIcon activated /> : null}
          />
        )}

        {/* Day swipe zone：current 用 relative 撐高度；prev / next 用 absolute 不影響高度 */}
        <div {...swipe.containerProps} className="overflow-hidden">
          <div
            ref={swipe.carouselRef}
            style={swipe.carouselStyle}
            className={swipe.carouselClassName}
          >
            {/* Prev panel：absolute 放在左側 (right-full)，不參與高度 */}
            {prevDayObj && (
              <div className="absolute top-0 right-full w-full overflow-hidden">
                <DayPanel dayObj={prevDayObj} dayMeta={prevDayMeta} itinerary={prevDayItinerary} tripName={trip.name} />
              </div>
            )}
            {/* Current panel：normal flow，撐整個 carousel 高度 */}
            <DayPanel
              dayObj={{ day: activeDay, date: days.find(d => d.day === activeDay)?.date }}
              dayMeta={activeDayMeta}
              itinerary={dayItinerary}
              tripName={trip.name}
              isCurrent
            />
            {/* Next panel：absolute 放在右側 (left-full)，不參與高度 */}
            {nextDayObj && (
              <div className="absolute top-0 left-full w-full overflow-hidden">
                <DayPanel dayObj={nextDayObj} dayMeta={nextDayMeta} itinerary={nextDayItinerary} tripName={trip.name} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={(key) => { setActiveModal(key); setSidebarOpen(false) }}
        sections={MENU_ITEMS}
        tripNameEn={tripNameEn}
      />

      {/* Section Modals */}
      <BottomSheet isOpen={activeModal === 'info'} onClose={() => setActiveModal(null)} title="旅程資訊" noScroll noStickyTitle>
        {activeModal === 'info' && (
          <Suspense fallback={<div className="p-8 text-stone-400">載入中…</div>}>
            <TripInfoSection flights={flights} accommodation={accommodation} destinationCountry={trip?.destination_country} />
          </Suspense>
        )}
      </BottomSheet>

      <BottomSheet isOpen={activeModal === 'checklist'} onClose={() => setActiveModal(null)} title="行李清單" noScroll noStickyTitle>
        {activeModal === 'checklist' && (
          <Suspense fallback={<div className="p-8 text-stone-400">載入中…</div>}>
            <ChecklistSection key={`checklist-${slug}`} rows={checklist} slug={slug} />
          </Suspense>
        )}
      </BottomSheet>

      <BottomSheet isOpen={activeModal === 'shopping'} onClose={() => setActiveModal(null)} title="逛街清單" noScroll noStickyTitle>
        {activeModal === 'shopping' && (
          <Suspense fallback={<div className="p-8 text-stone-400">載入中…</div>}>
            <ShoppingSection rows={shopping} />
          </Suspense>
        )}
      </BottomSheet>

      <BottomSheet isOpen={activeModal === 'food'} onClose={() => setActiveModal(null)} title="美食清單" noScroll noStickyTitle>
        {activeModal === 'food' && (
          <Suspense fallback={<div className="p-8 text-stone-400">載入中…</div>}>
            <FoodSection rows={foodItems} />
          </Suspense>
        )}
      </BottomSheet>

      {/* Easter Egg Modal */}
      {extras?.ProposalModal && (
        <extras.ProposalModal
          isOpen={easterEgg.open}
          onClose={easterEgg.reset}
          heartPosition={easterEgg.heartPosition}
        />
      )}
    </div>
  )
}

// 單一日 panel：banner + itinerary list；dayObj 為 null 時整格不渲染（給三欄第一/末日用）
function DayPanel({ dayObj, dayMeta, itinerary, tripName, isCurrent = false }) {
  if (!dayObj) return null
  return (
    <div className="overflow-hidden">
      <DayBanner
        bannerUrl={dayMeta?.banner_url}
        title={dayMeta?.title}
        subtitle={dayMeta?.subtitle}
        dateLabel={formatDayLabel(dayObj.date)}
        tripName={tripName}
        eager={isCurrent}
      />
      <div className="h-6" />
      <div className="mt-2">
        <ItinerarySection rows={itinerary} dayDate={dayObj.date} />
      </div>
    </div>
  )
}
