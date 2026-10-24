import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// 生產環境 CSP：只在 build 時注入（apply: 'build'）。dev 模式靠 React Refresh 的 inline script
// 做 HMR，CSP 的 script-src 'self' 會把它擋掉，所以不能用同一份設定跑 dev server。
// 外部 origin 清單逐一對應 src/ 裡實際會 fetch/載入的地方（見 CLAUDE.md 外部圖片/地圖/匯率段落）：
//   - docs.google.com：Google Sheets gviz CSV（src/lib/sheets.js）
//   - res.cloudinary.com：行程照片圖床
//   - open.er-api.com：匯率 API（src/hooks/useExchangeRate.js）
//   - fonts.googleapis.com / fonts.gstatic.com：Noto Serif JP webfont
//   - *.basemaps.cartocdn.com / *.tile.openstreetmap.org：地圖圖磚（TripMap.jsx 的 TileLayer，SW 也會 fetch 這兩個 host 做快取）
// data: 給 index.css 的和紙噪點背景 + 彩蛋 extras.jsx 的 BLUE_POSTER（data: SVG，當 <video poster> 算 img-src）。
// blob: 只在 media-src：彩蛋影片預載用 fetch 轉 blob 後指派給 <video src>（extras.jsx videoBlobCache）。
// style-src 需要 unsafe-inline：React 行內樣式 + Leaflet 動態插入的 style。
// www.google.com / maps.app.goo.gl 只是導航連結（openExternal 開新分頁），不是頁面會 fetch 的資源，不需要放進來。
function cspPlugin() {
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https://res.cloudinary.com https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org",
    "font-src 'self' https://fonts.gstatic.com",
    "media-src 'self' blob:",
    "connect-src 'self' https://docs.google.com https://res.cloudinary.com https://open.er-api.com https://fonts.googleapis.com https://fonts.gstatic.com https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ')

  return {
    name: 'inject-csp-meta',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler() {
        return [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: csp },
            injectTo: 'head-prepend',
          },
        ]
      },
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    cspPlugin(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      // 不用 'auto'：它只注入最簡單的 register，沒有 reload-on-update 邏輯
      // 改在 main.jsx 用 virtual:pwa-register 手動註冊，新 SW ready 時主動 reload
      injectRegister: false,
      // 把 plugin 沒掃到的靜態檔（apple-touch-icon、robots.txt 等）一起帶進 precache
      includeAssets: ['gokigen_panda_icon.png', 'gokigen_panda_icon_maskable.png', 'robots.txt'],
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
        // 原始美術稿只有 240x240；誠實標真實尺寸，不冒充 192/512（之前兩個 icon entry 都宣稱是
        // 192x192/512x512，實際都是同一張被瀏覽器硬縮放的 240x240，放大版會糊）。
        // 'any' 用原圖真實尺寸；'maskable' 另外用 sips 把同一張圖置中貼到 320x320（底色 #FBFAF5，
        // 貼版面積比 240/320=75% < maskable 安全區 80% 門檻）padded 版，不是裁切也不是冒充。
        // 日後若要清晰的 512 maskable icon，需要一張解析度夠高的來源美術稿重新出圖。
        icons: [
          {
            src: 'gokigen_panda_icon.png',
            sizes: '240x240',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'gokigen_panda_icon_maskable.png',
            sizes: '320x320',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,ico,woff,woff2}'],
        // 只排除「大、非核心」的 lazy chunk：TripMap（leaflet，gzip 約 56KB）與求婚彩蛋 extras。
        // 它們改走 sw.js 的 app-lazy-chunks runtime CacheFirst，第一次用到才快取。
        // ⚠️ 核心 section（TripInfo / Checklist / Shopping / Food / SegmentedControl，合計 gzip 約 11KB）
        // 必須留在 precache：每次部署 hash 都變、autoUpdate 靜默重載會讓 runtime cache 永遠是空的，
        // 排除它們等於「出國離線第一次點開航班 / 行李清單就載不到」。
        globIgnores: ['assets/TripMap-*', 'assets/extras-*'],
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
