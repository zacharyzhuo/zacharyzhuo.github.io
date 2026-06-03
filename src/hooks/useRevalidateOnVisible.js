import { useEffect, useRef } from 'react'

const DEFAULT_MIN_HIDDEN_MS = 10_000

/**
 * 當分頁 / PWA 從背景回到前景（且背景時間 >= minHiddenMs）時呼叫 onVisible。
 *
 * 用途：iOS「加入桌面」的 PWA 背景恢復是 warm resume —— 不重載頁面、JS context 還活著，
 * 所以靠 mount/initial-load 觸發的 fetch 都不會重跑、資料會凍住。掛這個 hook 在資料 hook 上，
 * 回到前景就靜默 revalidate（不重載整頁）。
 *
 * minHiddenMs 門檻避免「拉一下控制中心、切一下就回來」這種短暫離開也猛打網路。
 *
 * @param {() => void} onVisible
 * @param {{ minHiddenMs?: number }} [opts]
 */
export function useRevalidateOnVisible(onVisible, { minHiddenMs = DEFAULT_MIN_HIDDEN_MS } = {}) {
  const cbRef = useRef(onVisible)
  useEffect(() => { cbRef.current = onVisible }, [onVisible])

  useEffect(() => {
    let hiddenAt = null
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
        return
      }
      if (hiddenAt === null) return
      const elapsed = Date.now() - hiddenAt
      hiddenAt = null
      if (elapsed >= minHiddenMs) cbRef.current?.()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [minHiddenMs])
}
