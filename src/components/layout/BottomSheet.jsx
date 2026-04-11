import { X } from 'lucide-react'

export default function BottomSheet({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="glass-bottom-sheet min-h-[60vh] max-h-[79vh] flex flex-col relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 flex-shrink-0">
            <h2 className="text-xl font-serif font-bold text-jp-text">{title}</h2>
            <button
              onClick={onClose}
              className="p-3 liquid-glass-button rounded-full text-stone-500 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="關閉"
            >
              <X size={18} />
            </button>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide safe-area-bottom">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
