/**
 * Section-level 空狀態。icon outline，淡色，配標題 + 一行說明。
 *
 * @param {{
 *   icon: React.ComponentType<{ size?: number, className?: string, strokeWidth?: number }>,
 *   title: string,
 *   hint?: string,
 * }} props
 */
export default function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-12">
      <div className="mb-4 text-stone-300">
        <Icon size={56} strokeWidth={1.2} />
      </div>
      <p className="font-serif text-base text-stone-500 mb-1">{title}</p>
      {hint && (
        <p className="font-serif text-xs text-stone-400 tracking-wide max-w-[18em] leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  )
}
