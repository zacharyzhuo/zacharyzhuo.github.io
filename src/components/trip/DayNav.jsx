import { useRef, useEffect } from 'react'
import { tap } from '../../lib/haptic.js'

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
 *   easterEggDay?: number
 * }} props
 */
export default function DayNav({ days, activeDay, onSelect, easterEggIcon, easterEggDay }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!scrollRef.current) return
    const activeBtn = scrollRef.current.querySelector('[data-active="true"]')
    if (!activeBtn) return
    activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeDay])

  return (
    <div className="glass-day-nav sticky top-0 z-20 overflow-hidden">
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: 'touch', scrollPaddingInline: '50%' }}
      >
        {/* inline-flex + min-w-full：天數少時 justify-center 置中；天數多溢出時 inner div 自然展開，兩側都能捲到 */}
        <div className="inline-flex items-center justify-center min-w-full box-border px-6 py-4">
        {days.map(({ day, date }) => {
          const isActive = activeDay === day
          const isEasterDay = easterEggDay !== undefined && day === easterEggDay
          const dow = getDayOfWeek(date)
          const dom = getDayOfMonth(date)

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
                  <span className={`text-xs tracking-widest uppercase font-sans ${
                    isActive ? 'text-jp-red font-bold' : 'text-stone-400'
                  }`}>
                    {dow ? `週${dow}` : `Day${day}`}
                  </span>
                  <span className={`text-2xl font-serif leading-none tabular-nums ${
                    isActive ? 'text-jp-text' : 'text-stone-300'
                  }`}>
                    {dom || String(day).padStart(2, '0')}
                  </span>
                  {isActive && <div className="w-1 h-1 bg-jp-red rounded-full mt-1" />}
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
