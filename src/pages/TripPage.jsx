import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Menu, ArrowLeft, Info, Plane, Hotel, ShoppingBag, ClipboardList } from 'lucide-react'
import { useTrips } from '../hooks/useTrips.js'
import { useSheetData } from '../hooks/useSheetData.js'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import Sidebar from '../components/layout/Sidebar.jsx'
import DayNav from '../components/trip/DayNav.jsx'
import FlightSection from '../components/trip/FlightSection.jsx'
import ItinerarySection from '../components/trip/ItinerarySection.jsx'
import AccommodationSection from '../components/trip/AccommodationSection.jsx'
import ShoppingSection from '../components/trip/ShoppingSection.jsx'
import ChecklistSection from '../components/trip/ChecklistSection.jsx'

const SECTIONS = [
  { key: 'info', label: '旅程資訊', subLabel: 'Flight & Info', icon: <Info size={20} /> },
  { key: 'itinerary', label: '每日行程', subLabel: 'Itinerary', icon: <Plane size={20} /> },
  { key: 'accommodation', label: '住宿', subLabel: 'Accommodation', icon: <Hotel size={20} /> },
  { key: 'shopping', label: '購物清單', subLabel: 'Shopping', icon: <ShoppingBag size={20} /> },
  { key: 'checklist', label: '打包清單', subLabel: 'Checklist', icon: <ClipboardList size={20} /> },
]

export default function TripPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { trips, loading: tripsLoading } = useTrips()
  const trip = trips.find(t => t.slug === slug)

  const [activeSection, setActiveSection] = useState('itinerary')
  const [activeDay, setActiveDay] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [extras, setExtras] = useState(null)
  const [easterEggOpen, setEasterEggOpen] = useState(false)
  const [heartPosition, setHeartPosition] = useState(null)
  const [easterEggActivated, setEasterEggActivated] = useState(false)

  const { data: flights, loading: flightsLoading } = useSheetData(trip?.sheet_id, 'flights')
  const { data: itinerary, loading: itineraryLoading } = useSheetData(trip?.sheet_id, 'itinerary')
  const { data: accommodation } = useSheetData(trip?.sheet_id, 'accommodation')
  const { data: shopping } = useSheetData(trip?.sheet_id, 'shopping')
  const { data: checklist } = useSheetData(trip?.sheet_id, 'checklist')

  // Dynamic import of trip-specific extras
  useEffect(() => {
    if (!slug) return
    import(`../trips/${slug}/extras.jsx`)
      .then(m => setExtras(m.default))
      .catch(() => setExtras(null))
  }, [slug])

  // Build day list from itinerary data
  const days = [...new Set(itinerary.map(r => Number(r.day)))]
    .sort((a, b) => a - b)
    .map(day => {
      const row = itinerary.find(r => Number(r.day) === day)
      return { day, date: row?.date ?? '' }
    })

  if (tripsLoading || flightsLoading || itineraryLoading) {
    return <div className="bg-jp-bg min-h-screen safe-area-inset"><LoadingSpinner /></div>
  }

  if (!trip) {
    return (
      <div className="bg-jp-bg min-h-screen safe-area-inset flex flex-col items-center justify-center gap-4">
        <p className="text-jp-sub font-sans">找不到此行程</p>
        <button onClick={() => navigate('/')} className="text-jp-green font-sans text-sm underline">
          返回首頁
        </button>
      </div>
    )
  }

  return (
    <div className="bg-jp-bg min-h-screen safe-area-inset">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-jp-bg/80 backdrop-blur-sm border-b border-stone-100">
        <button
          onClick={() => navigate('/')}
          className="p-2 touch-manipulation"
          aria-label="返回"
        >
          <ArrowLeft size={20} className="text-jp-text" />
        </button>
        <h1 className="font-serif font-bold text-jp-text">{trip.name}</h1>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 touch-manipulation"
          aria-label="開啟選單"
        >
          <Menu size={20} className="text-jp-text" />
        </button>
      </div>

      {/* Day Nav — only in itinerary section */}
      {activeSection === 'itinerary' && days.length > 0 && (
        <DayNav
          days={days}
          activeDay={activeDay}
          onSelect={(day) => {
            setActiveDay(day)
            if (extras && day === extras.easterEggDay) {
              setEasterEggActivated(true)
            }
          }}
          easterEggDay={extras?.easterEggDay}
          easterEggIcon={
            extras && easterEggActivated ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setHeartPosition({ x: e.clientX, y: e.clientY })
                  setEasterEggOpen(true)
                }}
              >
                <extras.HeartIcon activated />
              </button>
            ) : null
          }
        />
      )}

      {/* Section Content */}
      <main className="pb-8">
        {activeSection === 'info' && <FlightSection flights={flights} trip={trip} />}
        {activeSection === 'itinerary' && (
          <ItinerarySection
            rows={itinerary.filter(r => Number(r.day) === activeDay)}
          />
        )}
        {activeSection === 'accommodation' && <AccommodationSection rows={accommodation} />}
        {activeSection === 'shopping' && <ShoppingSection rows={shopping} />}
        {activeSection === 'checklist' && <ChecklistSection rows={checklist} />}
      </main>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={setActiveSection}
        sections={SECTIONS}
      />

      {/* Easter Egg Modal */}
      {extras?.ProposalModal && (
        <extras.ProposalModal
          isOpen={easterEggOpen}
          onClose={() => setEasterEggOpen(false)}
          heartPosition={heartPosition}
        />
      )}
    </div>
  )
}
