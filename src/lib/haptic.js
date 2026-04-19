/**
 * 觸覺回饋
 *
 * iOS Safari 不支援 navigator.vibrate()，改用 Safari 17.4+ 的
 * <input type="checkbox" switch> trick：在背景建立一個隱藏 switch、
 * toggle 它、再移除，iOS Taptic Engine 就會觸發。
 * Android / 其他環境 fallback 回 navigator.vibrate()。
 */

const isIOS =
  typeof navigator !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent)

/** 觸發一次 iOS switch haptic（必須同步，在 user gesture context 內執行） */
function iosHapticOnce() {
  const label = document.createElement('label')
  label.ariaHidden = 'true'
  label.style.display = 'none'

  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  label.appendChild(input)

  document.head.appendChild(label)
  label.click()
  document.head.removeChild(label)
}

/** 觸發 N 次 iOS switch haptic，每次間隔 gap ms */
function iosHaptic(times = 1, gap = 70) {
  // 第一次必須同步（保持在 user gesture context 內）
  iosHapticOnce()
  // 後續次數可以用 setTimeout（success 的雙拍）
  for (let i = 1; i < times; i++) {
    setTimeout(() => { try { iosHapticOnce() } catch { /* ignore */ } }, i * gap)
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
