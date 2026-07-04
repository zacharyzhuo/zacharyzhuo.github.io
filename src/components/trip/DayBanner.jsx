import { bannerLabel } from '../../lib/tripDate.js'

/**
 * @param {{
 *   bannerUrl?: string,
 *   title?: string,
 *   subtitle?: string,
 *   dateLabel?: string,  // 例：'06/04 · 週四'
 *   tripName?: string,   // 用來判斷 title === tripName 時隱藏 subtitle 避免重複
 *   eager?: boolean,     // 當前日 panel 設 true：圖片改 eager + fetchpriority high（above-the-fold）
 *   date?: string,       // 此 banner 對應的完整日期 'YYYY/MM/DD'，給 bannerLabel 判斷是否為今天
 *   dayNumber?: number,  // 第幾天，非今天時顯示「DAY N」
 * }} props
 */
// 小字（日期 / 今日行程 / 副標）筆畫細、又常壓在亮色天空上，靠更緊更深的陰影撐可讀；大標夠粗用容器的光暈即可。
const SMALL_TEXT_SHADOW = '0 1px 1px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.6)'

export default function DayBanner({ bannerUrl, title, subtitle, dateLabel, tripName, eager = false, date, dayNumber }) {
  // subtitle 跟 trip 主名稱重複時隱藏（例：subtitle="宿霧" / tripName="宿霧"）
  const showSubtitle = subtitle && subtitle !== tripName && subtitle !== title
  const eyebrowLabel = bannerLabel(date, dayNumber)

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
      {/* 不蓋遮罩：照片保持鮮明，文字可讀性改靠緊貼字緣的多層暗色光暈陰影（見下方 textShadow） */}
      {/* 底部漸層淡入 jp-bg，與下方 itinerary 自然接縫（功能性，疊在 scrim 之上確保接縫乾淨）。
          終點刻意半透明（0.94）而非全不透明：背景是和紙染め（非純米白），
          不透明米白會在 banner 底緣形成一條亮帶色塊斷層 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, transparent 55%, rgba(251, 250, 245, 0.6) 86%, rgba(251, 250, 245, 0.94) 100%)',
        }}
      />
      <div
        className="absolute inset-0 flex flex-col justify-center items-center text-white p-6 text-center z-0"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6), 0 0 7px rgba(0,0,0,0.45), 0 0 14px rgba(0,0,0,0.3)' }}
      >
        {dateLabel && (
          <p className="text-2xs font-serif tracking-[0.3em] uppercase opacity-95 mb-1 tabular-nums" style={{ textShadow: SMALL_TEXT_SHADOW }}>
            {dateLabel}
          </p>
        )}
        <div className="flex items-center gap-2 text-2xs tracking-[0.2em] uppercase mb-1.5 font-serif" style={{ textShadow: SMALL_TEXT_SHADOW }}>
          <span className="w-5 h-[1px] bg-white drop-shadow-[0_0_2px_rgba(0,0,0,0.6)]" />
          <span>{eyebrowLabel}</span>
          <span className="w-5 h-[1px] bg-white drop-shadow-[0_0_2px_rgba(0,0,0,0.6)]" />
        </div>
        {title && (
          <h2 className="text-2xl font-serif font-bold tracking-wide leading-tight">
            {title}
          </h2>
        )}
        {showSubtitle && (
          <p className="text-xs font-serif tracking-widest mt-0.5" style={{ textShadow: SMALL_TEXT_SHADOW }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
