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
└── 每趟行程 Sheet     → flights / itinerary / accommodation / shopping / checklist / food / days / prepare

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
│   ├── categories.js                # 行程分類色彩單一 source of truth（label/icon/ink + chip 樣式）
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

### 行前準備（資料驅動）

「行前準備」tab 由 trip sheet 的 **`prepare` tab** 驅動（不再寫死國家）。`TripInfoSection` 接收 `prepare` prop（rows），`PrepareTab` 把每筆 render 成**玻璃連結卡**（`glass-card` + 深色標題 + `text-muted` 副標 + jp-green `ExternalLink` icon，與全站卡片同語言；不再是大面積實心綠塊）；無資料則顯示「尚無行前準備項目」空狀態。Visit Japan Web、簽證申請、入境/海關表單、eSIM 等都是其中一筆資料列。

> index sheet 的 `destination_country` 欄位目前**未被程式使用**（行前準備改資料驅動後不再需要它 gate）；欄位保留無妨，未來若有其他國家限定功能可再用。

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
| `destination_country` | 目的地國家代碼（選填，目前程式未使用，保留欄位） | `JP` |
| `dates` | 旅行日期範圍 | `2026/01/10 - 01/14` |
| `cover_image_url` | 封面圖片 URL | `https://...` |
| `sheet_id` | 該行程 Google Sheet 的 ID | `1BxiMVs...` |
| `status` | `published` 或 `draft` | `published` |

`name_en` 為空時自動從 `slug` 推算（例：`tokyo-hokkaido-2026-03` → `TOKYO HOKKAIDO TRIP`）。

### 每趟行程 Sheet（8 個 tab）

**`prepare` tab**（行前準備，資料驅動）

| `label` | `desc` | `url` |
|---|---|---|

- `label`：項目標題（如 `Visit Japan Web`、`泰國簽證申請`、`韓國 K-ETA`）
- `desc`：副標/說明（選填）
- `url`：連結（選填；有值才顯示外連 icon 並可點開）

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

| `date` | `time` | `name` | `type` | `address` | `link` | `description` | `note` | `hours` | `parent` | `image` |
|---|---|---|---|---|---|---|---|---|---|---|

`type` 可選值：`attraction`（預設）、`hotel`、`food`、`shopping`、`transport`（label / icon / 顏色見 `src/lib/categories.js`）

欄位說明：
- `date`：用於將 rows 分組到日。可填短格式 `M/D`（如 `6/4`）或完整 `YYYY/MM/DD`；短格式會用 index sheet 的 `dates` start 補年（跨年 trip 自動處理）。Day 序號由 `(date - tripStart)` 反推，不再需要獨立 `day` 欄。
- `description`：**卡片外**可直接看到的簡短介紹（line-clamp 三行）
- `note`：**點開卡片後**才顯示的詳細說明，支援 `\n` 換行
- `hours`：營業時間，顯示於卡片底部小 badge
- `address`：Google Maps 導航查詢字串（`link` 有值時優先用 `link`）
- `parent`：**子項目專用**，填入父卡片的 `name`（字串完全比對）。有值的 row 不出現在主時間軸，改顯示在父卡片 modal 的「街道亮點」區。排序：`food → attraction → shopping`；父卡片底部自動出現「N 個亮點」badge
- `image`：選填縮圖（完整 URL 或 `/trips/<slug>/...` 絕對路徑）。**資料驅動、與 type 無關**：有值才顯示。卡片右側 64×64 圓角縮圖；點開 modal 時頂部顯示為 hero 圖。`lazy` 載入。

**`shopping` tab**

| `area` | `building` | `name` | `floor` | `hours` | `link` |
|---|---|---|---|---|---|

- `building` 空白：獨棟店，單獨顯示一個 block
- `building` 有值：合併顯示在同名建築的 block（第一筆為建築標頭，其 `hours`/`link` 代表整棟）

**`food` tab**

| `area` | `category` | `name` | `hours` | `desc` | `link` | `image` |
|---|---|---|---|---|---|---|

- `area`：浮動 tab 分區（空白則不顯示 area tabs）
- `category`：分組標題（空白則不分組）
- `desc`：店家描述（程式碼同時支援 `note` 欄位名稱）
- `image`：選填縮圖（完整 URL 或絕對路徑），有值才顯示在卡片左側 64×64 圓角；`lazy` 載入
- 若 `food` tab 無資料，fallback 為 `itinerary` 中 `type === 'food'` 的行程（由 `useFoodItems` 處理）

---

## UI / Design System

