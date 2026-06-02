import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Crosshair, MapPin } from 'lucide-react'
import { getCategory, BRAND_INK, BACKUP_INK } from '../../lib/categories.js'
import { sortByDistance, routePoints, buildMapsUrl } from '../../lib/maps.js'
import { openExternal } from '../../lib/openExternal.js'
import { tap as hapticTap, bump } from '../../lib/haptic.js'
import { markerIcon, numberedIcon, meIcon } from './mapIcons.js'
import NearbyPanel from './NearbyPanel.jsx'
import DayNav from './DayNav.jsx'
import SegmentedControl from '../ui/SegmentedControl.jsx'
import EmptyState from '../ui/EmptyState.jsx'

const TOKYO = [35.6762, 139.6503]
const BUCKETS = ['food', 'shopping', 'attraction', 'backup']
const BUCKET_LABEL = { food: '美食', attraction: '景點', shopping: '購物', backup: '備選' }

// Leaflet 在「開啟時才長出來」的容器裡需重新量尺寸，否則圖磚渲染成灰塊。
function InvalidateOnMount() {
  const map = useMap()
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 250)
    return () => clearTimeout(id)
  }, [map])
  return null
}

// 切換模式時 chip 列收合/展開會改變地圖高度；Leaflet 不會自動察覺，需重新量測。
function InvalidateOnModeChange({ mode }) {
  const map = useMap()
  const isFirst = useRef(true)
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    const id = requestAnimationFrame(() => map.invalidateSize())
    return () => cancelAnimationFrame(id)
  }, [map, mode])
  return null
}

