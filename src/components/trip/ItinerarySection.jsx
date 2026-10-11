import { Fragment, useState, useEffect, useRef, useMemo, useId } from 'react'
import { createPortal } from 'react-dom'
import {
  Camera, X, Navigation, Clock, MapPin
} from 'lucide-react'
import { useScrollLock } from '../../hooks/useScrollLock.js'
import { useModalA11y } from '../../hooks/useModalA11y.js'
import { useCancelableTap } from '../../hooks/useCancelableTap.js'
import { formatToday } from '../../lib/tripDate.js'
import { resist } from '../../lib/gesture.js'
import { openExternal } from '../../lib/openExternal.js'
import { getCategory, categoryChipStyle, categoryInk, categoryWash, chipStyle, BRAND_INK } from '../../lib/categories.js'
import EmptyState from '../ui/EmptyState.jsx'

function formatNowHHMM() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 解析開頭的 `HH:MM`（允許個位數時、忽略後綴）→ 當日分鐘數；非時間（空、`下午`、`晚上`、`evening`…）回 null。
// 用數值比較取代字串比較，避免 `3:22`(非零補位) 或中文時段被誤判過去/未來。
function timeToMinutes(str) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(str || '').trim())
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

// 今日時間軸上「現在 HH:MM」紅線標記。對齊新三欄（時間 | 軌道節點 | 內容）。
function NowMarker({ time }) {
  return (
    <div className="flex gap-2.5 px-5 -mt-1 mb-3 items-center">
      <span className="w-10 shrink-0 text-right text-2xs font-serif font-bold text-jp-red leading-none tabular-nums">
        {time}
      </span>
      <div className="w-7 shrink-0 flex justify-center">
        <span className="w-3 h-3 rounded-full bg-jp-red animate-pulse shadow-[0_0_0_4px_rgba(185,54,50,0.15)]" />
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-2xs font-serif font-bold text-jp-red uppercase tracking-[0.2em] shrink-0">
          現在
        </span>
        <div className="flex-1 h-[1px] bg-jp-red/40" />
      </div>
    </div>
  )
}
const SPOT_TYPE_ORDER = { food: 0, attraction: 1, shopping: 2 }

// DetailModal 拖拉關閉：放開時取「最後 80ms」的尾端速度（非整段平均），規則同 BottomSheet
const VELOCITY_WINDOW_MS = 80
const FLICK_VELOCITY = 0.11 // px/ms
const FLICK_MIN_TRAVEL = 24 // px
const CLOSE_DISTANCE = 120 // px
const MIN_CLOSE_MS = 120
const MAX_CLOSE_MS = 300 // 與 index.css --dur-panel-close 同值
const DISMISS_FALLBACK_GRACE_MS = 150 // transitionend 後備收尾的寬限

// 讀目前實際的 translateY（含 transition 進行中的位置），讓中途抓住不會跳
function liveTranslateY(el) {
  if (!el || typeof DOMMatrixReadOnly === 'undefined') return 0
  const m = getComputedStyle(el).transform
  return m && m !== 'none' ? new DOMMatrixReadOnly(m).m42 : 0
}

function buildGoogleMapsUrl(address, name) {
  const query = address || name || ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function sortSpots(spots) {
  return [...spots].sort(
    (a, b) => (SPOT_TYPE_ORDER[a.type] ?? 99) - (SPOT_TYPE_ORDER[b.type] ?? 99)
  )
}

function SpotItem({ spot }) {
  const { label } = getCategory(spot.type)
  const url = spot.link?.startsWith('http')
    ? spot.link
    : buildGoogleMapsUrl(spot.address, spot.name)

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-stone-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="text-2xs px-1.5 py-0.5 border rounded font-serif font-bold shrink-0 uppercase tracking-wider backdrop-blur-sm"
            style={categoryChipStyle(spot.type)}
          >
            {label}
          </span>
          <span className="font-serif font-bold text-jp-text text-sm leading-snug truncate">
            {spot.name}
          </span>
        </div>
        {spot.description && (
          <p className="allow-select text-xs text-muted font-serif leading-relaxed line-clamp-1 pl-[2px]">
            {spot.description}
          </p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); openExternal(url) }}
        className="shrink-0 p-2 frosted-glass-button rounded-lg text-muted touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
        aria-label={`${spot.name} Google Maps`}
      >
        <Navigation size={14} />
      </button>
    </div>
  )
}

