import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, cleanup, act, waitFor } from '@testing-library/react'
import { usePullToRefresh } from '../../hooks/usePullToRefresh.js'

// 每次 render 累加，用來驗證 touchmove 不觸發 React re-render
let renderCount = 0

function Puller({ onRefresh }) {
  renderCount += 1
  const { showIndicator, indicatorRef, contentRef } = usePullToRefresh(onRefresh)
  return (
    <div>
      {showIndicator && (
        <div data-testid="indicator" ref={indicatorRef} style={{ transform: 'translateY(0px)', opacity: 0 }} />
      )}
      <div data-testid="content" ref={contentRef} />
    </div>
  )
}

// 下拉刷新 listener 掛在 document（原生 addEventListener），手動 dispatch 並帶 touches
function fireTouch(type, y, x = 100) {
  const ev = new Event(type, { bubbles: true, cancelable: true })
  ev.touches = type === 'touchend' ? [] : [{ clientX: x, clientY: y }]
  act(() => { document.dispatchEvent(ev) })
  return ev
}

const START_Y = 20

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  renderCount = 0
})

describe('usePullToRefresh', () => {
  test('拉過死區後拖回死區內：手指未放開 indicator 也即時退回 0（stale closure 回歸）', () => {
    const { getByTestId } = render(<Puller onRefresh={vi.fn()} />)
    fireTouch('touchstart', START_Y)
    fireTouch('touchmove', START_Y + 18 + 60) // effective 60
    const indicator = getByTestId('indicator')
    expect(Number(indicator.style.opacity)).toBeGreaterThan(0)
    expect(getByTestId('content').style.transform).toBe('translateY(60px)')

    fireTouch('touchmove', START_Y + 10) // 回到死區內
    expect(indicator.style.opacity).toBe('0')
    expect(indicator.style.transform).toBe('translateY(0px)')
    expect(getByTestId('content').style.transform).toBe('translateY(0px)')
  })

  test('拉動中的 touchmove 會 preventDefault（擋 iOS 原生回彈疊加）', () => {
    render(<Puller onRefresh={vi.fn()} />)
    fireTouch('touchstart', START_Y)
    const ev = fireTouch('touchmove', START_Y + 18 + 40)
    expect(ev.defaultPrevented).toBe(true)
  })

  test('過閾值放開 → onRefresh 只呼叫一次，完成後 indicator 淡出卸載', async () => {
    const onRefresh = vi.fn(() => Promise.resolve())
    const { getByTestId, queryByTestId } = render(<Puller onRefresh={onRefresh} />)
    fireTouch('touchstart', START_Y)
    fireTouch('touchmove', START_Y + 18 + 200)
    fireTouch('touchend', 0)
    expect(onRefresh).toHaveBeenCalledTimes(1)
    // refreshing：indicator 停在 24px、全不透明
    expect(getByTestId('indicator').style.transform).toBe('translateY(24px)')
    expect(getByTestId('indicator').style.opacity).toBe('1')
    // 300ms spinner 下限 + 200ms 淡出後卸載
    await waitFor(() => expect(queryByTestId('indicator')).toBeNull(), { timeout: 1500 })
  })

  test('未達閾值放開 → 不刷新，indicator 淡出完才卸載', () => {
    vi.useFakeTimers()
    const onRefresh = vi.fn()
    const { getByTestId, queryByTestId } = render(<Puller onRefresh={onRefresh} />)
    fireTouch('touchstart', START_Y)
    fireTouch('touchmove', START_Y + 18 + 60)
    fireTouch('touchend', 0)
    expect(onRefresh).not.toHaveBeenCalled()
    const indicator = getByTestId('indicator') // 淡出期間仍掛載
    expect(indicator.style.opacity).toBe('0')
    expect(indicator.style.transition).toContain('200ms')
    act(() => { vi.advanceTimersByTime(250) })
    expect(queryByTestId('indicator')).toBeNull()
  })

  test('拖動中的 touchmove 不觸發 React re-render', () => {
    render(<Puller onRefresh={vi.fn()} />)
    fireTouch('touchstart', START_Y)
    fireTouch('touchmove', START_Y + 18 + 5) // 開始顯示：一次性 state 更新掛載 indicator
    const baseline = renderCount
    for (let i = 1; i <= 10; i++) {
      fireTouch('touchmove', START_Y + 18 + 5 + i * 8) // 全程低於閾值
    }
    expect(renderCount).toBe(baseline)
  })
})
