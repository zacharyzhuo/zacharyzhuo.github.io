# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
npm run dev        # 啟動開發伺服器（Vite，預設 localhost:5173）
npm run build      # 生產 build（輸出至 dist/）
npm run preview    # 預覽生產 build
npm run test       # 執行測試（vitest run，單次）
npm run test:watch # 監看模式測試
```

---

## 架構概覽

Vite + React SPA，以 Google Sheets 作為 CMS，部署於 GitHub Pages。

```
Google Sheets (Public)
├── Index Sheet        → 所有行程清單
└── 每趟行程 Sheet     → days / flights / prepare / accommodation / checklist / itinerary / shopping / food

         ↓ fetch CSV at runtime
         ↓   - module-level Map 快取（同 session 不重複 fetch）
         ↓   - localStorage SWR 快取（跨 session、跨 reload，PWA 開啟瞬間有畫面）

Vite + React SPA (GitHub Pages)
├── 首頁 /#/                → fetch index sheet → 渲染行程卡片列表
└── 行程頁 /#/trip/:slug    → fetch 行程 sheet → 渲染各 section
```

- Routing 使用 **Hash mode**，以相容 GitHub Pages 靜態 hosting
- 環境變數：`VITE_INDEX_SHEET_ID` 為必填，缺漏時 dev 啟動會直接 throw（測試環境除外）

### 必填環境變數

| 變數 | 說明 |
|---|---|
| `VITE_INDEX_SHEET_ID` | Index Sheet 的 Google Sheet ID |

統一從 `src/lib/env.js` 讀取，請勿直接散用 `import.meta.env.XXX`。

---

## Component 架構

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx              # 抽屜導航（選單項目由 TripPage 的 MENU_ITEMS 經 sections prop 傳入）
│   │   ├── BottomSheet.jsx          # 共用底部彈出層（tall 變體：calc(100dvh - env(safe-area-inset-top) - 5rem)，供地圖用）
│   │   └── ExchangeRate.jsx         # Sidebar 內嵌匯率小工具（useExchangeRate + countryCode，見 destination_country）
│   ├── home/
│   │   └── TripCard.jsx             # 首頁行程卡片（毛玻璃風格）
│   ├── trip/
│   │   ├── DayNav.jsx / DayBanner.jsx / ItinerarySection.jsx（含 DetailModal）/ TripInfoSection.jsx
│   │   ├── ShoppingSection.jsx / FoodSection.jsx / ChecklistSection.jsx
│   │   └── TripMap.jsx / NearbyStrip.jsx / mapIcons.js
│   └── ui/
│       └── SegmentedControl.jsx / Skeletons.jsx / EmptyState.jsx / ErrorBoundary.jsx / ErrorState.jsx
├── pages/
│   ├── HomePage.jsx                 # 行程列表頁（PWA 啟動會嘗試自動跳轉）
│   └── TripPage.jsx                 # 行程詳細頁（通用；含 MENU_ITEMS 定義，側欄選單來源）
├── hooks/
│   ├── useSheetData.js / useTrips.js / useScrollLock.js / useModalA11y.js / usePageMeta.js
│   ├── useTripDerived.js / usePullToRefresh.js / useSegmentedDrag.js
│   ├── useCancelableTap.js          # 按下滑出取消手勢
│   ├── useDaySwipe.js               # 三欄輪播左右滑動切日
│   ├── useEasterEgg.js              # 求婚彩蛋連續點擊觸發（REQUIRED_CLICKS=9, CLICK_GAP_MS=2000）
│   ├── useExchangeRate.js           # fetch + 快取匯率
│   └── useRevalidateOnVisible.js    # PWA 回前景背景重抓
├── lib/
│   ├── sheets.js / env.js / haptic.js / swrCache.js / categories.js / tripDate.js / maps.js
│   ├── currency.js                  # 匯率純函式（國家碼→幣別、換算、格式化）
│   ├── gesture.js                   # resist() rubber-band 拉伸
│   └── openExternal.js              # 外部連結開啟包裝（PWA 相容）
├── trips/
│   └── 2026-03-tokyo-hokkaido/
│       ├── extras.jsx               # 求婚彩蛋（僅此行程）
│       └── extras/
│           ├── data.js              # PROPOSAL_PHOTOS + isVideoUrl
│           └── HeartIcon.jsx / ShareSheet.jsx / ContactAvatar.jsx
├── App.jsx
├── main.jsx                         # React entry；registerSW + onRegisteredSW（回前景/30min 檢查更新版本）
└── sw.js                            # PWA service worker 原始碼（NetworkFirst/CacheFirst 快取策略，見上方「資料流」段落）
```

### BottomSheet Props

| prop | 說明 |
|---|---|
| `isOpen` | 控制顯示 |
| `onClose` | 關閉回調（亦會被 ESC、下拉手勢觸發） |
| `title` | 標題文字（同時用於 `aria-labelledby`） |
| `noScroll` | 固定高度 `h-[79vh]`（`tall` 時見下），子元件自行管理捲動，供浮動 tab 使用。**內容一律滿版鋪到 sheet 頂**（`absolute inset-0` + 與 glass 同弧度的 `rounded-t-[2rem]` 裁切）：把手 pill 浮在內容上（header `z-[660]`、pill 深色 `stone-400/70`），捲動內容滑進 pill 底下，把手與內容間無玻璃縫 |
| `noStickyTitle` | 不顯示固定標題；標題改由子元件在 scroll 區頂端自行渲染（可隨內容捲動） |
| `tall` | 高度改 `calc(100dvh - env(safe-area-inset-top) - 5rem)`：頂緣切齊頁面 header icon（漢堡 / 地圖鈕）下緣。地圖 sheet 用 |

a11y：BottomSheet 與 ItinerarySection 的 DetailModal 都套用 `useModalA11y`，自動處理 ESC、focus trap 與 focus 還原。

**桌面寬螢幕置中（`max-w-2xl mx-auto`）**：BottomSheet 與 DetailModal 的外層固定容器都是 `inset-x-0`（左右貼齊 0），額外加上 `max-w-2xl mx-auto` 即可在桌面寬螢幕收窄置中、行動裝置滿版不受影響（`inset-x-0` + `max-width` + `margin:auto` 是標準的 fixed 元素置中技巧）。HomePage / TripPage 的內容欄（header + main）同套 `max-w-2xl mx-auto`，washi 背景維持滿版鋪滿。Sidebar（`fixed inset-y-0 left-0 w-64`）不受此規則影響，維持固定寬度貼左。

DetailModal（高度內容驅動 `min-h-[40vh] max-h-[85vh]`，無法 absolute 滿版）用**負 margin 等價手法**做同一套「把手浮在內容上」：捲動區 `-mt-6`（= 把手條 24px）墊到 pill 背後、`pt-12` 補回內容起點，pill `relative z-10` + 深色。

採 `noScroll noStickyTitle` 的 section（ShoppingSection / FoodSection / ChecklistSection）統一結構：

```jsx
<div className="flex flex-col relative h-full">
  <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-8 pb-... pt-2">
    <h2 className="text-2xl font-serif font-bold text-jp-text pt-8 pb-2 pr-12">{標題}</h2>
    {…內容…}
  </div>
  {/* 視需要附浮動 tab、bottom action 等 */}
</div>
```

### 側邊欄選單（MENU_ITEMS）

| key | 說明 |
|---|---|
| `info` | 旅程資訊（航班 / 行前準備 / 住宿） |
| `checklist` | 行李清單 |
| `shopping` | 逛街清單 |
| `food` | 美食清單 |

### 瀏覽器歷史整合（sidebar / modal / 地圖 / detail）— 2026-07-04

`TripPage` 的疊層 UI（側欄 `sidebarOpen`、四個 `activeModal`、地圖 `mapOpen`，以及 `ItinerarySection` 的 `DetailModal`）**不用各自的 boolean state**，改由 `location.state.panel` 單一值衍生（`'sidebar' | 'info' | 'checklist' | 'shopping' | 'food' | 'map' | 'detail'`），讓 Android 手勢 / 瀏覽器上一頁能正確「關掉最上層」而不是直接離開頁面：

