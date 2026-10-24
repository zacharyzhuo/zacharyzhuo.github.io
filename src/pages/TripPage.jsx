import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Menu, Info, ClipboardList, ShoppingBag, Utensils, RefreshCw, Map as MapIcon } from 'lucide-react'
import { useTrips } from '../hooks/useTrips.js'
import { useSheetData } from '../hooks/useSheetData.js'
import { useScrollLock } from '../hooks/useScrollLock.js'
import { usePullToRefresh } from '../hooks/usePullToRefresh.js'
import { useDaySwipe } from '../hooks/useDaySwipe.js'
import { useEasterEgg } from '../hooks/useEasterEgg.js'
import { pickInitialDay, formatDayLabel } from '../lib/tripDate.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { useDays, useFoodItems, useNormalizedDays, useNormalizedItinerary } from '../hooks/useTripDerived.js'
import { categoryInk, BRAND_INK } from '../lib/categories.js'
import { toMapPoints, listToMapPoints, shoppingToMapPoints, mergeMapPoints } from '../lib/maps.js'
import { TripSkeleton, SectionSkeleton } from '../components/ui/Skeletons.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import ErrorBoundary from '../components/ui/ErrorBoundary.jsx'
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
const TripMap = lazy(() => import('../components/trip/TripMap.jsx'))

const LAST_TRIP_KEY = 'lastTripSlug'
const PANEL_CLOSE_MS = 300 // 與 index.css --dur-panel-close 同值

// 側欄 icon：純分類色 icon（無圓底，與時間軸軌道同語言）。
// shopping / food 直接取分類色；info 借交通色（航班為主）、checklist 用品牌綠。
const MENU_ITEMS = [
  { key: 'info',      label: '旅程資訊', subLabel: 'Flight & Info',  icon: <Info size={22} />,          iconStyle: { color: categoryInk('transport') } },
  { key: 'checklist', label: '行李清單', subLabel: 'Packing List',   icon: <ClipboardList size={22} />, iconStyle: { color: BRAND_INK } },
  { key: 'shopping',  label: '逛街清單', subLabel: 'Shopping Map',   icon: <ShoppingBag size={22} />,   iconStyle: { color: categoryInk('shopping') } },
  { key: 'food',      label: '美食清單', subLabel: 'Food List',      icon: <Utensils size={22} />,      iconStyle: { color: categoryInk('food') } },
]

function getYearMonth(dates) {
  return dates?.match(/^(\d{4}\/\d{2})/)?.[1] ?? ''
}

