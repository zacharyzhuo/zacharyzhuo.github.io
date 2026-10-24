/**
 * 開啟外部連結。
 *
 * iOS「加入主畫面」的 standalone PWA 裡，window.open(url, '_blank') 會開一個獨立的
 * Safari 分頁；當 URL 是 universal link（如 Google Maps）被交給 app 後，那個分頁就
 * 空著，使用者切回來會看到空白的 Safari「搜尋或輸入網站名稱」頁。
 *
 * 對策：standalone 模式改用導頁（location.href），讓 iOS 直接把 universal link 交給
 * 對應 app，或開有「完成」鈕的 in-app 瀏覽器，都不會留下孤兒分頁。一般瀏覽器/桌面則
 * 維持開新分頁的行為。
 *
 * 只允許 http/https，避免 sheet 資料(link/url 欄)夾帶 `javascript:`/`data:` 等
 * 危險 scheme 被當成導頁目標執行。
 *
 * @param {string} url
 */
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])
const BARE_DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i

export function openExternal(url) {
  if (!url || typeof window === 'undefined') return

  // sheet 裡偶有漏打 scheme 的連結（如 `google.com/maps/...`）：看起來像網域就補 https://
  const normalized = BARE_DOMAIN.test(url) ? `https://${url}` : url

  let parsed
  try {
    parsed = new URL(normalized)
  } catch {
    console.error('[openExternal] 忽略無法解析的 URL：', url)
    return
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    console.error('[openExternal] 忽略不允許的 URL scheme：', parsed.protocol)
    return
  }

  const isStandalone =
    window.navigator?.standalone === true ||
    window.matchMedia?.('(display-mode: standalone)').matches === true

  if (isStandalone) {
    window.location.href = normalized
  } else {
    window.open(normalized, '_blank', 'noopener,noreferrer')
  }
}
