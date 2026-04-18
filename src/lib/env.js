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
}
