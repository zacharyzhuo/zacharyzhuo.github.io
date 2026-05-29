import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Top-level error boundary。任一 component render 拋錯時不讓整個 app 白屏，
 * 顯示 fallback UI 並提供「重新載入」按鈕（清掉所有 SWR cache 後 reload）。
 *
 * 故意保留 class component：React hooks 沒有 componentDidCatch 等價物。
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // 線上錯誤可在這裡接 Sentry / GA / 自家後端
    if (typeof window !== 'undefined' && window.console) {
      console.error('[ErrorBoundary]', error, info)
    }
  }

  handleReset = () => {
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('sheet:')) localStorage.removeItem(k)
      })
    } catch { /* ignore */ }
    window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-jp-bg flex flex-col items-center justify-center px-6 safe-area-inset">
        <div className="max-w-sm text-center">
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 text-amber-600">
            <AlertTriangle size={28} />
          </div>
          <h1 className="text-xl font-serif font-bold text-jp-text mb-2">這頁出了點問題</h1>
          <p className="text-sm text-stone-600 font-serif leading-relaxed mb-6">
            畫面渲染時發生錯誤。可能是資料格式變更，或新版尚未載入完成。
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-jp-green text-white font-serif touch-manipulation min-h-[44px]"
          >
            <RefreshCw size={16} />
            清快取並重新載入
          </button>
          {this.state.error?.message && (
            <details className="mt-6 text-left">
              <summary className="text-xs text-stone-400 font-serif cursor-pointer">技術細節</summary>
              <pre className="mt-2 text-2xs text-stone-500 font-mono bg-stone-100/50 p-3 rounded-lg overflow-auto whitespace-pre-wrap">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }
}
