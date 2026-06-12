import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      // 不用 'auto'：它只注入最簡單的 register，沒有 reload-on-update 邏輯
      // 改在 main.jsx 用 virtual:pwa-register 手動註冊，新 SW ready 時主動 reload
      injectRegister: false,
      // 把 plugin 沒掃到的靜態檔（apple-touch-icon、robots.txt 等）一起帶進 precache
      includeAssets: ['gokigen_panda_icon.png', 'robots.txt'],
      manifest: {
        id: '/',
        name: 'Trip Diaries',
        short_name: 'Trip Diaries',
        description: '個人旅行記錄與行程規劃',
        lang: 'zh-TW',
        theme_color: '#FBFAF5',
        background_color: '#FBFAF5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'gokigen_panda_icon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'gokigen_panda_icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      injectManifest: {
        // 不要把 trips/ 圖片塞進 precache（單張就幾百 KB），改走 runtime cache
        globPatterns: ['**/*.{js,css,html,svg,ico,woff,woff2}'],
        globIgnores: ['**/trips/**'],
        // 單檔上限 2 MB；JS chunk 漲過頭時 build 會報警，當作 budget guard
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
      },
      // 開發時關掉 SW，避免快取干擾本地 hot reload
      devOptions: {
        enabled: false,
      },
    }),
  ],
  base: '/',
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    globals: true,
    include: ['src/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  },
})
