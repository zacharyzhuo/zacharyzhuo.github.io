/**
 * @param {{ bannerUrl?: string, title?: string, subtitle?: string }} props
 */
export default function DayBanner({ bannerUrl, title, subtitle }) {
  return (
    <div className="relative rounded-none overflow-hidden h-48 group">
      {bannerUrl ? (
        <img
          src={bannerUrl}
          alt={title || ''}
          width={1200}
          height={400}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-500 to-stone-700" />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(249, 248, 244, 0.05) 45%, rgba(249, 248, 244, 0.15) 60%, rgba(249, 248, 244, 0.3) 72%, rgba(249, 248, 244, 0.5) 82%, rgba(249, 248, 244, 0.7) 90%, rgba(249, 248, 244, 0.85) 95%, rgba(249, 248, 244, 0.95) 98%, rgb(249, 248, 244) 100%)'
        }}
      />
      {/* 加深上半部 overlay，確保不論底圖明暗白字都可讀 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-transparent" />
      <div
        className="absolute inset-0 flex flex-col justify-center items-center text-white p-6 text-center z-0"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.45)' }}
      >
        <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase opacity-90 mb-2 font-serif">
          <span className="w-6 h-[1px] bg-white" />
          <span>今日行程</span>
          <span className="w-6 h-[1px] bg-white" />
        </div>
        {title && (
          <h2 className="text-2xl font-serif font-bold tracking-wide mb-1">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-xs font-serif opacity-95 tracking-widest">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
