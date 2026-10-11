import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEasterEgg } from '../../hooks/useEasterEgg.js'

vi.mock('../../lib/haptic.js', () => ({ success: vi.fn(), tap: vi.fn(), bump: vi.fn() }))

describe('useEasterEgg', () => {
  it('同一天連點 9 下才觸發；hideHeart 藏 icon；reset 全部清掉', () => {
    const { result } = renderHook(() => useEasterEgg({ extras: { easterEggDay: 4 } }))
    act(() => { for (let i = 0; i < 8; i++) result.current.handleDayClick(4, 4) })
    expect(result.current.open).toBe(false)
    act(() => result.current.handleDayClick(4, 4))
    expect(result.current.open).toBe(true)
    expect(result.current.activated).toBe(true)
    expect(result.current.heartHidden).toBe(false)
    act(() => result.current.hideHeart())
    expect(result.current.heartHidden).toBe(true)
    act(() => result.current.reset())
    expect(result.current.open).toBe(false)
    expect(result.current.activated).toBe(false)
    expect(result.current.heartHidden).toBe(false)
  })

  it('切到別天會重置計數', () => {
    const { result } = renderHook(() => useEasterEgg({ extras: { easterEggDay: 4 } }))
    act(() => { for (let i = 0; i < 8; i++) result.current.handleDayClick(4, 4) })
    act(() => result.current.handleDayClick(4, 3))
    act(() => result.current.handleDayClick(4, 4))
    expect(result.current.open).toBe(false)
  })
})
