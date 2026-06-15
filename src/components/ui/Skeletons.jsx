// Cold-start 載入骨架：取代置中 spinner，鏡射真實版面讓感知速度更快。
// animate-pulse 在 prefers-reduced-motion 下會被全域規則停掉（index.css），自動降級為靜態色塊。

/** 單一灰色佔位塊 */
function Bar({ className = '' }) {
  return <div className={`bg-stone-200/80 animate-pulse ${className}`} />
}

/** 行程頁全頁骨架：header + 日期導航 + banner + 時間軸卡片 */
export function TripSkeleton() {
  return (
    <div className="bg-washi min-h-screen safe-area-inset" role="status" aria-busy="true">
      <span className="sr-only">載入行程中…</span>

      {/* Header */}
      <div className="pt-8 pb-4 px-6 flex items-center justify-between">
        <Bar className="w-11 h-11 rounded-full" />
        <div className="flex flex-col items-center gap-2 flex-1 px-4">
          <Bar className="w-16 h-2.5 rounded" />
          <Bar className="w-24 h-2.5 rounded" />
          <Bar className="w-32 h-6 rounded-md" />
        </div>
        <div className="w-10" />
      </div>

      {/* 日期導航 pills */}
      <div className="flex gap-2 px-6 pb-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bar key={i} className="w-14 h-14 rounded-2xl shrink-0" />
        ))}
      </div>

      {/* Banner */}
      <Bar className="h-36 w-full" />
      <div className="h-6" />

      {/* 時間軸卡片 */}
      <div className="mt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-6">
            <div className="w-12 shrink-0 flex flex-col items-center pt-1">
              <Bar className="w-8 h-3 rounded" />
              {i < 3 && <div className="w-[1px] bg-hairline flex-1 my-2" />}
            </div>
            <div className="flex-1 min-w-0 pb-8">
              <Bar className="w-full h-28 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** 側邊欄 section 骨架：鏡射 noScroll section 版面（標題 + 卡片列 + 底部浮動 tab）。
    同時用於 lazy chunk 的 Suspense fallback 與 sheet 資料載入中。 */
export function SectionSkeleton({ bottomBar = true }) {
  return (
    <div className="flex flex-col relative h-full" role="status" aria-busy="true">
      <span className="sr-only">載入中…</span>
      <div className="flex-1 min-h-0 overflow-hidden px-8 pt-2">
        <Bar className="w-28 h-7 rounded-md mt-8 mb-5" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bar key={i} className="w-full h-24 rounded-2xl" />
          ))}
        </div>
      </div>
      {bottomBar && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center px-4 safe-area-bottom">
          <Bar className="w-64 h-14 rounded-full" />
        </div>
      )}
    </div>
  )
}

/** 首頁卡片清單骨架（不含 header，直接塞進既有 main）。
    鏡射新版面：Now & Next 大卡 + 年份分組索引條。 */
export function HomeCardsSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-busy="true">
      <span className="sr-only">載入行程列表中…</span>

      {/* Now & Next：區段標題 + 雜誌封面大卡 */}
      <section>
        <div className="flex items-center gap-2.5 mb-3.5 px-1">
          <Bar className="w-20 h-2.5 rounded" />
          <span className="flex-1 h-px bg-hairline" />
        </div>
        <Bar className="w-full aspect-[3/2] rounded-2xl" />
      </section>

      {/* 年份分組：年份標題 + 索引條 */}
      <section>
        <div className="flex items-center gap-3 mb-3 px-1">
          <Bar className="w-12 h-6 rounded-md" />
          <Bar className="w-10 h-2.5 rounded" />
          <span className="flex-1 h-px bg-hairline" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-stretch rounded-2xl overflow-hidden bg-stone-200/40 h-[76px]">
              <Bar className="w-[104px] h-full" />
              <div className="flex-1 px-4 py-3.5 flex flex-col justify-center gap-2">
                <Bar className="w-32 h-3.5 rounded" />
                <Bar className="w-40 h-3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
