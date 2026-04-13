import { useState, useEffect } from 'react'
import { sheetURL, parseCSV } from '../lib/sheets.js'

const cache = new Map()

export function useSheetData(sheetId, tabName) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!sheetId || !tabName) { setLoading(false); return }

    const key = `${sheetId}:${tabName}`
    if (cache.has(key)) {
      setData(cache.get(key))
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    fetch(sheetURL(sheetId, tabName))
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then(text => {
        const parsed = parseCSV(text)
        cache.set(key, parsed)
        setData(parsed)
      })
      .catch(err => setError(err))
      .finally(() => setLoading(false))
  }, [sheetId, tabName])

  return { data, loading, error }
}
