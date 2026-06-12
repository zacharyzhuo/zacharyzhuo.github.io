import { useEffect } from 'react'

let lockCount = 0
let savedScrollY = 0

/**
 * Body scroll lock（reference counting，多個 modal 疊開只鎖/解鎖一次）。
 *
 * iOS Safari 不理 body 的 overflow: hidden（touch 捲動照常穿透），
 * 必須用「body position: fixed + top 負值補償」技法才真正鎖得住：
 * 鎖定時把 body 釘在目前捲動位置（top: -scrollY 讓畫面不跳），
 * 解鎖時還原樣式並 scrollTo 回原位。
 * 背景可滾會造成：modal 上的點按被 iOS 當捲動手勢吃掉（按鈕偶發失效）、
 * 關掉 modal 後頁面位置莫名跑掉。
 */
export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return
    lockCount++
    if (lockCount === 1) {
      savedScrollY = window.scrollY
      const { style } = document.body
      style.position = 'fixed'
      style.top = `-${savedScrollY}px`
      style.left = '0'
      style.right = '0'
      style.width = '100%'
      style.overflow = 'hidden'
    }
    return () => {
      lockCount--
      if (lockCount === 0) {
        const { style } = document.body
        style.position = ''
        style.top = ''
        style.left = ''
        style.right = ''
        style.width = ''
        style.overflow = ''
        window.scrollTo(0, savedScrollY)
      }
    }
  }, [locked])
}