- **底色**：`#F9F8F4`（米白）
- **Accent**：`#5C6E58`（抹茶綠）
- **文字色**：主要 `#2C2C2C`（`text-jp-text`）；次要/註記用**語意 token**：`text-secondary`（次要正文，= 原 stone-600）、`text-muted`（小標/註記，= 原 stone-500）。這兩個 + `bg-hairline`/`border-hairline`（1px 分隔線，= 原 stone-200）都在 `tailwind.config.js` 定義成 `var(--text-secondary / --text-muted / --hairline)`，變數在 `index.css :root`。**新次要文字一律用 `text-secondary`/`text-muted`，勿再散用 `text-stone-500/600` 或已退役的 `jp-sub`**。這層是深色模式地基：未來只要在 `:root`（或 `.dark`）覆蓋這幾個變數即可一次翻，元件不用動。`text-stone-400`（更淡的 icon/placeholder）、`text-stone-700`（status pill）屬不同層級，未納入。
- **字型**：全站 `"Noto Serif JP"`（font-serif），所有文字元素應帶 `font-serif`
- **字級**：micro eyebrow / 大寫 caps 標籤用 `text-2xs`（tailwind token，0.625rem），勿再用 `text-[10px]/[11px]` arbitrary value
- **Frosted glass（毛玻璃）**：本站玻璃材質是 frosted glass / glassmorphism（`backdrop-filter: blur/saturate/contrast` + 高光邊框），**非** iOS 26 那種有邊緣折射扭曲的 Liquid Glass（web 上難以兼顧相容性與效能，刻意不追）。玻璃 `backdrop-filter` 組合集中在 `index.css` 的 `:root` token，**勿再散寫 blur/saturate/contrast 數值**。語意 token：`--glass-nav`（DayNav）、`--glass-card`（行程卡）、`--glass-overlay`（BottomSheet + Sidebar）、`--glass-button`、`--glass-tab` / `--glass-tab-active` / `--glass-tab-lifted`（press 放大時更強 frosted）。`.glass-card` **不畫白色外框/高光線**（`border: none`、無 inset 白高光、底色 `rgba(255,255,255,0.4)`），只靠下方柔和投影 `0 6px 18px rgba(0,0,0,0.08)` 做分離。原因：在彩色模糊背景（BottomSheet 透出 banner）上，白框/白高光會描出搶眼白邊。若日後覺得玻璃感不夠可加極淡高光，但勿回到舊的 0.6 border / 0.8 inset 白框。
- CSS utility classes：`frosted-tab-track`、`frosted-tab-btn`、`frosted-tab-pill`、`frosted-glass-button`、`press-springy`、`.safe-area-inset`、`.safe-area-bottom`、`.scrollbar-hide`、`.glass-card`、`.glass-bottom-sheet`、`.glass-sidebar`
- **Q 彈動效**：iOS26 風格彈簧 token：`--ease-spring`（彈較多，小元件用，Tailwind `ease-spring`）、`--ease-spring-soft`（彈較少，大行程面板用，`ease-spring-soft`）。
  - **press 微彈**：可點離散元件（卡片 / 選單項 / CTA / icon 按鈕）套 `.press-springy`（按下 squish、放開彈回）或共用的 `.frosted-glass-button`。
  - **面板開啟彈跳**：BottomSheet / Sidebar / ItinerarySection 詳情 sheet 開啟用 `ease-spring-soft`（overshoot），**關閉維持 `ease-out`**（關閉不彈）。overshoot / 反向拉會把面板頂出停駐邊露縫；**解法是「單層延伸玻璃」**：面板拆成 `frame（relative）> 單一 .glass-bottom-sheet/.glass-sidebar frost 層（absolute inset-0，往停駐邊用 `-bottom-56`/`-left-40` 延伸超過畫面）> 內容層（relative，不帶 backdrop，疊在 frost 上）`。因為是**同一塊** backdrop-filter，構造上無接縫（勿再用兩塊相鄰 backdrop 貼縫，必有色差縫）。內容層需 `overflow-hidden rounded-t-[2rem]` 把內容裁到圓角；frost 的 box-shadow 用 `[aria-hidden="false"] .glass-*`（後代選擇器，frost 已非直接子層）。
  - **反向拖拉拉伸**：拖拉關閉手勢往反方向拉時，用 `lib/gesture.js` 的 `resist()`（阻尼、上限 24px）做 rubber-band 拉伸，放開由開啟彈簧彈回；只從拖拉把手（pill/header）觸發，內容區反向拉是捲動。close 判定加了方向 guard（反向快速甩不關）。
  - **勿無差別灑**：進度條、fade、骨架、列表整列不套。`prefers-reduced-motion` 由全域 reset 自動降為瞬時（縫也不會出現）。
