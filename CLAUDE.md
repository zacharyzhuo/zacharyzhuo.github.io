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
└── 每趟行程 Sheet     → flights / itinerary / accommodation / shopping / checklist / food / days

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
│   │   ├── Sidebar.jsx              # 抽屜導航（含 MENU_ITEMS 清單）
│   │   └── BottomSheet.jsx          # 共用底部彈出層
│   ├── home/
│   │   └── TripCard.jsx             # 首頁行程卡片（毛玻璃風格）
│   ├── trip/
│   │   ├── DayNav.jsx               # 日期橫向導航列
│   │   ├── DayBanner.jsx            # 每日 banner 圖 + 標題
│   │   ├── ItinerarySection.jsx     # 每日行程（含 DetailModal）
│   │   ├── TripInfoSection.jsx      # 旅程資訊（航班 / 行前準備 / 住宿，三 tab）
│   │   ├── ShoppingSection.jsx      # 購物清單（area tabs + building 分組）
│   │   ├── FoodSection.jsx          # 美食清單（area tabs + category 分組）
│   │   └── ChecklistSection.jsx     # 打包清單（localStorage 持久化 + 進度條）
│   └── ui/
│       ├── SegmentedControl.jsx     # 玻璃膠囊分段控制器（移動膠囊 + 拖拉跟手 + 自適應降級）
│       ├── Skeletons.jsx            # 冷啟動載入骨架（TripSkeleton 全頁 / HomeCardsSkeleton 卡片）
│       ├── EmptyState.jsx           # 共用空狀態（icon + 標題 + hint）
│       ├── ErrorBoundary.jsx        # React error boundary
│       └── ErrorState.jsx           # 共用錯誤畫面（icon + 訊息 + action）
├── pages/
│   ├── HomePage.jsx                 # 行程列表頁（PWA 啟動會嘗試自動跳轉）
│   └── TripPage.jsx                 # 行程詳細頁（通用）
├── hooks/
│   ├── useSheetData.js              # fetch 單一 Sheet tab，記憶體 + SWR 快取
│   ├── useTrips.js                  # fetch index sheet
│   ├── useScrollLock.js             # body scroll lock（reference counting）
│   ├── useModalA11y.js              # modal a11y：ESC 關閉、focus trap、focus restore
│   ├── usePageMeta.js               # 動態 document.title + OG meta
│   ├── useTripDerived.js            # useNormalizedItinerary / useNormalizedDays / useDays / useFoodItems
│   ├── usePullToRefresh.js          # 下拉刷新手勢
│   └── useSegmentedDrag.js          # 分段控制器膠囊量測 + pointer 拖拉跟手 + 降級判斷（含 rubberBand/nearestIndex 純函式）
├── lib/
│   ├── sheets.js                    # CSV 解析工具（parseCSV、sheetURL）
│   ├── env.js                       # 集中讀取 + 驗證 Vite env
│   ├── haptic.js                    # navigator.vibrate 包裝（tap/bump/success）
│   ├── swrCache.js                  # localStorage 版 stale-while-revalidate
│   └── tripDate.js                  # 旅程日期相關純函式
├── trips/
│   └── tokyo-hokkaido-2026-03/
│       └── extras.jsx               # 求婚彩蛋（僅此行程）
└── App.jsx
```

### BottomSheet Props

| prop | 說明 |
|---|---|
| `isOpen` | 控制顯示 |
| `onClose` | 關閉回調（亦會被 ESC、下拉手勢觸發） |
| `title` | 標題文字（同時用於 `aria-labelledby`） |
| `noScroll` | 固定高度 `h-[79vh]`，子元件自行管理捲動，供浮動 tab 使用 |
| `noStickyTitle` | 不顯示固定標題；標題改由子元件在 scroll 區頂端自行渲染（可隨內容捲動） |

a11y：BottomSheet 與 ItinerarySection 的 DetailModal 都套用 `useModalA11y`，自動處理 ESC、focus trap 與 focus 還原。

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

### `destination_country` 國家限定功能

`TripInfoSection` 接收 `destinationCountry` prop（來自 index sheet `destination_country` 欄位），用於開關國家專屬內容：

| 值 | 行為 |
|---|---|
| `JP` | **行前準備** tab 顯示 Visit Japan Web 按鈕 |
| 空白 / 其他 | 顯示「尚無行前準備項目」佔位訊息 |

### Trip Extras 機制（求婚彩蛋）

`TripPage.jsx` 在渲染時嘗試 dynamic import：

```js
const extras = await import(`../trips/${trip.slug}/extras.jsx`).catch(() => null)
```

找不到時回傳 `null`，不影響通用流程。`tokyo-hokkaido-2026-03/extras.jsx` 匯出：
- `easterEggDay`：觸發彩蛋的天數（Day 4）
- `HeartIcon`：愛心 icon 組件
- `ProposalModal`：求婚彩蛋 modal

彩蛋觸發條件：在已選取的 `easterEggDay` 上**連續快速點擊 9 次**（每次間隔 < 2s）。

---

## 資料流 / 快取策略

### Two-tier cache

`useSheetData` 採兩層快取：

1. **Module-level `Map`**：同一 session 重複請求秒回，無 stale。
2. **localStorage SWR (`lib/swrCache.js`)**：
   - 命中時立即回傳 cached data 給 UI（瞬開）
   - 同時背景 revalidate，拿到新資料再覆蓋並寫回 cache
   - Key prefix 帶 `VERSION`（目前 `v1`），未來資料 schema 變更時 bump 即可作廢舊快取

### 行程列表排序

首頁行程排序為 Index Sheet 的**反向順序**（越後面的 row 排越上面）。

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
| `slug` | 行程唯一識別碼（用於 URL） | `fukuoka-2026-01` |
| `name` | 行程顯示名稱（中文） | `福岡` |
| `name_en` | 英文副標題（選填，用於 header 與 sidebar） | `Fukuoka` |
| `destination_country` | 目的地國家代碼，用於開關國家限定功能（選填） | `JP` |
| `dates` | 旅行日期範圍 | `2026/01/10 - 01/14` |
| `cover_image_url` | 封面圖片 URL | `https://...` |
| `sheet_id` | 該行程 Google Sheet 的 ID | `1BxiMVs...` |
| `status` | `published` 或 `draft` | `published` |

