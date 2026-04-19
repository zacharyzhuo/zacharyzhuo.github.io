import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { Menu, Info, ClipboardList, ShoppingBag, Utensils } from 'lucide-react'
import { useTrips } from '../hooks/useTrips.js'
import { useSheetData } from '../hooks/useSheetData.js'
import { useScrollLock } from '../hooks/useScrollLock.js'
import { pickInitialDay } from '../lib/tripDate.js'
import { bump } from '../lib/haptic.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { useDays, useFoodItems } from '../hooks/useTripDerived.js'

const LAST_TRIP_KEY = 'lastTripSlug'
// 切換日期手勢的閾值：拖曳超過 50px 或速度超過 0.5px/ms 就 commit
const SWIPE_DISTANCE_THRESHOLD = 50
const SWIPE_VELOCITY_THRESHOLD = 0.5
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

const MENU_ITEMS = [
  {
    key: 'info',
    label: '旅程資訊',
    subLabel: 'Flight & Info',
    icon: <Info size={20} />,
    color: 'bg-blue-50/80 text-blue-600',
  },
  {
    key: 'checklist',
    label: '行李清單',
    subLabel: 'Packing List',
    icon: <ClipboardList size={22} />,
    color: 'bg-green-50/80 text-green-600',
  },
  {
    key: 'shopping',
    label: '逛街清單',
    subLabel: 'Shopping Map',
    icon: <ShoppingBag size={22} />,
    color: 'bg-pink-50/80 text-pink-600',
  },
  {
    key: 'food',
    label: '美食清單',
    subLabel: 'Food List',
    icon: <Utensils size={22} />,
    color: 'bg-orange-50/80 text-orange-600',
  },
]

function getYearMonth(dates) {
  return dates?.match(/^(\d{4}\/\d{2})/)?.[1] ?? ''
}

function slugToEnglish(slug) {
  // "tokyo-hokkaido-2026-03" → "TOKYO HOKKAIDO TRIP"
  // "fukuoka-2026-01" → "FUKUOKA TRIP"
  const base = slug.replace(/-\d{4}-\d{2}$/, '').replace(/-/g, ' ')
  return base.toUpperCase() + ' TRIP'
}

/**
 * 優先用 CMS 提供的 name_en（人為編輯），fallback 到 slug 解析。
 * 接收物件而非字串，方便日後擴充其他欄位。
 */
function getTripNameEn(trip, slug) {
  const fromCms = trip?.name_en?.trim()
  if (fromCms) return fromCms.toUpperCase().endsWith(' TRIP')
    ? fromCms.toUpperCase()
    : `${fromCms.toUpperCase()} TRIP`
  return slugToEnglish(slug)
}

