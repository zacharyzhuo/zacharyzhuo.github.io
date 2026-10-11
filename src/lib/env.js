/**
 * 集中管理 Vite 環境變數，方便：
 *  1. 統一存取點，避免散落 import.meta.env.XXX
 *  2. Boot 時 fail-fast：缺漏必填變數會在 console 顯眼提示
 *  3. 之後新增變數有單一地方可加 type / fallback / 驗證邏輯
 *
 * 注意：值用 getter 延遲讀取，方便測試環境用 vi.stubEnv 覆蓋。
 */

const REQUIRED = ['VITE_INDEX_SHEET_ID']

let validated = false

function validateOnce() {
  if (validated) return
  validated = true
  const raw = import.meta.env
  const missing = REQUIRED.filter(k => !raw[k] || String(raw[k]).trim() === '')
  if (missing.length === 0) return

  const msg = `[env] 缺少必要環境變數：${missing.join(', ')}。請檢查 .env(.local) 或 GitHub Actions secrets。`
  if (raw.DEV && !raw.MODE?.includes('test')) {
    throw new Error(msg)
  } else {
    console.error(msg)
  }
}

export const env = {
  get INDEX_SHEET_ID() {
    validateOnce()
    return import.meta.env.VITE_INDEX_SHEET_ID || ''
  },
  get BASE_URL() {
    return import.meta.env.BASE_URL || '/'
  },
  get IS_DEV() {
    return !!import.meta.env.DEV
  },
  get IS_PROD() {
    return !!import.meta.env.PROD
  },
  // CARTO basemaps API key（選填）。CARTO 自 2026 起對 basemaps.cartocdn.com 強制要 key，
  // 無 key 時圖磚會變成「API KEY REQUIRED」浮水印。key 是前端公開 key，靠 CARTO 後台綁網域限制；
  // 本地放 .env.local、CI 走 GitHub Actions secret，勿寫死在程式碼。
  get CARTO_API_KEY() {
    return (import.meta.env.VITE_CARTO_API_KEY || '').trim()
  },
  // CI 在 build 時注入 commit sha；本地 build 時可能為 'dev'
  get APP_VERSION() {
    return import.meta.env.VITE_APP_VERSION || 'dev'
  },
}
