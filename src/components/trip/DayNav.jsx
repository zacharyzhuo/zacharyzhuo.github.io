import { useRef, useEffect } from 'react'

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
    activeBtn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeDay])

  return (
    <div className="glass-day-nav sticky top-0 z-20 overflow-hidden">
      <div
        ref={scrollRef}
        className="flex items-center justify-center px-6 py-4 overflow-x-auto scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
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
              onClick={() => onSelect(day)}
              className="flex flex-col items-center gap-1 min-w-[4rem] flex-shrink-0 min-h-[44px] justify-center touch-manipulation px-2 relative"
              aria-label={`選擇第 ${day} 天`}
            >
              {isEasterDay && easterEggIcon ? (
                easterEggIcon
              ) : (
                <>
                  <span className={`text-xs tracking-widest uppercase font-serif ${
                    isActive ? 'text-jp-red font-bold' : 'text-stone-400'
                  }`}>
                    {dow ? `週${dow}` : `Day${day}`}
                  </span>
                  <span className={`text-2xl font-serif leading-none ${
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
  )
}
