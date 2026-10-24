import { describe, test, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import TripPage from '../../pages/TripPage.jsx'

// jsdom 沒實作 scrollTo（window 與 Element 都沒有）；DayNav/切日 effect 會呼叫到，
// 範圍只限這個測試檔，不動全域 setup.js。
beforeAll(() => {
  window.scrollTo = vi.fn()
  Element.prototype.scrollTo = vi.fn()
})

const TRIP = {
  slug: 'test-trip',
  name: '測試行程',
  sheet_id: 'sheet-1',
  dates: '2026/01/01 - 01/03',
  status: 'published',
}

const ITINERARY_ROW = { date: '1/1', time: '09:00', name: '抵達', type: 'attraction' }

// 預設：所有 tab 都「沒資料、沒 error」，個別測試用 overrides 蓋掉特定 tab
function makeSheetDataMock(overrides = {}) {
  const refresh = vi.fn()
  return (sheetId, tabName) => {
    if (overrides[tabName]) return { data: [], loading: false, error: null, refresh, ...overrides[tabName] }
    return { data: [], loading: false, error: null, refresh }
  }
}

let sheetDataImpl = makeSheetDataMock()

vi.mock('../../hooks/useTrips.js', () => ({
  useTrips: () => ({ trips: [TRIP], loading: false, error: null, refresh: vi.fn() }),
}))

vi.mock('../../hooks/useSheetData.js', () => ({
  useSheetData: (sheetId, tabName) => sheetDataImpl(sheetId, tabName),
  prefetchSheet: vi.fn(),
}))

function renderTripPage(initialEntries = ['/trip/test-trip']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/trip/:slug" element={<TripPage />} />
      </Routes>
    </MemoryRouter>
  )
}

afterEach(() => {
  cleanup()
  sheetDataImpl = makeSheetDataMock()
})

describe('TripPage 錯誤狀態', () => {
  test('itinerary fetch 失敗且無快取資料時，顯示全頁 ErrorState 而非空白', async () => {
    sheetDataImpl = makeSheetDataMock({
      itinerary: { error: new Error('network down') },
    })
    renderTripPage()

    await waitFor(() => expect(screen.getByText('無法載入行程資料')).toBeTruthy())
    expect(screen.getByRole('button', { name: '重試' })).toBeTruthy()
  })

  test('itinerary 有 stale cache 時，即使這次 fetch 失敗也照常顯示資料（SWR 語意，不擋頁）', async () => {
    sheetDataImpl = makeSheetDataMock({
      itinerary: { data: [ITINERARY_ROW], error: new Error('network down') },
    })
    renderTripPage()

    await waitFor(() => expect(screen.getByText('抵達')).toBeTruthy())
    expect(screen.queryByText('無法載入行程資料')).toBeNull()
  })

  test('逛街清單 fetch 失敗且無資料時，sheet 內顯示錯誤重試而非空狀態', async () => {
    sheetDataImpl = makeSheetDataMock({
      itinerary: { data: [ITINERARY_ROW] },
      shopping: { error: new Error('network down') },
    })
    renderTripPage([{ pathname: '/trip/test-trip', state: { panel: 'shopping' } }])

    await waitFor(() => expect(screen.getByText('請檢查網路連線後重試')).toBeTruthy())
    expect(screen.queryByText('尚無逛街清單')).toBeNull()
  })
})
