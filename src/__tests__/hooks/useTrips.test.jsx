import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { useTrips } from '../../hooks/useTrips.js'

// mock env variable
vi.stubEnv('VITE_INDEX_SHEET_ID', 'index-sheet-id')

const INDEX_ID = 'index-sheet-id'
const BASE_URL = `https://docs.google.com/spreadsheets/d/${INDEX_ID}/gviz/tq`

const CSV_WITH_DRAFT = `"slug","name","dates","cover_image_url","sheet_id","status"\n"fukuoka-2026-01","福岡","2026/01/10 - 01/14","https://img.example.com/fuk.jpg","sheet-fuk","published"\n"draft-trip","Draft","2026/06","","sheet-draft","draft"`

const server = setupServer(
  http.get(BASE_URL, () => HttpResponse.text(CSV_WITH_DRAFT))
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useTrips', () => {
  it('returns only published trips', async () => {
    const { result } = renderHook(() => useTrips())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.trips).toHaveLength(1)
    expect(result.current.trips[0].slug).toBe('fukuoka-2026-01')
  })

  it('sets error on fetch failure', async () => {
    server.use(http.get(BASE_URL, () => HttpResponse.error()))
    const { result } = renderHook(() => useTrips())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
  })
})