- **開啟**：`navigate(pathname + search, { state: { panel } })`（push，新增一筆 history entry）。
- **關閉**（X 鈕 / ESC / backdrop / 拖曳關閉手勢）：一律 `navigate(-1)`，讓 UI 的關閉動作跟瀏覽器上一頁行為完全一致，不會兩者狀態打架。
- **Sidebar → 選單項目**：用 `replace: true` 蓋掉 sidebar 那筆 entry（而非疊加新一筆），所以從選單項目按上一頁會直接回到行程頁本身，不會先經過「sidebar 開啟」的中繼態。
- **`ItinerarySection` 的 `DetailModal`**：改為可選受控（`detailKey`/`onOpenDetail`/`onCloseDetail` 皆為選填，未帶時退回原本內部 `useState`，既有的 render-only smoke test 不需包 Router）。`TripPage` 把 `detailKey` 組成 `${dayDate}|${row.time}|${row.name}` 塞進同一個 `location.state`（連同 `day`），靠 `dayDate` 保證跨日不撞號、靠 `day` 比對確保三欄輪播中 prev/current/next 只有對應那個 day panel 會渲染 modal。
- **`activeDay` ↔ `?d=<1-based>`**：查詢字串同步用 `replace: true`（不灑 history），只在值真的改變時才寫入；掛載時讀回並 clamp 到 `[1, days.length]`，讀不到或超界則退回原本「今天」自動選 day 邏輯。純 `navigate({ pathname, search })`，不碰 hash 結構，HashRouter 相容。

### 行前準備（資料驅動）

「行前準備」tab 由 trip sheet 的 **`prepare` tab** 驅動（不再寫死國家）。`TripInfoSection` 接收 `prepare` prop（rows），`PrepareTab` 把每筆 render 成**玻璃連結卡**（`glass-card` + 深色標題 + `text-muted` 副標 + jp-green `ExternalLink` icon，與全站卡片同語言；不再是大面積實心綠塊）；無資料則顯示「尚無行前準備項目」空狀態。Visit Japan Web、簽證申請、入境/海關表單、eSIM 等都是其中一筆資料列。

> `destination_country`：行前準備 tab 已不再用它 gate；但驅動 Sidebar 底部即時匯率 widget（`ExchangeRate` → `resolveCurrency`，見 `src/lib/currency.js` / `src/hooks/useExchangeRate.js`）。

### Trip Extras 機制（求婚彩蛋）

`TripPage.jsx` 用 `useEffect`（keyed on `slug`，含 `cancelled` guard）嘗試 dynamic import：

```js
useEffect(() => {
  if (!slug) { setExtras(null); return }
  let cancelled = false
  import(`../trips/${slug}/extras.jsx`)
    .then(m => { if (!cancelled) setExtras(m.default) })
    .catch(() => { if (!cancelled) setExtras(null) })
  return () => { cancelled = true }
}, [slug])
```

找不到時 `setExtras(null)`，不影響通用流程。`2026-03-tokyo-hokkaido/extras.jsx` 匯出：
- `easterEggDay`：觸發彩蛋的天數（Day 4）
- `HeartIcon`：愛心 icon 組件
- `ProposalModal`：求婚彩蛋 modal

彩蛋觸發邏輯抽成 `hooks/useEasterEgg.js`：在已選取的 `easterEggDay` 上**連續快速點擊 9 次**（每次間隔 < 2s；常數 `REQUIRED_CLICKS`/`CLICK_GAP_MS`）觸發。

---

## 資料流 / 快取策略

### Two-tier cache

`useSheetData` 採兩層快取：

1. **Module-level `Map`**（`promiseCache`）：同一 session（JS context）重複請求秒回，**無被動/定時的自動 revalidate**（見下方「回前景自動刷新」：resume 事件會主動清這層，非被動 revalidate）。
2. **localStorage SWR (`lib/swrCache.js`)**：
   - 命中時立即回傳 cached data 給 UI（瞬開）
   - 拿到新資料再覆蓋並寫回 cache
   - Key prefix 帶 `VERSION`（目前 `v1`），未來資料 schema 變更時 bump 即可作廢舊快取

### 回前景自動刷新（resume revalidate）— 解 iOS PWA warm resume 卡舊資料/舊版

iOS「加入桌面」的 PWA 背景恢復是 **warm resume**：不重載頁面、JS context 還活著，所以 `promiseCache` 與「靠 mount 觸發的 fetch」都不會重跑 → 不整個關掉就一直看到舊資料 / 舊版本。

對策（`hooks/useRevalidateOnVisible.js`：背景 >10s 後回前景才觸發，避免短暫切換猛打網路）：
- **資料**：`useSheetData` / `useTrips` 掛 `useRevalidateOnVisible` → 回前景時**背景靜默重抓 + bump refetchTick，不重載整頁**。`useSheetData` 額外呼叫 `revalidateSheet`（只清 in-memory `promiseCache`，保留 localStorage）；`useTrips` 沒有 promiseCache 這層，單純 bump tick 讓 `useEffect` 重新 fetch（localStorage 快取一樣保留、成功後才覆蓋）。localStorage（冷啟動瞬開、離線 fallback）與 SW 的圖片/字型 CacheFirst **完全不受影響**。
  - 注意區分：`invalidateSheet`（pull-to-refresh 用，**連 localStorage 一起清**）vs `revalidateSheet`（resume 用，**只清 in-memory**，僅 `useSheetData` 會呼叫）。
- **App 版本**：`main.jsx` 的 `onRegisteredSW` 除了 30 分鐘 interval，另加 `visibilitychange→visible` 時 `registration.update()`；有新版照 `registerType:'autoUpdate'` + `onNeedRefresh→updateSW(true)` **靜默自動重載**。
- **SW 網路層（兩層 JS 快取之下還有第三層）**：`sw.js` 對同一批 gviz CSV 請求（`docs.google.com/.../gviz/tq`）也做 `NetworkFirst`（5s timeout、1 天 maxAge、50 筆上限）。`invalidateSheet`/`revalidateSheet` **都不會清這層**，弱網時 pull-to-refresh 仍可能吐出 SW 快取的舊 response。

### 行程列表排序

首頁行程排序**不是**單純反轉 Index Sheet 順序：`useTrips` 仍對原始 rows `.reverse()`，但實際顯示順序由 `groupTrips`（`lib/tripDate.js`）決定 — **Now & Next**：進行中最前，其餘按出發日期近到遠；**Past**：按年分組（新到舊），組內按結束日期新到舊。

### PWA 啟動自動跳轉（HomePage）

PWA 從根目錄 `/` 啟動時，HomePage 會自動跳轉到「最相關」的行程，避免每次都看到列表：

1. 優先：`localStorage.lastTripSlug`（最後造訪的行程，仍存在於清單中時）
2. 次選：`pickActiveTrip(trips)` — 今日落在某 trip 區間 → 該 trip；否則挑最近即將出發的 trip
3. 都不符合 → 停在首頁

帶 `?home=1` query 的進入點（從 trip page 主動「回行程列表」）會跳過自動跳轉，避免循環。

---

## Google Sheets 資料結構

### Index Sheet

| 欄位 | 說明 | 範例 |
|---|---|---|
| `slug` | 行程唯一識別碼（用於 URL，格式 `yyyy-mm-destination`；Google Sheet 檔名須與 slug 完全一致） | `2026-01-fukuoka` |
| `name` | 行程顯示名稱（中文） | `福岡` |
| `name_en` | 英文副標題（選填，用於 header 與 sidebar；**不論填寫或自動推算，一律強制轉大寫並補 `' TRIP'` 後綴**） | `Fukuoka` |
| `destination_country` | 目的地國家代碼（選填；行前準備 tab 不再用它 gate，但驅動 Sidebar 匯率 widget，見上方「行前準備」小節） | `JP` |
| `dates` | 旅行日期範圍 | `2026/01/10 - 01/14` |
| `cover_image_url` | 封面圖片 URL | `https://...` |
| `sheet_id` | 該行程 Google Sheet 的 ID | `1BxiMVs...` |
| `status` | `published` 或 `draft` | `published` |

