import { useRef } from 'react'
import { isPointInRect } from '../lib/gesture.js'

/**
 * 「按下後滑出元件範圍再放開＝取消」的點擊行為，避免長按/誤觸誤觸發。
 *
 * 呼叫一次即可服務多個元件（含 `.map()` 清單）：同一時間只會按一個，
 * 共用單一 ref 足矣。把 `onPointerDown`/`onPointerUp` spread 到元件上，
 * 用 `guard(fn)` 包住原本的點擊行為當 `onClick`。
 *
 * onClick 仍保留：鍵盤（Enter/Space）無 pointer，releasedOutside 維持 false → 照常觸發，a11y 不受影響。
 *
 * @returns {{ onPointerDown: Function, onPointerUp: Function, guard: (fn?: Function) => Function }}
 */
export function useCancelableTap() {
  const releasedOutsideRef = useRef(false)

  const onPointerDown = (e) => {
    releasedOutsideRef.current = false
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* ignore */ }
  }

  const onPointerUp = (e) => {
    releasedOutsideRef.current = !isPointInRect(
      e.clientX, e.clientY, e.currentTarget.getBoundingClientRect()
    )
  }

  const guard = (fn) => (e) => {
    if (releasedOutsideRef.current) { releasedOutsideRef.current = false; return } // 滑出後放開：取消
    fn?.(e)
  }

  // 給 <a>/<Link> 用：取消時對 click event 呼叫 preventDefault() 擋掉原生導航；
  // 但 modifier 鍵（cmd/ctrl/shift/alt）或非左鍵點擊一律略過，保留瀏覽器「開新分頁」原生行為。
  const guardLink = (fn) => (e) => {
    if (releasedOutsideRef.current) {
      releasedOutsideRef.current = false
      const hasModifierOrNonPrimary = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0
      if (!hasModifierOrNonPrimary) e.preventDefault()
      return
    }
    fn?.(e)
  }

  return { onPointerDown, onPointerUp, guard, guardLink }
}
