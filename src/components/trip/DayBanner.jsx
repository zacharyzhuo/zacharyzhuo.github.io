/**
 * @param {{
 *   bannerUrl?: string,
 *   title?: string,
 *   subtitle?: string,
 *   dateLabel?: string,  // 例：'06/04 · 週四'
 *   tripName?: string,   // 用來判斷 title === tripName 時隱藏 subtitle 避免重複
 * }} props
 */
export default function DayBanner({ bannerUrl, title, subtitle, dateLabel, tripName }) {
  // subtitle 跟 trip 主名稱重複時隱藏（例：subtitle="宿霧" / tripName="宿霧"）
  const showSubtitle = subtitle && subtitle !== tripName && subtitle !== title

  return (
    <div className="relative rounded-none overflow-hidden h-36 group">
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
      {/* 底部漸層淡入 jp-bg，讓 banner 跟下方 itinerary 自然接縫
         單條 ease-in-out 線性 fade（3 stop）避免階梯感 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, transparent 50%, rgba(249, 248, 244, 0.7) 88%, rgb(249, 248, 244) 100%)',
        }}
      />
      {/* 上半部加深 overlay，白字保持可讀 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-transparent" />
      <div
        className="absolute inset-0 flex flex-col justify-center items-center text-white p-6 text-center z-0"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.45)' }}
      >
        {dateLabel && (
          <p className="text-[10px] font-serif tracking-[0.3em] uppercase opacity-80 mb-1 tabular-nums">
            {dateLabel}
          </p>
        )}
        <div className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase opacity-90 mb-1.5 font-serif">
          <span className="w-5 h-[1px] bg-white" />
          <span>今日行程</span>
          <span className="w-5 h-[1px] bg-white" />
        </div>
        {title && (
          <h2 className="text-2xl font-serif font-bold tracking-wide leading-tight">
            {title}
          </h2>
        )}
        {showSubtitle && (
          <p className="text-xs font-serif opacity-95 tracking-widest mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
