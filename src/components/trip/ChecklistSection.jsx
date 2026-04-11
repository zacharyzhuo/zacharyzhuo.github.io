import { useState } from 'react'
import { Check } from 'lucide-react'

/**
 * @param {{ rows: Array<{ category: string, item: string }> }} props
 */
export default function ChecklistSection({ rows }) {
  const [checked, setChecked] = useState(new Set())

  if (rows.length === 0) {
    return <p className="text-center text-jp-sub font-sans text-sm mt-12">尚無打包清單</p>
  }

  const toggle = (key) => {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // Group by category
  const byCategory = rows.reduce((acc, row) => {
    const cat = row.category || '其他'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(row.item)
    return acc
  }, {})

  return (
    <div className="px-4 py-6 space-y-6">
      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category}>
          <h3 className="font-serif font-bold text-jp-text text-base px-1 mb-3">{category}</h3>
          <div className="bg-white/60 rounded-2xl border border-stone-100 divide-y divide-stone-100">
            {items.map((item, i) => {
              const key = `${category}:${item}`
              const isChecked = checked.has(key)
              return (
                <button
                  key={i}
                  onClick={() => toggle(key)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left touch-manipulation"
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isChecked ? 'bg-jp-green border-jp-green' : 'border-stone-300'
                  }`}>
                    {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className={`font-sans text-sm transition-colors ${
                    isChecked ? 'line-through text-stone-400' : 'text-jp-text'
                  }`}>
                    {item}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
