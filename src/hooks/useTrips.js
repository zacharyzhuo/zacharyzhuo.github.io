import { useState, useEffect } from 'react'
import { sheetURL, parseCSV } from '../lib/sheets.js'

export function useTrips() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const indexSheetId = import.meta.env.VITE_INDEX_SHEET_ID

    fetch(sheetURL(indexSheetId, 'trips'))
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then(text => {
        const rows = parseCSV(text)
        setTrips(rows.filter(r => r.status === 'published'))
      })
      .catch(err => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { trips, loading, error }
}
