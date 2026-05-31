import { AlertCircle } from 'lucide-react'

/**
 * 統一的錯誤狀態 UI：圖示 + 訊息 + 動作按鈕。
 *
 * @param {{
 *   title?: string,
 *   message?: string,
 *   actionLabel?: string,
 *   onAction?: () => void
 * }} props
 */
export default function ErrorState({
  title = '無法載入',
  message = '請檢查網路連線後重試',
  actionLabel = '重試',
  onAction,
}) {
  const handle = onAction || (() => window.location.reload())
  return (
    <div className="flex flex-col items-center gap-4 mt-12 text-center px-6 font-serif">
      <div className="text-stone-400">
        <AlertCircle size={32} />
      </div>
      <div>
        <p className="text-jp-text font-medium">{title}</p>
        <p className="text-muted text-sm mt-1">{message}</p>
      </div>
      <button
        onClick={handle}
        className="px-6 py-3 bg-jp-green text-white rounded-xl text-sm touch-manipulation min-h-[44px]"
      >
        {actionLabel}
      </button>
    </div>
  )
}