- **按下滑出取消（`useCancelableTap`）**：選中類可點元件（TripCard、ItinerarySection 卡片、Sidebar 選單項）用 `hooks/useCancelableTap.js`：按下 setPointerCapture，放開時 `isPointInRect` 判定放開點是否仍在元件內，滑出去放開＝取消，避免長按/誤觸。呼叫一次回傳 `{ onPointerDown, onPointerUp, guard }`，`guard(fn)` 包原本 onClick，可服務 `.map()` 清單（同時只按一個）。原生 onClick 保留給鍵盤無障礙。ChecklistSection 已自帶距離式（移動 >10px 不 toggle）取消，不重複套。
- **分段控制器（SegmentedControl）**：所有分段 tab（TripInfoSection / FoodSection / ShoppingSection）統一用 `src/components/ui/SegmentedControl.jsx`，**勿再各自手寫 `frosted-tab-track` markup**。玻璃感由**單一移動膠囊** `.frosted-tab-pill` 呈現（`.frosted-tab-btn.active` 只負責文字色），膠囊 width/transform 由 `useSegmentedDrag` 量測各 segment 實際 rect 設定。支援 pointer 拖拉跟手：按下任一段都可起手（非選中段按下即切換並滑行過去），按著一路滑可跨段、**拖拉中即時 `onChange` 切換畫面內容**，跨段 haptic、放開吸附（6px 門檻、邊緣 rubber-band）。拖拉期間 `isDraggingRef` 讓 value 變化的 reposition 讓位，避免跟手位置被搶。切換時短暫加 `.traveling`（透明玻璃態滑行）、按住/拖拉加 `.lifted`（放大超出邊界 + 更透）、`.dragging` 移除膠囊 `backdrop-filter`（iOS Safari 防 jank 逃生艙）。內容超寬時自動降級為「可橫向捲動 + 點按」

### 分類色彩系統（`src/lib/categories.js`）

行程分類（`itinerary` 的 `type`）的 **label / icon / 顏色** 統一由 `src/lib/categories.js` 提供，**是唯一 source of truth**。新增分類或改色只動這個檔；**勿再散寫 Tailwind pastel（`blue-700` / `pink-500` …）或 raw hex**。

配色為低彩度日本傳統「鼠色系」（和紙手帳調性），與品牌抹茶綠同一色族：

| 分類 | 傳統色 | ink hex |
|---|---|---|
| `transport` 交通 | 藍鼠 | `#4E6171` |
| `food` 美食 | 弁柄（赤陶） | `#9C5A43` |
| `attraction` 景點 | 苔・橄欖 | `#656E3C` |
| `shopping` 購物 | 葡萄鼠 | `#8A5A6E` |
| `hotel` 住宿 | 藤鼠 | `#5E5E86` |

- **抹茶綠 `jp-green #5C6E58` 是全站唯一主 accent**（連結 / active / CTA / 進度條 / focus ring），**不當分類色用**；景點故意用偏黃橄欖色與品牌綠區隔，避免「品牌 or 分類」混淆。全站只有一種綠（先前 `prepare` 卡片誤用的 `#6B9080` 已統一為 `jp-green`）。
- API：
  - `getCategory(type)`：回 `{ label, en, icon, ink }`（`en` 為大寫英文，給編輯排版 eyebrow 用），未知 type 退回景點。
  - `categoryChipStyle(type)` / `chipStyle(ink)`：**淡玻璃 chip**（文字 ink / 邊框 ink@40% / 底 ink@10%），搭配 className `border backdrop-blur-sm rounded`。用於小標籤。
  - `categorySolidStyle(type)` / `solidStyle(ink)`：**實心**（底 ink / 字白）。目前無引用（航班色帶已改半透明、側欄改純 icon），保留 API 供未來實心場景。
  - `categoryInk(type)`：純 ink 色（給脊線、節點底色等）。
  - `BRAND_INK`：品牌抹茶綠（= `jp-green` `#5C6E58`）的 JS 字面值，給 inline style 餵 `chipStyle` / `solidStyle` 用（Tailwind class 不適用時）；勿再散寫 `#5C6E58`。
- 引用處：`ItinerarySection`（時間軸節點 + 脊線 + eyebrow + modal 編輯排版）、`ShoppingSection`（樓層 `FloorTag` 用淡 chip）、`FoodSection`（店名前弁柄色點）、`TripInfoSection`（航班登機證色帶用 transport 半透明淡色 + 深色字、航線用 transport ink；行前準備玻璃連結卡用 jp-green 外連 icon；住宿 hotel/airbnb 同屬住宿分類，同色靠文字區分）、`TripPage` 的 `MENU_ITEMS`（側欄 icon，**純色 icon 無圓底**）。
- **日期是 metadata 不是分類**，勿套分類色：航班日期在登機證色帶上（transport 深色字）、住宿日期在 eyebrow 的 `STAY · <date>`。
- 側欄 `MENU_ITEMS` 的 icon = **純分類色 icon（無圓底）**，`iconStyle` 為 `{ color: categoryInk(...) }`（與時間軸軌道同語言），Sidebar 以 `style={iconStyle}` 套用。

