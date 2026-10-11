/// <reference lib="webworker" />
/* eslint-env serviceworker */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { RangeRequestsPlugin } from 'workbox-range-requests'

// Vite-plugin-pwa 會在 build 時把 self.__WB_MANIFEST 注入為 precache manifest
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// HashRouter 下所有 navigation 請求都走 / index.html
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'app-shell',
      networkTimeoutSeconds: 3,
    }),
    { allowlist: [/^\/$/] }
  )
)

// Google Sheets gviz CSV：優先打網路，5s 內沒回 fallback 到 cache
// maxAge 設 1 天（原本 7 天）：sheet 編輯頻繁，舊快取卡太久不值得
registerRoute(
  ({ url }) => url.origin === 'https://docs.google.com' && url.pathname.includes('/gviz/tq'),
  new NetworkFirst({
    cacheName: 'sheets-csv',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }),
    ],
  })
)

// Cloudinary 圖床（封面 / banner / itinerary・food 縮圖，URL 來自 sheet）— URL 帶 transformation 參數、內容不變，CacheFirst 30 天。
// 只收 200（CORS）response：所有 <img> 都帶 crossOrigin="anonymous"（Cloudinary 回 ACAO: *），
// 不收 opaque（status 0）是因為 Chrome 對 opaque response 的配額計算每筆灌水到 ~7MB。
registerRoute(
  ({ url }) => url.hostname === 'res.cloudinary.com',
  new CacheFirst({
    cacheName: 'cloudinary-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30, purgeOnQuotaError: true }),
    ],
  })
)

// 求婚彩蛋媒體（同源 /proposal-photos/：AVIF 照片、mp4、m4a BGM）— 一次性作品永不變，CacheFirst 30 天。
// 音訊 / 影片元素會發 Range 請求：只快取完整 200 response（206 不存），
// RangeRequestsPlugin 再從完整快取切出 206 回給元素（Safari 對媒體要求 206，直接回 200 會播不出來）。
// 完整 response 由 extras.jsx 的 warm-up fetch / 影片 blob fetch 寫入。
registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/proposal-photos/'),
  new CacheFirst({
    cacheName: 'proposal-media',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new RangeRequestsPlugin(),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30, purgeOnQuotaError: true }),
    ],
  })
)

// 地圖圖磚（CARTO Positron / OSM）— 圖資幾乎不變，CacheFirst：同區域第二次起零流量（漫遊省流量），
// 弱網/離線時舊圖磚仍可顯示。OSM tile policy 本就要求 client 善用快取。
// 1500 張 × 每張 ~20-60KB ≈ 30-50MB，超出配額時 purgeOnQuotaError 自動清這個 cache。
registerRoute(
  ({ url }) =>
    url.hostname.endsWith('.basemaps.cartocdn.com') ||
    url.hostname.endsWith('.tile.openstreetmap.org'),
  new CacheFirst({
    cacheName: 'map-tiles',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 1500,
        maxAgeSeconds: 60 * 60 * 24 * 30,
        purgeOnQuotaError: true,
      }),
    ],
  })
)

// Google Fonts CSS — 字重變動時要新版，stale-while-revalidate
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' })
)

// Google Fonts 字型檔本體 — 一年不變
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
)

// 新版 SW 裝好就立即接管所有 client，搭配 registerType: 'autoUpdate' 達成靜默更新
self.skipWaiting()
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
