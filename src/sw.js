/// <reference lib="webworker" />
/* eslint-env serviceworker */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

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
registerRoute(
  ({ url }) => url.origin === 'https://docs.google.com' && url.pathname.includes('/gviz/tq'),
  new NetworkFirst({
    cacheName: 'sheets-csv',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  })
)

// 行程靜態資產（banner、proposal 照片、音檔）— 拍下來就少變，cache first
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/trips/') &&
    /\.(?:jpe?g|png|webp|avif|gif|svg|mp3|mp4|m4a)$/i.test(url.pathname) &&
    (request.destination === 'image' || request.destination === 'audio' || request.destination === 'video' || request.destination === ''),
  new CacheFirst({
    cacheName: 'trip-assets',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }),
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