`name_en` 無論手動填寫或留空，都會經 `getTripNameEn` 強制轉大寫並補 `' TRIP'` 後綴（已是該後綴結尾則不重複加）：填 `Fukuoka` 實際顯示為 `FUKUOKA TRIP`；留空則自動從 `slug` 推算（去掉開頭的 `yyyy-mm-` 後轉大寫），例：`2026-03-tokyo-hokkaido` → `TOKYO HOKKAIDO TRIP`。

### 每趟行程 Sheet（8 個 tab）

> **新 sheet 的 tab 標準順序**（建立新行程 sheet 時一律照這個順序建 tab）：`days → flights → prepare → accommodation → checklist → itinerary → shopping → food`。Tab 順序**不影響程式**（app 一律以 tab **名稱**（gviz `sheet=<tab>`）抓資料），純粹是 Google Sheets UI 的編排慣例。

**`prepare` tab**（行前準備，資料驅動）

| `label` | `description` | `url` |
|---|---|---|

- `label`：項目標題（如 `Visit Japan Web`、`泰國簽證申請`、`韓國 K-ETA`）
- `description`：副標/說明（選填）
- `url`：連結（選填；有值才顯示外連 icon 並可點開）

**`days` tab**

| `date` | `title` | `subtitle` | `banner_url` |
|---|---|---|---|

**`flights` tab**

| `date` | `route` | `time` | `flight_no` | `carry_on` | `checked_bag` |
|---|---|---|---|---|---|

**`accommodation` tab**

| `date` | `name` | `address` | `check_in` | `check_out` | `link` | `region` | `type` | `note` | `lat` | `lng` |
|---|---|---|---|---|---|---|---|---|---|---|

`type` 可選值：`hotel`、`airbnb`
`lat` / `lng`：選填經緯度，給地圖用（歸「住宿」分類）。有值才上圖。
`date`：check-in 日期，顯示於卡片頂部 eyebrow 列（`STAY · <date>`，與型別標籤同行的髮絲文字），非獨立 badge，款式與 flight 卡片的滿版色帶不同。

**`checklist` tab**

| `category` | `item` |
|---|---|

每個 category 會自動帶完成度進度條與 `done / total` 計數，勾選狀態存於 `localStorage`（key：`trip-checklist:v1:<slug>`）。

**`itinerary` tab**

| `date` | `time` | `name` | `type` | `address` | `link` | `description` | `note` | `hours` | `parent` | `image` | `lat` | `lng` |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

`type` 可選值：`attraction`（預設）、`hotel`、`food`、`shopping`、`transport`（label / icon / 顏色見 `src/lib/categories.js`）

欄位說明：
- `date`：用於將 rows 分組到日。可填短格式 `M/D`（如 `6/4`）或完整 `YYYY/MM/DD`；短格式會用 index sheet 的 `dates` start 補年（跨年 trip 自動處理）。Day 序號由 `(date - tripStart)` 反推，不再需要獨立 `day` 欄。
- `description`：**卡片外**可直接看到的簡短介紹（line-clamp 三行）
- `note`：**點開卡片後**才顯示的詳細說明，支援 `\n` 換行
- `hours`：營業時間，顯示於卡片底部小 badge
- `address`：Google Maps 導航查詢字串（`link` 有值時優先用 `link`）
- `parent`：**子項目專用**，填入父卡片的 `name`（字串完全比對）。有值的 row 不出現在主時間軸，改顯示在父卡片 modal 的「街道亮點」區。排序：`food → attraction → shopping`；父卡片底部自動出現「N 個亮點」badge
- `image`：選填縮圖（完整 URL，貼 Cloudinary 圖床連結；`/trips/<slug>/...` 舊慣例已移除，填了會 404，見下方「靜態資源路徑」）。**資料驅動、與 type 無關**：有值才顯示。卡片右側 64×64 圓角縮圖；點開 modal 時頂部顯示為 hero 圖。`lazy` 載入。
- `lat` / `lng`：選填經緯度（從 Google Maps 複製貼上，兩欄分開）。給「地圖」功能（見下方）戳點用，有值才上圖。詳見 **地圖（TripMap）** 一節。

**`shopping` tab**

| `area` | `building` | `name` | `floor` | `hours` | `link` | `description` | `lat` | `lng` |
|---|---|---|---|---|---|---|---|---|

> 欄位以 **header 名稱** 對應（`parseCSV` 產生物件），實際 sheet 內欄位順序可不同；新增欄位只要 header 名對得上即可。

- `building` 空白：獨棟店，單獨顯示一個 block
- `building` 有值：合併顯示在同名建築的 block（第一筆為建築標頭，其 `hours`/`link`/`description` 代表整棟）
- **building-meta 列**：某筆 `name === building` 且 `floor` 空白時，視為「描述整棟」的 meta 列，只餵建築標頭（description/hours/link），**不再重複列為子店**（避免標頭與子店名稱重複）。但 `name === building` 卻**有樓層**（如整棟店橫跨 `B2～8F`）的列仍當子店，好讓樓層範圍照常顯示。判斷在 `groupItems`
- `description`：店家備註（選填，有值才顯示），顯示於店名與 `hours` 之間的淡色副文（`text-secondary`）。standalone 卡、building 標頭、building 子店列三處皆支援。把原本硬塞在 `name` 後面的括號補充（如「伴手禮一站・芒果乾/otap」）改填這欄，店名可回到單行
- `lat` / `lng`：選填經緯度，給地圖用（歸「購物」分類）。**建議只在建築的第一筆列填（一棟一個點）**；同棟其他列留白即可。地圖端由 `shoppingToMapPoints` 做**一棟一點聚合**（popup 標題 = building、內文列同棟店家名單），且有防呆：座標填在非第一筆、同棟多筆重複填座標、不同列同座標（5 位小數）都會收斂成一點，不會出現重複 marker

**`food` tab**

| `area` | `category` | `name` | `hours` | `description` | `link` | `image` | `lat` | `lng` |
|---|---|---|---|---|---|---|---|---|

- `area`：浮動 tab 分區（空白則不顯示 area tabs）
- `category`：分組標題（空白則不分組）
- `description`：店家描述（程式碼同時支援 `note` 欄位名稱）
- `image`：選填縮圖（完整 URL，貼 Cloudinary 圖床連結），有值才顯示在卡片左側 64×64 圓角；`lazy` 載入
- `lat` / `lng`：選填經緯度，給地圖用（歸「美食」分類）。有值才上圖
- 若 `food` tab 無資料，fallback 為 `itinerary` 中 `type === 'food'` 的行程（由 `useFoodItems` 處理）。**注意**：地圖的美食點來自 **raw `food` tab**（非 `useFoodItems`），避免與 itinerary 的 food 重複計算

> **描述欄統一為 `description`（不縮寫，與全表其他欄一致）**：itinerary 本來就是 `description`，food / shopping / prepare 由舊的 `desc` 改名統一。所有讀取處（FoodSection / ShoppingSection / TripInfoSection / `maps.js` listToMapPoints）一律**只認 `description`**（無 `desc` fallback，sheet 已全部改名）。ShoppingSection 內部欄位也用 `.description`。

### 寫入 sheet 的型別政策（MUST 遵守）⚠️

App 透過 **gviz CSV 端點**讀 sheet；gviz 對每欄推定**單一**型別，型別不符的 cell 會被輸出成**空字串**（症狀：Sheet 裡看得到、網頁卻不顯示）。鐵則：
- **整欄同型別**：`itinerary.time` 整欄文字（混了時鐘與 `晚上` 類標籤）；`date` 整欄 DATE；`accommodation.check_in`/`check_out` 整欄 TIME；`lat`/`lng` 數字
- 任何 cell 第一個字元不可是 `'`（forced-text = 型別沒設對）
- 寫入一律 `valueInputOption: USER_ENTERED`（**不要 `RAW`**）
- **寫後必驗** gviz CSV；新建 sheet 必須先開「知道連結的任何人可檢視」