// 依目前要顯示的點自動 fit；positionsKey 變了才重算（避免每 render 都 fit）。
function FitBounds({ positions, positionsKey }) {
  const map = useMap()
  useEffect(() => {
    if (!positions.length) return
    const bounds = L.latLngBounds(positions)
    map.fitBounds(bounds, { padding: [44, 44], maxZoom: 16 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, positionsKey])
  return null
}

function popupNode(point) {
  const eyebrowColor = point.bucket === 'backup' ? BACKUP_INK : getCategory(point.bucket).ink
  const url = buildMapsUrl(point)
  return (
    <div className="font-serif">
      <div className="text-2xs tracking-widest uppercase font-bold" style={{ color: eyebrowColor }}>
        {BUCKET_LABEL[point.bucket]}
      </div>
      <div className="text-base font-bold text-jp-text mt-0.5 mb-0.5">{point.name}</div>
      {point.desc && <div className="text-xs text-muted mb-1.5 leading-snug">{point.desc}</div>}
      {/* 刻意用 Google 藍（非站內 jp-green）：示意這顆會開啟 Google 產品，借品牌色辨識 */}
      {url && (
        <button
          type="button"
          onClick={() => openExternal(url)}
          className="text-[13px] font-bold text-[#1a73e8] touch-manipulation"
        >
          ↗ 開啟 Google Maps 導航
        </button>
      )}
    </div>
  )
}

/**
 * @param {{
 *   points: Array,           // toMapPoints() 結果（全部有座標的點）
 *   days?: Array<{ day:number, date:string }>, // 路線 tab 的日期列
 *   activeDay?: number|null, // 開啟時預設選中的天（背景頁當下那天）
 * }} props
 */
export default function TripMap({ points, days = [], activeDay = null }) {
  const [mode, setMode] = useState('explore')
  const [routeDay, setRouteDay] = useState(activeDay ?? days[0]?.day ?? null)
  const [active, setActive] = useState(() => new Set(BUCKETS))
  const [userPos, setUserPos] = useState(null)
  const [geoStatus, setGeoStatus] = useState('idle') // idle|locating|ok|error
  const [nearbyOpen, setNearbyOpen] = useState(false)
  const mapRef = useRef(null)
  const markerRefs = useRef({})

  const explorePoints = useMemo(() => points.filter((p) => active.has(p.bucket)), [points, active])
  const routePts = useMemo(() => (routeDay != null ? routePoints(points, routeDay) : []), [points, routeDay])

  const shown = mode === 'route' ? routePts : explorePoints
  const positions = useMemo(() => shown.map((p) => [p.lat, p.lng]), [shown])
  const positionsKey = useMemo(() => positions.map((p) => p.join(',')).join('|'), [positions])

  const ranked = useMemo(
    () => (userPos ? sortByDistance(explorePoints, userPos) : []),
    [userPos, explorePoints]
  )

  const toggleBucket = useCallback((b) => {
    hapticTap()
    setActive((prev) => {
      const next = new Set(prev)
      next.has(b) ? next.delete(b) : next.add(b)
      return next
    })
  }, [])

  const locate = useCallback(() => {
    bump()
    if (!navigator.geolocation) { setGeoStatus('error'); setNearbyOpen(true); return }
    setGeoStatus('locating'); setNearbyOpen(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserPos(ll); setGeoStatus('ok')
        mapRef.current?.flyTo([ll.lat, ll.lng], 14)
      },
      () => setGeoStatus('error'),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  const focusPoint = useCallback((p) => {
    bump()
    mapRef.current?.flyTo([p.lat, p.lng], 16)
    markerRefs.current[p.id]?.openPopup()
  }, [])

  const switchMode = useCallback((m) => setMode(m), [])

  const initialCenter = positions[0] || (userPos ? [userPos.lat, userPos.lng] : TOKYO)

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-t-[2rem]">
      {/* header：模式切換（探索＝分類 chip 列 / 路線＝DayNav 換天） */}
      <div className="flex-none pt-2">
        <h2 className="sr-only">行程地圖</h2>
        <div className="flex justify-center mb-2 px-5">
          <SegmentedControl
            tabs={[{ key: 'explore', label: '探索' }, { key: 'route', label: '路線' }]}
            value={mode}
            onChange={switchMode}
            itemClassName="px-5"
            ariaLabel="地圖模式"
          />
        </div>
        {mode === 'explore' && (
          <div className="flex flex-wrap gap-2 justify-center px-5 pb-3">
            {BUCKETS.map((b) => {
              const on = active.has(b)
              const ink = b === 'backup' ? BACKUP_INK : getCategory(b).ink
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleBucket(b)}
                  style={on ? { color: ink, borderColor: `${ink}59` } : undefined}
                  className={`frosted-glass-button text-xs font-serif font-bold px-4 py-1.5 rounded-full touch-manipulation ${
                    on ? '' : 'text-stone-400 opacity-55'
                  }`}
                >
                  {BUCKET_LABEL[b]}
                </button>
              )
            })}
          </div>
        )}
        {mode === 'route' && days.length > 0 && (
          <DayNav days={days} activeDay={routeDay} onSelect={setRouteDay} />
        )}
      </div>

      {/* map */}
      <div className="relative flex-1 min-h-0">
        {shown.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            {mode === 'explore' && points.length > 0 ? (
              <EmptyState
                icon={MapPin}
                title="所有分類已關閉"
                hint="點上方分類即可重新顯示地圖點"
              />
            ) : (
              <EmptyState
                icon={MapPin}
                title={mode === 'route' ? '這天還沒有地圖座標' : '尚無地圖座標'}
                hint="在 Google Sheet 的 itinerary tab 填 lat / lng 即可上圖"
              />
            )}
          </div>
        ) : (
          <>
            <MapContainer
              ref={mapRef}
              center={initialCenter}
              zoom={14}
              zoomControl={true}
              className="absolute inset-0 h-full w-full"
              style={{ background: '#eceae3' }}
            >
              <InvalidateOnMount />
              <InvalidateOnModeChange mode={mode} />
              <FitBounds positions={positions} positionsKey={positionsKey} />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap &copy; CARTO'
                subdomains="abcd"
                maxZoom={20}
              />

              {mode === 'explore' &&
                explorePoints.map((p) => (
                  <Marker
                    key={p.id}
                    position={[p.lat, p.lng]}
                    icon={markerIcon(p.bucket)}
                    ref={(el) => {
                      if (el) markerRefs.current[p.id] = el
                      else delete markerRefs.current[p.id]
                    }}
                  >
                    <Popup>{popupNode(p)}</Popup>
                  </Marker>
                ))}

              {mode === 'route' && (
                <>
                  {routePts.length > 1 && (
                    <Polyline
                      positions={routePts.map((p) => [p.lat, p.lng])}
                      pathOptions={{ color: BRAND_INK, weight: 3, dashArray: '2,8', lineCap: 'round', opacity: 0.85 }}
                    />
                  )}
                  {routePts.map((p, i) => (
                    <Marker key={p.id} position={[p.lat, p.lng]} icon={numberedIcon(p.bucket, i + 1)}>
                      <Popup>{popupNode(p)}</Popup>
                    </Marker>
                  ))}
                </>
              )}

              {userPos && <Marker position={[userPos.lat, userPos.lng]} icon={meIcon()} />}
            </MapContainer>

            {/* locate button（探索模式才有意義） */}
            {mode === 'explore' && (
              <button
                type="button"
                onClick={locate}
                className="absolute right-4 bottom-[124px] z-[600] w-12 h-12 rounded-full bg-white shadow-lg grid place-items-center text-jp-green active:scale-95 touch-manipulation"
                aria-label="定位我的位置"
              >
                <Crosshair size={22} />
              </button>
            )}

            {mode === 'explore' && (
              <NearbyPanel
                ranked={ranked}
                status={geoStatus}
                open={nearbyOpen}
                onToggle={() => setNearbyOpen((o) => !o)}
                onSelect={focusPoint}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
