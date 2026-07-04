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

// 跳到主要內容：預設視覺隱藏，鍵盤 focus 到才顯示（sr-only + focus:not-sr-only）。
// 用 HashRouter 時不能靠原生 `#fragment` 錨點捲動（hash 已被路由佔用，瀏覽器對 `#main`
// 的處理會跟 router 打架），改為 preventDefault 後手動 focus() 目標的 <main id="main">。
function SkipLink() {
  const handleClick = (e) => {
    e.preventDefault()
    document.getElementById('main')?.focus()
  }
  return (
    <a
      href="#main"
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[2000] focus:px-4 focus:py-2 focus:rounded-full focus:bg-jp-green focus:text-white focus:font-serif focus:font-bold focus:shadow-lg"
    >
      跳到主要內容
    </a>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <SkipLink />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trip/:slug" element={<TripPage />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}
