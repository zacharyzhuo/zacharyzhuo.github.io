import { useState, useEffect, useCallback } from 'react'
import { sheetURL, parseCSV } from '../lib/sheets.js'
import { getCached, setCached, clearCached } from '../lib/swrCache.js'

// key -> Promise<rows>。同一 sheet+tab 的並行 request 共用同一個 Promise，避免重複 fetch
const promiseCache = new Map()

/** 清空 in-memory cache，主要供測試使用 */
export function __clearSheetCache() {
  promiseCache.clear()
}

/**
 * 主動失效一個 sheet tab 的 cache（in-memory + localStorage 都清）。下次 useSheetData
 * 重新讀取時會走網路。給 pull-to-refresh 用。
 */
export function invalidateSheet(sheetId, tabName) {
  if (!sheetId || !tabName) return
  const key = `${sheetId}:${tabName}`
  promiseCache.delete(key)
  clearCached(key)
}

export function fetchSheet(sheetId, tabName) {
  const key = `${sheetId}:${tabName}`
  if (!promiseCache.has(key)) {
    const p = fetch(sheetURL(sheetId, tabName))
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then(parseCSV)
      .then(rows => {
        setCached(key, rows)
        return rows
      })
      .catch(err => {
        // 失敗時清掉 cache，下次 hook 重跑時能重試
        promiseCache.delete(key)
        throw err
      })
    promiseCache.set(key, p)
  }
  return promiseCache.get(key)
}

/**
 * 預先 fetch 但不等待（用於 hover/touchstart prefetch）
 */
export function prefetchSheet(sheetId, tabName) {
  if (!sheetId || !tabName) return
  fetchSheet(sheetId, tabName).catch(() => { /* prefetch 失敗無聲忽略 */ })
}

export function useSheetData(sheetId, tabName) {
  // 啟動時嘗試從 localStorage 讀上次 fetch 結果，達成 stale-while-revalidate
  const cacheKey = sheetId && tabName ? `${sheetId}:${tabName}` : null

  const [data, setData] = useState(() => (cacheKey && getCached(cacheKey)) || [])
  const [loading, setLoading] = useState(() => {
    if (!cacheKey) return false
    return !getCached(cacheKey)
  })
  const [error, setError] = useState(null)
  // bump 這個 tick 強制重 fetch；refresh() 會呼叫
  const [refreshTick, setRefreshTick] = useState(0)

  const refresh = useCallback(async () => {
    if (!sheetId || !tabName) return
    invalidateSheet(sheetId, tabName)
    setRefreshTick(t => t + 1)
  }, [sheetId, tabName])

  useEffect(() => {
    if (!sheetId || !tabName) { setLoading(false); return }

    let cancelled = false
    setError(null)

    // 有快取就不顯示 loading（避免 flicker），背景 revalidate
    const cached = getCached(`${sheetId}:${tabName}`)
    if (!cached) setLoading(true)

    fetchSheet(sheetId, tabName)
      .then(rows => {
        if (cancelled) return
        setData(rows)
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
  }, [sheetId, tabName, refreshTick])

  return { data, loading, error, refresh }
}
