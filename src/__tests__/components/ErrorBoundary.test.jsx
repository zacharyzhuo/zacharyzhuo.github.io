import { describe, test, expect, afterEach, vi } from 'vitest'
import { lazy, Suspense } from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import ErrorBoundary from '../../components/ui/ErrorBoundary.jsx'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  test('local fallback replaces only its subtree when a lazy chunk fails to load (offline)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const Broken = lazy(() => Promise.reject(new TypeError('Failed to fetch dynamically imported module')))

    render(
      <div>
        <p>page header</p>
        <ErrorBoundary fallback={<p>section error</p>}>
          <Suspense fallback={<p>loading</p>}>
            <Broken />
          </Suspense>
        </ErrorBoundary>
      </div>
    )

    expect(await screen.findByText('section error')).toBeInTheDocument()
    expect(screen.getByText('page header')).toBeInTheDocument()
  })

  test('renders children when nothing throws', () => {
    render(
      <ErrorBoundary fallback={<p>section error</p>}>
        <p>content</p>
      </ErrorBoundary>
    )
    expect(screen.getByText('content')).toBeInTheDocument()
  })
})
