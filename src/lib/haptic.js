/**
 * 觸覺回饋
 *
 * iOS Safari 不支援 navigator.vibrate()，改用 Safari 17.4+ 的
 * <input type="checkbox" switch> trick：toggle 一個 switch，iOS Taptic Engine 就會觸發。
 *
 * 關鍵：該 switch 必須「真的被 render」才會有 haptic。
 *   - 不能 display:none（不 render → 無效）
 *   - 不能掛在 <head>（head 子元素不 render → 無效）
 * 因此改成常駐在 <body>、用 position:fixed + opacity:0 + 1px 藏在畫面外（仍 render）。
 *
 * Android / 其他環境 fallback 回 navigator.vibrate()。
 */

const isIOS =
  typeof navigator !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent)

let switchEl = null

/** 取得（或惰性建立）常駐的隱形 iOS switch。render 在畫面外，不影響版面與互動。 */
function getSwitch() {
  if (switchEl || typeof document === 'undefined' || !document.body) return switchEl
  const label = document.createElement('label')
  label.setAttribute('aria-hidden', 'true')
  // 渲染但不可見、不可互動、不佔版面感知
  label.style.cssText =
    'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1;'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  label.appendChild(input)
  document.body.appendChild(label)
  switchEl = label
  return switchEl
}

/** 觸發一次 iOS switch haptic（必須同步，在 user gesture context 內執行） */
function iosHapticOnce() {
  try { getSwitch()?.click() } catch { /* ignore */ }
}

/** 觸發 N 次 iOS switch haptic，每次間隔 gap ms */
function iosHaptic(times = 1, gap = 70) {
  iosHapticOnce() // 第一次必須同步（保持在 user gesture context 內）
  for (let i = 1; i < times; i++) {
    setTimeout(iosHapticOnce, i * gap)
  }
}

function safeVibrate(pattern) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
    }
  } catch { /* ignore */ }
}

/** 輕微回饋：一般點擊、tab 切換 */
export function tap() {
  isIOS ? iosHaptic(1) : safeVibrate(8)
}

/** 中等回饋：開啟 modal、切換日期 */
export function bump() {
  isIOS ? iosHaptic(1) : safeVibrate(15)
}

/** 較強回饋：完成關鍵操作（例如清單全打勾、求婚彩蛋） */
export function success() {
  isIOS ? iosHaptic(2, 80) : safeVibrate([10, 30, 10])
}
