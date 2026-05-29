import { useEffect, useRef } from 'react'

/**
 * Modal 共用 a11y：
 *  1. ESC 關閉
 *  2. 開啟時記住觸發焦點，關閉後還原
 *  3. 開啟時將焦點移到 modal 容器本身（containerRef，需帶 tabindex="-1"）。
 *     不聚焦內部第一個按鈕，避免觸控開啟時關閉鈕被畫上 focus-visible 綠環
 *     （那顆環對沒在用鍵盤的觸控使用者只是視覺噪音）。聚焦 dialog 容器是
 *     ARIA 推薦做法，螢幕閱讀器會讀出 dialog 標題；使用者第一次按 Tab 仍會
 *     正常進入內部 focusable，下方 focus trap 照常運作。
 *  4. 簡易 focus trap：Tab / Shift+Tab 在 modal 內循環
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {React.RefObject<HTMLElement>} containerRef 指向 modal root 元素
 */
export function useModalA11y(isOpen, onClose, containerRef) {
  const onCloseRef = useRef(onClose)
  const previousFocusRef = useRef(null)

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement

    // 等 DOM 完成 transition 再 focus，避免被 transform 影響 viewport
    const focusTimer = setTimeout(() => {
      const root = containerRef.current
      if (!root) return
      // 聚焦 dialog 容器本身（非內部按鈕），不畫出 focus-visible 綠環
      root.focus({ preventScroll: true })
    }, 50)

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const root = containerRef.current
      if (!root) return
      const focusables = Array.from(
        root.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('aria-hidden'))
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKeyDown)
      // 還原開啟前的焦點
      const prev = previousFocusRef.current
      if (prev && typeof prev.focus === 'function') {
        prev.focus({ preventScroll: true })
      }
    }
  }, [isOpen, containerRef])
}
