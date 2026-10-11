import { describe, test, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import ItinerarySection from '../../components/trip/ItinerarySection.jsx'

const rows = [
  { time: '09:50', name: '抵達機場', type: 'transport', address: '機場', note: '出關後集合', _spots: [] },
  { time: '15:00', name: 'Check-in', type: 'hotel', address: '飯店', _spots: [] },
]

afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('ItinerarySection 渲染冒煙測試', () => {
  test('用基本 rows 渲染不丟錯', () => {
    render(<ItinerarySection rows={rows} dayDate="2026/06/04" />)
    expect(screen.getByText('抵達機場')).toBeTruthy()
  })

  test('空 rows 也不丟錯', () => {
    render(<ItinerarySection rows={[]} dayDate="" />)
  })
})

describe('DetailModal 拖拉關閉', () => {
  const key = '2026/06/04|09:50|抵達機場'

  function setup() {
    const onCloseDetail = vi.fn()
    render(
      <ItinerarySection rows={rows} dayDate="2026/06/04" detailKey={key} onOpenDetail={() => {}} onCloseDetail={onCloseDetail} />
    )
    const dialog = screen.getByRole('dialog')
    const pill = dialog.querySelector('.select-none')
    return { dialog, pill, onCloseDetail }
  }

  test('拖過距離門檻放開：呼叫關閉，且從放開點直接滑出（translate-y-full，不先彈回 translate-y-0）', () => {
    const { dialog, pill, onCloseDetail } = setup()
    fireEvent.touchStart(pill, { touches: [{ clientY: 100 }] })
    fireEvent.touchMove(pill, { touches: [{ clientY: 260 }] })
    fireEvent.touchEnd(pill)
    expect(onCloseDetail).toHaveBeenCalledTimes(1)
    expect(dialog.className).toContain('translate-y-full')
    expect(dialog.className).not.toContain('translate-y-0')
  })

  test('慢慢拖一小段（尾端速度 ≈ 0）放開：不關閉、彈回', () => {
    const now = vi.spyOn(Date, 'now')
    const { dialog, pill, onCloseDetail } = setup()
    now.mockReturnValue(1000)
    fireEvent.touchStart(pill, { touches: [{ clientY: 100 }] })
    now.mockReturnValue(1500)
    fireEvent.touchMove(pill, { touches: [{ clientY: 160 }] })
    fireEvent.touchEnd(pill)
    expect(onCloseDetail).not.toHaveBeenCalled()
    expect(dialog.className).toContain('translate-y-0')
  })

  test('快速拖一段後停住 1 秒才放開：放開當下樣本已過期，尾端速度 ≈ 0，不關閉', () => {
    const now = vi.spyOn(Date, 'now')
    const { dialog, pill, onCloseDetail } = setup()
    now.mockReturnValue(1000)
    fireEvent.touchStart(pill, { touches: [{ clientY: 100 }] })
    now.mockReturnValue(1010)
    fireEvent.touchMove(pill, { touches: [{ clientY: 140 }] })
    now.mockReturnValue(1020)
    fireEvent.touchMove(pill, { touches: [{ clientY: 180 }] })
    now.mockReturnValue(2020)
    fireEvent.touchEnd(pill)
    expect(onCloseDetail).not.toHaveBeenCalled()
    expect(dialog.className).toContain('translate-y-0')
  })

  test('touchcancel 也會結束拖拉（不卡在半路）', () => {
    const { dialog, pill, onCloseDetail } = setup()
    fireEvent.touchStart(pill, { touches: [{ clientY: 100 }] })
    fireEvent.touchCancel(pill)
    expect(onCloseDetail).not.toHaveBeenCalled()
    expect(dialog.className).toContain('transition-transform')
  })
})
