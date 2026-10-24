import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest'
import { useTrips } from '../../hooks/useTrips.js'
import { getCached } from '../../lib/swrCache.js'

// mock env variable
vi.stubEnv('VITE_INDEX_SHEET_ID', 'index-sheet-id')

const INDEX_ID = 'index-sheet-id'
const BASE_URL = `https://docs.google.com/spreadsheets/d/${INDEX_ID}/gviz/tq`

const CSV_WITH_DRAFT = `"slug","name","dates","cover_image_url","sheet_id","status"\n"2026-01-fukuoka","福岡","2026/01/10 - 01/14","https://img.example.com/fuk.jpg","sheet-fuk","published"\n"draft-trip","Draft","2026/06","","sheet-draft","draft"`

const server = setupServer(
  http.get(BASE_URL, () => HttpResponse.text(CSV_WITH_DRAFT))
)

beforeAll(() => server.listen())
beforeEach(() => {
  // SWR localStorage 跨 test 殘留 → 下個 test 起手就有 cached data，waitFor 提早通過
  localStorage.clear()
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useTrips', () => {
  it('returns only published trips', async () => {
    const { result } = renderHook(() => useTrips())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.trips).toHaveLength(1)
    expect(result.current.trips[0].slug).toBe('2026-01-fukuoka')
  })

  it('sets error on fetch failure', async () => {
    server.use(http.get(BASE_URL, () => HttpResponse.error()))
    const { result } = renderHook(() => useTrips())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
  })

  it('refresh() resolves only after the refetch settles', async () => {
    const { result } = renderHook(() => useTrips())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // 延遲回應：refresh 的 promise 必須等到這個 fetch 完成才 resolve
    let release
    const gate = new Promise(r => { release = r })
    let hits = 0
    server.use(http.get(BASE_URL, async () => {
      hits += 1
      await gate
      return HttpResponse.text(CSV_WITH_DRAFT)
    }))

    let settled = false
    let pending
    act(() => { pending = result.current.refresh().then(() => { settled = true }) })
    await waitFor(() => expect(hits).toBe(1))
    expect(settled).toBe(false)

    release()
    await act(async () => { await pending })
    expect(settled).toBe(true)
  })

  it('refresh() keeps stale trips and localStorage entry when the refetch fails (offline pull-to-refresh)', async () => {
    const { result } = renderHook(() => useTrips())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.trips).toHaveLength(1)
    expect(getCached('trips:index')).toHaveLength(1)

    server.use(http.get(BASE_URL, () => HttpResponse.error()))
    let pending
    act(() => { pending = result.current.refresh() })
    await waitFor(() => expect(result.current.error).not.toBeNull())
    await act(async () => { await pending })

    // 失敗後畫面上的 trips 與 localStorage 都不能被清掉（舊版會在呼叫 refresh() 那一刻就先清掉）
    expect(result.current.error).not.toBeNull()
    expect(result.current.trips).toHaveLength(1)
    expect(getCached('trips:index')).toHaveLength(1)
  })
})
