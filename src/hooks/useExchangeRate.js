import { useState, useEffect } from 'react'
import { getCached, setCached } from '../lib/swrCache.js'

const API_URL = 'https://open.er-api.com/v6/latest/TWD'

// 同一 session 內共用同一個 in-flight Promise，避免多個 widget 重複 fetch
let inflight = null

/** 清空 in-memory 共享 Promise，供測試使用 */
export function __clearFxCache() {
  inflight = null
}

/** 以本機日期組出 fx:TWD:<YYYY-MM-DD>。API 為日更，跨日 key 變 → 自動 revalidate。 */
function todayKey() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `fx:TWD:${y}-${m}-${d}`
}

/**
 * 驗證 API payload 並萃取要快取的整張 rates 表（base = TWD）。
 * schema 不符即 throw，呼叫端降級為靜默隱藏。
 */
function parsePayload(json) {
  if (!json || json.result !== 'success' || typeof json.rates !== 'object' || !json.rates) {
    throw new Error('Invalid exchange-rate payload')
  }
  return { rates: json.rates, updatedAt: json.time_last_update_utc ?? null }
}

function fetchRates(key) {
  if (!inflight) {
    inflight = fetch(API_URL)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(parsePayload)
      .then(payload => {
        setCached(key, payload)
        return payload
      })
      .catch(err => {
        // 失敗時清掉 in-flight，下次 hook 重跑能重試
        inflight = null
        throw err
      })
  }
  return inflight
}

/**
 * 取得「1 TWD = ? <currency>」匯率。
 *
 * - currency 為 null（國家查不到幣別）時整個 hook no-op，不 fetch。
 * - 快取整張 base=TWD rates 表（key 不含 currency），rate 由表中取值。
 * - 回傳 { rate, updatedAt, loading, error }。失敗 / 查無幣別時 rate = null。
 */
export function useExchangeRate(currency) {
  const key = todayKey()
  const cached = currency ? getCached(key) : null

  const [table, setTable] = useState(() => cached)
  const [loading, setLoading] = useState(() => Boolean(currency) && !cached)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!currency) { setLoading(false); return }

    let cancelled = false
    setError(null)

    // 有快取就不顯示 loading（瞬開），背景 revalidate
    const hit = getCached(key)
    if (hit) setTable(hit)
    else setLoading(true)

    fetchRates(key)
      .then(payload => {
        if (cancelled) return
        setTable(payload)
      })
      .catch(err => {
        if (cancelled) return
        setError(err)
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [currency, key])

  const rates = table?.rates ?? null
  const rate = currency && rates && Number.isFinite(rates[currency]) ? rates[currency] : null

  return { rate, updatedAt: table?.updatedAt ?? null, loading, error }
}
