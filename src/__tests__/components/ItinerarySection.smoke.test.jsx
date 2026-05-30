import { describe, test, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import ItinerarySection from '../../components/trip/ItinerarySection.jsx'

const rows = [
  { time: '09:50', name: '抵達機場', type: 'transport', address: '機場', note: '出關後集合', _spots: [] },
  { time: '15:00', name: 'Check-in', type: 'hotel', address: '飯店', _spots: [] },
]

afterEach(cleanup)

describe('ItinerarySection 渲染冒煙測試', () => {
  test('用基本 rows 渲染不丟錯', () => {
    render(<ItinerarySection rows={rows} dayDate="2026/06/04" />)
    expect(screen.getByText('抵達機場')).toBeTruthy()
  })

  test('空 rows 也不丟錯', () => {
    render(<ItinerarySection rows={[]} dayDate="" />)
  })
})
