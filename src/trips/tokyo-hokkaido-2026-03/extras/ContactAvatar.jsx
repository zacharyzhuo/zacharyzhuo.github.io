import { useState } from 'react'

/**
 * 聯絡人頭像。img 載入失敗時 fallback 到 initials（用 state 切換，不用 innerHTML）。
 */
export default function ContactAvatar({ contact, onClick }) {
  const [imgError, setImgError] = useState(false)
  return (
    <div
      className="flex flex-col items-center gap-2 w-[72px] cursor-pointer"
      onClick={onClick}
    >
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 bg-white/5 flex items-center justify-center active:scale-90 transition-transform">
        {imgError ? (
          <span className="text-white/30 text-2xl font-sans">{contact.name[0]}</span>
        ) : (
          <img
            src={contact.avatar}
            alt={contact.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <span className="text-white text-xs font-sans text-center leading-tight">{contact.name}</span>
    </div>
  )
}
