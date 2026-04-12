import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Menu, Info, ClipboardList, ShoppingBag, Utensils } from 'lucide-react'
import { useTrips } from '../hooks/useTrips.js'
import { useSheetData } from '../hooks/useSheetData.js'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import Sidebar from '../components/layout/Sidebar.jsx'
import BottomSheet from '../components/layout/BottomSheet.jsx'
import DayNav from '../components/trip/DayNav.jsx'
import DayBanner from '../components/trip/DayBanner.jsx'
import TripInfoSection from '../components/trip/TripInfoSection.jsx'
import ItinerarySection from '../components/trip/ItinerarySection.jsx'
import ShoppingSection from '../components/trip/ShoppingSection.jsx'
import ChecklistSection from '../components/trip/ChecklistSection.jsx'
import FoodSection from '../components/trip/FoodSection.jsx'

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

export default function TripPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { trips, loading: tripsLoading } = useTrips()
  const trip = trips.find(t => t.slug === slug)

  const edgeSwipeRef = useRef(null)
  const daySwipeRef = useRef(null)

  const [activeDay, setActiveDay] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeModal, setActiveModal] = useState(null)
  const [extras, setExtras] = useState(null)
  const [easterEggOpen, setEasterEggOpen] = useState(false)
  const [heartPosition, setHeartPosition] = useState(null)
  const [easterEggActivated, setEasterEggActivated] = useState(false)
  const [eggClickCount, setEggClickCount] = useState(0)
  const [lastEggClickTime, setLastEggClickTime] = useState(0)

  const { data: flights, loading: flightsLoading } = useSheetData(trip?.sheet_id, 'flights')
  const { data: itinerary, loading: itineraryLoading } = useSheetData(trip?.sheet_id, 'itinerary')
  const { data: accommodation } = useSheetData(trip?.sheet_id, 'accommodation')
  const { data: shopping } = useSheetData(trip?.sheet_id, 'shopping')
  const { data: checklist } = useSheetData(trip?.sheet_id, 'checklist')
  const { data: food } = useSheetData(trip?.sheet_id, 'food')
  const { data: daysData } = useSheetData(trip?.sheet_id, 'days')

  useEffect(() => {
    if (!slug) return
    import(`../trips/${slug}/extras.jsx`)
      .then(m => setExtras(m.default))
      .catch(() => setExtras(null))
  }, [slug])

  // Prevent background scroll when any modal/sidebar is open
  useEffect(() => {
    const isAnyOpen = sidebarOpen || activeModal || easterEggOpen
    document.body.style.overflow = isAnyOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [sidebarOpen, activeModal, easterEggOpen])

  const days = [...new Set(itinerary.map(r => Number(r.day)))]
    .sort((a, b) => a - b)
    .map(day => {
      const row = itinerary.find(r => Number(r.day) === day)
      return { day, date: row?.date ?? '' }
    })

  const activeDayMeta = daysData.find(r => Number(r.day) === activeDay)
  const dayItinerary = itinerary.filter(r => Number(r.day) === activeDay)
  const foodItems = food.length > 0 ? food : itinerary.filter(r => r.type === 'food')

  // 右滑返回首頁（限左緣 30px 內起始）
  const handleEdgeTouchStart = (e) => {
    if (sidebarOpen || activeModal) return
    const t = e.touches[0]
    if (t.clientX > 30) return
    edgeSwipeRef.current = { x: t.clientX, y: t.clientY }
  }
  const handleEdgeTouchEnd = (e) => {
    if (!edgeSwipeRef.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - edgeSwipeRef.current.x
    const dy = t.clientY - edgeSwipeRef.current.y
    edgeSwipeRef.current = null
    if (Math.abs(dy) > Math.abs(dx) || dx < 60) return
    navigate(-1)
  }

  // 左右滑動切換日期（掛在 DayBanner + ItinerarySection 區域，避開 DayNav 橫向捲動）
  const handleDaySwipeTouchStart = (e) => {
    if (sidebarOpen || activeModal || days.length <= 1) return
    const t = e.touches[0]
    daySwipeRef.current = { x: t.clientX, y: t.clientY }
  }
  const handleDaySwipeTouchEnd = (e) => {
    if (!daySwipeRef.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - daySwipeRef.current.x
    const dy = t.clientY - daySwipeRef.current.y
    daySwipeRef.current = null
    if (Math.abs(dy) > Math.abs(dx) || Math.abs(dx) < 50) return
    const idx = days.findIndex(d => d.day === activeDay)
    if (dx < 0 && idx < days.length - 1) setActiveDay(days[idx + 1].day)
    if (dx > 0 && idx > 0) setActiveDay(days[idx - 1].day)
  }

  if (tripsLoading || flightsLoading || itineraryLoading) {
    return <div className="bg-jp-bg min-h-screen safe-area-inset"><LoadingSpinner /></div>
  }

  if (!trip) {
    return (
      <div className="bg-jp-bg min-h-screen safe-area-inset flex flex-col items-center justify-center gap-4">
        <p className="text-jp-sub font-serif">找不到此行程</p>
      </div>
    )
  }

  const yearMonth = getYearMonth(trip.dates)
  const tripNameEn = slugToEnglish(slug)

  return (
    <div
      className="min-h-screen bg-jp-bg text-jp-text font-serif pb-12 safe-area-inset"
      onTouchStart={handleEdgeTouchStart}
      onTouchEnd={handleEdgeTouchEnd}
    >
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
              setEggClickCount(0)
              setLastEggClickTime(0)
              return
            }

            const now = Date.now()
            const newCount = (now - lastEggClickTime > 2000) ? 1 : eggClickCount + 1
            setEggClickCount(newCount)
            setLastEggClickTime(now)

            if (newCount >= 9) {
              setEasterEggActivated(true)
              setEggClickCount(0)
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

      {/* Day swipe zone：Banner + Itinerary，刻意不包含 DayNav 避免橫向捲動衝突 */}
      <div
        onTouchStart={handleDaySwipeTouchStart}
        onTouchEnd={handleDaySwipeTouchEnd}
      >
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

      {/* Trip Menu Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={(key) => { setActiveModal(key); setSidebarOpen(false) }}
        sections={MENU_ITEMS}
        trip={trip}
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
        <TripInfoSection flights={flights} accommodation={accommodation} trip={trip} />
      </BottomSheet>

      <BottomSheet
        isOpen={activeModal === 'checklist'}
        onClose={() => setActiveModal(null)}
        title="行李清單"
      >
        <ChecklistSection rows={checklist} />
      </BottomSheet>

      <BottomSheet
        isOpen={activeModal === 'shopping'}
        onClose={() => setActiveModal(null)}
        title="逛街清單"
        noScroll
        noStickyTitle
      >
        <ShoppingSection rows={shopping} />
      </BottomSheet>

      <BottomSheet
        isOpen={activeModal === 'food'}
        onClose={() => setActiveModal(null)}
        title="美食清單"
        noScroll
        noStickyTitle
      >
        <FoodSection rows={foodItems} />
      </BottomSheet>

      {/* Easter Egg Modal */}
      {extras?.ProposalModal && (
        <extras.ProposalModal
          isOpen={easterEggOpen}
          onClose={() => {
            setEasterEggOpen(false)
            setEggClickCount(0)
            setEasterEggActivated(false)
            setHeartPosition(null)
          }}
          heartPosition={heartPosition}
        />
      )}
    </div>
  )
}
