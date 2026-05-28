import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// PWA：新 SW 安裝完成 → 立即重整套用新版（避免 iOS PWA 殼層持續顯示舊 bundle）
// + 每 30 分鐘主動觸發 update check，給長時間掛在前景的場景用
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true)
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    setInterval(() => {
      registration.update().catch(() => {})
    }, 30 * 60 * 1000)
  },
})