`name_en` 為空時自動從 `slug` 推算（例：`tokyo-hokkaido-2026-03` → `TOKYO HOKKAIDO TRIP`）。

### 每趟行程 Sheet（7 個 tab）

**`days` tab**

| `date` | `title` | `subtitle` | `banner_url` |
|---|---|---|---|

**`flights` tab**

| `date` | `route` | `time` | `flight_no` | `carry_on` | `checked_bag` |
|---|---|---|---|---|---|

**`accommodation` tab**

| `date` | `name` | `address` | `check_in` | `check_out` | `link` | `region` | `type` | `note` |
|---|---|---|---|---|---|---|---|---|

`type` 可選值：`hotel`、`airbnb`
`date`：check-in 日期，UI 上會以 badge 形式顯示在卡片頂端（同 flight 卡片樣式）。

**`checklist` tab**

| `category` | `item` |
|---|---|

每個 category 會自動帶完成度進度條與 `done / total` 計數，勾選狀態存於 `localStorage`（key：`trip-checklist:v1:<slug>`）。

**`itinerary` tab**

| `date` | `time` | `name` | `type` | `address` | `link` | `description` | `note` | `hours` | `parent` |
|---|---|---|---|---|---|---|---|---|---|

`type` 可選值：`attraction`（預設）、`hotel`、`food`、`shopping`、`transport`

欄位說明：
- `date`：用於將 rows 分組到日。可填短格式 `M/D`（如 `6/4`）或完整 `YYYY/MM/DD`；短格式會用 index sheet 的 `dates` start 補年（跨年 trip 自動處理）。Day 序號由 `(date - tripStart)` 反推，不再需要獨立 `day` 欄。
- `description`：**卡片外**可直接看到的簡短介紹（line-clamp 三行）
- `note`：**點開卡片後**才顯示的詳細說明，支援 `\n` 換行
- `hours`：營業時間，顯示於卡片底部小 badge
- `address`：Google Maps 導航查詢字串（`link` 有值時優先用 `link`）
- `parent`：**子項目專用**，填入父卡片的 `name`（字串完全比對）。有值的 row 不出現在主時間軸，改顯示在父卡片 modal 的「街道亮點」區。排序：`food → attraction → shopping`；父卡片底部自動出現「N 個亮點」badge

**`shopping` tab**

| `area` | `building` | `name` | `floor` | `hours` | `link` |
|---|---|---|---|---|---|

- `building` 空白：獨棟店，單獨顯示一個 block
- `building` 有值：合併顯示在同名建築的 block（第一筆為建築標頭，其 `hours`/`link` 代表整棟）

**`food` tab**

| `area` | `category` | `name` | `hours` | `desc` | `link` |
|---|---|---|---|---|---|

- `area`：浮動 tab 分區（空白則不顯示 area tabs）
- `category`：分組標題（空白則不分組）
- `desc`：店家描述（程式碼同時支援 `note` 欄位名稱）
- 若 `food` tab 無資料，fallback 為 `itinerary` 中 `type === 'food'` 的行程（由 `useFoodItems` 處理）

---

## UI / Design System

