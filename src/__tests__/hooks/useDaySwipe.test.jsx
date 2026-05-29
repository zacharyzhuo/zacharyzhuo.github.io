import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, cleanup, act, fireEvent } from '@testing-library/react'
import { useDaySwipe } from '../../hooks/useDaySwipe.js'

function Swiper({ days, activeDay, setActiveDay, enabled = true }) {
  const swipe = useDaySwipe({ days, activeDay, setActiveDay, enabled })
  return (
    <div data-testid="container" {...swipe.containerProps}>
      <div ref={swipe.carouselRef} />
    </div>
  )
}

// touchmove 是原生 addEventListener（非 React），需手動 dispatch 並帶 touches
function fireTouchMove(el, x, y = 0) {
  const ev = new Event('touchmove', { bubbles: true, cancelable: true })
  ev.touches = [{ clientX: x, clientY: y }]
  el.dispatchEvent(ev)
}

const days = [{ day: 1 }, { day: 2 }, { day: 3 }]

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('useDaySwipe', () => {
  test('往左滑超過距離閾值 → 切到下一天', () => {
    vi.useFakeTimers()
    const setActiveDay = vi.fn()
    const { getByTestId } = render(
      <Swiper days={days} activeDay={2} setActiveDay={setActiveDay} />
    )
    const c = getByTestId('container')

    fireEvent.touchStart(c, { touches: [{ clientX: 200, clientY: 0 }] })
    act(() => { fireTouchMove(c, 110) }) // dx = -90
    fireEvent.touchEnd(c)
    act(() => { vi.advanceTimersByTime(350) })

    expect(setActiveDay).toHaveBeenCalledWith(3)
  })

  test('往右滑超過距離閾值 → 切到上一天', () => {
    vi.useFakeTimers()
    const setActiveDay = vi.fn()
    const { getByTestId } = render(
      <Swiper days={days} activeDay={2} setActiveDay={setActiveDay} />
    )
    const c = getByTestId('container')

    fireEvent.touchStart(c, { touches: [{ clientX: 100, clientY: 0 }] })
    act(() => { fireTouchMove(c, 190) }) // dx = +90
    fireEvent.touchEnd(c)
    act(() => { vi.advanceTimersByTime(350) })

    expect(setActiveDay).toHaveBeenCalledWith(1)
  })

  test('未達距離與速度閾值 → 不切日', () => {
    vi.useFakeTimers()
    const setActiveDay = vi.fn()
    const { getByTestId } = render(
      <Swiper days={days} activeDay={2} setActiveDay={setActiveDay} />
    )
    const c = getByTestId('container')

    fireEvent.touchStart(c, { touches: [{ clientX: 200, clientY: 0 }] })
    act(() => { fireTouchMove(c, 170) })       // dx = -30
    act(() => { vi.advanceTimersByTime(100) }) // 拉長時間壓低速度 → velocity 0.3
    fireEvent.touchEnd(c)
    act(() => { vi.advanceTimersByTime(350) })

    expect(setActiveDay).not.toHaveBeenCalled()
  })

  test('垂直拖動不觸發切日', () => {
    vi.useFakeTimers()
    const setActiveDay = vi.fn()
    const { getByTestId } = render(
      <Swiper days={days} activeDay={2} setActiveDay={setActiveDay} />
    )
    const c = getByTestId('container')

    fireEvent.touchStart(c, { touches: [{ clientX: 200, clientY: 200 }] })
    act(() => { fireTouchMove(c, 195, 320) })  // dy 為主 → 判定為垂直捲動
    fireEvent.touchEnd(c)
    act(() => { vi.advanceTimersByTime(350) })

    expect(setActiveDay).not.toHaveBeenCalled()
  })
})
