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
      injectRegister: 'auto',
      // 把 plugin 沒掃到的靜態檔（apple-touch-icon、robots.txt 等）一起帶進 precache
      includeAssets: ['gokigen_panda_icon.png', 'robots.txt'],
      manifest: {
        id: '/',
        name: 'Trip Diaries',
        short_name: 'Trip Diaries',
        description: '個人旅行記錄與行程規劃',
        lang: 'zh-TW',
        theme_color: '#F9F8F4',
        background_color: '#F9F8F4',
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
        // proposal-photos 內單張可能 > 2 MB，提高上限避免 build 報警
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
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