function slugToEnglish(slug) {
  const base = slug.replace(/^\d{4}-\d{2}-/, '').replace(/-/g, ' ')
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
  const location = useLocation()
  const { trips, loading: tripsLoading } = useTrips()
  const trip = trips.find(t => t.slug === slug)

  const [activeDay, setActiveDay] = useState(1)
  const initialDayPickedRef = useRef(false)

  // 疊層 UI（側欄 / 四個 modal / 地圖 / 行程詳情）不用各自 boolean state，改由 location.state.panel
  // 單一值衍生，讓 Android 手勢 / 瀏覽器上一頁能正確關掉最上層，而非直接離開頁面（見 CLAUDE.md「瀏覽器歷史整合」）。
  const panel = location.state?.panel ?? null
  const sidebarOpen = panel === 'sidebar'
  const activeModal = ['info', 'checklist', 'shopping', 'food'].includes(panel) ? panel : null
  const mapOpen = panel === 'map'
  const detailState = panel === 'detail' ? location.state : null
  const [extras, setExtras] = useState(null)

  // 關閉時內容多留 --dur-panel-close，讓滑下去的面板裡還有東西（空玻璃板滑走很突兀；地圖則是圖磚瞬間消失）；
  // DetailModal 用 displayRow 做同一件事。isOpen 仍由 activeModal / mapOpen 即時驅動。
  const openSheet = activeModal ?? (mapOpen ? 'map' : null)
  const [renderedSheet, setRenderedSheet] = useState(openSheet)
  useEffect(() => {
    if (openSheet) { setRenderedSheet(openSheet); return }
    const id = setTimeout(() => setRenderedSheet(null), PANEL_CLOSE_MS)
    return () => clearTimeout(id)
  }, [openSheet])

  // 地圖每次開啟都要是新的 TripMap instance（mode / routeDay / focusIdx 重置成「探索 + 當天」）。
  // 關閉後 renderedSheet 仍讓它掛載 PANEL_CLOSE_MS，此時重開會沿用舊 instance → 以開啟次數當 key 強制重掛。
  // 用 render 期間比對前值（React 官方「prop 變動時調整 state」寫法），避免 effect 造成先渲染舊 instance 再重掛
  const [mapOpenCount, setMapOpenCount] = useState(mapOpen ? 1 : 0)
  const [prevMapOpen, setPrevMapOpen] = useState(mapOpen)
  if (mapOpen !== prevMapOpen) {
    setPrevMapOpen(mapOpen)
    if (mapOpen) setMapOpenCount((c) => c + 1)
  }

  // 開啟＝push 一筆新 history；關閉（X／ESC／backdrop／拖曳關閉）一律 navigate(-1)，
  // 讓 UI 關閉動作與瀏覽器上一頁行為完全一致，不會兩者狀態打架。
  const openPanel = useCallback((key) => {
    navigate(`${location.pathname}${location.search}`, { state: { panel: key } })
  }, [navigate, location.pathname, location.search])
  const closePanel = useCallback(() => { navigate(-1) }, [navigate])
  // Sidebar → 選單項目：replace 蓋掉 sidebar 那筆 entry，上一頁會直接回到頁面本身，
  // 不會先經過「sidebar 開啟」的中繼態。
  const replacePanel = useCallback((key) => {
    navigate(`${location.pathname}${location.search}`, { state: { panel: key }, replace: true })
  }, [navigate, location.pathname, location.search])
  const openMap = useCallback(() => openPanel('map'), [openPanel])
  const openDetail = useCallback((day, key) => {
    navigate(`${location.pathname}${location.search}`, { state: { panel: 'detail', day, detailKey: key } })
  }, [navigate, location.pathname, location.search])

  // 各 sheet tab data
  const flightsHook = useSheetData(trip?.sheet_id, 'flights')
  const itineraryHook = useSheetData(trip?.sheet_id, 'itinerary')
  const accommodationHook = useSheetData(trip?.sheet_id, 'accommodation')
  const shoppingHook = useSheetData(trip?.sheet_id, 'shopping')
  const checklistHook = useSheetData(trip?.sheet_id, 'checklist')
  const foodHook = useSheetData(trip?.sheet_id, 'food')
  const daysHook = useSheetData(trip?.sheet_id, 'days')
  const prepareHook = useSheetData(trip?.sheet_id, 'prepare')

  const { data: flights, loading: flightsLoading } = flightsHook
  const { data: itinerary, loading: itineraryLoading } = itineraryHook
  const { data: accommodation } = accommodationHook
  const { data: shopping } = shoppingHook
  const { data: checklist } = checklistHook
  const { data: food } = foodHook
  const { data: daysData } = daysHook
  const { data: prepare } = prepareHook

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
      prepareHook.refresh(),
    ])
  }, [
    flightsHook.refresh, itineraryHook.refresh, accommodationHook.refresh,
    shoppingHook.refresh, checklistHook.refresh, foodHook.refresh, daysHook.refresh,
    prepareHook.refresh,
  ])
  const { refreshing, showIndicator: showPullIndicator, indicatorRef: pullIndicatorRef } = usePullToRefresh(refreshAllSheets, {
    // 任何疊層（側欄 / 四個 sheet / 地圖 / 行程詳情 DetailModal）打開時停掉 pull-to-refresh，
    // 避免跟拖曳關閉手勢衝突：DetailModal 高度 85vh 時把手落在頂端 140px 起手區內，
    // 曾因 panel === 'detail' 沒被排除而「拖關 modal 同時觸發刷新」。
    enabled: panel === null,
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

  useScrollLock(sidebarOpen || !!activeModal || easterEgg.open || mapOpen)

  usePageMeta({
    title: trip ? `${trip.name}｜${trip.dates || ''}`.replace(/｜$/, '') : '行程',
    description: trip ? `${trip.name} ${trip.dates || ''} 旅行記錄`.trim() : undefined,
    image: trip?.cover_image_url || undefined,
  })

  const normalizedItinerary = useNormalizedItinerary(itinerary, trip?.dates)
  const normalizedDays = useNormalizedDays(daysData, trip?.dates)
  const days = useDays(normalizedItinerary, trip?.dates)

  // 第一次拿到 itinerary 時決定初始 day：優先讀 URL 的 ?d=（clamp 到有效範圍），
  // 讀不到／超界才退回原本「今天」自動選 day 邏輯（user 手動切過後不再覆蓋）。
  useEffect(() => {
    if (initialDayPickedRef.current || days.length === 0) return
    const dParam = Number(new URLSearchParams(location.search).get('d'))
    let initial
    if (Number.isInteger(dParam)) {
      const clamped = Math.min(Math.max(dParam, 1), days.length)
      initial = days.some(d => d.day === clamped) ? clamped : pickInitialDay(days)
    } else {
      initial = pickInitialDay(days)
    }
    setActiveDay(initial)
    initialDayPickedRef.current = true
  }, [days, location.search])

  // activeDay → ?d=<1-based>，replace 避免灑 history；只在真的改變時才寫入 URL
  useEffect(() => {
    if (!initialDayPickedRef.current) return
    const params = new URLSearchParams(location.search)
    if (params.get('d') === String(activeDay)) return
    params.set('d', String(activeDay))
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true, state: location.state })
    // 只在 activeDay 改變時同步一次；day 變動時 sidebar/modal/地圖理應已關閉，
    // 刻意不把 location/navigate 列進 deps，避免 URL 被我們自己的 replace 觸發二次同步
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDay])

  // 切天 = 換到新畫面，捲回頂端從該天 banner 看起，不繼承上一天的捲動位置。
  // 涵蓋 swipe 與 DayNav 兩種切天（皆最終改 activeDay）；swipe 的歸位正好在
  // activeDay 改變那刻發生，舊天滑走、新天從頂端出現，instant 回頂最連貫。
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [activeDay])

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
  const mapPoints = useMemo(
    () => mergeMapPoints(
      toMapPoints(normalizedItinerary),
      [
        ...listToMapPoints(food, 'food'),
        ...shoppingToMapPoints(shopping),
        ...listToMapPoints(accommodation, 'hotel'),
      ]
    ),
    [normalizedItinerary, food, shopping, accommodation]
  )
  const hasMapPoints = mapPoints.length > 0

  // 左右滑動切日手勢
  const swipe = useDaySwipe({
    days,
    activeDay,
    setActiveDay,
    enabled: !sidebarOpen && !activeModal && !mapOpen,
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
    return <TripSkeleton />
  }

  if (!trip) {
    return (
      <main id="main" tabIndex={-1} className="bg-washi min-h-screen safe-area-inset flex flex-col items-center justify-center">
        <ErrorState
          title="找不到此行程"
          message="可能網址有誤或行程已下架"
          actionLabel="回行程列表"
          onAction={() => navigate('/?home=1')}
        />
      </main>
    )
  }

  // 核心資料（itinerary，驅動時間軸內容與 DayNav 的 days 清單）fetch 失敗又沒有任何快取資料可退回時，
  // 整頁沒東西可顯示，給全頁 ErrorState + 重試；有 stale cache 則照 SWR 語意照常顯示舊資料，不擋。
  if (itineraryHook.error && itinerary.length === 0) {
    return (
      <main id="main" tabIndex={-1} className="bg-washi min-h-screen safe-area-inset flex flex-col items-center justify-center">
        <ErrorState
          title="無法載入行程資料"
          message="請檢查網路連線後重試"
          onAction={() => { itineraryHook.refresh(); daysHook.refresh() }}
        />
      </main>
    )
  }

  const yearMonth = getYearMonth(trip.dates)
  const tripNameEn = getTripNameEn(trip, slug)

  return (
    <div className="bg-washi min-h-screen text-jp-text font-serif pb-12 safe-area-inset relative">
      {/* Pull-to-refresh indicator：floating，不平移內容（避免干擾 day swipe transform） */}
      {showPullIndicator && (
        <div
          ref={pullIndicatorRef}
          className="fixed left-0 right-0 top-0 flex justify-center pointer-events-none z-30"
          style={{ transform: 'translateY(0px)', opacity: 0 }}
        >
          <div className="frosted-glass-button rounded-full p-3 text-muted">
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </div>
        </div>
      )}

      <main id="main" tabIndex={-1} className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="relative pt-8 pb-4 px-6 flex items-center justify-between">
          <button
            onClick={() => openPanel('sidebar')}
            className="p-3 frosted-glass-button rounded-full text-muted touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="開啟選單"
          >
            <Menu size={24} />
          </button>
          <div className="flex flex-col items-center flex-1 px-4">
            {yearMonth && (
              <p className="text-2xs tracking-[0.3em] uppercase text-stone-400 mb-2 font-serif font-medium">{yearMonth}</p>
            )}
            <p className="text-xs tracking-[0.15em] uppercase text-stone-400 mb-3 font-serif font-medium">
              {tripNameEn.replace(' TRIP', ' Trip')}
            </p>
            <h1 className="text-2xl font-bold tracking-[0.1em] text-jp-text leading-tight">{trip.name}旅行</h1>
          </div>
          {hasMapPoints ? (
            <button
              onClick={openMap}
              className="p-3 frosted-glass-button rounded-full text-muted touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="開啟地圖"
            >
              <MapIcon size={24} />
            </button>
          ) : (
            <div className="w-10" />
          )}
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
            easterEggIcon={easterEgg.activated && extras ? <extras.HeartIcon activated hidden={easterEgg.heartHidden} /> : null}
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
                <DayPanel dayObj={prevDayObj} dayMeta={prevDayMeta} itinerary={prevDayItinerary} tripName={trip.name} detailState={detailState} onOpenDetail={openDetail} onCloseDetail={closePanel} />
              </div>
            )}
            {/* Current panel：normal flow，撐整個 carousel 高度 */}
            <DayPanel
              dayObj={{ day: activeDay, date: days.find(d => d.day === activeDay)?.date }}
              dayMeta={activeDayMeta}
              itinerary={dayItinerary}
              tripName={trip.name}
              isCurrent
              detailState={detailState}
              onOpenDetail={openDetail}
              onCloseDetail={closePanel}
            />
            {/* Next panel：absolute 放在右側 (left-full)，不參與高度 */}
            {nextDayObj && (
              <div className="absolute top-0 left-full w-full overflow-hidden">
                <DayPanel dayObj={nextDayObj} dayMeta={nextDayMeta} itinerary={nextDayItinerary} tripName={trip.name} detailState={detailState} onOpenDetail={openDetail} onCloseDetail={closePanel} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closePanel}
        onSelect={replacePanel}
        sections={MENU_ITEMS}
        tripNameEn={tripNameEn}
        countryCode={trip.destination_country}
      />

      {/* Section Modals */}
      <BottomSheet isOpen={activeModal === 'info'} onClose={closePanel} title="旅程資訊" noScroll noStickyTitle>
        {renderedSheet === 'info' && (
          <LazySection fallback={<SectionSkeleton />}>
            {flightsHook.loading || accommodationHook.loading || prepareHook.loading
              ? <SectionSkeleton />
              : flightsHook.error && flights.length === 0
                && accommodationHook.error && accommodation.length === 0
                && prepareHook.error && prepare.length === 0
                ? (
                  <SectionError onRetry={() => {
                    flightsHook.refresh()
                    accommodationHook.refresh()
                    prepareHook.refresh()
                  }} />
                )
                : <TripInfoSection flights={flights} accommodation={accommodation} prepare={prepare} />}
          </LazySection>
        )}
      </BottomSheet>

      <BottomSheet isOpen={activeModal === 'checklist'} onClose={closePanel} title="行李清單" noScroll noStickyTitle>
        {renderedSheet === 'checklist' && (
          <LazySection fallback={<SectionSkeleton bottomBar={false} />}>
            {checklistHook.loading
              ? <SectionSkeleton bottomBar={false} />
              : checklistHook.error && checklist.length === 0
                ? <SectionError onRetry={checklistHook.refresh} />
                : <ChecklistSection key={`checklist-${slug}`} rows={checklist} slug={slug} />}
          </LazySection>
        )}
      </BottomSheet>

      <BottomSheet isOpen={activeModal === 'shopping'} onClose={closePanel} title="逛街清單" noScroll noStickyTitle>
        {renderedSheet === 'shopping' && (
          <LazySection fallback={<SectionSkeleton />}>
            {shoppingHook.loading
              ? <SectionSkeleton />
              : shoppingHook.error && shopping.length === 0
                ? <SectionError onRetry={shoppingHook.refresh} />
                : <ShoppingSection rows={shopping} />}
          </LazySection>
        )}
      </BottomSheet>

      <BottomSheet isOpen={activeModal === 'food'} onClose={closePanel} title="美食清單" noScroll noStickyTitle>
        {renderedSheet === 'food' && (
          <LazySection fallback={<SectionSkeleton />}>
            {foodHook.loading
              ? <SectionSkeleton />
              : foodHook.error && foodItems.length === 0
                ? <SectionError onRetry={foodHook.refresh} />
                : <FoodSection rows={foodItems} />}
          </LazySection>
        )}
      </BottomSheet>

      {/* Map */}
      <BottomSheet isOpen={mapOpen} onClose={closePanel} title="行程地圖" noScroll noStickyTitle tall>
        {renderedSheet === 'map' && (
          <LazySection fallback={<SectionSkeleton />}>
            <TripMap key={mapOpenCount} points={mapPoints} days={days} activeDay={activeDay} />
          </LazySection>
        )}
      </BottomSheet>

      {/* Easter Egg Modal */}
      {extras?.ProposalModal && (
        <extras.ProposalModal
          isOpen={easterEgg.open}
          onClose={easterEgg.reset}
          heartPosition={easterEgg.heartPosition}
          onRevealStart={easterEgg.hideHeart}
          warm={activeDay === extras.easterEggDay}
        />
      )}
    </div>
  )
}

