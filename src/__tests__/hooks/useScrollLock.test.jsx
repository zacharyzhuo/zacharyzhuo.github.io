import { describe, test, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useScrollLock } from '../../hooks/useScrollLock.js'

describe('useScrollLock', () => {
  beforeEach(() => {
    document.body.removeAttribute('style')
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
    window.scrollTo = vi.fn()
  })

  test('locks body with position fixed and scroll offset (iOS-proof)', () => {
    // Arrange
    window.scrollY = 250

    // Act
    renderHook(() => useScrollLock(true))

    // Assert
    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.top).toBe('-250px')
    expect(document.body.style.overflow).toBe('hidden')
  })

  test('restores body styles and scroll position on unlock', () => {
    // Arrange
    window.scrollY = 250
    const { unmount } = renderHook(() => useScrollLock(true))

    // Act
    unmount()

    // Assert
    expect(document.body.style.position).toBe('')
    expect(document.body.style.top).toBe('')
    expect(document.body.style.overflow).toBe('')
    expect(window.scrollTo).toHaveBeenCalledWith(0, 250)
  })

  test('does not lock when locked=false', () => {
    renderHook(() => useScrollLock(false))

    expect(document.body.style.position).toBe('')
  })

  test('reference counting: unlocks only after all locks released', () => {
    // Arrange: 兩個 modal 同時鎖
    const first = renderHook(() => useScrollLock(true))
    const second = renderHook(() => useScrollLock(true))

    // Act + Assert: 先解一個，仍鎖著
    first.unmount()
    expect(document.body.style.position).toBe('fixed')

    // 全解才還原
    second.unmount()
    expect(document.body.style.position).toBe('')
  })
})
