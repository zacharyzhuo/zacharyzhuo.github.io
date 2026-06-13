import { useState, useMemo, useRef, useEffect } from 'react'
import { ShoppingBag, Clock, Navigation } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'
import SegmentedControl from '../ui/SegmentedControl.jsx'
import { categoryInk } from '../../lib/categories.js'

const SHOP_INK = categoryInk('shopping')

/**
 * Flat CSV rows → grouped display units.
 *
 * Row rules (from Google Sheets):
 *  - building === ''  : standalone shop → own card
 *  - building !== ''  : belongs to that building → grouped under one card
 *
 * The first row that introduces a new building name becomes the building header
 * (its name/hours/link/description represent the building itself; floor is ignored).
 * Subsequent rows with the same building name are sub-shops.
 *
 * Building-meta row: when a row's `name === building` AND it has no `floor`, it
 * describes the building itself (e.g. a mall entrance / overall note), so it only
 * feeds the header meta and is NOT also listed as a redundant sub-shop. A
 * name===building row WITH a floor (e.g. a whole-building store spanning B2～8F)
 * stays a sub-shop so its floor range still shows.
 */
function groupItems(rows) {
  const groups = []
  const buildingMap = {}

  rows.forEach(row => {
    if (!row.building) {
      // Standalone shop
      groups.push({ type: 'standalone', ...row })
      return
    }

    const isBuildingMeta = row.name === row.building && !row.floor

    if (!buildingMap[row.building]) {
      // First time we see this building — create the group
      const g = {
        type: 'building',
        name: row.building,
        hours: row.hours,
        link: row.link,
        description: row.description,
        shops: [],
      }
      buildingMap[row.building] = g
      groups.push(g)
    }

    // Meta rows only populate the header; everything else is a sub-shop
    if (!isBuildingMeta) {
      buildingMap[row.building].shops.push(row)
    }
  })

  return groups
}

/** Google Maps 導航小鈕（玻璃圓鈕）。 */
function NavButton({ name, link }) {
  if (!link) return null
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2.5 frosted-glass-button rounded-full text-secondary transition-colors touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
      onClick={e => e.stopPropagation()}
      aria-label={`查看 ${name} 的位置`}
    >
      <Navigation size={15} />
    </a>
  )
}

/**
 * 店家 meta 行：樓層（購物色，bold）· 營業時間（clock）。
 * 樓層併入 meta（不再當左側固定欄），所以再長都只是這行文字、不撐版。
 */
function ShopMeta({ floor, hours }) {
  if (!floor && !hours) return null
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted font-serif mt-1 tabular-nums flex-wrap">
      {floor && <span className="font-bold" style={{ color: SHOP_INK }}>{floor}</span>}
      {floor && hours && <span className="opacity-40">·</span>}
      {hours && (
        <span className="flex items-center gap-1.5">
          <Clock size={13} className="shrink-0" /> {hours}
        </span>
      )}
    </div>
  )
}

/**
 * 購物色標記點（固定 8px，永不撐版）：內嵌在標題行（與美食卡同構，items-center 對齊）。
 *  - solid（地點：建築標頭 / 獨棟店）= 實心
 *  - ring（棟內店家）= 空心環，保留「建築 → 店家」階層
 */
function Marker({ variant = 'solid' }) {
  return (
    <span
      className={`w-2 h-2 rounded-full shrink-0 ${variant === 'ring' ? 'border-[1.5px]' : ''}`}
      style={variant === 'ring' ? { borderColor: SHOP_INK } : { backgroundColor: SHOP_INK }}
      aria-hidden="true"
    />
  )
}

/**
 * 單一店家列：版型與 FoodSection 卡片一致 —— 標題（色點內嵌）→ meta（樓層·時間）
 * → 描述（靠左緣、不縮排）。
 *  - 預設（地點 / 獨棟店）：text-lg。
 *  - compact（棟內店家）：標題降為 text-base、描述 text-sm，整體小一級表「附屬」。
 */
