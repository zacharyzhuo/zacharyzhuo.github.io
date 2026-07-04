import { describe, test, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCancelableTap } from '../../hooks/useCancelableTap.js'

const RECT = { left: 0, right: 100, top: 0, bottom: 100 }

function pointerEvent(x, y) {
  return {
    clientX: x,
    clientY: y,
    pointerId: 1,
    currentTarget: {
      getBoundingClientRect: () => RECT,
      setPointerCapture: () => {},
    },
  }
}

function clickEvent({ button = 0, metaKey = false, ctrlKey = false, shiftKey = false, altKey = false } = {}) {
  return { button, metaKey, ctrlKey, shiftKey, altKey, preventDefault: vi.fn() }
}

// press 在 rect 內、放開在 rect 外 = 取消（見 gesture.js isPointInRect）
function cancelTap(tap) {
  tap.onPointerDown(pointerEvent(50, 50))
  tap.onPointerUp(pointerEvent(500, 500))
}

describe('useCancelableTap - guardLink', () => {
  test('取消的一般左鍵點擊 → preventDefault 被呼叫，fn 不執行', () => {
    const { result } = renderHook(() => useCancelableTap())
    const fn = vi.fn()

    cancelTap(result.current)
    const e = clickEvent()
    result.current.guardLink(fn)(e)

    expect(e.preventDefault).toHaveBeenCalled()
    expect(fn).not.toHaveBeenCalled()
  })

  test('取消但帶 metaKey（cmd-click）→ 不呼叫 preventDefault，保留開新分頁', () => {
    const { result } = renderHook(() => useCancelableTap())
    const fn = vi.fn()

    cancelTap(result.current)
    const e = clickEvent({ metaKey: true })
    result.current.guardLink(fn)(e)

    expect(e.preventDefault).not.toHaveBeenCalled()
    expect(fn).not.toHaveBeenCalled()
  })

  test('取消但 button !== 0（如中鍵）→ 不呼叫 preventDefault', () => {
    const { result } = renderHook(() => useCancelableTap())
    const fn = vi.fn()

    cancelTap(result.current)
    const e = clickEvent({ button: 1 })
    result.current.guardLink(fn)(e)

    expect(e.preventDefault).not.toHaveBeenCalled()
    expect(fn).not.toHaveBeenCalled()
  })

  test('正常放開在元件內 → 呼叫 fn，不呼叫 preventDefault', () => {
    const { result } = renderHook(() => useCancelableTap())
    const fn = vi.fn()

    result.current.onPointerDown(pointerEvent(50, 50))
    result.current.onPointerUp(pointerEvent(60, 60)) // 仍在 rect 內 → 非取消

    const e = clickEvent()
    result.current.guardLink(fn)(e)

    expect(fn).toHaveBeenCalledWith(e)
    expect(e.preventDefault).not.toHaveBeenCalled()
  })
})
