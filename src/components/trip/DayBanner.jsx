/**
 * @param {{
 *   bannerUrl?: string,
 *   title?: string,
 *   subtitle?: string,
 *   dateLabel?: string,  // 例：'06/04 · 週四'
 *   tripName?: string,   // 用來判斷 title === tripName 時隱藏 subtitle 避免重複
 *   eager?: boolean,     // 當前日 panel 設 true：圖片改 eager + fetchpriority high（above-the-fold）
 * }} props
 */
export default function DayBanner({ bannerUrl, title, subtitle, dateLabel, tripName, eager = false }) {
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
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-500 to-stone-700" />
      )}
      {/* 文字 scrim：中央柔和暗角，只在文字落點加深，讓照片邊角維持原色透氣（搭配文字 textShadow 即足夠可讀） */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 120% 95% at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.22) 55%, rgba(0,0,0,0) 80%)',
        }}
      />
      {/* 底部漸層淡入 jp-bg，與下方 itinerary 自然接縫（功能性，疊在 scrim 之上確保接縫乾淨） */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, transparent 55%, rgba(249, 248, 244, 0.7) 88%, rgb(249, 248, 244) 100%)',
        }}
      />
      <div
        className="absolute inset-0 flex flex-col justify-center items-center text-white p-6 text-center z-0"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.45)' }}
      >
        {dateLabel && (
          <p className="text-2xs font-serif tracking-[0.3em] uppercase opacity-80 mb-1 tabular-nums">
            {dateLabel}
          </p>
        )}
        <div className="flex items-center gap-2 text-2xs tracking-[0.2em] uppercase opacity-90 mb-1.5 font-serif">
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
