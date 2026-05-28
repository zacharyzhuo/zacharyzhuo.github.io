import { HashRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import TripPage from './pages/TripPage.jsx'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trip/:slug" element={<TripPage />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}
