import { useRef, useMemo } from 'react'
import { tap } from '../../lib/haptic.js'
import { useSegmentedDrag } from '../../hooks/useSegmentedDrag.js'

/**
 * 玻璃膠囊分段控制器。單一個會移動的膠囊作為 indicator，支援拖拉跟手，
 * 內容裝不下時自動降級為「可橫向捲動 + 點按」（膠囊改為 tap-to-slide）。
 *
 * @param {object} props
 * @param {Array<{ key: string, label: string }>} props.tabs
 * @param {string} props.value 目前選中的 key
 * @param {(key: string) => void} props.onChange
 * @param {string} [props.itemClassName] 套到每顆 tab 的額外 class（例如 padding 微調）
 * @param {string} [props.className] 套到軌道容器的額外 class
 * @param {string} [props.ariaLabel]
 */
export default function SegmentedControl({
  tabs,
  value,
  onChange,
  itemClassName = '',
  className = '',
  ariaLabel,
}) {
  const trackRef = useRef(null)
  const pillRef = useRef(null)
  const keys = useMemo(() => tabs.map(t => t.key), [tabs])

  const { isDegraded, consumeClickAfterDrag, beginTravel } = useSegmentedDrag({
    trackRef,
    pillRef,
    keys,
    value,
    onChange,
  })

  const handleClick = (key) => (e) => {
    e.stopPropagation()
    if (consumeClickAfterDrag()) return // 拖拉剛結束，吞掉這次 click
    if (key !== value) {
      tap()
      beginTravel() // 膠囊先變透明玻璃態，再滑行到新位置
      onChange(key)
    }
    if (isDegraded) {
      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  const handleKeyDown = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const idx = keys.indexOf(value)
    const nextIdx = e.key === 'ArrowLeft'
      ? Math.max(0, idx - 1)
      : Math.min(keys.length - 1, idx + 1)
    if (nextIdx !== idx) {
      tap()
      beginTravel()
      onChange(keys[nextIdx])
    }
  }

  return (
    <div
      ref={trackRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={`frosted-tab-track scrollbar-hide pointer-events-auto shadow-2xl ${isDegraded ? 'is-scrollable' : 'is-draggable'} ${className}`}
    >
      <span ref={pillRef} className="frosted-tab-pill" aria-hidden="true">
        <span className="frosted-tab-pill-fill" />
      </span>
      {tabs.map(tab => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={value === tab.key}
          tabIndex={value === tab.key ? 0 : -1}
          onClick={handleClick(tab.key)}
          className={`frosted-tab-btn font-serif touch-manipulation ${itemClassName} ${value === tab.key ? 'active' : ''}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
