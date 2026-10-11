import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, cleanup, act, fireEvent } from '@testing-library/react'
import { useDaySwipe } from '../../hooks/useDaySwipe.js'

function Swiper({ days, activeDay, setActiveDay, enabled = true }) {
  const swipe = useDaySwipe({ days, activeDay, setActiveDay, enabled })
  return (
    <div data-testid="container" {...swipe.containerProps}>
      <div data-testid="carousel" ref={swipe.carouselRef} style={swipe.carouselStyle} />
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

    // 速度改以「放開前 80ms 尾段」量測（plan 002）。舊寫法（停 100ms 後單次 move）在 80ms 窗下
    // 其實也只剩一個樣本、速度同樣是 0，不會 commit；改寫是為了貼合尾段窗語意：
    // 拖 30px 後手指停住 200ms 再放開 → 放開時窗內沒有新樣本 → 速度 0，且 30px < 50px 距離閾值 → 彈回
    fireEvent.touchStart(c, { touches: [{ clientX: 200, clientY: 0 }] })
    act(() => { fireTouchMove(c, 170) })       // dx = -30
    act(() => { vi.advanceTimersByTime(200) }) // 手指停住 → 尾段速度 0
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

  test('快速甩動：30px（< 距離閾值）於 40ms 內 → 走速度路徑切到下一天', () => {
    vi.useFakeTimers()
    const setActiveDay = vi.fn()
    const { getByTestId } = render(
      <Swiper days={days} activeDay={2} setActiveDay={setActiveDay} />
    )
    const c = getByTestId('container')

    fireEvent.touchStart(c, { touches: [{ clientX: 200, clientY: 0 }] })
    act(() => { vi.advanceTimersByTime(40) })
    act(() => { fireTouchMove(c, 170) }) // dx = -30，尾段速度 0.75 px/ms
    fireEvent.touchEnd(c)
    act(() => { vi.advanceTimersByTime(350) })

    expect(setActiveDay).toHaveBeenCalledWith(3)
  })

  test('連續慢拖 30px（每 20ms 一次、共 100ms）後立即放開 → 尾段速度 0.3 px/ms 走速度路徑切日', () => {
    vi.useFakeTimers()
    const setActiveDay = vi.fn()
    const { getByTestId } = render(
      <Swiper days={days} activeDay={2} setActiveDay={setActiveDay} />
    )
    const c = getByTestId('container')

    fireEvent.touchStart(c, { touches: [{ clientX: 200, clientY: 0 }] })
    for (let x = 194; x >= 170; x -= 6) {
      act(() => { vi.advanceTimersByTime(20) })
      act(() => { fireTouchMove(c, x) })
    }
    // 位移 30px（≥ 24px 甩動最小位移、< 50px 距離閾值），尾段速度 0.3 ≥ 0.11
    fireEvent.touchEnd(c)
    act(() => { vi.advanceTimersByTime(350) })

    expect(setActiveDay).toHaveBeenCalledWith(3)
  })

  test('第一個 5px 水平 touchmove 就 preventDefault（iOS 需在首個 move 搶下手勢）', () => {
    const setActiveDay = vi.fn()
    const { getByTestId } = render(
      <Swiper days={days} activeDay={2} setActiveDay={setActiveDay} />
    )
    const c = getByTestId('container')

    fireEvent.touchStart(c, { touches: [{ clientX: 200, clientY: 0 }] })
    const ev = new Event('touchmove', { bubbles: true, cancelable: true })
    ev.touches = [{ clientX: 195, clientY: 0 }]
    act(() => { c.dispatchEvent(ev) })

    expect(ev.defaultPrevented).toBe(true)
  })

  test('carouselStyle 靜態：初始不帶 transform / will-change', () => {
    const setActiveDay = vi.fn()
    const { getByTestId } = render(
      <Swiper days={days} activeDay={2} setActiveDay={setActiveDay} />
    )
    const carousel = getByTestId('carousel')
    expect(carousel.style.transform).toBe('')
    expect(carousel.style.willChange).toBe('')
  })

  test('彈回途中再按住 → 停掉 transition 接手，原地放開不切日', () => {
    vi.useFakeTimers()
    const setActiveDay = vi.fn()
    const { getByTestId } = render(
      <Swiper days={days} activeDay={2} setActiveDay={setActiveDay} />
    )
    const c = getByTestId('container')
    const carousel = getByTestId('carousel')

    fireEvent.touchStart(c, { touches: [{ clientX: 200, clientY: 0 }] })
    act(() => { fireTouchMove(c, 180) }) // dx = -20 < 甩動最小位移 → 彈回
    fireEvent.touchEnd(c)
    expect(carousel.style.transition).toContain('var(--ease-out)')

    act(() => { vi.advanceTimersByTime(100) }) // 彈回動畫進行中
    fireEvent.touchStart(c, { touches: [{ clientX: 200, clientY: 0 }] })
    expect(carousel.style.transition).toBe('none')
    expect(carousel.style.willChange).toBe('transform')

    fireEvent.touchEnd(c)
    act(() => { vi.advanceTimersByTime(350) })
    expect(setActiveDay).not.toHaveBeenCalled()
  })

  test('commit 滑出途中再按住 → 取消 settle，原地放開不切日', () => {
    vi.useFakeTimers()
    const setActiveDay = vi.fn()
    const { getByTestId } = render(
      <Swiper days={days} activeDay={2} setActiveDay={setActiveDay} />
    )
    const c = getByTestId('container')
    const carousel = getByTestId('carousel')

    fireEvent.touchStart(c, { touches: [{ clientX: 200, clientY: 0 }] })
    act(() => { fireTouchMove(c, 110) }) // dx = -90 → commit
    fireEvent.touchEnd(c)

    act(() => { vi.advanceTimersByTime(100) }) // 滑出動畫進行中
    // jsdom 無 DOMMatrixReadOnly → 接手位置退回 0，仍走中斷路徑
    fireEvent.touchStart(c, { touches: [{ clientX: 200, clientY: 0 }] })
    expect(carousel.style.transition).toBe('none')
    fireEvent.touchEnd(c)
    act(() => { vi.advanceTimersByTime(250) }) // 距 commit 共 350ms

    expect(setActiveDay).not.toHaveBeenCalled()
  })
})