function ShopRow({ name, floor, hours, description, link, marker = 'solid', compact = false }) {
  return (
    <div className="flex-1 min-w-0">
      <div className={`flex justify-between items-start ${compact ? 'mb-1.5' : 'mb-2'}`}>
        <div className="min-w-0">
          <h4
            className={`font-bold text-jp-text font-serif flex items-center gap-2 ${
              compact ? 'text-base leading-snug' : 'text-lg leading-tight'
            }`}
          >
            <Marker variant={marker} />
            {name}
          </h4>
          <ShopMeta floor={floor} hours={hours} />
        </div>
        <NavButton name={name} link={link} />
      </div>
      {description && (
        <p className={`text-secondary leading-relaxed font-serif ${compact ? 'text-[13px]' : 'text-sm'}`}>
          {description}
        </p>
      )}
    </div>
  )
}

function StandaloneCard({ item }) {
  return (
    <div className="glass-card relative rounded-xl p-5 overflow-hidden">
      <ShopRow
        name={item.name}
        floor={item.floor}
        hours={item.hours}
        description={item.description}
        link={item.link}
      />
    </div>
  )
}

function BuildingCard({ building }) {
  return (
    <div className="glass-card relative rounded-xl p-5 overflow-hidden">
      {/* Building header（建築標頭＝一個地點，實心點；店家在下方用空心環） */}
      <ShopRow
        name={building.name}
        hours={building.hours}
        description={building.description}
        link={building.link}
        marker="solid"
      />

      {/* 子店：左側導引線 + 縮排，像從建築垂下的分枝；小一級字 + 空心環表「附屬」 */}
      {building.shops.length > 0 && (
        <div className="mt-4 pl-4 border-l border-hairline space-y-4">
          {building.shops.map((shop, i) => (
            <ShopRow
              key={i}
              name={shop.name}
              floor={shop.floor}
              hours={shop.hours}
              description={shop.description}
              link={shop.link}
              marker="ring"
              compact
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * @param {{ rows: Array<{ area: string, building: string, name: string, floor: string, hours: string, link: string, description: string }> }} props
 */
export default function ShoppingSection({ rows }) {
  const areas = useMemo(
    () => [...new Set(rows.map(r => r.area).filter(Boolean))],
    [rows]
  )
  const areaTabs = useMemo(() => areas.map(a => ({ key: a, label: a })), [areas])
  const [activeArea, setActiveArea] = useState(() => areas[0] ?? '')
  const scrollRef = useRef(null)

  // 資料非同步載入後，若尚未選中任何 tab 則自動選中第一個
  useEffect(() => {
    if (!activeArea && areas.length > 0) {
      setActiveArea(areas[0])
    }
  }, [areas, activeArea])

  // filtered 要 memo，否則每次 render 都是新 array ref，下面的 grouped useMemo 永遠 miss
  const filtered = useMemo(
    () => activeArea ? rows.filter(r => r.area === activeArea) : rows,
    [activeArea, rows]
  )
  const grouped = useMemo(() => groupItems(filtered), [filtered])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0 })
  }, [activeArea])


  if (rows.length === 0) {
    return <EmptyState icon={ShoppingBag} title="尚無逛街清單" hint="填好 shopping tab（建築 + 樓層 + 店家），這裡會自動分群。" />
  }

  return (
    <div className="flex flex-col relative h-full">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide px-8 pb-24 space-y-4 pt-2"
      >
        <h2 className="text-2xl font-serif font-bold text-jp-text pt-8 pb-2 pr-12">逛街清單</h2>
        {grouped.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="這個區域還沒有店" hint="切到其他區看看，或回去 shopping tab 加幾筆。" />
        ) : (
          grouped.map((g, i) =>
            g.type === 'building'
              ? <BuildingCard key={`b-${i}`} building={g} />
              : <StandaloneCard key={`s-${i}`} item={g} />
          )
        )}
      </div>

      {areas.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center px-4 safe-area-bottom pointer-events-none">
          <SegmentedControl
            tabs={areaTabs}
            value={activeArea}
            onChange={setActiveArea}
            itemClassName="px-5"
            ariaLabel="逛街分區"
          />
        </div>
      )}
    </div>
  )
}