export default function TripPage() {
  const { slug } = useParams()
  const { trips, loading: tripsLoading } = useTrips()
  const trip = trips.find(t => t.slug === slug)

  const daySwipeContainerRef = useRef(null)
  const carouselInnerRef = useRef(null)

  const [activeDay, setActiveDay] = useState(1)
  const initialDayPickedRef = useRef(false)

  // 日期切換手勢：dragX 跟手位移；isDragging=true 時關閉 transition 達到 1:1 跟手
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragXRef = useRef(0)
  const dragStartRef = useRef(null)
  const dragHorizontalRef = useRef(null)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeModal, setActiveModal] = useState(null)
  const [isCarouselAnimating, setIsCarouselAnimating] = useState(false)
  const [extras, setExtras] = useState(null)
  const [easterEggOpen, setEasterEggOpen] = useState(false)
  const [heartPosition, setHeartPosition] = useState(null)
  const [easterEggActivated, setEasterEggActivated] = useState(false)
  const eggClickCount = useRef(0)
  const lastEggClickTime = useRef(0)

  const { data: flights, loading: flightsLoading } = useSheetData(trip?.sheet_id, 'flights')
  const { data: itinerary, loading: itineraryLoading } = useSheetData(trip?.sheet_id, 'itinerary')
  const { data: accommodation } = useSheetData(trip?.sheet_id, 'accommodation')
  const { data: shopping } = useSheetData(trip?.sheet_id, 'shopping')
  const { data: checklist } = useSheetData(trip?.sheet_id, 'checklist')
  const { data: food } = useSheetData(trip?.sheet_id, 'food')
  const { data: daysData } = useSheetData(trip?.sheet_id, 'days')

  useEffect(() => {
    if (!slug) {
      setExtras(null)
      return
    }
    let cancelled = false
    import(`../trips/${slug}/extras.jsx`)
      .then(m => { if (!cancelled) setExtras(m.default) })
      .catch(() => { if (!cancelled) setExtras(null) })
    return () => { cancelled = true }
  }, [slug])

  // 切換 trip 時記下「最後造訪行程」，PWA 啟動時 HomePage 會用來判斷是否自動跳轉
  useEffect(() => {
    if (!slug) return
    initialDayPickedRef.current = false
    try { localStorage.setItem(LAST_TRIP_KEY, slug) } catch { /* ignore */ }
  }, [slug])

  useScrollLock(sidebarOpen || !!activeModal || easterEggOpen)

  usePageMeta({
    title: trip ? `${trip.name}｜${trip.dates || ''}`.replace(/｜$/, '') : '行程',
    description: trip ? `${trip.name} ${trip.dates || ''} 旅行記錄`.trim() : undefined,
    image: trip?.cover_image_url || undefined,
  })

  const days = useDays(itinerary)

  // 第一次拿到 itinerary 資料時自動跳到「今天」對應的 day。
  // 用 ref 確保 user 手動切過之後不會被覆蓋；切換 trip 時 ref 會被 reset。
  useEffect(() => {
    if (initialDayPickedRef.current || days.length === 0) return
    setActiveDay(pickInitialDay(days))
    initialDayPickedRef.current = true
  }, [days])

  const activeDayMeta = useMemo(
    () => daysData.find(r => Number(r.day) === activeDay),
    [daysData, activeDay]
  )
  const dayItinerary = useMemo(
    () => itinerary.filter(r => Number(r.day) === activeDay),
    [itinerary, activeDay]
  )
  const foodItems = useFoodItems(food, itinerary)

  // 輪播三欄：前一天 / 當天 / 後一天
  const activeDayIdx = useMemo(() => days.findIndex(d => d.day === activeDay), [days, activeDay])
  const prevDayObj = activeDayIdx > 0 ? days[activeDayIdx - 1] : null
  const nextDayObj = activeDayIdx < days.length - 1 ? days[activeDayIdx + 1] : null
  const prevDayMeta = useMemo(
    () => prevDayObj ? daysData.find(r => Number(r.day) === prevDayObj.day) : null,
    [daysData, prevDayObj]
  )
  const nextDayMeta = useMemo(
    () => nextDayObj ? daysData.find(r => Number(r.day) === nextDayObj.day) : null,
    [daysData, nextDayObj]
  )
  const prevDayItinerary = useMemo(
    () => prevDayObj ? itinerary.filter(r => Number(r.day) === prevDayObj.day) : [],
    [itinerary, prevDayObj]
  )
  const nextDayItinerary = useMemo(
    () => nextDayObj ? itinerary.filter(r => Number(r.day) === nextDayObj.day) : [],
    [itinerary, nextDayObj]
  )

  // 左右滑動切換日期：跟手位移 + commit 時順勢回彈過場
  const handleDaySwipeTouchStart = (e) => {
    if (sidebarOpen || activeModal || days.length <= 1) return
    const t = e.touches[0]
    dragStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() }
    dragHorizontalRef.current = null
    dragXRef.current = 0
    setIsDragging(true)
    setDragX(0)
  }

  // 非 passive 的 touchmove 才能 preventDefault 阻止頁面捲動
  useEffect(() => {
    const el = daySwipeContainerRef.current
    if (!el) return

    const onMove = (e) => {
      if (!dragStartRef.current) return
      const dx = e.touches[0].clientX - dragStartRef.current.x
      const dy = e.touches[0].clientY - dragStartRef.current.y

      // 第一次明顯的移動決定方向；垂直拖則放棄手勢，讓頁面正常捲動
      if (dragHorizontalRef.current === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        dragHorizontalRef.current = Math.abs(dx) > Math.abs(dy)
        if (!dragHorizontalRef.current) {
          // 確認是垂直滑動 → 取消手勢追蹤
          dragStartRef.current = null
          setIsDragging(false)
          return
        }
      }

      e.preventDefault()

      // 邊界阻尼：第一天往右拉、最後一天往左拉時施加 0.3x damping
      const idx = days.findIndex(d => d.day === activeDay)
      let damped = dx
      if ((idx === 0 && dx > 0) || (idx === days.length - 1 && dx < 0)) {
        damped = dx * 0.3
      }
      dragXRef.current = damped
      // 直接操作 DOM，不走 React state — 避免每幀 re-render 造成卡頓
      if (carouselInnerRef.current) {
        carouselInnerRef.current.style.transform = `translateX(calc(-33.333% + ${damped}px))`
      }
    }

    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [days, activeDay, sidebarOpen, activeModal])

  const handleDaySwipeTouchEnd = () => {
    if (!dragStartRef.current) {
      setIsDragging(false)
      return
    }
    const dx = dragXRef.current
    const elapsed = Math.max(1, Date.now() - dragStartRef.current.time)
    const velocity = Math.abs(dx) / elapsed
    const idx = days.findIndex(d => d.day === activeDay)

    dragStartRef.current = null
    dragHorizontalRef.current = null
    dragXRef.current = 0

    const passDistance = Math.abs(dx) >= SWIPE_DISTANCE_THRESHOLD
    const passVelocity = velocity >= SWIPE_VELOCITY_THRESHOLD && Math.abs(dx) > 10

    if (passDistance || passVelocity) {
      if (dx < 0 && idx < days.length - 1) {
        bump()
        // Phase 1：把動畫跑完（滑到 -100vw）
        setIsDragging(false)
        setDragX(-window.innerWidth)
        // Phase 2：動畫結束後瞬間換內容 + 歸零（無 transition）
        setTimeout(() => {
          setIsCarouselAnimating(true)
          setActiveDay(days[idx + 1].day)
          setDragX(0)
          requestAnimationFrame(() => requestAnimationFrame(() => setIsCarouselAnimating(false)))
        }, 300)
        return
      } else if (dx > 0 && idx > 0) {
        bump()
        setIsDragging(false)
        setDragX(window.innerWidth)
        setTimeout(() => {
          setIsCarouselAnimating(true)
          setActiveDay(days[idx - 1].day)
          setDragX(0)
          requestAnimationFrame(() => requestAnimationFrame(() => setIsCarouselAnimating(false)))
        }, 300)
        return
      }
    }

    // 未達閾值：彈回中心
    // dragX React state 在拖動中始終是 0（直接操作 DOM），setDragX(0) 不會觸發 DOM 更新。
    // 改為直接操作 DOM 加 transition 做回彈，動畫結束後再讓 React 接管。
    const snapEl = carouselInnerRef.current
    if (snapEl && dx !== 0) {
      snapEl.style.transition = 'transform 300ms ease-out'
      snapEl.style.transform = 'translateX(-33.333%)'
      setTimeout(() => {
        if (carouselInnerRef.current) carouselInnerRef.current.style.transition = ''
        setIsDragging(false)
      }, 300)
    } else {
      setIsDragging(false)
    }
  }

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

  return (
    <div
      className="min-h-screen bg-jp-bg text-jp-text font-serif pb-12 safe-area-inset"
    >
      <div>
      {/* Header: centered multi-line, hamburger absolute-left */}
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
            setActiveDay(day)

            if (!extras || day !== extras.easterEggDay) return

            if (activeDay !== day) {
              eggClickCount.current = 0
              lastEggClickTime.current = 0
              return
            }

            const now = Date.now()
            const newCount = (now - lastEggClickTime.current > 2000) ? 1 : eggClickCount.current + 1
            eggClickCount.current = newCount
            lastEggClickTime.current = now

            if (newCount >= 9) {
              setEasterEggActivated(true)
              eggClickCount.current = 0
              const btn = document.querySelector(`[data-day="${day}"]`)
              if (btn) {
                const rect = btn.getBoundingClientRect()
                setHeartPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
              }
              setEasterEggOpen(true)
            }
          }}
          easterEggDay={extras?.easterEggDay}
          easterEggIcon={
            easterEggActivated && extras ? (
              <extras.HeartIcon activated />
            ) : null
          }
        />
      )}

      {/* Day swipe zone：三欄輪播（prev｜current｜next），拖動時看到隔壁內容 */}
      <div
        ref={daySwipeContainerRef}
        onTouchStart={handleDaySwipeTouchStart}
        onTouchEnd={handleDaySwipeTouchEnd}
        onTouchCancel={handleDaySwipeTouchEnd}
        className="overflow-hidden"
      >
        {/* 寬 300%、每欄 33.333%；基礎偏移 -33.333%（顯示中間欄），拖動時加 dragX */}
        <div
          ref={carouselInnerRef}
          style={{
            display: 'flex',
            width: '300%',
            transform: `translateX(calc(-33.333% + ${dragX}px))`,
            willChange: 'transform',
          }}
          className={(!isDragging && !isCarouselAnimating) ? 'transition-transform duration-300 ease-out' : ''}
        >
          {/* Prev panel */}
          <div style={{ width: '33.333%', flexShrink: 0 }}>
            {prevDayObj && (
              <>
                <DayBanner
                  bannerUrl={prevDayMeta?.banner_url}
                  title={prevDayMeta?.title}
                  subtitle={prevDayMeta?.subtitle}
                />
                <div className="h-8" />
                <div className="mt-2">
                  <ItinerarySection rows={prevDayItinerary} />
                </div>
              </>
            )}
          </div>

          {/* Current panel */}
          <div style={{ width: '33.333%', flexShrink: 0 }}>
            <DayBanner
              bannerUrl={activeDayMeta?.banner_url}
              title={activeDayMeta?.title}
              subtitle={activeDayMeta?.subtitle}
            />
            <div className="h-8" />
            <div className="mt-2">
              <ItinerarySection rows={dayItinerary} />
            </div>
          </div>

          {/* Next panel */}
          <div style={{ width: '33.333%', flexShrink: 0 }}>
            {nextDayObj && (
              <>
                <DayBanner
                  bannerUrl={nextDayMeta?.banner_url}
                  title={nextDayMeta?.title}
                  subtitle={nextDayMeta?.subtitle}
                />
                <div className="h-8" />
                <div className="mt-2">
                  <ItinerarySection rows={nextDayItinerary} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </div>{/* /content wrapper */}

      {/* Trip Menu Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={(key) => { setActiveModal(key); setSidebarOpen(false) }}
        sections={MENU_ITEMS}
        tripNameEn={tripNameEn}
      />
      {/* Section Modals */}
      <BottomSheet
        isOpen={activeModal === 'info'}
        onClose={() => setActiveModal(null)}
        title="旅程資訊"
        noScroll
        noStickyTitle
      >
        {activeModal === 'info' && (
          <Suspense fallback={<div className="p-8 text-stone-400">載入中…</div>}>
            <TripInfoSection flights={flights} accommodation={accommodation} destinationCountry={trip?.destination_country} />
          </Suspense>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={activeModal === 'checklist'}
        onClose={() => setActiveModal(null)}
        title="行李清單"
        noScroll
        noStickyTitle
      >
        {activeModal === 'checklist' && (
          <Suspense fallback={<div className="p-8 text-stone-400">載入中…</div>}>
            <ChecklistSection key={`checklist-${slug}`} rows={checklist} slug={slug} />
          </Suspense>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={activeModal === 'shopping'}
        onClose={() => setActiveModal(null)}
        title="逛街清單"
        noScroll
        noStickyTitle
      >
        {activeModal === 'shopping' && (
          <Suspense fallback={<div className="p-8 text-stone-400">載入中…</div>}>
            <ShoppingSection rows={shopping} />
          </Suspense>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={activeModal === 'food'}
        onClose={() => setActiveModal(null)}
        title="美食清單"
        noScroll
        noStickyTitle
      >
        {activeModal === 'food' && (
          <Suspense fallback={<div className="p-8 text-stone-400">載入中…</div>}>
            <FoodSection rows={foodItems} />
          </Suspense>
        )}
      </BottomSheet>

      {/* Easter Egg Modal */}
      {extras?.ProposalModal && (
        <extras.ProposalModal
          isOpen={easterEggOpen}
          onClose={() => {
            setEasterEggOpen(false)
            eggClickCount.current = 0
            setEasterEggActivated(false)
            setHeartPosition(null)
          }}
          heartPosition={heartPosition}
        />
      )}
    </div>
  )
}
