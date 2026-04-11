import { useState, useEffect } from 'react'
import { sheetURL, parseCSV } from '../lib/sheets.js'

export function useSheetData(sheetId, tabName) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!sheetId || !tabName) return
    setLoading(true)
    setError(null)

    fetch(sheetURL(sheetId, tabName))
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then(text => setData(parseCSV(text)))
      .catch(err => setError(err))
      .finally(() => setLoading(false))
  }, [sheetId, tabName])

  return { data, loading, error }
}
