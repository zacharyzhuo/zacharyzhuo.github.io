import { X } from 'lucide-react'

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   title: string,
 *   children: React.ReactNode,
 *   noScroll?: boolean
 * }} props
 */
export default function BottomSheet({ isOpen, onClose, title, children, noScroll = false }) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-transparent z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div
          className={`glass-bottom-sheet flex flex-col relative ${
            noScroll ? 'h-[79vh]' : 'min-h-[60vh] max-h-[79vh]'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 p-3 liquid-glass-button rounded-full text-stone-500 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉"
          >
            <X size={20} />
          </button>

          {noScroll ? (
            <>
              <div className="px-8 pt-8 pb-4 flex-shrink-0">
                <h2 className="text-2xl font-serif font-bold text-jp-text pr-12">{title}</h2>
              </div>
              <div className="flex-1 min-h-0">
                {children}
              </div>
            </>
          ) : (
            <div className="overflow-y-auto px-8 pb-10 space-y-4 flex-1 pt-8">
              <h2 className="text-2xl font-serif font-bold text-jp-text mb-4 pr-12">{title}</h2>
              {children}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
