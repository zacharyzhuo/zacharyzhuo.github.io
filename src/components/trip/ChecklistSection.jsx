import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { tap } from '../../lib/haptic.js'

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

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(checkedItems))
    } catch { /* ignore */ }
  }, [checkedItems, storageKey])

  const toggle = (key) => {
    tap()
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const byCategory = rows.reduce((acc, row) => {
    const cat = row.category || '其他'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(row.item)
    return acc
  }, {})

  // 採 Shopping / Food 同樣的 noScroll noStickyTitle 結構：
  // 由 section 自己管理捲動容器，標題放在捲動區頂端，會跟著一起捲動。
  return (
    <div className="flex flex-col relative h-full">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-8 pb-10 pt-2">
        <h2 className="text-2xl font-serif font-bold text-jp-text pt-8 pb-2 pr-12">行李清單</h2>

        {rows.length === 0 ? (
          <p className="text-center text-stone-500 font-serif text-sm mt-12">尚無行李清單</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 mt-4">
            {Object.entries(byCategory).map(([category, items]) => {
              const total = items.length
              const done = items.filter(i => checkedItems[`${category}-${i}`]).length
              const pct = total === 0 ? 0 : Math.round((done / total) * 100)
              return (
                <div key={category}>
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest">
                      {category}
                    </h3>
                    <span className="text-xs font-serif text-stone-400 tabular-nums">
                      {done} / {total}
                    </span>
                  </div>
                  {/* 細進度條：0% 隱形 → 100% 滿格綠色 */}
                  <div className="h-1 rounded-full bg-stone-200/60 overflow-hidden mb-3">
                    <div
                      className="h-full bg-jp-green transition-all duration-300 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <ul className="space-y-3">
                    {items.map((item) => {
                      const uniqueKey = `${category}-${item}`
                      const isChecked = checkedItems[uniqueKey] || false

                      return (
                        <li
                          key={uniqueKey}
                          className="flex items-center gap-3 group cursor-pointer touch-manipulation py-0.5"
                          onClick={() => toggle(uniqueKey)}
                          role="checkbox"
                          aria-checked={isChecked}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              toggle(uniqueKey)
                            }
                          }}
                        >
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                            isChecked
                              ? 'bg-jp-green border-jp-green text-white'
                              : 'border-stone-300 text-transparent hover:border-stone-400'
                          }`}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                          <span className={`text-base font-serif transition-all leading-tight ${
                            isChecked ? 'text-stone-400 line-through' : 'text-jp-text'
                          }`}>
                            {item}
                          </span>
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
