import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from 'vitest'
import { useExchangeRate, __clearFxCache } from '../../hooks/useExchangeRate.js'

const API_URL = 'https://open.er-api.com/v6/latest/TWD'

const OK_PAYLOAD = {
  result: 'success',
  base_code: 'TWD',
  time_last_update_utc: 'Sat, 30 May 2026 00:02:31 +0000',
  rates: { TWD: 1, JPY: 5.076464, KRW: 47.948936, THB: 1.036048 },
}

const server = setupServer(
  http.get(API_URL, () => HttpResponse.json(OK_PAYLOAD))
)

beforeAll(() => server.listen())
beforeEach(() => {
  localStorage.clear()
  __clearFxCache()
})
afterEach(() => {
  server.resetHandlers()
  __clearFxCache()
})
afterAll(() => server.close())

describe('useExchangeRate', () => {
  it('no-ops when currency is null (no fetch, no loading)', () => {
    const { result } = renderHook(() => useExchangeRate(null))
    expect(result.current.loading).toBe(false)
    expect(result.current.rate).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('returns the rate for the requested currency on success', async () => {
    const { result } = renderHook(() => useExchangeRate('JPY'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.rate).toBeCloseTo(5.076464, 5)
    expect(result.current.updatedAt).toBe(OK_PAYLOAD.time_last_update_utc)
    expect(result.current.error).toBeNull()
  })

  it('returns null rate for a currency missing from the table', async () => {
    const { result } = renderHook(() => useExchangeRate('XYZ'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.rate).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('degrades to error when API reports result:error', async () => {
    server.use(http.get(API_URL, () => HttpResponse.json({ result: 'error' })))
    const { result } = renderHook(() => useExchangeRate('JPY'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
    expect(result.current.rate).toBeNull()
  })

  it('degrades to error on network failure', async () => {
    server.use(http.get(API_URL, () => HttpResponse.error()))
    const { result } = renderHook(() => useExchangeRate('JPY'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
    expect(result.current.rate).toBeNull()
  })

  it('serves cached rates immediately without loading flash', async () => {
    // 先跑一次寫入 SWR 快取
    const first = renderHook(() => useExchangeRate('JPY'))
    await waitFor(() => expect(first.result.current.loading).toBe(false))
    __clearFxCache() // 清掉 in-memory promise，只留 localStorage 快取

    const { result } = renderHook(() => useExchangeRate('JPY'))
    expect(result.current.loading).toBe(false) // 快取命中 → 不 loading
    expect(result.current.rate).toBeCloseTo(5.076464, 5)
  })
})