function DetailModal({ row, spots, onClose }) {
  const [displayRow, setDisplayRow] = useState(null)
  const [displaySpots, setDisplaySpots] = useState([])
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  // dismissing：放開判定關閉後，從放開點直接滑出（不等 isOpen 變 false）；dismissMs = 依甩速算的關閉時長
  const [dismissing, setDismissing] = useState(false)
  const [dismissMs, setDismissMs] = useState(null)
  // closeCalledRef：本次開啟已呼叫過 onClose（navigate(-1)）；每次開啟只呼叫一次，避免連退兩頁
  const closeCalledRef = useRef(false)
  const samplesRef = useRef([])
  const baseRef = useRef(0)
  const pillRef = useRef(null)
  const sheetRef = useRef(null)
  const touchStartY = useRef(null)
  const dragYRef = useRef(0)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const tap = useCancelableTap()

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (row) { setDisplayRow(row); setDisplaySpots(spots) }
  }, [row, spots])

  const isOpen = !!row

  useModalA11y(isOpen, onClose, sheetRef)

  const resetDismiss = () => {
    setDismissing(false)
    setDismissMs(null)
    setDragY(0)
    dragYRef.current = 0
  }

  // 開啟時清掉拖拉狀態；關閉（isOpen → false）時結束 dismissing，改由一般關閉 class 接手（同一個終點，不會重跑動畫）
  useEffect(() => {
    resetDismiss()
    if (isOpen) {
      setIsDragging(false)
      closeCalledRef.current = false
    }
  }, [isOpen])

  // 後備：navigate(-1) 沒讓 isOpen 變 false 時，transform 動畫結束也要收尾
  useEffect(() => {
    if (!dismissing) return
    const el = sheetRef.current
    if (!el) return
    let timer = null
    // 再寬限一下才收尾：reduced-motion 下 transition 只有 0.01ms，transitionend 可能比 popstate 先到，
    // 直接重置會讓面板先閃回開啟位置；正常情況 isOpen 會先變 false，effect cleanup 把 timer 清掉
    const onEnd = (e) => {
      if (e.target === el && e.propertyName === 'transform') timer = setTimeout(resetDismiss, DISMISS_FALLBACK_GRACE_MS)
    }
    el.addEventListener('transitionend', onEnd)
    return () => {
      el.removeEventListener('transitionend', onEnd)
      clearTimeout(timer)
    }
  }, [dismissing])

  useScrollLock(isOpen)

  // Non-passive touchmove on pill so preventDefault blocks page scroll.
  // 依賴 isOpen：首次 mount 時 return null（無選取項目），pillRef.current 為 null，
  // 需等到 modal 開啟、元素實際渲染後才能掛上 listener。
  useEffect(() => {
    if (!isOpen) return
    const el = pillRef.current
    if (!el) return
    const onMove = (e) => {
      if (touchStartY.current === null) return
      const clientY = e.touches[0].clientY
      // baseRef：起手時面板的實際位置（開啟動畫進行中被抓住）
      const delta = clientY - touchStartY.current + baseRef.current
      e.preventDefault()
      // 往下＝關閉方向，1:1 跟手；往上＝反方向，阻尼拉伸（放開彈回）
      const next = delta > 0 ? delta : resist(delta)
      dragYRef.current = next
      setDragY(next)
      const now = Date.now()
      const samples = samplesRef.current
      samples.push({ pos: clientY, t: now })
      while (samples.length > 1 && now - samples[0].t > VELOCITY_WINDOW_MS) samples.shift()
    }
    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [isOpen])

  const onPillTouchStart = (e) => {
    // 關閉由歷史驅動（navigate(-1)），抓住無法取消；未開啟或已送出關閉後一律不接手
    if (!isOpen || closeCalledRef.current) return
    // 開啟動畫進行中被抓住：從目前實際位置接著拖，不跳
    const base = liveTranslateY(sheetRef.current)
    baseRef.current = base
    touchStartY.current = e.touches[0].clientY
    samplesRef.current = [{ pos: e.touches[0].clientY, t: Date.now() }]
    dragYRef.current = base
    setDragY(base)
    setIsDragging(true)
  }

  const onPillTouchEnd = (e) => {
    if (touchStartY.current === null) return
    // 放開當下再裁一次窗口：「快拖 → 停住 → 放開」時，最後一次 touchmove 留下的舊樣本不能算進尾端速度
    const now = Date.now()
    const samples = samplesRef.current.filter(s => now - s.t <= VELOCITY_WINDOW_MS)
    const first = samples[0]
    const last = samples[samples.length - 1]
    // 尾端速度 px/ms，正值＝往下（關閉方向）
    const v = samples.length > 1 ? (last.pos - first.pos) / Math.max(1, last.t - first.t) : 0
    // captured：面板視覺位置（含起手 base），用於剩餘距離；travel：手指實際位移，用於關閉判定
    // （開啟動畫中途點一下，base 可能已超過門檻，不能因此零位移就關掉）
    const captured = dragYRef.current
    const travel = captured - baseRef.current
    touchStartY.current = null
    const isFlick = v > FLICK_VELOCITY && travel > FLICK_MIN_TRAVEL
    const shouldClose = travel > CLOSE_DISTANCE || isFlick
    if (shouldClose && !closeCalledRef.current) {
      // 從放開點直接滑出，不先歸零（否則 isOpen 仍 true 的那幾幀會先彈回頂再被 navigate(-1) 關掉）
      closeCalledRef.current = true
      if (isFlick) {
        const remaining = Math.max(0, (sheetRef.current?.offsetHeight ?? 0) - captured)
        setDismissMs(Math.round(Math.min(MAX_CLOSE_MS, Math.max(MIN_CLOSE_MS, remaining / v))))
      }
      setIsDragging(false)
      setDismissing(true)
      // 擋掉 iOS 在 touchend 後於同座標補發的 synthetic click：
      // sheet 滑走後那個 click 會落在底下的行程卡上，誤開別張卡
      if (e?.cancelable) e.preventDefault()
      onCloseRef.current()
    } else {
      setIsDragging(false)
      setDragY(0)
      dragYRef.current = 0
    }
  }

  const sheetClass = [
    // max-w-2xl mx-auto：桌面寬螢幕置中收窄（inset-x-0 + max-width + margin:auto 置中技巧），行動裝置滿版不受影響
    'fixed inset-x-0 bottom-0 z-50 transform max-w-2xl mx-auto',
    // 開啟用 Q 彈彈簧（overshoot 由單層延伸玻璃覆蓋，無縫），關閉維持乾淨 ease-out（時長走 --dur-panel-close token）
    isDragging
      ? ''
      : (dismissing || !isOpen)
        ? 'transition-transform duration-[var(--dur-panel-close)] ease-out'
        : 'transition-transform duration-500 ease-spring-soft',
    (dismissing || (dragY === 0 && !isOpen)) ? 'translate-y-full' : (dragY === 0 ? 'translate-y-0' : ''),
    // sheet-hidden：關閉動畫結束後 visibility 隱藏，避免 Safari 工具列透出貼在視窗底線的圓角頂緣
    (!isOpen && !dismissing && dragY === 0) ? 'sheet-hidden' : '',
  ].filter(Boolean).join(' ')

  const sheetStyle = dismissing
    ? (dismissMs ? { transitionDuration: `${dismissMs}ms` } : undefined)
    : (dragY !== 0 ? { transform: `translateY(${dragY}px)` } : undefined)

  const current = row || displayRow
  const currentSpots = row ? spots : displaySpots
  // 注意：不能在這裡早 return null，否則第一次點開時 sheet div 直接 mount 在 translate-y-0，
  // 沒有「translate-y-full → translate-y-0」的起點可以動，CSS transition 不會觸發。
  // 改為：殼永遠 render（預設 translate-y-full 藏在畫面外），內容才依 current 條件渲染。
  const typeInfo = current ? getCategory(current.type) : null
  const navUrl = current
    ? (current.link?.startsWith('http')
        ? current.link
        : buildGoogleMapsUrl(current.address, current.name))
    : ''

  // Portal 到 body 以跳過祖先 transform（day swipe 容器永遠掛 translate3d，
  // 會讓 fixed 元素改成相對該容器，導致 modal 被切掉 / 看起來高度很低）。
  return createPortal(
    <>
      <div
        aria-hidden="true"
        className={`fixed inset-0 bg-transparent z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!isOpen}
        tabIndex={-1}
        className={sheetClass}
        style={sheetStyle}
      >
        {/* 單一毛玻璃層：往下延伸超過停駐邊（-bottom-56），開啟 overshoot / 反向拉由「同一塊」玻璃覆蓋 → 無接縫。
            內容層疊在上面、不帶 backdrop。 */}
        <div className="relative">
          <div aria-hidden="true" className="glass-bottom-sheet absolute inset-0 -bottom-56 pointer-events-none" />
          <div className="min-h-[40vh] max-h-[85vh] flex flex-col relative overflow-hidden rounded-t-[2rem]">
        {current && (
          <>

          {/* Drag pill handle：浮在內容上（內容用負 margin 墊到底下），同 BottomSheet noScroll 的語言 */}
          <div
            ref={pillRef}
            className="relative z-10 flex justify-center pt-3 pb-2 touch-manipulation select-none flex-shrink-0"
            onTouchStart={onPillTouchStart}
            onTouchEnd={onPillTouchEnd}
            onTouchCancel={onPillTouchEnd}
          >
            <div className="w-10 h-1 rounded-full bg-stone-400/70" />
          </div>

          <button
            onPointerDown={tap.onPointerDown}
            onPointerUp={tap.onPointerUp}
            onClick={tap.guard(onClose)}
            className="absolute top-8 right-6 z-20 p-3 frosted-glass-button rounded-full text-muted touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉詳情"
          >
            <X size={20} />
          </button>

          {/* -mt-6 = 把手條高度（pt-3 + pill 4px + pb-2 = 24px）：內容上緣墊到 pill 背後，
              捲動時滑進把手底下，消除把手與內容間的裁切硬線；pt-12 補回原本的內容起點（24+24=48px） */}
          <div className="overflow-y-auto overscroll-contain px-8 pb-32 flex-1 -mt-6 pt-12">
            {/* 彩色 eyebrow（分類） */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-sm font-serif font-bold" style={{ color: categoryInk(current.type) }}>
                {typeInfo.label}
              </span>
              <span
                className="text-2xs font-serif font-bold uppercase tracking-[0.25em]"
                style={{ color: categoryInk(current.type), opacity: 0.6 }}
              >
                {typeInfo.en}
              </span>
            </div>

            {/* 特大標題 */}
            <h2 id={titleId} className="text-2xl font-serif font-bold text-jp-text leading-tight mb-2.5 pr-12">
              {current.name}
            </h2>

            {/* meta 一行：時間 · 地點（無地址不顯示，修掉 placeholder） */}
            {(current.time || current.address) && (
              <div className="flex items-center gap-2 text-sm text-muted font-serif mb-6 flex-wrap">
                {current.time && (
                  <span className="font-bold text-secondary tabular-nums">{current.time}</span>
                )}
                {current.time && current.address && <span className="text-stone-300">·</span>}
                {current.address && (
                  <span className="inline-flex items-center gap-1 min-w-0">
                    <MapPin size={13} className="shrink-0" style={{ color: categoryInk(current.type) }} />
                    <span className="allow-select truncate">{current.address}</span>
                  </span>
                )}
              </div>
            )}

            {/* hero 圖（有才放，置於 meta 下） */}
            {current.image && (
              <img
                src={current.image}
                alt=""
                width={800}
                height={384}
                loading="lazy"
                decoding="async"
                className="w-full h-48 rounded-2xl object-cover mb-7 bg-stone-200"
              />
            )}

            {/* 關於此處（髮絲線 eyebrow） */}
            {current.note && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xs font-serif font-bold uppercase tracking-[0.2em] text-muted shrink-0">關於此處</span>
                  <div className="h-[1px] flex-1 bg-hairline" />
                </div>
                <p className="allow-select text-jp-text leading-relaxed font-serif text-base opacity-90 whitespace-pre-line">
                  {current.note}
                </p>
              </section>
            )}

            {/* 街道亮點 */}
            {currentSpots.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xs font-serif font-bold uppercase tracking-[0.2em] text-muted shrink-0">街道亮點</span>
                  <span className="text-2xs text-stone-400 font-serif tabular-nums shrink-0">{currentSpots.length}</span>
                  <div className="h-[1px] flex-1 bg-hairline" />
                </div>
                <div>
                  {currentSpots.map((spot) => (
                    <SpotItem key={`${spot.type}:${spot.name}`} spot={spot} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* 底部浮動 Google Maps 導航 CTA */}
          <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center px-4 safe-area-bottom pointer-events-none">
            <button
              onPointerDown={tap.onPointerDown}
              onPointerUp={tap.onPointerUp}
              onClick={tap.guard(() => openExternal(navUrl))}
              className="frosted-tab-track press-springy pointer-events-auto shadow-2xl font-serif text-secondary flex items-center gap-2"
              style={{
                padding: '12px 32px',
                background: 'rgba(255, 255, 255, 0.45)',
                boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.7), 0 8px 24px rgba(0,0,0,0.15)',
              }}
              aria-label={`開啟 ${current.name} 的 Google Maps 導航`}
            >
              <Navigation size={16} />
              Google Maps 導航
            </button>
          </div>
          </>
        )}
        </div>
        </div>
      </div>
    </>,
    document.body
  )
}

/**
 * @param {{
 *   rows: Array,
 *   dayDate?: string,  // 此 panel 對應的完整日期 'YYYY/MM/DD'，等於今天時插入「現在」標記
 *   detailKey?: string|null,     // 選填：外部（TripPage，經瀏覽器歷史）控制目前開啟的詳情項目
 *   onOpenDetail?: (key: string) => void, // 選填：點卡片時呼叫，不提供則退回內部 state（原本行為）
 *   onCloseDetail?: () => void,           // 選填：關閉時呼叫，不提供則退回內部 state
 * }} props
 * rows 包含主行程 row（無 parent）以及子項目 row（有 parent = 父 row 的 name）
 *
 * detailKey/onOpenDetail 為一組：兩者都給時視為「受控」（TripPage 把開啟狀態掛進瀏覽器歷史，
 * 見 CLAUDE.md「瀏覽器歷史整合」），否則維持原本的內部 useState（例如既有的 smoke test 未帶路由）。
 * key 格式 `${dayDate}|${row.time}|${row.name}`，靠 dayDate 保證跨日不撞號。
 */
export default function ItinerarySection({ rows, dayDate, detailKey = null, onOpenDetail, onCloseDetail }) {
  const [localSelectedKey, setLocalSelectedKey] = useState(null)
  const isControlled = typeof onOpenDetail === 'function'
  const selectedKey = isControlled ? detailKey : localSelectedKey
  const cardTap = useCancelableTap()
  const [now, setNow] = useState(formatNowHHMM)
  const isToday = dayDate && dayDate === formatToday()

  // 每分鐘 tick 一次，讓「現在」線會慢慢往下移
  // 切到「今天」時先立刻刷新一次 now，避免沿用切換前（如午夜前 23:56）的舊值
  useEffect(() => {
    if (!isToday) return
    setNow(formatNowHHMM())
    const t = setInterval(() => setNow(formatNowHHMM()), 60_000)
    return () => clearInterval(t)
  }, [isToday])

  const mainRows = useMemo(() => rows.filter(r => !r.parent), [rows])

  // 「現在」標記插在第一個未開始 row 之前；全部都過了就放最後。
  // 以分鐘數數值比較；非時間值（如 `下午`、空白）回 null → 跳過、不影響定位。
  const nowIdx = useMemo(() => {
    if (!isToday) return -1
    const nowMin = timeToMinutes(now)
    if (nowMin == null) return -1
    const idx = mainRows.findIndex(r => {
      const m = timeToMinutes(r.time)
      return m != null && m > nowMin
    })
    return idx === -1 ? mainRows.length : idx
  }, [isToday, mainRows, now])

  const spotsByParent = useMemo(
    () =>
      rows
        .filter(r => r.parent)
        .reduce((acc, r) => {
          if (!acc[r.parent]) acc[r.parent] = []
          acc[r.parent].push(r)
          return acc
        }, {}),
    [rows]
  )

  const keyFor = (row) => `${dayDate}|${row.time}|${row.name}`

  const openDetail = (row) => {
    const key = keyFor(row)
    if (isControlled) onOpenDetail(key)
    else setLocalSelectedKey(key)
  }
  const closeDetail = () => {
    if (isControlled) { onCloseDetail?.(); return }
    setLocalSelectedKey(null)
  }

  const selected = useMemo(() => {
    if (!selectedKey) return null
    const found = mainRows.find(r => keyFor(r) === selectedKey)
    if (!found) return null
    return { row: found, spots: sortSpots(spotsByParent[found.name] ?? []) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, mainRows, spotsByParent, dayDate])

  if (mainRows.length === 0) {
    return <EmptyState icon={Camera} title="此天尚無行程" hint="到 Google Sheets 的 itinerary 加幾筆，這裡就會出現時間軸。" />
  }

  return (
    <>
      <div className="mt-2">
        {mainRows.map((row, i) => {
          const { label, icon: Icon } = getCategory(row.type)
          const isLast = i === mainRows.length - 1
          const spots = sortSpots(spotsByParent[row.name] ?? [])

          return (
            <Fragment key={`${row.time}:${row.name}`}>
              {nowIdx === i && <NowMarker time={now} />}
            <div
              className="flex gap-2.5 px-5 group"
            >
              {/* 時間（拉高權重，右對齊指向節點） */}
              <span className="w-10 shrink-0 text-right text-sm font-serif font-bold text-jp-text leading-none tabular-nums pt-2.5">
                {row.time}
              </span>

              {/* 軌道：純分類色 icon（無圓底）+ 連接線 */}
              <div className="w-7 shrink-0 flex flex-col items-center">
                <span
                  aria-hidden="true"
                  className="w-7 h-7 flex items-center justify-center shrink-0"
                  style={{ color: categoryInk(row.type) }}
                >
                  <Icon size={18} />
                </span>
                {!isLast && <div className="w-[1.5px] bg-hairline flex-1 mt-1" />}
              </div>

              <div className="flex-1 min-w-0 pb-7 relative">
                <button
                  type="button"
                  onPointerDown={cardTap.onPointerDown}
                  onPointerUp={cardTap.onPointerUp}
                  onClick={cardTap.guard(() => openDetail(row))}
                  aria-label={`${row.time} ${label} ${row.name} 詳情`}
                  className="glass-card press-springy relative rounded-2xl py-4 pr-4 pl-4 h-full w-full flex flex-row gap-3 items-start text-left touch-manipulation overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-jp-green/60"
                >
                  {/* 内側淡彩（定案）：卡片玻璃自帶從脊線暈開的分類色淡彩（有色玻璃感）。
                      用 categories.js 的 wash（高明度水彩版）；內容層需 relative 才疊在淡彩上。
                      （曾試過並淘汰：包住整卡的 radial 橢圓 alpha 0.55 → 太重不自然；
                       下緣色影 → 見 git 1d970bd） */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(100deg, rgba(${categoryWash(row.type)}, 0.2), rgba(${categoryWash(row.type)}, 0.05) 45%, transparent 70%)`,
                    }}
                  />
                  {/* 分類色細脊線（2px 半透） */}
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-0 bottom-0 w-[2px]"
                    style={{ backgroundColor: `${categoryInk(row.type)}80` }}
                  />

                  <div className="relative flex-1 min-w-0 flex flex-col">
                  <span
                    className="text-2xs font-serif font-bold uppercase tracking-[0.15em] mb-1"
                    style={{ color: categoryInk(row.type) }}
                  >
                    {label}
                  </span>

                  <h3 className="text-lg font-serif font-bold text-jp-text mb-1 leading-snug">{row.name}</h3>
                  {row.description && (
                    <p className="text-sm text-muted line-clamp-3 font-serif mb-2 leading-relaxed opacity-80">
                      {row.description}
                    </p>
                  )}

                  {/* hours badge 的 bg 刻意極淡（white/15）：不透明白底會在卡片的分類色淡彩上蓋出一塊白斑 */}
                  {row.hours && (
                    <div className="flex items-center gap-1.5 text-xs text-muted font-serif mb-3 bg-white/15 backdrop-blur-sm border border-white/35 w-fit px-2 py-1 rounded-full tabular-nums">
                      <Clock size={12} />
                      <span>{row.hours}</span>
                    </div>
                  )}

                  {/* 底部 meta：只有真有地址 / 亮點才渲染（無內容不留空殼） */}
                  {(row.address || spots.length > 0) && (
                    <div className="flex items-center gap-2 text-xs text-stone-400 font-serif mt-auto pt-2 min-w-0">
                      {row.address && (
                        <>
                          <MapPin size={13} className="shrink-0" style={{ color: categoryInk(row.type) }} />
                          <span className="truncate text-muted opacity-80 flex-1 min-w-0">
                            {row.address}
                          </span>
                        </>
                      )}
                      {spots.length > 0 && (
                        <span
                          className="text-xs font-bold font-serif shrink-0 px-2 py-0.5 rounded-full border backdrop-blur-sm ml-auto"
                          style={chipStyle(BRAND_INK)}
                        >
                          {spots.length} 個亮點
                        </span>
                      )}
                    </div>
                  )}
                  </div>

                  {/* 右側縮圖（資料驅動：row.image 有值才顯示，與 type 無關） */}
                  {row.image && (
                    <img
                      src={row.image}
                      alt=""
                      width={64}
                      height={64}
                      loading="lazy"
                      decoding="async"
                      className="relative w-16 h-16 rounded-xl object-cover shrink-0 bg-stone-200"
                    />
                  )}
                </button>
              </div>
            </div>
            </Fragment>
          )
        })}
        {/* 全部時間都過了 → 把「現在」標記放在最後 */}
        {isToday && nowIdx === mainRows.length && <NowMarker time={now} />}
      </div>

      <DetailModal
        row={selected?.row ?? null}
        spots={selected?.spots ?? []}
        onClose={closeDetail}
      />
    </>
  )
}
