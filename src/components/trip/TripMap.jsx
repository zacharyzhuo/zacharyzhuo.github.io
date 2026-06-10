import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ChevronLeft, ChevronRight, Crosshair, Layers, MapPin, Navigation } from 'lucide-react'
import { getCategory, BRAND_INK, BACKUP_INK } from '../../lib/categories.js'
import { sortByDistance, routePoints, nextFocusIndex, buildMapsUrl } from '../../lib/maps.js'
import { openExternal } from '../../lib/openExternal.js'
import { tap as hapticTap, bump } from '../../lib/haptic.js'
import { markerIcon, numberedIcon, meIcon } from './mapIcons.js'
import NearbyStrip from './NearbyStrip.jsx'
import DayNav from './DayNav.jsx'
import SegmentedControl from '../ui/SegmentedControl.jsx'
import EmptyState from '../ui/EmptyState.jsx'

const TOKYO = [35.6762, 139.6503]
const BUCKETS = ['food', 'shopping', 'attraction', 'hotel', 'backup']
const BUCKET_LABEL = { food: '美食', attraction: '景點', shopping: '購物', hotel: '住宿', backup: '備選', transport: '交通' }

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
  // 編輯排版（同住宿卡 / DetailModal 家族）：eyebrow（label + EN）→ 大標 → 髮絲線小標 → 內文段落 → CTA
  const cat = point.bucket === 'backup' ? null : getCategory(point.bucket)
  const ink = point.bucket === 'backup' ? BACKUP_INK : cat.ink
  const en = cat?.en
  const url = buildMapsUrl(point)
  return (
    <div className="font-serif" style={{ minWidth: '11rem' }}>
      <div className="flex items-baseline gap-1.5 mb-1 flex-wrap">
        <span className="text-sm font-serif font-bold" style={{ color: ink }}>
          {BUCKET_LABEL[point.bucket]}
        </span>
        {en && (
          <span
            className="text-2xs font-serif font-bold uppercase tracking-[0.25em]"
            style={{ color: ink, opacity: 0.6 }}
          >
            {en}
          </span>
        )}
      </div>

      <h3 className="font-serif font-bold text-jp-text text-lg leading-tight">{point.name}</h3>

      {point.desc && (
        <>
          <div className="flex items-center gap-2 mt-2.5 mb-1.5">
            <span className="text-2xs font-serif font-bold uppercase tracking-[0.2em] text-muted shrink-0">關於</span>
            <div className="h-[1px] flex-1 bg-hairline" />
          </div>
          <p className="text-xs text-secondary font-serif leading-relaxed whitespace-pre-line">{point.desc}</p>
        </>
      )}

      {url && (
        <>
          <div className="h-[1px] bg-hairline mt-3 mb-2" />
          {/* 刻意用 Google 藍（非站內 jp-green）：示意這顆會開啟 Google 產品，借品牌色辨識 */}
          <button
            type="button"
            onClick={() => openExternal(url)}
            className="text-[13px] font-serif font-bold text-[#1a73e8] touch-manipulation inline-flex items-center gap-1"
          >
            <Navigation size={13} />
            Google Maps 導航
          </button>
        </>
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
  const [basemap, setBasemap] = useState('simple') // 'simple'（CARTO Positron）| 'transit'（OSM 標準圖，看得到車站/鐵道）
  const [routeDay, setRouteDay] = useState(activeDay ?? days[0]?.day ?? null)
  const [focusIdx, setFocusIdx] = useState(null) // 路線逐站 stepper：null = 總覽
  const [active, setActive] = useState(() => new Set(BUCKETS))
  const [userPos, setUserPos] = useState(null)
  const [geoStatus, setGeoStatus] = useState('idle') // idle|locating|ok|error
  const mapRef = useRef(null)
  const markerRefs = useRef({})

  // 探索排除 route-only（交通/住宿動線點只屬於路線模式）
  const explorePoints = useMemo(() => points.filter((p) => !p.routeOnly && active.has(p.bucket)), [points, active])
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
    if (!navigator.geolocation) { setGeoStatus('error'); return }
    setGeoStatus('locating')
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

  // 換天 / 切模式 → stepper 回總覽
  useEffect(() => { setFocusIdx(null) }, [routeDay, mode])

  const stepRoute = useCallback((dir) => {
    bump()
    setFocusIdx((cur) => nextFocusIndex(cur, dir, routePts.length))
  }, [routePts.length])

  const backToOverview = useCallback(() => { hapticTap(); setFocusIdx(null) }, [])

  // 路線相機：總覽 fit 全部；聚焦則 flyTo 該點並開 popup
  useEffect(() => {
    if (mode !== 'route' || !routePts.length) return
    const map = mapRef.current
    if (!map) return
    if (focusIdx === null) {
      map.fitBounds(L.latLngBounds(routePts.map((p) => [p.lat, p.lng])), { padding: [44, 44], maxZoom: 16, duration: 0.5 })
      return
    }
    const p = routePts[focusIdx]
    if (!p) return
    map.flyTo([p.lat, p.lng], 16, { duration: 0.6 }) // 上限 0.6s，避免遠點弧線飛太久
    const openPopup = () => markerRefs.current[p.id]?.openPopup()
    map.once('moveend', openPopup) // 移動結束才開 popup，不會飛到一半就跳出
    return () => map.off('moveend', openPopup)
  }, [focusIdx, mode, routePts])

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
              {mode === 'explore' && <FitBounds positions={positions} positionsKey={positionsKey} />}
              {basemap === 'transit' ? (
                <TileLayer
                  key="osm"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                  subdomains="abc"
                  maxZoom={19}
                  crossOrigin="anonymous"
                />
              ) : (
                <TileLayer
                  key="carto"
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap &copy; CARTO'
                  subdomains="abcd"
                  maxZoom={20}
                  crossOrigin="anonymous"
                />
              )}

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
                    <Marker
                      key={p.id}
                      position={[p.lat, p.lng]}
                      icon={numberedIcon(p.bucket, i + 1)}
                      ref={(el) => {
                        if (el) markerRefs.current[p.id] = el
                        else delete markerRefs.current[p.id]
                      }}
                    >
                      <Popup>{popupNode(p)}</Popup>
                    </Marker>
                  ))}
                </>
              )}

              {userPos && <Marker position={[userPos.lat, userPos.lng]} icon={meIcon()} />}
            </MapContainer>

            {/* 底圖切換：簡約（Positron）↔ 交通（OSM 標準圖，看得到車站/鐵道，規劃日本行程用） */}
            <button
              type="button"
              onClick={() => { hapticTap(); setBasemap((b) => (b === 'simple' ? 'transit' : 'simple')) }}
              className="absolute top-3 right-3 z-[601] inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-white/90 backdrop-blur shadow-md text-jp-text text-xs font-serif font-bold active:scale-95 touch-manipulation"
              aria-label={basemap === 'simple' ? '切換到交通底圖（顯示車站）' : '切換回簡約底圖'}
            >
              <Layers size={15} />
              {basemap === 'simple' ? '簡約' : '交通'}
            </button>

            {/* locate button（探索模式才有意義）；底部出現膠囊/卡片條時抬高，不被蓋住 */}
            {mode === 'explore' && (
              <button
                type="button"
                onClick={locate}
                className={`absolute right-4 z-[601] w-12 h-12 rounded-full bg-white shadow-lg grid place-items-center text-jp-green active:scale-95 touch-manipulation transition-[bottom] duration-300 ${
                  geoStatus === 'idle' ? 'bottom-6' : 'bottom-[112px]'
                }`}
                aria-label="定位我的位置"
              >
                <Crosshair size={22} />
              </button>
            )}

            {mode === 'explore' && (
              <NearbyStrip ranked={ranked} status={geoStatus} onSelect={focusPoint} />
            )}

            {/* 路線逐站 stepper：‹ 3/7 › ，中間數字點一下回總覽 */}
            {mode === 'route' && routePts.length > 0 && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-[600] flex items-center gap-0.5 frosted-glass-panel rounded-full p-1">
                <button
                  type="button"
                  onClick={() => stepRoute(-1)}
                  disabled={focusIdx === 0}
                  className="w-10 h-10 grid place-items-center rounded-full text-jp-text active:scale-90 disabled:opacity-30 touch-manipulation"
                  aria-label="上一站"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={backToOverview}
                  className="min-w-[3.5rem] px-2 h-10 grid place-items-center font-serif font-bold text-sm tabular-nums text-jp-text active:scale-95 touch-manipulation"
                  aria-label={focusIdx === null ? '總覽' : '回到總覽'}
                >
                  {focusIdx === null ? `${routePts.length} 站` : `${focusIdx + 1} / ${routePts.length}`}
                </button>
                <button
                  type="button"
                  onClick={() => stepRoute(1)}
                  disabled={focusIdx === routePts.length - 1}
                  className="w-10 h-10 grid place-items-center rounded-full text-jp-text active:scale-90 disabled:opacity-30 touch-manipulation"
                  aria-label="下一站"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