### 各 section 的設計語言（避免脊線濫用）

**脊線是行程時間軸卡的專屬招牌，其他 section 用不同裝置表達分類色**：

- **航班卡（FlightsTab）= 登機證**：頂部 transport **半透明淡色色帶**（`${categoryInk('transport')}33` ≈ 20% 底 + transport ink 深色字，清透不再大面積實心，色帶固定高 `h-11`=44px），色帶下接**撕票口**（虛線 + 兩側用 CSS `mask`（`FLIGHT_NOTCH_STYLE`，雙 radial-gradient + `mask-composite: intersect` / `-webkit-mask-composite: source-in`）在 y=44 挖真半圓鏤空，透出底層 sheet）；再接玻璃機身區，航線（端點/線/飛機）用 transport ink（`categoryInk` + `currentColor`）。⚠️ mask 會連投影一起裁掉，故外層另包 wrapper 掛 box-shadow；WebKit 下 `mask` 不會裁 `backdrop-filter`，鏤空處會殘留卡片自身的一層淡霜（已知限制）。
- **逛街卡（ShoppingSection）= 索引 tag**：樓層 `FloorTag`（購物色淡 chip）當左錨點，**不再用重複的袋子 icon**；無樓層時 tag 內顯示一顆色點維持對齊。建築卡標頭無 icon，識別色交給下方樓層 tag。
- **美食卡（FoodSection）= 縮圖 + 色點**：店名前一顆弁柄色小圓點當分類標記；有 `image` 時左側縮圖。
- **行程 modal（DetailModal）= 編輯排版**：彩色 eyebrow（`label` + `en`）→ 特大標題（`text-3xl`）→ 一行 meta（`時間 · 地點`，**無地址不顯示**，已修掉 placeholder）→ 有 `image` 才放 hero 圖 → 髮絲線 eyebrow 分隔的「關於此處 / 街道亮點」。不再用 bordered pill。
- **住宿卡（HotelTab）= 編輯排版**（同 modal 家族）：eyebrow（子型別 `飯店/Airbnb` + `STAY · <入住日>`，hotel 藤鼠色）→ 大標（飯店名）→ 地址 meta → 髮絲線「入住資訊」+ check-in/out **等寬兩欄 + 置中分隔線** → Maps CTA。不再用 type chip / date badge。
- **DayBanner（每日 banner）**：照片上**不蓋暗色遮罩**（中央 scrim 會讓整張照片發灰）；文字可讀性改靠**多層 text-shadow 暗色光暈**，小字（日期 / 今日行程 / 副標）用更緊更深的 `SMALL_TEXT_SHADOW`、大標用容器較柔的光暈即可。底部保留淡入米白漸層做與下方行程區的接縫。勿再加回中央暗色 scrim。

### 行程時間軸（ItinerarySection）

每筆行程是 **三欄**：`時間 | 軌道節點 | 卡片`。

- **節點化軌道**：每個時間點是**純分類色 type icon（無圓底）**（`categoryInk` 著色、`size 18`，放在 `w-7 h-7` 置中盒維持對齊），下接 `w-[1.5px]` 連接線；刻意輕量（先前的實心圓底 + 4px 脊線份量太重）。
- **卡片細脊線**：卡片 `overflow-hidden` + 絕對定位 **`w-[2px]` 半透**分類色 spine（`categoryInk` + `80` alpha ≈ 50%）；內容左 padding `pl-4`。
- **分類標籤**：卡片內用輕量**彩色 eyebrow**（`text-2xs` 分類色），取代原本的 bordered pill。
- **砍空殼**：底部 meta（地址 + 「N 個亮點」badge）**只在真有值時渲染**，無地址不印 placeholder；移除了原本的 ChevronRight（整卡可點不需要）。「N 個亮點」badge 用品牌綠 chip（`chipStyle(BRAND_INK)`），不再用 amber。
- **時間權重**：時間 `text-sm font-bold tabular-nums` 右對齊指向節點。
- **NowMarker**（今日「現在」紅線）對齊同一套三欄；紅色僅用於「現在/今日/live」語意。

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

GitHub Actions push to master → Vite build → 部署至 GitHub Pages（非 `gh-pages` 分支）。
`public/.nojekyll` 防止 GitHub Pages 啟動 Jekyll。

---

## 測試

- Runner：Vitest + jsdom
- 測試檔位於 `src/__tests__/`
- 環境變數測試請用 `vi.stubEnv('VITE_XXX', '...')`；`lib/env.js` 採 getter 延遲讀取，stub 才生效
