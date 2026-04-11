import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'

/**
 * @param {{ rows: Array<{ category: string, item: string }> }} props
 */
export default function ChecklistSection({ rows }) {
  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem('trip-checklist')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('trip-checklist', JSON.stringify(checkedItems))
    } catch { /* ignore */ }
  }, [checkedItems])

  if (rows.length === 0) {
    return <p className="text-center text-stone-500 font-serif text-sm mt-12">尚無行李清單</p>
  }

  const toggle = (key) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const byCategory = rows.reduce((acc, row) => {
    const cat = row.category || '其他'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(row.item)
    return acc
  }, {})

  return (
    <div className="grid grid-cols-1 gap-6">
      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-3 pb-1">
            {category}
          </h3>
          <ul className="space-y-3">
            {items.map((item, i) => {
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
      ))}
    </div>
  )
}
