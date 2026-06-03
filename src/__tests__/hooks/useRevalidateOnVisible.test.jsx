import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { useRevalidateOnVisible } from '../../hooks/useRevalidateOnVisible.js'

function Probe({ cb, minHiddenMs }) {
  useRevalidateOnVisible(cb, minHiddenMs != null ? { minHiddenMs } : undefined)
  return null
}

function setVisibility(state) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
})

describe('useRevalidateOnVisible', () => {
  test('fires when foregrounded after being hidden longer than threshold', () => {
    vi.useFakeTimers()
    const cb = vi.fn()
    render(<Probe cb={cb} minHiddenMs={10_000} />)

    setVisibility('hidden')
    vi.advanceTimersByTime(11_000)
    setVisibility('visible')

    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('does NOT fire for a brief hide under the threshold', () => {
    vi.useFakeTimers()
    const cb = vi.fn()
    render(<Probe cb={cb} minHiddenMs={10_000} />)

    setVisibility('hidden')
    vi.advanceTimersByTime(2_000)
    setVisibility('visible')

    expect(cb).not.toHaveBeenCalled()
  })

  test('does NOT fire on a visible event with no preceding hide', () => {
    const cb = vi.fn()
    render(<Probe cb={cb} minHiddenMs={0} />)
    setVisibility('visible')
    expect(cb).not.toHaveBeenCalled()
  })
})
