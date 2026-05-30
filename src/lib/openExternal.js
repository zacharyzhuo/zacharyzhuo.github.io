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
 * @param {string} url
 */
export function openExternal(url) {
  if (!url || typeof window === 'undefined') return

  const isStandalone =
    window.navigator?.standalone === true ||
    window.matchMedia?.('(display-mode: standalone)').matches === true

  if (isStandalone) {
    window.location.href = url
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
