import { useRef, useEffect } from 'react'
import { tap } from '../../lib/haptic.js'
import { formatToday } from '../../lib/tripDate.js'

function getDayOfWeek(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('/')
  if (parts.length < 3) return ''
  const [y, m, d] = parts.map(Number)
  return ['日', '一', '二', '三', '四', '五', '六'][new Date(y, m - 1, d).getDay()]
}

function getDayOfMonth(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('/')
  return parts[2] ? String(Number(parts[2])).padStart(2, '0') : ''
}

/**
 * @param {{
 *   days: Array<{ day: number, date: string }>,
 *   activeDay: number,
 *   onSelect: (day: number) => void,
 *   easterEggIcon?: React.ReactNode,
 *   easterEggDay?: number,
 *   bare?: boolean,
 *   compact?: boolean
 * }} props
 * bare：不渲染 glass-day-nav 全寬色帶（無底/無框/無陰影/非 sticky），
 * 給「已經有自己玻璃容器」的場景用（如地圖 modal 的懸浮膠囊），
 * 避免全寬色帶在地圖上形成上下斷層。
 * compact：單行緊湊版（「五 05」一行 baseline 排列，高 ~44px），給地圖路線模式用 ——
 * 兩層式（週幾＋大數字）直向太高會擋地圖。文字語言：紅字週幾只標記「今天」欄
 * （與選中態無關）；選中但非今天＝深色粗體週幾；不用品牌綠膠囊（user 明確指定）。
 */
export default function DayNav({ days, activeDay, onSelect, easterEggIcon, easterEggDay, bare = false, compact = false }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const activeBtn = el.querySelector('[data-active="true"]')
    if (!activeBtn) return
    // 勿用 scrollIntoView：iOS Safari 對 sticky 容器內的元素會連「整頁垂直」
    // 一起捲到它的文流位置（header 下方），造成換天時頁面莫名跳進行程卡。
    // 改為只捲水平容器自己，把 active chip 置中。
    const elRect = el.getBoundingClientRect()
    const btnRect = activeBtn.getBoundingClientRect()
    const delta = (btnRect.left + btnRect.width / 2) - (elRect.left + elRect.width / 2)
    el.scrollTo({ left: el.scrollLeft + delta, behavior: 'smooth' })
  }, [activeDay])

  return (
    <div className={bare ? 'overflow-hidden' : 'glass-day-nav sticky top-0 z-20 overflow-hidden'}>
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: 'touch', scrollPaddingInline: '50%' }}
      >
        {/* inline-flex + min-w-full：天數少時 justify-center 置中；天數多溢出時 inner div 自然展開，兩側都能捲到 */}
        <div className={`inline-flex items-center justify-center min-w-full box-border ${compact ? 'px-1.5 py-0.5' : 'px-6 py-4'}`}>
        {days.map(({ day, date }) => {
          const isActive = activeDay === day
          // 紅色只標記「今天」欄（與選中態獨立）；選中另用深色粗體表示。
          const isToday = date === formatToday()
          const isEasterDay = easterEggDay !== undefined && day === easterEggDay
          const dow = getDayOfWeek(date)
          const dom = getDayOfMonth(date)
          const dowClass = isToday ? 'text-jp-red font-bold' : (isActive ? 'text-jp-text font-bold' : 'text-muted')

          if (compact) {
            return (
              <button
                key={day}
                data-active={isActive}
                data-day={day}
                onClick={() => { if (!isActive) tap(); onSelect(day) }}
                className="grid place-items-center px-2.5 min-h-[44px] flex-shrink-0 touch-manipulation relative snap-center"
                aria-label={`選擇第 ${day} 天`}
              >
                <span className="flex items-baseline gap-1">
                  <span className={`text-xs font-serif ${dowClass}`}>
                    {dow || `D${day}`}
                  </span>
                  <span className={`text-sm font-serif font-bold leading-none tabular-nums ${isActive ? 'text-jp-text' : 'text-stone-400'}`}>
                    {dom || String(day).padStart(2, '0')}
                  </span>
                </span>
              </button>
            )
          }

          return (
            <button
              key={day}
              data-active={isActive}
              data-day={day}
              onClick={() => { if (!isActive) tap(); onSelect(day) }}
              className="flex flex-col items-center gap-1 min-w-[4rem] flex-shrink-0 min-h-[44px] justify-center touch-manipulation px-2 relative snap-center"
              aria-label={`選擇第 ${day} 天`}
            >
              {isEasterDay && easterEggIcon ? (
                easterEggIcon
              ) : (
                <>
                  <span className={`text-xs tracking-widest uppercase font-serif ${dowClass}`}>
                    {dow ? `週${dow}` : `Day${day}`}
                  </span>
                  <span className={`text-2xl font-serif leading-none tabular-nums ${
                    isActive ? 'text-jp-text' : 'text-stone-400'
                  }`}>
                    {dom || String(day).padStart(2, '0')}
                  </span>
                  {isActive && <div className={`w-1 h-1 rounded-full mt-1 ${isToday ? 'bg-jp-red' : 'bg-jp-text'}`} />}
                </>
              )}
            </button>
          )
        })}
        </div>
      </div>
    </div>
  )
}
