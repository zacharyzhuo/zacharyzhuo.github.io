import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup, act } from '@testing-library/react'
import { useRef } from 'react'
import { useModalA11y } from '../../hooks/useModalA11y.js'

function Modal({ isOpen, onClose }) {
  const ref = useRef(null)
  useModalA11y(isOpen, onClose, ref)
  if (!isOpen) return null
  return (
    <div ref={ref} role="dialog" tabIndex={-1}>
      <button>first</button>
      <button>last</button>
    </div>
  )
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('useModalA11y', () => {
  test('開啟時按 ESC 觸發 onClose', () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('關閉時按 ESC 不觸發 onClose', () => {
    const onClose = vi.fn()
    render(<Modal isOpen={false} onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).not.toHaveBeenCalled()
  })

  test('非 ESC 鍵不觸發 onClose', () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Enter' })

    expect(onClose).not.toHaveBeenCalled()
  })

  test('關閉後將焦點還原到開啟前的觸發元素', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const { rerender, getByRole } = render(<Modal isOpen onClose={onClose} />)
    // 推進 focusTimer：焦點移到 dialog 容器本身（非內部按鈕）
    act(() => { vi.advanceTimersByTime(60) })
    expect(document.activeElement).toBe(getByRole('dialog'))

    // 關閉 → effect cleanup 還原焦點
    rerender(<Modal isOpen={false} onClose={onClose} />)
    expect(document.activeElement).toBe(trigger)

    trigger.remove()
  })
})
