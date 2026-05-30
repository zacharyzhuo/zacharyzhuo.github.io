import { describe, test, expect, vi, afterEach } from 'vitest'
import { openExternal } from '../../lib/openExternal.js'

afterEach(() => { vi.restoreAllMocks() })

describe('openExternal', () => {
  test('no-op for empty url', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    openExternal('')
    expect(open).not.toHaveBeenCalled()
  })

  test('opens a new tab in normal (non-standalone) browser', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false })
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    openExternal('https://example.com')
    expect(open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer')
  })

  test('navigates via location (no new tab) in standalone PWA', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true })
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    // jsdom location.href 不可實際導頁，僅驗證「沒有開新分頁」
    openExternal('https://example.com')
    expect(open).not.toHaveBeenCalled()
  })
})
