import { describe, test, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import ChecklistSection from '../../components/trip/ChecklistSection.jsx'

const rows = [
  { category: '證件', item: '護照' },
  { category: '證件', item: '機票' },
  { category: '電子', item: '充電器' },
]

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('ChecklistSection localStorage 持久化', () => {
  test('勾選 item 後寫入對應 slug 的 localStorage key', () => {
    // Arrange
    render(<ChecklistSection rows={rows} slug="tokyo-2026" />)

    // Act
    fireEvent.click(screen.getByRole('checkbox', { name: /護照/ }))

    // Assert
    const saved = JSON.parse(localStorage.getItem('trip-checklist:v1:tokyo-2026'))
    expect(saved['證件-護照']).toBe(true)
  })

  test('既有 localStorage 狀態在初次 render 還原為已勾選', () => {
    // Arrange
    localStorage.setItem('trip-checklist:v1:tokyo-2026', JSON.stringify({ '證件-護照': true }))

    // Act
    render(<ChecklistSection rows={rows} slug="tokyo-2026" />)

    // Assert
    expect(screen.getByRole('checkbox', { name: /護照/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('checkbox', { name: /機票/ })).toHaveAttribute('aria-checked', 'false')
  })

  test('不同 slug 使用獨立 namespace，狀態不互相污染', () => {
    // Arrange
    localStorage.setItem('trip-checklist:v1:trip-a', JSON.stringify({ '證件-護照': true }))

    // Act
    render(<ChecklistSection rows={rows} slug="trip-b" />)

    // Assert
    expect(screen.getByRole('checkbox', { name: /護照/ })).toHaveAttribute('aria-checked', 'false')
  })

  test('取消勾選後 localStorage 對應值為 false', () => {
    // Arrange
    render(<ChecklistSection rows={rows} slug="tokyo-2026" />)
    const passport = screen.getByRole('checkbox', { name: /護照/ })

    // Act
    fireEvent.click(passport) // on
    fireEvent.click(passport) // off

    // Assert
    const saved = JSON.parse(localStorage.getItem('trip-checklist:v1:tokyo-2026'))
    expect(saved['證件-護照']).toBe(false)
  })
})
