import { describe, test, expect, vi, afterEach } from 'vitest'
import { openExternal } from '../../lib/openExternal.js'

// jsdom 沒實作 matchMedia，vitest 4 不能 spyOn 不存在的屬性，改直接掛一個 mock
const mockStandalone = (matches) => { window.matchMedia = vi.fn(() => ({ matches })) }

afterEach(() => {
  vi.restoreAllMocks()
  delete window.matchMedia
})

describe('openExternal', () => {
  test('no-op for empty url', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    openExternal('')
    expect(open).not.toHaveBeenCalled()
  })

  test('opens a new tab in normal (non-standalone) browser', () => {
    mockStandalone(false)
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    openExternal('https://example.com')
    expect(open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer')
  })

  test('navigates via location (no new tab) in standalone PWA', () => {
    mockStandalone(true)
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    // jsdom location.href 不可實際導頁，僅驗證「沒有開新分頁」
    openExternal('https://example.com')
    expect(open).not.toHaveBeenCalled()
  })

  test('rejects javascript: URL (non-standalone)', () => {
    mockStandalone(false)
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {})
    openExternal('javascript:alert(1)')
    expect(open).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalled()
  })

  test('rejects javascript: URL in standalone PWA (no location assignment)', () => {
    mockStandalone(true)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const originalHref = window.location.href
    openExternal('javascript:alert(1)')
    expect(window.location.href).toBe(originalHref)
  })

  test('rejects data: URL', () => {
    mockStandalone(false)
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    openExternal('data:text/html,<script>alert(1)</script>')
    expect(open).not.toHaveBeenCalled()
  })

  test('rejects malformed URL string', () => {
    mockStandalone(false)
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    openExternal('not a url')
    expect(open).not.toHaveBeenCalled()
  })

  test('allows http: URL', () => {
    mockStandalone(false)
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    openExternal('http://example.com')
    expect(open).toHaveBeenCalledWith('http://example.com', '_blank', 'noopener,noreferrer')
  })
  test('adds https:// to a scheme-less domain link from the sheet', () => {
    mockStandalone(false)
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    openExternal('google.com/maps/search/?api=1&query=1,2')
    expect(open).toHaveBeenCalledWith('https://google.com/maps/search/?api=1&query=1,2', '_blank', 'noopener,noreferrer')
  })
})