完整型別表、numberFormat 設定步驟、驗證/偵錯指令、插列方法：**見 `docs/sheet-data-entry.md`**——動手寫 sheet 前先讀完它。

---

## 地圖（TripMap）

行程頁的地圖功能，`src/components/trip/TripMap.jsx`，包在 **tall 版 `BottomSheet`** 裡，用 **react-leaflet v5 + leaflet**，以 `React.lazy` 切出 chunk。**tall 高度 = `calc(100dvh - env(safe-area-inset-top) - 5rem)`**：頂緣切齊頁面 header icon（漢堡 / 地圖鈕）下緣（safe-top + pt-8 32px + 鈕高 48px = 5rem），不再用 92vh 頂到接近滿屏。noScroll sheet 內容一律滿版鋪到頂（見 BottomSheet props）→ 地圖直達 sheet 圓角頂、把手 pill 浮在圖磚上，TripMap 的懸浮控制列因此用 `pt-8` 讓出 pill 空間、與右上關閉鈕（`top-8`）同列對齊。

**底圖切換（`Layers` 鈕，懸浮在 SegmentedControl 同列左側、鏡像右側 sheet 關閉鈕；`basemap` state，免 key）**：
- `simple`（預設）= **CARTO Positron**（`light_all`）：和紙簡約調性，但**幾乎不顯示車站/POI**。
- `transit` = **OSM 標準圖**（`tile.openstreetmap.org`）：原生顯示車站 icon、站名、地鐵/鐵道路線（日本 OSM 資料完整，規劃交通用）。
- 用 keyed `<TileLayer>` 條件切換；切換不影響其他狀態。OSM 圖 `maxZoom=19`、Positron `maxZoom=20`。

**圖磚快取（省漫遊流量）**：`sw.js` 對兩個 tile host（`*.basemaps.cartocdn.com` / `*.tile.openstreetmap.org`）做 `CacheFirst`（cache name `map-tiles`，30 天、上限 1500 張、`purgeOnQuotaError`）→ 同區域第二次起零流量，弱網/離線顯示舊圖磚。兩個 `TileLayer` 都帶 `crossOrigin="anonymous"`（兩家 CDN 皆回 `Access-Control-Allow-Origin: *`），讓快取存的是 CORS response 而非 opaque response（opaque 在配額計算會被灌水）。首次瀏覽新區域的流量是固有成本，省不掉。

### 單一入口、modal 內兩種模式（同一個 `TripMap` 元件）

- **入口**：行程頁 header **右上角**的地圖 icon（與左上漢堡對稱）；`mapPoints` 為空時不顯示。DayBanner **沒有**地圖按鈕。
- 打開後**預設探索模式**，頂部一顆 `SegmentedControl`（探索 / 路線）切換：
  - **探索**：全部點、跨日、可分類篩選（chip 列）、定位找最近。
  - **路線**：頂部 chip 列換成 **`DayNav`（複用行程頁那顆，`bare` + `compact` 變體 + `frosted-glass-panel` 圓膠囊、w-fit 置中）**，預設選中**開啟當下背景頁那天**（`activeDay`），可在 modal 內換天瀏覽各日動線（換天只改地圖，不動背景頁）。`compact` = 單行「五 05」緊湊版（高 ~44px）：行程頁的兩層式（週幾＋大數字）直向 ~90px 在地圖上太擋；文字語言見下方「DayNav 紅字語意」（**不用品牌綠膠囊**，user 指定）。
  - **header 懸浮在地圖上**（地圖滿版、控制各自是玻璃膠囊浮在圖上，z-[650]）：勿改回「header 區塊 + 地圖」上下堆疊 —— 全寬控制列色帶與地圖相接會有色塊斷層（踩過）。`zoomControl` 關閉（左上 zoom 鈕會被懸浮 Layers 鈕蓋住）。`DayNav` 的 `bare` prop = 無 glass 色帶/非 sticky，給「自己有玻璃容器」的場景。

`TripMap` 接 `points` / `days` / `activeDay` 三個 prop；`mode` 與 `routeDay` 都是元件內部 state（每次開啟重置為探索 + 背景當天）。

### 點的來源與分類（bucket）

地圖點來自**四個 tab**（皆需填 `lat`/`lng`，有座標才上圖）：

- **`itinerary` tab**：有日期 → 依 `type` 歸 `food`/`attraction`/`shopping`；**空 `date` → `backup`（備選，不分 type）**；**有日期的 `transport`/`hotel` → `routeOnly` 點：只進「路線」模式（讓整天動線含機場/港口/飯店 check-in），不進「探索」**（交通非探索點；住宿的探索點改由 accommodation tab 提供，避免重複）。著色用各自 type ink（transport 藍鼠 / hotel 藤鼠）。判斷在 `toMapPoints`（`pointBucket` 維持對 transport/hotel 回 null 不變，routeOnly 在 `toMapPoints` 內另判）。
- **`food` tab**：全部歸 `food` bucket（`day=null`，只進探索）。
- **`shopping` tab**：全部歸 `shopping` bucket（`day=null`，只進探索）。**經 `shoppingToMapPoints` 聚合：一棟建築一個點**——依 `building` 分組（無 building 的獨立店單點），popup 標題用 building、內文「店家」區列同棟所有店名（含樓層）；building-meta 列（`name === building` 且無 floor）只餵標頭 hours/link/description、不入名單（同 ShoppingSection.groupItems）。防呆：座標不在第一筆 → 群組內任一筆有座標即可上圖；同棟多筆重複填座標 → 仍一點；任兩點同座標（5dp）→ 合併、名單聯集。
- **`accommodation` tab**：全部歸 `hotel` bucket（`day=null`，只進探索）。是住宿的唯一地圖來源。

探索模式 5 顆篩選 chip（置中、毛玻璃 `.frosted-glass-button` 樣式，分類色在文字＋邊框）：**美食 / 購物 / 景點 / 住宿 / 備選**（順序即 `BUCKETS` 常數）。每個點屬於剛好一個 bucket。

### 座標查法（lat/lng 怎麼填才準 — 給未來的 Claude）

幫使用者填 `lat`/`lng` 時，**務必照下面的優先序取「圖釘真實座標」，不要憑記憶猜、也不要用地圖鏡頭中心**：

1. **該列有 Google Maps 地點連結（`link`）** → 解析重導後網址裡的 **`!3d<lat>!4d<lng>`**（這才是圖釘位置）。
   ```bash
   final=$(curl -sL -A "Mozilla/5.0" -o /tmp/m.html -w '%{url_effective}' "$URL")
   echo "$final" | grep -oE '!3d-?[0-9.]+!4d-?[0-9.]+' | head -1   # 抓不到再 grep /tmp/m.html
   ```
   ⚠️ **絕對不要用網址裡的 `@lat,lng`** —— 那是「地圖鏡頭中心」，常與圖釘差數百公尺到數公里（踩過：Moonlit 差 2.4km、Halomango 鏡頭跑到外省）。
   ⚠️ 若連結重導到 `…/maps/search/…`（搜尋連結，非釘選地點）就**沒有** `!3d!4d` → 改走第 2 步，或請使用者重發一個「地點」連結（Google Maps 點該圖釘 → 分享 → 複製連結）。

2. **沒連結，或連結是搜尋連結** → 用 **OpenStreetMap Nominatim**（免費、回傳真實地點座標）：
   ```bash
   curl -s -A "your-app/1.0 (contact)" \
     "https://nominatim.openstreetmap.org/search?format=json&limit=3&q=<名稱+區域>"
   ```
   守則：帶 User-Agent、≤1 req/sec；**核對回傳的 `display_name` 確實是該店/地標**、且座標落在該趟行程的合理範圍（如本宿霧 trip：Cebu 市區約 `10.3x,123.9x`、Panglao 約 `9.55,123.77`、Oslob 約 `9.46,123.38`），再寫入。對不上就留白，別硬填。

