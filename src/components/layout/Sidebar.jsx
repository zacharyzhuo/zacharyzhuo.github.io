import { X } from 'lucide-react'

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSelect: (key: string) => void,
 *   sections: Array<{ key: string, label: string, subLabel: string, icon: React.ReactNode }>
 * }} props
 */
export default function Sidebar({ isOpen, onClose, onSelect, sections }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-64 glass-sidebar z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/20 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-serif font-bold text-jp-text">Trip Menu</h2>
          <button
            onClick={onClose}
            className="p-3 liquid-glass-button rounded-full text-stone-500 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉選單"
          >
            <X size={18} />
          </button>
        </div>
        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-2 scrollbar-hide">
          {sections.map(({ key, label, subLabel, icon }) => (
            <button
              key={key}
              onClick={() => { onSelect(key); onClose() }}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/20 transition-all text-left group touch-manipulation min-h-[44px]"
            >
              <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center text-jp-green flex-shrink-0">
                {icon}
              </div>
              <div>
                <span className="block font-serif font-bold text-jp-text text-base">{label}</span>
                <span className="block text-xs text-stone-400 font-sans tracking-wide">{subLabel}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}
