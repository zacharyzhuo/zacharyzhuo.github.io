import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import extras from '../../trips/2026-03-tokyo-hokkaido/extras.jsx'
import { PROPOSAL_PHOTOS } from '../../trips/2026-03-tokyo-hokkaido/extras/data.js'

const { ProposalModal } = extras

// warm-up 走 requestIdleCallback，jsdom 沒有 → 退回 setTimeout(500)；用 fake timers 推進
function deferred() {
  let resolve
  const promise = new Promise((r) => { resolve = r })
  return { promise, resolve }
}

describe('ProposalModal warm-up', () => {
  let fetchMock
  beforeEach(() => {
    vi.useFakeTimers()
    fetchMock = vi.fn(() => Promise.resolve({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) }))
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('warm=false（不在彩蛋那天）完全不預載', async () => {
    render(<ProposalModal isOpen={false} onClose={() => {}} heartPosition={null} warm={false} />)
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('warm=true 依播放順序逐一 fetch，最後是 BGM', async () => {
    const gate = deferred()
    // 第一個 fetch 卡住，確認第二個不會並發發出
    fetchMock.mockImplementationOnce(() => gate.promise)
    render(<ProposalModal isOpen={false} onClose={() => {}} heartPosition={null} warm />)
    await act(async () => { await vi.advanceTimersByTimeAsync(600) })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(PROPOSAL_PHOTOS[0])

    gate.resolve({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) })
    await act(async () => { await vi.advanceTimersByTimeAsync(10) })
    expect(fetchMock).toHaveBeenCalledTimes(PROPOSAL_PHOTOS.length + 1)
    expect(fetchMock.mock.calls.at(-1)[0]).toMatch(/proposal-photos\/sukidakara\.m4a$/)
    // 所有媒體 URL 都是 AVIF / mp4，沒有殘留 JPG
    expect(PROPOSAL_PHOTOS.every((u) => /\.(avif|mp4)$/.test(u))).toBe(true)
  })

  it('warm 轉回 false 會 abort，後續不再 fetch', async () => {
    const gate = deferred()
    fetchMock.mockImplementationOnce((_url, { signal }) => {
      signal.addEventListener('abort', () => gate.resolve(Promise.reject(new DOMException('aborted', 'AbortError'))))
      return gate.promise
    })
    const { rerender } = render(<ProposalModal isOpen={false} onClose={() => {}} heartPosition={null} warm />)
    await act(async () => { await vi.advanceTimersByTimeAsync(600) })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    rerender(<ProposalModal isOpen={false} onClose={() => {}} heartPosition={null} warm={false} />)
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
