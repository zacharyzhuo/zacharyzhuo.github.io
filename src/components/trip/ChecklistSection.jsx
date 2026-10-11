import { useState, useEffect, useRef } from 'react'
import { Check, ClipboardList } from 'lucide-react'
import { tap, success } from '../../lib/haptic.js'
import EmptyState from '../ui/EmptyState.jsx'

// 完成慶祝 overlay 的存活時間
const CELEBRATE_MS = 600 // 與 index.css .bar-celebrate 同值

/**
 * 每趟行程獨立的勾選狀態（透過 storageKey 命名空間隔離）
 *
 * 注意：parent 應該使用 `key={`checklist-${slug}`}` 包裝此元件，
 * 以確保 slug 變更時 component remount，useState 初始值能重新從 localStorage 讀取對應 trip 的狀態。
 *
 * @param {{ rows: Array<{ category: string, item: string }>, slug: string }} props
 */
export default function ChecklistSection({ rows, slug }) {
  const storageKey = `trip-checklist:v1:${slug || '_default'}`

  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // { [category]: true } — 正在慶祝中的 category
  const [celebrating, setCelebrating] = useState({})
  // 每次有 category 新完成就 +1，當 overlay 的 key，讓重複完成也能重播動畫（keyframes 只在 remount 時重來）
  const [celebrateTick, setCelebrateTick] = useState(0)

  // 上一次 render 各 category 的完成數，用來偵測「剛好完成」的瞬間
  const prevDoneRef = useRef({})
  const touchStartRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(checkedItems))
    } catch { /* ignore */ }
  }, [checkedItems, storageKey])

  // 偵測 category 是否剛好從未完成 → 完成
  useEffect(() => {
    const bc = rows.reduce((acc, row) => {
      const cat = row.category || '其他'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(row.item)
      return acc
    }, {})

    const newlyComplete = []
    Object.entries(bc).forEach(([cat, items]) => {
      const total = items.length
      const done = items.filter(i => checkedItems[`${cat}-${i}`]).length
      const prev = prevDoneRef.current[cat]
      if (done === total && total > 0 && prev !== undefined && prev < total) {
        newlyComplete.push(cat)
      }
      prevDoneRef.current[cat] = done
    })

    if (newlyComplete.length === 0) return

    success()
    setCelebrateTick(t => t + 1)
    setCelebrating(prev => {
      const next = { ...prev }
      newlyComplete.forEach(c => { next[c] = true })
      return next
    })
    const timer = setTimeout(() => {
      setCelebrating(prev => {
        const next = { ...prev }
        newlyComplete.forEach(c => { delete next[c] })
        return next
      })
    }, CELEBRATE_MS)
    return () => clearTimeout(timer)
  }, [checkedItems, rows])

  const toggle = (key) => {
    tap()
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleTouchStart = (e) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const handleTouchEnd = (e, key) => {
    const start = touchStartRef.current
    touchStartRef.current = null
    if (!start) return
    const dx = Math.abs(e.changedTouches[0].clientX - start.x)
    const dy = Math.abs(e.changedTouches[0].clientY - start.y)
    if (dx < 10 && dy < 10) {
      e.preventDefault()
      toggle(key)
    }
  }

  const byCategory = rows.reduce((acc, row) => {
    const cat = row.category || '其他'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(row.item)
    return acc
  }, {})

  return (
    <div className="flex flex-col relative h-full">
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide px-8 pb-10 pt-2">
        <div>
          <p className="text-2xs tracking-[0.25em] uppercase text-muted font-serif font-medium pt-8 mb-1">Packing List</p>
          <h2 className="text-2xl font-serif font-bold text-jp-text pb-2 pr-12">行李清單</h2>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={ClipboardList} title="尚無行李清單" hint="填好 checklist tab，這裡能勾選 + 看完成進度。" />
        ) : (
          <div className="grid grid-cols-1 gap-6 mt-4">
            {Object.entries(byCategory).map(([category, items]) => {
              const total = items.length
              const done = items.filter(i => checkedItems[`${category}-${i}`]).length
              const pct = total === 0 ? 0 : Math.round((done / total) * 100)
              const isComplete = done === total && total > 0
              const isCelebrating = celebrating[category]

              return (
                <div key={category}>
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest font-serif">
                      {category}
                    </h3>
                    {isComplete ? (
                      <span
                        key={`${category}-check`}
                        className="check-pop text-xs font-serif text-jp-green font-bold"
                      >
                        ✓
                      </span>
                    ) : (
                      <span className="text-xs font-serif text-secondary tabular-nums">
                        {done} / {total}
                      </span>
                    )}
                  </div>
                  {/* 進度條：填滿用 transform（compositor），完成瞬間在 track 上疊一層 overlay 播 bar-celebrate；
                      bar 本身不下 key，否則最後一步會因 remount 直接跳到 100% 而沒有填滿動畫 */}
                  <div className="relative h-1 rounded-full bg-stone-200/60 overflow-hidden mb-3">
                    <div
                      className="absolute inset-0 bg-jp-green origin-left transition-transform duration-300 ease-out"
                      style={{ transform: `scaleX(${pct / 100})` }}
                    />
                    {isCelebrating && (
                      <div key={`${category}-celebrate-${celebrateTick}`} className="absolute inset-0 bar-celebrate pointer-events-none" aria-hidden="true" />
                    )}
                  </div>
                  <ul className="space-y-1">
                    {items.map((item) => {
                      const uniqueKey = `${category}-${item}`
                      const isChecked = checkedItems[uniqueKey] || false

                      return (
                        <li key={uniqueKey}>
                          <button
                            type="button"
                            className="w-full flex items-center gap-3 touch-manipulation py-3 min-h-[44px] text-left press-springy rounded-xl active:bg-white/25"
                            onTouchStart={handleTouchStart}
                            onTouchEnd={(e) => handleTouchEnd(e, uniqueKey)}
                            onClick={() => toggle(uniqueKey)}
                            role="checkbox"
                            aria-checked={isChecked}
                          >
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                              isChecked
                                ? 'bg-jp-green border-jp-green text-white'
                                : 'border-stone-300 text-transparent hover:border-stone-400'
                            }`}>
                              <Check size={12} strokeWidth={3} />
                            </div>
                            <span className={`text-base font-serif transition-colors leading-tight ${
                              isChecked ? 'text-muted line-through' : 'text-jp-text'
                            }`}>
                              {item}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
