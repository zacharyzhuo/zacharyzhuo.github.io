import { useEffect, useRef } from 'react'

/**
 * Modal 共用 a11y：
 *  1. ESC 關閉
 *  2. 開啟時記住觸發焦點，關閉後還原
 *  3. 開啟時將焦點移入 modal（ref.current 內第一個可聚焦元素，預設第一個 button）
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
      const focusable = root.querySelector(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusable) focusable.focus({ preventScroll: true })
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