3. **寫入後一定做區域 sanity check**：把所有點掃一遍，任何落在行程範圍外的就是查錯了。

4. **本來就沒有固定地點的列留白**（如 `Dinner On Own`、「晚餐待定」、海上的「追海豚」）；有座標才上圖，留白不影響其他點。

> Google Sheet 寫入用 `gws sheets spreadsheets values update`（`lat`/`lng` 兩欄分開）；寫前先 `--dry-run`、寫後讀回抽驗。

### 去重（`mergeMapPoints`）

itinerary 點**全留**（保留 `day`，能進路線）；清單（food/shopping/accommodation）點若與既有點**同 bucket 同座標（5 位小數）**則去重 — 涵蓋 list-vs-itinerary 與 list-vs-list 重複。itinerary 點彼此**不**去重（同旅館的早餐/午餐各算一個停留）。組裝在 `TripPage`：`mergeMapPoints(toMapPoints(normalizedItinerary), [...listToMapPoints(food,'food'), ...shoppingToMapPoints(shopping), ...listToMapPoints(accommodation,'hotel')])`（shopping 先經建築聚合，再進 mergeMapPoints 與 itinerary 去重）。

> **`routeOnly` 點不當去重種子**：`mergeMapPoints` 的 `seen` 只用「非 routeOnly 的 itinerary 點」建立。否則 itinerary 的住宿 routeOnly 點會把 accommodation tab 同址住宿點去掉，害探索模式看不到住宿。兩者並存：路線模式顯示 itinerary 那顆（有 day），探索模式顯示 accommodation 那顆（day=null）。

### 路線模式

只取**選中那天有座標的點**（含 routeOnly 的交通/住宿）按 `time` 排序，畫編號 marker + 品牌綠虛線（綠=動線語意，非分類色）。清單（food/shopping/accommodation）點 `day=null` 自然不進路線。要看哪天由 modal 內的 `DayNav` 選（預設 `activeDay`）。

> **路線 = 「那天怎麼移動」，跨國/跨海長線是 OK 的**（產品定義）。抵達/離境日的跨國交通列（機場接送、出發國機場）**照填座標**，路線會 fit 到跨國範圍、拉一條跨海線呈現整天移動 —— 這是刻意的，**不要**為了避免長線而把那些列留空。

**逐站 stepper（前進/後退）**：路線模式底部置中一顆玻璃膠囊 `‹  3/7  ›`。
- state `focusIdx`（`null` = 總覽）。換天(DayNav)/切模式 → 自動重置回總覽（`useEffect` on `[routeDay, mode]`）。
- **›** 前進：總覽 → 第 1 點；之後 +1，clamp 在最後一點。**‹** 後退：總覽 → **最後一點**；之後 -1，clamp 在第 1 點。索引邏輯抽成純函式 `nextFocusIndex(current, dir, total)`（`lib/maps.js`，有測試）。
- 中間 `n/total` 點一下 → 回總覽。
- 相機：總覽 `fitBounds` 全部點；聚焦 `flyTo(zoom 16)` + 開該點 popup（route marker 需存 `markerRefs`）。`FitBounds` 元件只在**探索模式**掛載，路線相機完全由 stepper 的 `useEffect` 控（總覽 fit / 聚焦 flyTo），避免兩者打架。
- ⚠️ **膠囊容器用 `.frosted-glass-panel`（靜態毛玻璃），不要套 `.frosted-glass-button`**：後者的 `:active` 是 lift（`scale(1.1)` + 變透）配 `--ease-spring`（overshoot），套在「裝多顆按鈕的容器」上會讓整顆膠囊一按就彈來彈去、裡面 ‹ › 難點。`.frosted-glass-panel` 材質同 frosted-glass-button 靜止態但**無** `:active` 彈簧。press 彈簧只屬於**單一**可點元件；內層 ‹ › 套 `.press-lift`（無玻璃材質的純 lift 彈簧：press-in 0.22s 快彈、放開 0.4s Q 彈落回）。膠囊另有**方向性 squish**（`.stepper-squish` + `dir-left/right` + `pressed`）：按 ‹ 往左鼓、按 › 往右鼓（scaleX 1.07 / scaleY 0.93，origin 錨對側）—— 與被禁止的「整顆均勻 scale 彈跳」不同，小幅度方向性形變不影響按壓；`dir-*` 在放開後保留（origin 不跳，回彈從同錨點收回）。⚠️ squish 的 scale 與置中的 `-translate-x-1/2` 都是 transform，**必須分兩層**（外層定位、內層形變），疊同層會互相覆蓋。
- 相機動畫：`flyTo`/`fitBounds` 都帶 `{ duration: 0.6 / 0.5 }` 上限（預設弧線在遠點會飛很久）；聚焦的 popup 用 `map.once('moveend', …)` 在移動結束才開（不會飛到一半就跳出）。

### 顏色 / marker

- marker 顏色取自 `categories.js`：food/attraction/shopping 用各自 ink；**備選用 `BACKUP_INK`（中性墨灰 `#6B6B66`，非品牌綠、非分類色）+ 空心環**。
- popup（`popupNode`）結構：eyebrow（分類）→ 標題 → **`hours` 小列（Clock icon，有填才顯示；來源 = itinerary/food 的 `hours` 欄、購物為建築標頭列的 `hours`）** → 髮絲線「關於」desc → **（購物聚合點）髮絲線「店家」名單（樓層 muted 前綴 + 店名）** → Maps CTA。
- Google Maps 導航連結：優先用該點 `link`（地點頁）；無 `link` 才退用 `name+address` 搜尋字串（**不用裸經緯度**）。`buildMapsUrl` 在 `lib/maps.js`，開連結走 `openExternal`（PWA 相容）。
- 「離你最近」（`NearbyStrip`）：`navigator.geolocation` + `haversineMeters` 排序。**定位鈕只負責相機**（flyTo 我的位置 + 紅點），最近清單改成**底部一排可橫滑的小卡**（無把手、不蓋半屏、不像第二層 modal；locating/error 顯示置中小膠囊）。底部有卡片/膠囊時定位鈕自動抬高（`bottom-6`→`bottom-[112px]`）避免被蓋。點卡片 `flyTo`+開 popup。**勿**再把它做成會滑上來的 BottomSheet（會與外層地圖 modal 衝突）。

### 已知限制 / 雷

- Leaflet 在「開啟時才長出來」「切模式高度改變」的容器需 `map.invalidateSize()`（`InvalidateOnMount` / `InvalidateOnModeChange` 處理），否則圖磚渲染成灰塊/灰條。
- 純函式（`parseLatLng`/`pointBucket`/`toMapPoints`/`listToMapPoints`/`shoppingToMapPoints`/`mergeMapPoints`/`haversineMeters`/`sortByDistance`/`routePoints`/`nextFocusIndex`/`formatDistance`/`buildMapsUrl`）集中在 `lib/maps.js` 並有測試；Leaflet 元件本身以手動驗收為主。

---

## UI / Design System

- **底色**：`#FBFAF5`（米白）＋ feTurbulence 和紙噪點，兩者都直接在 **body 自己的 background** 上（噪點隨頁捲動，均勻噪點察覺不到）。
  - **iOS 26 PWA 狀態列結論（勿再追）**：狀態列 letterbox 強制跟隨系統外觀，頁面端**無法控制**；方案已窮舉否決，實測過程見 `docs/decisions.md` 的 status-bar 條。head 維持最簡形狀：單一 `theme-color`，**勿加 `apple-mobile-web-app-*` meta**；長期解是深色模式（token 地基已鋪）。
  - 滿版頁面 wrapper 仍一律鋪 `.bg-washi`（米白 + 噪點）：這是紙感紋理的載體（噪點不再用 fixed 偽元素層）。
  - **分類色「内側淡彩」（玻璃透明感的色彩來源）**：行程卡玻璃內帶一抹從脊線往右暈開的分類 `wash` 色淡彩（`ItinerarySection`，卡內 `absolute inset-0` linear-gradient 0.2→透明；內容層與縮圖需 `relative` 疊在淡彩上），像有色玻璃。營業時間 badge 底色刻意極淡（`white/15`），不透明白底會在淡彩上蓋出白斑。
  - **歷史教訓（勿走回頭路）**：四角色斑背景、包卡 radial 光暈、下緣色影（C 變體）三案皆已否決，**定案內側淡彩（D）**；否決原因與 git 位置見 `docs/decisions.md` 的 background-glow 條。
  - **光暈色票鐵則**：光暈用 `categories.js` 各分類的 `wash`（高明度水彩版 `'R, G, B'`），**勿直接用 ink** —— ink 是文字色（明度低），拉濃會讀成髒灰陰影；濃度感用彩度與 alpha 撐，不能用暗度撐。
