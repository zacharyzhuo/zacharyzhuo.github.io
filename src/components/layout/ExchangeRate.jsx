import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { tap } from '../../lib/haptic.js'
import { useExchangeRate } from '../../hooks/useExchangeRate.js'
import { resolveCurrency, convert, formatRate, DIRECTIONS, FOREIGN_UNIT } from '../../lib/currency.js'

/** UTC 字串 → 本地 M/D，解析失敗回 null */
function formatUpdated(utc) {
  if (!utc) return null
  const d = new Date(utc)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/**
 * 側邊欄底部即時匯率 widget。依目的地國家碼自動換算對台幣匯率，點一下切換方向。
 *
 * 優雅降級（皆回 null，絕不破版）：國家查不到幣別 / 幣別 = TWD（換算無意義）/
 * 載入完成但無 rate（fetch 失敗且無快取、幣別不在 API）。
 */
export default function ExchangeRate({ countryCode }) {
  // currency 純函式先算（可能為 null），但 hook 必須無條件呼叫（rules of hooks）
  const currency = resolveCurrency(countryCode)
  const { rate, updatedAt, loading } = useExchangeRate(currency)
  const [direction, setDirection] = useState(DIRECTIONS.TO_TWD)

  if (!currency || currency === 'TWD') return null
  if (!rate && !loading) return null
  if (!rate) return null // 載入中且無快取：不顯示（避免閃爍），有快取時 rate 已就緒

  const toTwd = direction === DIRECTIONS.TO_TWD
  const value = formatRate(convert(rate, direction))
  const line = toTwd
    ? `${FOREIGN_UNIT} ${currency} ≈ ${value} TWD`
    : `1 TWD ≈ ${value} ${currency}`
  const updated = formatUpdated(updatedAt)

  const flip = () => {
    tap()
    setDirection((d) => (d === DIRECTIONS.TO_TWD ? DIRECTIONS.TO_FOREIGN : DIRECTIONS.TO_TWD))
  }

  return (
    <div className="px-6 pb-1 pt-2 flex justify-center">
      <button
        type="button"
        onClick={flip}
        className="press-springy w-full flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl touch-manipulation min-h-[44px]"
        aria-label={`目前匯率 ${line}，點擊切換換算方向`}
      >
        <span className="flex items-center gap-1.5 font-serif text-xs text-stone-600">
          <ArrowLeftRight size={12} className="text-stone-400" aria-hidden="true" />
          {line}
        </span>
        <span className="font-serif text-2xs text-stone-400 tracking-wide">
          {updated ? `updated ${updated} · ` : ''}tap to flip
        </span>
      </button>
    </div>
  )
}
