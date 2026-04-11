import { X } from 'lucide-react'

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSelect: (key: string) => void,
 *   sections: Array<{ key: string, label: string, subLabel: string, icon: React.ReactNode, color?: string, isEmergency?: boolean }>,
 *   trip?: { name: string, dates: string },
 *   tripNameEn?: string
 * }} props
 */
export default function Sidebar({ isOpen, onClose, onSelect, sections, trip, tripNameEn }) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-transparent z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 left-0 w-64 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full w-full glass-sidebar flex flex-col">
          <div className="p-6 flex justify-between items-center">
            <h2 className="text-xl font-serif font-bold text-jp-text">Trip Menu</h2>
            <button
              onClick={onClose}
              className="p-3 liquid-glass-button rounded-full text-stone-500 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="關閉選單"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-2 px-4">
              {sections.map(({ key, label, subLabel, icon, color, isEmergency }) => (
                <button
                  key={key}
                  onClick={() => { onSelect(key); onClose() }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/20 transition-all text-left group"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color ?? 'bg-white/30 text-jp-green'}`}>
                    {icon}
                  </div>
                  <div>
                    <span className={`block font-serif font-bold text-base ${isEmergency ? 'text-red-700' : 'text-jp-text'}`}>
                      {label}
                    </span>
                    <span className={`block text-xs font-serif tracking-wide ${isEmergency ? 'text-red-400' : 'text-stone-500'}`}>
                      {subLabel}
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            <p className="text-xs text-stone-500 text-center font-serif tracking-widest uppercase opacity-70">
              {tripNameEn || 'Trip'}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