- **Accent**：`#5E8C61`（明るい抹茶）
- **文字色**：主要 `#2C2C2C`（`text-jp-text`）；次要/註記用**語意 token**：`text-secondary`（次要正文，= 原 stone-600）、`text-muted`（小標/註記，= 原 stone-500）。這兩個 + `bg-hairline`/`border-hairline`（1px 分隔線，= 原 stone-200）都在 `tailwind.config.js` 定義成 `var(--text-secondary / --text-muted / --hairline)`，變數在 `index.css :root`。**新次要文字一律用 `text-secondary`/`text-muted`，勿再散用 `text-stone-500/600` 或已退役的 `jp-sub`**。這層是深色模式地基：未來只要在 `:root`（或 `.dark`）覆蓋這幾個變數即可一次翻，元件不用動。`text-stone-400`（更淡的 icon/placeholder）、`text-stone-700`（status pill）屬不同層級，未納入。
- **字型**：全站 `"Noto Serif JP"`（font-serif），所有文字元素應帶 `font-serif`
- **字級**：micro eyebrow / 大寫 caps 標籤用 `text-2xs`（tailwind token，0.625rem），勿再用 `text-[10px]/[11px]` arbitrary value
- **Frosted glass（毛玻璃）**：本站玻璃材質是 frosted glass / glassmorphism（`backdrop-filter: blur/saturate/contrast` + 高光邊框），**非** iOS 26 那種有邊緣折射扭曲的 Liquid Glass，這是**刻意取捨**而非無法做到。

  - **真折射不追（研究已做完，勿重查）**：Safari 相容的「refract-a-copy」路線存在，但只適合「單一玻璃面 × 固定靜態背景」的 one-off（如 DayBanner hero、求婚彩蛋），且動手前須在目標 iPhone PWA 實機測 FPS/發熱；本站玻璃浮在會捲動的異質內容上，成本與 jank 不值。完整研究（Outpace filter chain、瀏覽器支援矩陣）見 `docs/decisions.md` 的 glass-refraction 條。
  - 全站維持 frosted，**改追 iOS26 的互動語言**（press lift、拖拉跟手、彈簧吸附，見下方 press 微彈）。玻璃 `backdrop-filter` 組合集中在 `index.css` 的 `:root` token，**勿再散寫 blur/saturate/contrast 數值**。語意 token：`--glass-nav`（DayNav）、`--glass-card`（行程卡）、`--glass-overlay`（BottomSheet + Sidebar）、`--glass-button` / `--glass-button-lifted`（小鈕 press 抬起時更強 frosted）、`--glass-tab` / `--glass-tab-active` / `--glass-tab-lifted`（press 放大時更強 frosted）。`.glass-card` **不畫白色外框/高光線**（`border: none`、無 inset 白高光、底色 `rgba(255,255,255,0.5)`），只靠下方柔和投影 `0 6px 18px rgba(0,0,0,0.08)` 做分離。原因：在彩色模糊背景（BottomSheet 透出 banner）上，白框/白高光會描出搶眼白邊。若日後覺得玻璃感不夠可加極淡高光，但勿回到舊的 0.6 border / 0.8 inset 白框。
- CSS utility classes：`frosted-tab-track`、`frosted-tab-btn`、`frosted-tab-pill`、`frosted-glass-button`、`press-springy`、`.safe-area-inset`、`.safe-area-bottom`、`.scrollbar-hide`、`.glass-card`、`.glass-bottom-sheet`、`.glass-sidebar`
- **Q 彈動效**：iOS26 風格彈簧 token：`--ease-spring`（彈較多，小元件用，Tailwind `ease-spring`）、`--ease-spring-soft`（彈較少，大行程面板用，`ease-spring-soft`）。
  - **press 微彈（iOS26 lift 語言）**：可點離散元件（卡片 / 選單項 / CTA / icon 按鈕）套 `.press-springy`（按下**浮起** `scale(1.03)`、放開 Q 彈落回）或共用的 `.frosted-glass-button`（按下浮起 `scale(1.1)` + body 變近乎全透 + backdrop 切 `--glass-button-lifted` + 邊緣高光變亮 + 投影加深；press-in 0.22s 快彈、放開回 base 0.4s 彈簧）。可點玻璃卡（`glass-card press-springy` 並用）另有卡片版 lift：變更透 + 投影加深，**不切 backdrop**（大面積重繪會 jank）也**不加白框**。方向統一是「浮起」不是「壓扁」（舊的 squish scale(0.9/0.95) 已全面退役）。
  - **面板開啟彈跳**：BottomSheet / Sidebar / ItinerarySection 詳情 sheet 開啟用 `ease-spring-soft`（overshoot），**關閉維持 `ease-out`**（關閉不彈）。overshoot / 反向拉會把面板頂出停駐邊露縫；**解法是「單層延伸玻璃」**：面板拆成 `frame（relative）> 單一 .glass-bottom-sheet/.glass-sidebar frost 層（absolute inset-0，往停駐邊用 `-bottom-56`/`-left-40` 延伸超過畫面）> 內容層（relative，不帶 backdrop，疊在 frost 上）`。因為是**同一塊** backdrop-filter，構造上無接縫（勿再用兩塊相鄰 backdrop 貼縫，必有色差縫）。內容層需 `overflow-hidden rounded-t-[2rem]` 把內容裁到圓角；frost 的 box-shadow 用 `[aria-hidden="false"] .glass-*`（後代選擇器，frost 已非直接子層）。
  - **反向拖拉拉伸**：拖拉關閉手勢往反方向拉時，用 `lib/gesture.js` 的 `resist()`（阻尼、上限 24px）做 rubber-band 拉伸，放開由開啟彈簧彈回；只從拖拉把手（pill/header）觸發，內容區反向拉是捲動。close 判定加了方向 guard（反向快速甩不關）。
  - **勿無差別灑**：進度條、fade、骨架、列表整列不套。`prefers-reduced-motion` 由全域 reset 自動降為瞬時（縫也不會出現）。
- **按下滑出取消（`useCancelableTap`）**：選中類可點元件（TripCard、ItinerarySection 卡片、Sidebar 選單項）用 `hooks/useCancelableTap.js`：按下 setPointerCapture，放開時 `isPointInRect` 判定放開點是否仍在元件內，滑出去放開＝取消，避免長按/誤觸。呼叫一次回傳 `{ onPointerDown, onPointerUp, guard, guardLink }`，`guard(fn)` 包原本 onClick，可服務 `.map()` 清單（同時只按一個）。原生 onClick 保留給鍵盤無障礙。ChecklistSection 已自帶距離式（移動 >10px 不 toggle）取消，不重複套。
  - **`guardLink`**：`TripCard`（首頁行程卡）改用 react-router `<Link>`（原生右鍵/開新分頁語意，取代舊的 `<button onClick={navigate(...)}>`），取消時對 click event 呼叫 `preventDefault()` 擋掉導航；但 modifier 鍵（cmd/ctrl/shift/alt）或非左鍵點擊一律略過不攔截，保留 cmd-click/中鍵開新分頁的原生行為。
  - 過往卡片 status pill 不再顯示「回顧」，改用 `tripDays()`（`lib/tripDate.js`）算出的行程天數（如「5 天」）；日期格式異常算不出來則不顯示 pill。