// Section modal 內的錯誤狀態：fetch 失敗且沒有任何快取資料可退回時取代 EmptyState，
// 讓「失敗」與「本來就沒資料」可以區分，並提供重試。有 stale cache 時不會走到這裡
// （SWR 語意：照常顯示舊資料，背景重試失敗不打擾使用者）。
function SectionError({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <ErrorState message="請檢查網路連線後重試" onAction={onRetry} />
    </div>
  )
}

// lazy section 的外框：Suspense 管載入中；ErrorBoundary 接住 chunk 載入失敗（離線且 SW 沒快取到），
// 只把這個 sheet 換成錯誤狀態，不讓 lazy import 的 reject 冒到 App 的全域 boundary 把整個 app 弄掛。
// React.lazy 會記住失敗的 import，所以重試只能整頁重載。
function LazySection({ fallback, children }) {
  return (
    <ErrorBoundary fallback={<SectionError onRetry={() => window.location.reload()} />}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  )
}

// 單一日 panel：banner + itinerary list；dayObj 為 null 時整格不渲染（給三欄第一/末日用）
function DayPanel({ dayObj, dayMeta, itinerary, tripName, isCurrent = false, detailState, onOpenDetail, onCloseDetail }) {
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
        date={dayObj.date}
        dayNumber={dayObj.day}
      />
      <div className="h-6" />
      <div className="mt-2">
        <ItinerarySection
          rows={itinerary}
          dayDate={dayObj.date}
          detailKey={detailState?.day === dayObj.day ? detailState.detailKey : null}
          onOpenDetail={(key) => onOpenDetail(dayObj.day, key)}
          onCloseDetail={onCloseDetail}
        />
      </div>
    </div>
  )
}
