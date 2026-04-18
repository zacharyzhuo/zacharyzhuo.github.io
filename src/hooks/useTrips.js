import { useState, useEffect, useCallback } from 'react'
import { sheetURL, parseCSV } from '../lib/sheets.js'
import { getCached, setCached, clearCached } from '../lib/swrCache.js'
import { env } from '../lib/env.js'

const TRIPS_CACHE_KEY = 'trips:index'

function transformTrips(rows) {
  return rows.filter(r => r.status === 'published').reverse()
}

export function useTrips() {
  // 啟動時直接讀 localStorage 上一次的結果，避免每次 reload 都白屏等 fetch
  const [trips, setTrips] = useState(() => getCached(TRIPS_CACHE_KEY) || [])
  const [loading, setLoading] = useState(() => !getCached(TRIPS_CACHE_KEY))
  const [error, setError] = useState(null)
  const [refreshTick, setRefreshTick] = useState(0)

  const refresh = useCallback(async () => {
    clearCached(TRIPS_CACHE_KEY)
    setRefreshTick(t => t + 1)
    // 等待一個 microtask 讓 effect 跑完，UI 端可 await 拿到 fresh 完成
    await new Promise(r => setTimeout(r, 600))
  }, [])

  useEffect(() => {
    const indexSheetId = env.INDEX_SHEET_ID
    if (!indexSheetId) {
      setError(new Error('VITE_INDEX_SHEET_ID not configured'))
      setLoading(false)
      return
    }

    let cancelled = false

    fetch(sheetURL(indexSheetId, 'trips'))
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then(text => {
        if (cancelled) return
        const next = transformTrips(parseCSV(text))
        setTrips(next)
        setCached(TRIPS_CACHE_KEY, next)
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
  }, [refreshTick])

  return { trips, loading, error, refresh }
}
