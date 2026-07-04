/**
 * 匯率相關純函式：國家碼 → 幣別、雙向換算、格式化。
 * 全純函式、無副作用，好測。fetch / 快取邏輯在 hooks/useExchangeRate.js。
 */

import countryToCurrency from 'country-to-currency'

/** 換算方向：100 外幣 → TWD（toTwd），或 1 TWD → 外幣（toForeign） */
export const DIRECTIONS = Object.freeze({ TO_TWD: 'toTwd', TO_FOREIGN: 'toForeign' })

/** 方向 A 的外幣基數：顯示「100 JPY ≈ X TWD」 */
export const FOREIGN_UNIT = 100

/**
 * ISO 3166-1 alpha-2 國家碼 → ISO 4217 幣別碼。
 * 查不到（空字串 / 未知國家）回傳 null，呼叫端據此優雅降級。
 */
export function resolveCurrency(countryCode) {
  if (!countryCode || typeof countryCode !== 'string') return null
  const cc = countryCode.trim().toUpperCase()
  return countryToCurrency[cc] ?? null
}

/**
 * 雙向換算。rate = rates[CUR]，語意為「1 TWD = rate 個外幣」。
 *
 * - toTwd：100 外幣等於多少 TWD → 100 / rate
 * - toForeign：1 TWD 等於多少外幣 → rate
 */
export function convert(rate, direction) {
  if (!Number.isFinite(rate) || rate <= 0) return null
  return direction === DIRECTIONS.TO_TWD ? FOREIGN_UNIT / rate : rate
}

/**
 * 顯示用格式化：~3 位有效數字，依量級決定小數位，避免冗長尾數。
 * 例：19.7（>=10 取 1 位）、5.08（>=1 取 2 位）、0.0318（<1 取 4 位）。
 */
export function formatRate(value) {
  if (!Number.isFinite(value)) return ''
  const abs = Math.abs(value)
  let digits
  if (abs >= 100) digits = 0
  else if (abs >= 10) digits = 1
  else if (abs >= 1) digits = 2
  else digits = 4
  // useGrouping: false 保留原本 toFixed 的輸出形狀（無千分位逗號）
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: false,
  }).format(value)
}
