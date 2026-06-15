import { useLayoutEffect } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import TripPage from './pages/TripPage.jsx'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'

// 切換路由時把視窗捲回頂端。HashRouter 不會自動重置 window scroll，
// 否則從首頁捲到中間點進 trip page，會「繼承」捲動位置卡在內容中段。
function ScrollToTop() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trip/:slug" element={<TripPage />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}