- **分段控制器（SegmentedControl）**：所有分段 tab（TripInfoSection / FoodSection / ShoppingSection）統一用 `src/components/ui/SegmentedControl.jsx`，**勿再各自手寫 `frosted-tab-track` markup**。玻璃感由**單一移動膠囊** `.frosted-tab-pill` 呈現（`.frosted-tab-btn.active` 只負責文字色），膠囊 width/transform 由 `useSegmentedDrag` 量測各 segment 實際 rect 設定。支援 pointer 拖拉跟手：按下任一段都可起手（非選中段按下即切換並滑行過去），按著一路滑可跨段、**拖拉中即時 `onChange` 切換畫面內容**，跨段 haptic、放開吸附（6px 門檻、邊緣 rubber-band）。拖拉期間 `isDraggingRef` 讓 value 變化的 reposition 讓位，避免跟手位置被搶。切換時短暫加 `.traveling`（透明玻璃態滑行）、按住/拖拉加 `.lifted`（放大超出邊界 + 更透）、`.dragging` 移除膠囊 `backdrop-filter`（iOS Safari 防 jank 逃生艙）。內容超寬時自動降級為「可橫向捲動 + 點按」

### 分類色彩系統（`src/lib/categories.js`）

行程分類（`itinerary` 的 `type`）的 **label / icon / 顏色** 統一由 `src/lib/categories.js` 提供，**是唯一 source of truth**。新增分類或改色只動這個檔；**勿再散寫 Tailwind pastel（`blue-700` / `pink-500` …）或 raw hex**。

配色為「明るい日本傳統色」（2026-06 由低彩鼠色系全族提彩提亮：低彩色配毛玻璃容易整面灰 —— blur 把背後顏色平均、低彩一平均就趨灰）。每個分類有 `ink`（文字/脊線/icon 色）與 `wash`（背景染色用高明度水彩版，`'R, G, B'` 字串）：

| 分類 | 傳統色 | ink hex | wash (R, G, B) |
|---|---|---|---|
| `transport` 交通 | 縹 | `#5F8FB4` | `150, 185, 215` |
| `food` 美食 | 朱（明るい弁柄） | `#C96B49` | `240, 172, 140` |
| `attraction` 景點 | 若葉 | `#7C9B4E` | `178, 206, 138` |
| `shopping` 購物 | 紅藤 | `#B279A2` | `218, 170, 204` |
| `hotel` 住宿 | 藤紫 | `#7D82BC` | `176, 180, 232` |

- **`jp-green #5E8C61`（明るい抹茶）是全站唯一主 accent**（連結 / active / CTA / 進度條 / focus ring），**不當分類色用**；景點用偏黃的若葉與品牌綠區隔，避免「品牌 or 分類」混淆。
- API：
  - `getCategory(type)`：回 `{ label, en, icon, ink }`（`en` 為大寫英文，給編輯排版 eyebrow 用），未知 type 退回景點。
  - `categoryChipStyle(type)` / `chipStyle(ink)`：**淡玻璃 chip**（文字 ink / 邊框 ink@40% / 底 ink@10%），搭配 className `border backdrop-blur-sm rounded`。用於小標籤。
  - `categorySolidStyle(type)` / `solidStyle(ink)`：**實心**（底 ink / 字白）。目前無引用（航班色帶已改半透明、側欄改純 icon），保留 API 供未來實心場景。
  - `categoryInk(type)`：純 ink 色（給脊線、節點底色等）。
  - `BRAND_INK`：品牌綠（= `jp-green` `#5E8C61`）的 JS 字面值，給 inline style 餵 `chipStyle` / `solidStyle` 用（Tailwind class 不適用時）；勿再散寫 hex。`categoryWash(type)`：分類水彩色 `'R, G, B'`（卡片光暈用）。
- 引用處：`ItinerarySection`（時間軸節點 + 脊線 + eyebrow + modal 編輯排版）、`ShoppingSection`（樓層 `FloorTag` 用淡 chip）、`FoodSection`（店名前弁柄色點）、`TripInfoSection`（航班登機證色帶用 transport 半透明淡色 + 深色字、航線用 transport ink；行前準備玻璃連結卡用 jp-green 外連 icon；住宿 hotel/airbnb 同屬住宿分類，同色靠文字區分）、`TripPage` 的 `MENU_ITEMS`（側欄 icon，**純色 icon 無圓底**）。
- **日期是 metadata 不是分類**，勿套分類色：航班日期在登機證色帶上（transport 深色字）、住宿日期在 eyebrow 的 `STAY · <date>`。
- 側欄 `MENU_ITEMS` 的 icon = **純分類色 icon（無圓底）**，`iconStyle` 為 `{ color: categoryInk(...) }`（與時間軸軌道同語言），Sidebar 以 `style={iconStyle}` 套用。

### 各 section 的設計語言（避免脊線濫用）

**脊線是行程時間軸卡的專屬招牌，其他 section 用不同裝置表達分類色**：

- **航班卡（FlightsTab）= 登機證**：頂部 transport **半透明淡色色帶**（`${categoryInk('transport')}33` ≈ 20% 底 + transport ink 深色字，清透不再大面積實心，色帶固定高 `h-11`=44px），色帶下接**撕票口**（虛線 + 兩側用 CSS `mask`（`FLIGHT_NOTCH_STYLE`，雙 radial-gradient + `mask-composite: intersect` / `-webkit-mask-composite: source-in`）在 y=44 挖真半圓鏤空，透出底層 sheet）；再接玻璃機身區，航線（端點/線/飛機）用 transport ink（`categoryInk` + `currentColor`）。⚠️ mask 會連投影一起裁掉，故外層另包 wrapper 掛 box-shadow；WebKit 下 `mask` 不會裁 `backdrop-filter`，鏤空處會殘留卡片自身的一層淡霜（已知限制）。
- **逛街卡（ShoppingSection）= 索引 tag**：樓層 `FloorTag`（購物色淡 chip）當左錨點，**不再用重複的袋子 icon**；無樓層時 tag 內顯示一顆色點維持對齊。建築卡標頭無 icon，識別色交給下方樓層 tag。
- **美食卡（FoodSection）= 縮圖 + 色點**：店名前一顆弁柄色小圓點當分類標記；有 `image` 時左側縮圖。
- **行程 modal（DetailModal）= 編輯排版**：彩色 eyebrow（`label` + `en`）→ 標題（`text-2xl`，同住宿卡）→ 一行 meta（`時間 · 地點`，**無地址不顯示**，已修掉 placeholder）→ 有 `image` 才放 hero 圖 → 髮絲線 eyebrow 分隔的「關於此處 / 街道亮點」。不再用 bordered pill。
- **住宿卡（HotelTab）= 編輯排版**（同 modal 家族）：eyebrow（子型別 `飯店/Airbnb` + `STAY · <入住日>`，hotel 藤鼠色）→ 大標（飯店名）→ 地址 meta → 髮絲線「入住資訊」+ check-in/out **等寬兩欄 + 置中分隔線** → Maps CTA。不再用 type chip / date badge。
- **DayBanner（每日 banner）**：照片上**不蓋暗色遮罩**（中央 scrim 會讓整張照片發灰）；文字可讀性改靠**多層 text-shadow 暗色光暈**，小字（日期 / 今日行程 / 副標）用更緊更深的 `SMALL_TEXT_SHADOW`、大標用容器較柔的光暈即可。底部保留淡入米白漸層做與下方行程區的接縫。勿再加回中央暗色 scrim。頂部小標題不再寫死「今日行程」：由 `bannerLabel(dateStr, dayNumber, today)`（`lib/tripDate.js`）依這個 banner 對應的日期是否真的是今天動態決定，是今天才顯示「今日行程」，否則顯示「DAY N」。
- **DayNav 紅字語意（今天 vs. 選中）**：`jp-red` 只標記「今天」那一欄（週幾文字 + 選中時的圓點），與是否被選中無關；選中但非今天＝深色粗體（`text-jp-text font-bold`），選中且今天＝紅字粗體。圓點只在選中時出現，顏色今天用 `bg-jp-red`、非今天用深色中性（`bg-jp-text`）。regular / compact 兩變體皆同此語意，與 `ItinerarySection` 的 `NowMarker`（紅＝現在/今日/live）一致。