- **底色**：`#F9F8F4`（米白）
- **Accent**：`#5C6E58`（抹茶綠）
- **文字色**：`#2C2C2C`（jp-text）、`stone` 系列
- **字型**：全站 `"Noto Serif JP"`（font-serif），所有文字元素應帶 `font-serif`
- **字級**：micro eyebrow / 大寫 caps 標籤用 `text-2xs`（tailwind token，0.625rem），勿再用 `text-[10px]/[11px]` arbitrary value
- **Frosted glass（毛玻璃）**：本站玻璃材質是 frosted glass / glassmorphism（`backdrop-filter: blur/saturate/contrast` + 高光邊框），**非** iOS 26 那種有邊緣折射扭曲的 Liquid Glass（web 上難以兼顧相容性與效能，刻意不追）。玻璃 `backdrop-filter` 組合集中在 `index.css` 的 `:root` token，**勿再散寫 blur/saturate/contrast 數值**。語意 token：`--glass-nav`（DayNav）、`--glass-card`（行程卡）、`--glass-overlay`（BottomSheet + Sidebar）、`--glass-button`、`--glass-tab` / `--glass-tab-active` / `--glass-tab-lifted`（press 放大時更強 frosted）
- CSS utility classes：`frosted-tab-track`、`frosted-tab-btn`、`frosted-tab-pill`、`frosted-glass-button`、`.safe-area-inset`、`.safe-area-bottom`、`.scrollbar-hide`、`.glass-card`、`.glass-bottom-sheet`、`.glass-sidebar`
- **分段控制器（SegmentedControl）**：所有分段 tab（TripInfoSection / FoodSection / ShoppingSection）統一用 `src/components/ui/SegmentedControl.jsx`，**勿再各自手寫 `frosted-tab-track` markup**。玻璃感由**單一移動膠囊** `.frosted-tab-pill` 呈現（`.frosted-tab-btn.active` 只負責文字色），膠囊 width/transform 由 `useSegmentedDrag` 量測各 segment 實際 rect 設定。支援 pointer 拖拉跟手：按下任一段都可起手（非選中段按下即切換並滑行過去），按著一路滑可跨段、**拖拉中即時 `onChange` 切換畫面內容**，跨段 haptic、放開吸附（6px 門檻、邊緣 rubber-band）。拖拉期間 `isDraggingRef` 讓 value 變化的 reposition 讓位，避免跟手位置被搶。切換時短暫加 `.traveling`（透明玻璃態滑行）、按住/拖拉加 `.lifted`（放大超出邊界 + 更透）、`.dragging` 移除膠囊 `backdrop-filter`（iOS Safari 防 jank 逃生艙）。內容超寬時自動降級為「可橫向捲動 + 點按」

### Accessibility 原則

- 所有可點擊卡片用 `<button type="button">` 而非 `<div onClick>`，並加 `aria-label`
- Modal 都套 `useModalA11y`：`role="dialog"` + `aria-modal="true"` + `aria-labelledby` + ESC 關閉 + focus trap
- 觸控目標 ≥ 44×44（iOS HIG），按鈕統一加 `touch-manipulation`
- ChecklistSection 的 `<li>` 是 `role="checkbox"` + `tabIndex=0` + `Enter/Space` 切換
- **Focus**：`index.css` 只關閉滑鼠 `:focus`，全域保留 `:focus-visible`（jp-green ring，token `--glass-focus-ring`）；勿用 `outline-none` 而不補替代
- **捲動容器**：modal / section 的 `overflow-y-auto` 一律加 `overscroll-contain`，避免捲動鏈結到背後頁面

### 觸覺回饋（lib/haptic.js）

| 函式 | 強度 | 用途 |
|---|---|---|
| `tap()` | 8ms | 一般點擊、tab 切換 |
| `bump()` | 15ms | 開啟 modal、切換日期 |
| `success([10,30,10])` | pattern | 完成關鍵操作 |

包裝 `navigator.vibrate`，不支援的環境（含 iOS Safari）silent fail。

### SEO / 分享

- `index.html` 內含預設 OG meta（fallback）
- `usePageMeta({ title, description, image })` 在 runtime 動態覆蓋；行程頁帶上 `cover_image_url` 作為 `og:image`

### 靜態資源路徑

圖片、音樂等靜態資源放於 `public/trips/<slug>/`，以絕對路徑存取：`/trips/<slug>/images/D1.jpg`

---

## 部署

GitHub Actions push to master → Vite build → 部署至 GitHub Pages（非 `gh-pages` 分支）。
`public/.nojekyll` 防止 GitHub Pages 啟動 Jekyll。

---

## 測試

- Runner：Vitest + jsdom
- 測試檔位於 `src/__tests__/`
- 環境變數測試請用 `vi.stubEnv('VITE_XXX', '...')`；`lib/env.js` 採 getter 延遲讀取，stub 才生效
