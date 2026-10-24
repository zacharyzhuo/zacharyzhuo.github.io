import { useState, useEffect, useCallback, useRef } from 'react'
import { sheetURL, parseCSV } from '../lib/sheets.js'
import { getCached, setCached } from '../lib/swrCache.js'
import { env } from '../lib/env.js'
import { useRevalidateOnVisible } from './useRevalidateOnVisible.js'

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
  // 待 resolve 的 refresh() promise：fetch effect 完成（成功或失敗）時 resolve
  const refreshResolveRef = useRef(null)

  const settleRefresh = useCallback(() => {
    refreshResolveRef.current?.()
    refreshResolveRef.current = null
  }, [])

  const refresh = useCallback(() => {
    // 不先清 localStorage：refetch 失敗（離線）時要保留舊清單，success 時下方 effect 的
    // setCached 自然覆蓋。前一次 refresh 還沒完成就又被呼叫 → 先放掉舊的，避免它永遠 pending
    settleRefresh()
    return new Promise((resolve) => {
      refreshResolveRef.current = resolve // effect 完成（成功或失敗）時 resolve
      setRefreshTick(t => t + 1)
    })
  }, [settleRefresh])

  // 回前景 → 靜默 refetch index sheet（不清 localStorage，背景拿新清單不重載）
  useRevalidateOnVisible(useCallback(() => {
    setRefreshTick(t => t + 1)
  }, []))

  useEffect(() => {
    const indexSheetId = env.INDEX_SHEET_ID
    if (!indexSheetId) {
      setError(new Error('VITE_INDEX_SHEET_ID not configured'))
      setLoading(false)
      settleRefresh()
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
        // 被取消代表有更新的一輪 effect 接手，由那一輪負責 resolve
        if (cancelled) return
        setLoading(false)
        settleRefresh()
      })

    return () => { cancelled = true }
  }, [refreshTick, settleRefresh])

  return { trips, loading, error, refresh }
}
