import { useRef, useEffect } from 'react'

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
    <div className="sticky top-0 z-20 border-b border-stone-200/50 bg-jp-bg/80 backdrop-filter backdrop-blur-sm">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide px-4 py-3 gap-2"
      >
        {days.map(({ day, date }) => {
          const isActive = activeDay === day
          const isEasterDay = easterEggDay !== undefined && day === easterEggDay

          return (
            <button
              key={day}
              data-active={isActive}
              onClick={() => onSelect(day)}
              className={`flex flex-col items-center min-w-[4rem] px-2 py-2 rounded-xl transition-all touch-manipulation flex-shrink-0 ${
                isActive ? 'liquid-glass-button' : 'hover:bg-white/30'
              }`}
              aria-label={`選擇第 ${day} 天`}
            >
              {isEasterDay && easterEggIcon ? (
                easterEggIcon
              ) : (
                <span className={`text-sm font-serif font-bold ${isActive ? 'text-jp-text' : 'text-stone-400'}`}>
                  Day {day}
                </span>
              )}
              <span className="text-xs font-sans text-stone-400 mt-0.5">{date}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
