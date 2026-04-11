import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { useSheetData } from '../../hooks/useSheetData.js'

const SHEET_ID = 'test-sheet-123'
const CSV = '"name","time"\n"福岡","12:00"'
const BASE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`

const server = setupServer(
  http.get(BASE_URL, () => HttpResponse.text(CSV))
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useSheetData', () => {
  it('starts with loading=true', () => {
    const { result } = renderHook(() => useSheetData(SHEET_ID, 'flights'))
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('returns parsed data on success', async () => {
    const { result } = renderHook(() => useSheetData(SHEET_ID, 'flights'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([{ name: '福岡', time: '12:00' }])
    expect(result.current.error).toBeNull()
  })

  it('sets error on fetch failure', async () => {
    server.use(http.get(BASE_URL, () => HttpResponse.error()))
    const { result } = renderHook(() => useSheetData(SHEET_ID, 'flights'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
    expect(result.current.data).toEqual([])
  })

  it('returns loading=false immediately when sheetId is empty', () => {
    const { result } = renderHook(() => useSheetData('', 'flights'))
    expect(result.current.loading).toBe(false)
    expect(result.current.data).toEqual([])
    expect(result.current.error).toBeNull()
  })
})
