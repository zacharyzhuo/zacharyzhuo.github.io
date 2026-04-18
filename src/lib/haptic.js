/**
 * 觸覺回饋 — 統一介面方便將來換實作（例如包成 Capacitor 後可換 native API）。
 * Web 上目前只有 navigator.vibrate；iOS Safari 支援度仍不穩，所以失敗時 silent。
 */

function safeVibrate(pattern) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
    }
  } catch { /* ignore */ }
}

/** 輕微回饋：一般點擊、tab 切換 */
export function tap() { safeVibrate(8) }

/** 中等回饋：開啟 modal、切換日期 */
export function bump() { safeVibrate(15) }

/** 較強回饋：完成關鍵操作（例如成功送出） */
export function success() { safeVibrate([10, 30, 10]) }
