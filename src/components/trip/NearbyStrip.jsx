import { categoryInk, BACKUP_INK, getCategory } from '../../lib/categories.js'
import { formatDistance } from '../../lib/maps.js'

const dotColor = (bucket) => (bucket === 'backup' ? BACKUP_INK : categoryInk(bucket))
const bucketLabel = (bucket) => (bucket === 'backup' ? '備選' : getCategory(bucket).label)

// 只列最近的前幾個，避免一排無限長
const MAX_CARDS = 12
// 卡片滑入 stagger：每張 40ms，第 6 張起不再加（總延遲上限 200ms）
const STAGGER_MS = 40
const MAX_STAGGER_STEPS = 5

/**
 * 探索模式「離你最近」底部橫向卡片條（**非** BottomSheet：無把手、不蓋半屏、不像第二層 modal）。
 * 定位後出現一排可左右滑的小卡，點了飛到該點。locating / error 顯示一顆置中小膠囊。
 *
 * @param {{
 *   ranked: Array<{ id:string,name:string,bucket:string,desc:string,_dist:number,lat:number,lng:number }>,
 *   status: 'idle'|'locating'|'ok'|'error',
 *   onSelect: (point) => void,
 * }} props
 */
export default function NearbyStrip({ ranked, status, onSelect }) {
  if (status === 'idle') return null
  // 三個分支的根節點各給不同 key：否則 React 會沿用同一個 div、只換 className，
  // locating → ok 時不會重新掛載，@starting-style 的滑入就不會觸發

  if (status === 'locating' || status === 'error') {
    return (
      <div key="status-pill" className="nearby-enter absolute left-1/2 -translate-x-1/2 bottom-6 z-[600] frosted-glass-panel rounded-full px-4 py-2">
        <span className="text-sm font-serif text-muted">
          {status === 'locating' ? '定位中…' : '無法取得位置（權限被拒或逾時）'}
        </span>
      </div>
    )
  }

  // status === 'ok'
  if (!ranked.length) {
    return (
      <div key="empty-pill" className="nearby-enter absolute left-1/2 -translate-x-1/2 bottom-6 z-[600] frosted-glass-panel rounded-full px-4 py-2">
        <span className="text-sm font-serif text-muted">附近沒有可顯示的點</span>
      </div>
    )
  }

  return (
    <div key="card-strip" className="absolute left-0 right-0 bottom-0 z-[600] pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x px-4">
        {ranked.slice(0, MAX_CARDS).map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p)}
            style={{ '--enter-delay': `${Math.min(i, MAX_STAGGER_STEPS) * STAGGER_MS}ms` }}
            className="nearby-enter snap-start flex-none w-44 glass-card press-springy relative rounded-2xl px-3.5 py-2.5 text-left touch-manipulation"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-serif font-bold text-jp-text truncate">{p.name}</span>
              <span className="text-xs font-bold text-jp-green-text tabular-nums flex-none">{formatDistance(p._dist)}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: dotColor(p.bucket) }} />
              <span className="text-2xs text-muted font-serif truncate">
                {bucketLabel(p.bucket)}{p.desc ? ` · ${p.desc}` : ''}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
