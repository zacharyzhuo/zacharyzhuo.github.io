import { ChevronUp } from 'lucide-react'
import { categoryInk, BACKUP_INK, getCategory } from '../../lib/categories.js'
import { formatDistance } from '../../lib/maps.js'

const dotColor = (bucket) => (bucket === 'backup' ? BACKUP_INK : categoryInk(bucket))
const bucketLabel = (bucket) => (bucket === 'backup' ? '備選' : getCategory(bucket).label)

/**
 * 探索模式底部「離你最近」可收合面板（sheet 內的一層 panel，非第二個 BottomSheet）。
 *
 * @param {{
 *   ranked: Array<{ id:string,name:string,bucket:string,desc:string,_dist:number,lat:number,lng:number }>,
 *   status: 'idle'|'locating'|'ok'|'error',
 *   open: boolean,
 *   onToggle: () => void,
 *   onSelect: (point) => void,
 * }} props
 */
export default function NearbyPanel({ ranked, status, open, onToggle, onSelect }) {
  if (status === 'idle') return null

  return (
    <div
      className={`absolute left-0 right-0 bottom-0 z-[600] bg-jp-bg/90 backdrop-blur-md rounded-t-3xl shadow-[0_-6px_24px_rgba(0,0,0,0.12)] transition-transform duration-300 ${
        open ? 'translate-y-0' : 'translate-y-[calc(100%-46px)]'
      }`}
      style={{ maxHeight: '58%' }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-center gap-2 pt-3 pb-2 touch-manipulation"
        aria-label={open ? '收合最近清單' : '展開最近清單'}
      >
        <span className="w-9 h-1 rounded-full bg-stone-300/70" />
      </button>

      <h3 className="px-5 pb-1 text-xs tracking-wide text-muted font-serif flex items-center gap-1">
        {status === 'locating' && '定位中…'}
        {status === 'error' && '無法取得位置（權限被拒或逾時）'}
        {status === 'ok' && (
          <>
            <ChevronUp size={14} className={open ? '' : 'rotate-180'} />
            離你最近 · {ranked.length} 個點
          </>
        )}
      </h3>

      {status === 'ok' && (
        <div className="overflow-y-auto overscroll-contain px-3 pb-6" style={{ maxHeight: '46vh' }}>
          {ranked.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl active:bg-black/5 touch-manipulation text-left"
            >
              <span className="w-3 h-3 rounded-full flex-none" style={{ background: dotColor(p.bucket) }} />
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-serif text-jp-text truncate">{p.name}</span>
                <span className="block text-2xs text-muted truncate">{bucketLabel(p.bucket)}{p.desc ? ` · ${p.desc}` : ''}</span>
              </span>
              <span className="text-sm font-bold text-jp-green tabular-nums">{formatDistance(p._dist)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
