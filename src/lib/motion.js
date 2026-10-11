/**
 * 使用者是否要求減少動態（prefers-reduced-motion: reduce）。
 * CSS 端由 index.css 的 @media 區塊處理；這個 helper 給 JS 驅動的動畫
 * （Leaflet flyTo / smooth scroll / 教學 peek / inline transition）分支用。
 * SSR / 測試環境（無 matchMedia）一律回 false。
 */
export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
