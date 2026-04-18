/**
 * 跨頁面/跨 reload 的 stale-while-revalidate 快取。
 * 寫入 localStorage，使用者開啟 PWA 時能瞬間看到上次的內容，背景再 revalidate。
 *
 * Versioning：未來改變資料 schema 時把 VERSION bump 即可作廢舊資料。
 */

const VERSION = 'v1'
const PREFIX = `sheet:${VERSION}:`

export function getCached(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.data ?? null
  } catch {
    return null
  }
}

export function setCached(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, ts: Date.now() }))
  } catch {
    // localStorage 可能滿了或被禁用 — 靜默忽略，下次還是能 fetch
  }
}

export function clearCached(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch { /* ignore */ }
}

export function clearAllCached() {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(PREFIX)) localStorage.removeItem(k)
    }
  } catch { /* ignore */ }
}