### 行程時間軸（ItinerarySection）

每筆行程是 **三欄**：`時間 | 軌道節點 | 卡片`。

- **節點化軌道**：每個時間點是**純分類色 type icon（無圓底）**（`categoryInk` 著色、`size 18`，放在 `w-7 h-7` 置中盒維持對齊），下接 `w-[1.5px]` 連接線；刻意輕量（先前的實心圓底 + 4px 脊線份量太重）。
- **卡片細脊線**：卡片 `overflow-hidden` + 絕對定位 **`w-[2px]` 半透**分類色 spine（`categoryInk` + `80` alpha ≈ 50%）；內容左 padding `pl-4`。
- **分類標籤**：卡片內用輕量**彩色 eyebrow**（`text-2xs` 分類色），取代原本的 bordered pill。
- **砍空殼**：底部 meta（地址 + 「N 個亮點」badge）**只在真有值時渲染**，無地址不印 placeholder；移除了原本的 ChevronRight（整卡可點不需要）。「N 個亮點」badge 用品牌綠 chip（`chipStyle(BRAND_INK)`），不再用 amber。
- **時間權重**：時間 `text-sm font-bold tabular-nums` 右對齊指向節點。
- **NowMarker**（今日「現在」紅線）對齊同一套三欄；紅色僅用於「現在/今日/live」語意。插在第一個「時間 > 現在」的 row 前；全部時間都過了就放最後。**比較用 `timeToMinutes` 把 `HH:MM` 解析成分鐘數做數值比較**（不是字串比大小），所以 `3:22`(非零補位) 或 `下午`/`晚上`/空白 這種非標準值不會被誤判：解析不出來的回 `null` → **跳過、不影響定位**。每 60s tick 一次；切到「今天」時先立刻 `setNow` 刷新一次（避免沿用切換前的舊時間，如午夜前 23:56）。**過去的行程不變灰、不 disable**（曾用 `opacity-50` 變灰，造成「看起來不能點」的困擾，已移除）；現在線是唯一的「現在」指示。**不做自動 scrollIntoView 捲到現在線**（曾有，但 TripPage 的三欄輪播會同時掛載 prev/current/next，今天那天切到隔天時，變成 prev 的「今天」panel 重新掛載又觸發捲動 → 整頁亂跳，且當天一載入就被捲走、看不到 DayBanner。已移除，捲動完全交給使用者）。

### Accessibility 原則

- 所有可點擊卡片用 `<button type="button">` 而非 `<div onClick>`，並加 `aria-label`
- Modal 都套 `useModalA11y`：`role="dialog"` + `aria-modal="true"` + `aria-labelledby` + ESC 關閉 + focus trap。例外：求婚彩蛋 `ProposalModal` 因原生複雜手勢/輸入流程，不套 `useModalA11y`，只手動 ESC + `role="dialog"` + `aria-modal` + `aria-label`，刻意不做 focus trap（signed off 2026-07-04）
- 觸控目標 ≥ 44×44（iOS HIG），按鈕統一加 `touch-manipulation`
- 每個 ChecklistSection 項目是 `<li>` 包一個 `<button type="button" role="checkbox" aria-checked={isChecked}>`；role/aria-checked 掛在 button 上，靠原生 button 語意取得 focus 與 Enter/Space，不需額外 tabIndex 或 keydown handler
- **Focus**：`index.css` 只關閉滑鼠 `:focus`，全域保留 `:focus-visible`（jp-green ring，token `--glass-focus-ring`）；勿用 `outline-none` 而不補替代
- **捲動容器**：modal / section 的 `overflow-y-auto` 一律加 `overscroll-contain`，避免捲動鏈結到背後頁面
- **雙指縮放（pinch zoom）維持開放**：`index.html` 的 viewport meta **不設** `maximum-scale`/`user-scalable=no`（2026-07-04 起，先前鎖死違反「使用者可自行放大」的 a11y 基本需求），也沒有攔截 `touchmove`/`gesturestart` 的 JS。雙擊誤觸縮放由互動元件的 `touch-action: manipulation` 抑制，不需額外攔截。
- **Skip link**：`App.jsx` 的 `SkipLink` 是 Router 內第一個可 focus 元素，`sr-only focus:not-sr-only`，目標 `<main id="main" tabIndex={-1}>`（HomePage / TripPage 各自的主內容容器）。HashRouter 下不能用原生 `#fragment` 錨點捲動（hash 已被路由佔用），改為 onClick `preventDefault()` 後手動 `focus()`。

### 觸覺回饋（lib/haptic.js）

| 函式 | 強度 | 用途 |
|---|---|---|
| `tap()` | 8ms | 一般點擊、tab 切換 |
| `bump()` | 15ms | 開啟 modal、切換日期 |
| `success([10,30,10])` | pattern | 完成關鍵操作 |

依平台分流：iOS Safari 不支援 `navigator.vibrate`，改用 Safari 17.4+ `<input type="checkbox" switch>` trick 觸發 Taptic Engine（非 silent fail；`tap()`/`bump()` 在 iOS 上實為同一次單擊）；Android/其他環境 fallback `navigator.vibrate()`，該路徑不支援時才真正 silent fail。

### SEO / 分享

- `index.html` 內含預設 OG meta（fallback）
- `usePageMeta({ title, description, image })` 在 runtime 動態覆蓋；行程頁帶上 `cover_image_url` 作為 `og:image`

### 靜態資源路徑

`public/trips/<slug>/` 慣例已於 2026-05-31 移除，現無此目錄。行程照片全面改用下方 Cloudinary 外部圖床；唯一殘留本地靜態資源是求婚彩蛋的 `public/proposal-photos/`（扁平結構，不分 slug）。`itinerary`/`food` 的 `image` 欄實作上是原樣 `src={row.image}`，貼 Cloudinary 完整 URL 即可，無路徑慣例可言。

### 外部圖片（Cloudinary）

行程照片（`cover_image_url` / `banner_url` / itinerary・food 的 `image` 欄）改放外部圖床、在 sheet 填 URL；目前用 **Cloudinary**（免費額度對此站綽綽有餘，且能自動轉檔縮放，免自己轉 AVIF/WebP）。

**貼進 sheet 的 URL 要帶 transformation 參數**（插在 `/upload/` 之後）：

```
.../upload/f_auto,q_auto,w_800/v123/xxx.jpg
```

- `f_auto`：依瀏覽器自動吐 AVIF / WebP（免自己轉檔）
- `q_auto`：自動最佳壓縮品質
- `w_<寬>`：縮到合理寬度（縮放比換格式更重要）

建議寬度：itinerary・food 的 `image`（縮圖 + modal hero 共用）與 `cover_image_url` 用 `w_800`；`banner_url` 用 `w_1200`。

> 程式端不需配合：app 已對 `<img>` 設 `loading="lazy"` + 固定 `width`/`height`（防 CLS），優化全在「sheet 裡貼什麼 URL」這層。若日後離開 Cloudinary，需自備轉檔（Cloudflare R2 + 先轉好檔、或 Cloudflare Images / Bunny.net Optimizer 等含自動轉檔的服務）。

---

## 部署

GitHub Actions push to master → `npm ci` → **`npm test`（gate，測試沒過不繼續 build）** → Vite build → 部署至 GitHub Pages（`actions/upload-pages-artifact` + `actions/deploy-pages`，非 legacy `gh-pages` 分支）。走 `deploy-pages` 本來就不會跑 Jekyll，不需要 `.nojekyll`（該檔已移除）。

---

## 測試

- Runner：Vitest + jsdom
- 測試檔位於 `src/__tests__/`
- 環境變數測試請用 `vi.stubEnv('VITE_XXX', '...')`；`lib/env.js` 採 getter 延遲讀取，stub 才生效
