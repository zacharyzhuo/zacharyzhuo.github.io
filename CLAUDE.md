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
│   │   └── BottomSheet.jsx          # 共用底部彈出層（tall 變體：h-[92vh]，供地圖用）
│   ├── home/
│   │   └── TripCard.jsx             # 首頁行程卡片（毛玻璃風格）
│   ├── trip/
│   │   ├── DayNav.jsx               # 日期橫向導航列
│   │   ├── DayBanner.jsx            # 每日 banner 圖 + 標題
│   │   ├── ItinerarySection.jsx     # 每日行程（含 DetailModal）
│   │   ├── TripInfoSection.jsx      # 旅程資訊（航班 / 行前準備 / 住宿，三 tab）
│   │   ├── ShoppingSection.jsx      # 購物清單（area tabs + building 分組）
│   │   ├── FoodSection.jsx          # 美食清單（area tabs + category 分組）
│   │   ├── ChecklistSection.jsx     # 打包清單（localStorage 持久化 + 進度條）
│   │   ├── TripMap.jsx              # 行程地圖（探索 + 路線；單一入口，路線用 DayNav 換天；react-leaflet + CARTO 底圖）
│   │   ├── NearbyPanel.jsx          # 探索模式「離你最近」可收合面板（geolocation + haversine）
│   │   └── mapIcons.js              # 地圖 marker divIcon 工廠（實心彩點 / 編號點 / 備選空心墨灰環 / 我的位置）
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
│   ├── categories.js                # 行程分類色彩單一 source of truth（label/icon/ink + chip 樣式 + BACKUP_INK）
│   ├── tripDate.js                  # 旅程日期相關純函式
│   └── maps.js                      # 地圖純函式（座標解析 / bucket / haversine / 路線排序 / Maps URL / 去重合併）
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

| `date` | `name` | `address` | `check_in` | `check_out` | `link` | `region` | `type` | `note` | `lat` | `lng` |
|---|---|---|---|---|---|---|---|---|---|---|

`type` 可選值：`hotel`、`airbnb`
`lat` / `lng`：選填經緯度，給地圖用（歸「住宿」分類）。有值才上圖。
`date`：check-in 日期，UI 上會以 badge 形式顯示在卡片頂端（同 flight 卡片樣式）。

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
- `image`：選填縮圖（完整 URL 或 `/trips/<slug>/...` 絕對路徑）。**資料驅動、與 type 無關**：有值才顯示。卡片右側 64×64 圓角縮圖；點開 modal 時頂部顯示為 hero 圖。`lazy` 載入。
- `lat` / `lng`：選填經緯度（從 Google Maps 複製貼上，兩欄分開）。給「地圖」功能（見下方）戳點用，有值才上圖。詳見 **地圖（TripMap）** 一節。

**`shopping` tab**

| `area` | `building` | `name` | `floor` | `hours` | `link` | `desc` | `lat` | `lng` |
|---|---|---|---|---|---|---|---|---|

> 欄位以 **header 名稱** 對應（`parseCSV` 產生物件），實際 sheet 內欄位順序可不同；新增欄位只要 header 名對得上即可。

- `building` 空白：獨棟店，單獨顯示一個 block
- `building` 有值：合併顯示在同名建築的 block（第一筆為建築標頭，其 `hours`/`link`/`desc` 代表整棟）
- **building-meta 列**：某筆 `name === building` 且 `floor` 空白時，視為「描述整棟」的 meta 列，只餵建築標頭（desc/hours/link），**不再重複列為子店**（避免標頭與子店名稱重複）。但 `name === building` 卻**有樓層**（如整棟店橫跨 `B2～8F`）的列仍當子店，好讓樓層範圍照常顯示。判斷在 `groupItems`
- `desc`：店家備註（選填，有值才顯示），顯示於店名與 `hours` 之間的淡色副文（`text-secondary`）。standalone 卡、building 標頭、building 子店列三處皆支援。把原本硬塞在 `name` 後面的括號補充（如「伴手禮一站・芒果乾/otap」）改填這欄，店名可回到單行
- `lat` / `lng`：選填經緯度，給地圖用（歸「購物」分類）。建議只在**建築標頭列**填（一棟一個點）；同棟分店留白即可（地圖會依座標去重）

**`food` tab**

| `area` | `category` | `name` | `hours` | `desc` | `link` | `image` | `lat` | `lng` |
|---|---|---|---|---|---|---|---|---|

- `area`：浮動 tab 分區（空白則不顯示 area tabs）
- `category`：分組標題（空白則不分組）
- `desc`：店家描述（程式碼同時支援 `note` 欄位名稱）
- `image`：選填縮圖（完整 URL 或絕對路徑），有值才顯示在卡片左側 64×64 圓角；`lazy` 載入
- `lat` / `lng`：選填經緯度，給地圖用（歸「美食」分類）。有值才上圖
- 若 `food` tab 無資料，fallback 為 `itinerary` 中 `type === 'food'` 的行程（由 `useFoodItems` 處理）。**注意**：地圖的美食點來自 **raw `food` tab**（非 `useFoodItems`），避免與 itinerary 的 food 重複計算

### 寫入 sheet 的型別政策（MUST 遵守）⚠️

App 透過 **gviz CSV 端點**（`.../gviz/tq?tqx=out:csv&sheet=<tab>`）讀 sheet。**gviz 會對每一欄推定單一型別，並把「不符該欄型別」的儲存格輸出成空字串**。所以每個 cell 必須是「該欄正確的型別」，否則資料會在 app 端消失或錯亂。

**踩過的雷**：用 `valueInputOption: RAW` 把 `"6/5"` 寫進 `date` 欄 → 存成**純文字**（cell 顯示 `'6/5`、靠左對齊）→ gviz 認定 date 欄是 Date 型別、把這個文字格輸出成**空字串** → app 收到空 `date` → 該列 `_day=null` → **從當天時間軸消失**（並被地圖當「備選」點）。症狀：**Sheet 裡看得到、網頁卻不顯示**。

**鐵則：任何 cell 的第一個字元都不該是 `'`（forced-text）。出現 `'` 代表型別沒設對。** 各欄正確型別：

| 欄 | 正確型別 | 怎麼寫 |
|---|---|---|
| `date`（所有 tab） | **日期（DATE）** | `USER_ENTERED` 寫 `6/5`；整欄 numberFormat `type=DATE`（現用 `m/d`）。gviz 輸出 `6/4`，resolveTripDate 吃 `M/D`／`YYYY/MM/DD` |
| `itinerary.time` | **文字（整欄一致）** | 此欄實務上**混了真時鐘（`09:50`）與非時鐘標籤（`晚上`/`上午`/`下午`/`晚餐`/`備選`）**，且這些標籤要照常顯示在時間軸。**整欄一律當文字**：`USER_ENTERED` 寫字串，並把該欄資料範圍 numberFormat 設 `TEXT`（防之後在 UI 輸入 `14:00` 又被自動轉成 TIME 型別、破壞「整欄文字」）。gviz 對「全文字欄」照吐所有值（含 `09:50` 與 `晚上`），安全。**切勿只把部分格轉成真 TIME 型別** → 見下方「同一欄不可混型別」 |
| `accommodation.check_in`/`check_out` | **時間（TIME）** | 這兩欄是 100% 乾淨時鐘時間、無文字標籤 → 整欄 numberFormat `type=TIME, pattern=hh:mm`，再 `USER_ENTERED` 寫 `09:50`。gviz 輸出乾淨 `09:50`（已驗） |
| `lat` / `lng` | **數字（Number）** | `USER_ENTERED` 寫數字字串 `10.4070429`（成 number；gviz 輸出數字） |
| `flights.time`、`hours` 等含**區間/中文**的自由文字 | **文字** | 內容非單一可轉換值（`07:00 - 09:50`、`06:30 – 10:30`、`停留 40 分鐘`）→ Sheets 不會自動轉、本來就無 `'`，直接 `USER_ENTERED` 寫 |
| 其餘文字欄（`name`/`address`/`link`/`description`/`note`/`type`/`area`/…） | 文字 | `USER_ENTERED`；內容非「整格可轉換」不會出現 `'`，免特別處理 |

**同一欄不可混型別（核心鐵則，實測）**：gviz 對一欄只推定**一種**型別，把不符的格吐成空字串。所以真正的規則不是「time 一定要 TIME」，而是「**整欄同型別**」。
- 把 `itinerary.time` 的時鐘格轉成真 TIME、卻保留 `晚上`/`上午` 文字格 → gviz 判整欄為時間型 → **那些文字格被吐成空**（時間軸時間標籤消失）。
- 實測（拋棄式 sheet 驗證）：**全文字欄**（`16:00` 與 `晚上` 都 stringValue）→ gviz 全部照吐；**混型別欄**（`16:00` 是 numberValue＋`晚上` 是 stringValue）→ `晚上` 被吐成 `''`。
- 結論：`itinerary.time` 維持**整欄文字**。只有「該欄 100% 是乾淨時鐘時間」（如 `accommodation.check_in/check_out`）才用真 TIME 型別。

**通則**：
- 寫 cell 一律 `valueInputOption: USER_ENTERED`（**不要 `RAW`**）；URL 也才會變連結。
- 要把某欄設成特定型別（`date`→DATE、`check_in`/`check_out`→TIME、`lat`/`lng`→NUMBER、`itinerary.time`→TEXT）：先用 `batchUpdate` 的 `repeatCell` 設該欄資料範圍 `userEnteredFormat.numberFormat`（`{type, pattern}`；TEXT 型別用 `{type:"TEXT"}`），再 `USER_ENTERED` 寫值。
- **寫後必驗**：`curl 'https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=<tab>'`，確認新列該填的欄**非空**、值正確。
- 偵測殘留 forced-text：`spreadsheets.get` 帶 `includeGridData` 看 `userEnteredValue` 是否為 `stringValue` 但內容是純數字/純日期（這種就是型別錯）。**例外**：`itinerary.time` 的 `stringValue` 純 `HH:MM` 是**刻意的全欄文字**，不是錯。
- **要在某天中間插列**（保持時間順序，而非丟到表尾）：用 `batchUpdate` 的 `insertDimension`（指定分頁 `sheetId`、`ROWS`、`startIndex`/`endIndex`）插空列，再 `values.update` 寫入；itinerary **無 `day` 欄**，日由 `date` 推。

---

## 地圖（TripMap）

行程頁的地圖功能，`src/components/trip/TripMap.jsx`，包在 **tall 版 `BottomSheet`（`h-[92vh]`）** 裡，用 **react-leaflet v5 + leaflet + CARTO Positron 免費底圖**（不用 API key），以 `React.lazy` 切出 chunk。

### 單一入口、modal 內兩種模式（同一個 `TripMap` 元件）

- **入口**：行程頁 header **右上角**的地圖 icon（與左上漢堡對稱）；`mapPoints` 為空時不顯示。DayBanner **沒有**地圖按鈕。
- 打開後**預設探索模式**，頂部一顆 `SegmentedControl`（探索 / 路線）切換：
  - **探索**：全部點、跨日、可分類篩選（chip 列）、定位找最近。
  - **路線**：頂部 chip 列換成 **`DayNav`（複用行程頁那顆）**，預設選中**開啟當下背景頁那天**（`activeDay`），可在 modal 內換天瀏覽各日動線（換天只改地圖，不動背景頁）。

`TripMap` 接 `points` / `days` / `activeDay` 三個 prop；`mode` 與 `routeDay` 都是元件內部 state（每次開啟重置為探索 + 背景當天）。

### 點的來源與分類（bucket）

地圖點來自**四個 tab**（皆需填 `lat`/`lng`，有座標才上圖）：

- **`itinerary` tab**：有日期 → 依 `type` 歸 `food`/`attraction`/`shopping`；**空 `date` → `backup`（備選，不分 type）**；**有日期的 `transport`/`hotel` → `routeOnly` 點：只進「路線」模式（讓整天動線含機場/港口/飯店 check-in），不進「探索」**（交通非探索點；住宿的探索點改由 accommodation tab 提供，避免重複）。著色用各自 type ink（transport 藍鼠 / hotel 藤鼠）。判斷在 `toMapPoints`（`pointBucket` 維持對 transport/hotel 回 null 不變，routeOnly 在 `toMapPoints` 內另判）。
- **`food` tab**：全部歸 `food` bucket（`day=null`，只進探索）。
- **`shopping` tab**：全部歸 `shopping` bucket（`day=null`，只進探索；建議只填建築標頭列）。
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

itinerary 點**全留**（保留 `day`，能進路線）；清單（food/shopping/accommodation）點若與既有點**同 bucket 同座標（5 位小數）**則去重 — 涵蓋 list-vs-itinerary 與 list-vs-list 重複。itinerary 點彼此**不**去重（同旅館的早餐/午餐各算一個停留）。組裝在 `TripPage`：`mergeMapPoints(toMapPoints(itinerary), [...listToMapPoints(food,'food'), ...listToMapPoints(shopping,'shopping'), ...listToMapPoints(accommodation,'hotel')])`。

> **`routeOnly` 點不當去重種子**：`mergeMapPoints` 的 `seen` 只用「非 routeOnly 的 itinerary 點」建立。否則 itinerary 的住宿 routeOnly 點會把 accommodation tab 同址住宿點去掉，害探索模式看不到住宿。兩者並存：路線模式顯示 itinerary 那顆（有 day），探索模式顯示 accommodation 那顆（day=null）。

### 路線模式

只取**選中那天有座標的點**（含 routeOnly 的交通/住宿）按 `time` 排序，畫編號 marker + 品牌綠虛線（綠=動線語意，非分類色）。清單（food/shopping/accommodation）點 `day=null` 自然不進路線。要看哪天由 modal 內的 `DayNav` 選（預設 `activeDay`）。

> **路線 = 「那天怎麼移動」，跨國/跨海長線是 OK 的**（產品定義）。抵達/離境日的跨國交通列（機場接送、出發國機場）**照填座標**，路線會 fit 到跨國範圍、拉一條跨海線呈現整天移動 —— 這是刻意的，**不要**為了避免長線而把那些列留空。

**逐站 stepper（前進/後退）**：路線模式底部置中一顆玻璃膠囊 `‹  3/7  ›`。
- state `focusIdx`（`null` = 總覽）。換天(DayNav)/切模式 → 自動重置回總覽（`useEffect` on `[routeDay, mode]`）。
- **›** 前進：總覽 → 第 1 點；之後 +1，clamp 在最後一點。**‹** 後退：總覽 → **最後一點**；之後 -1，clamp 在第 1 點。索引邏輯抽成純函式 `nextFocusIndex(current, dir, total)`（`lib/maps.js`，有測試）。
- 中間 `n/total` 點一下 → 回總覽。
- 相機：總覽 `fitBounds` 全部點；聚焦 `flyTo(zoom 16)` + 開該點 popup（route marker 需存 `markerRefs`）。`FitBounds` 元件只在**探索模式**掛載，路線相機完全由 stepper 的 `useEffect` 控（總覽 fit / 聚焦 flyTo），避免兩者打架。
- ⚠️ **膠囊容器用 `.frosted-glass-panel`（靜態毛玻璃），不要套 `.frosted-glass-button`**：後者的 `:active` 是 `scale(0.9)` 配 `--ease-spring`（overshoot），套在「裝多顆按鈕的容器」上會讓整顆膠囊一按就彈來彈去、裡面 ‹ › 難點。`.frosted-glass-panel` 材質同 frosted-glass-button 靜止態但**無** `:active` 彈簧。press 彈簧只屬於**單一**可點元件；內層 ‹ › 用瞬時 `active:scale-90` 即可。
- 相機動畫：`flyTo`/`fitBounds` 都帶 `{ duration: 0.6 / 0.5 }` 上限（預設弧線在遠點會飛很久）；聚焦的 popup 用 `map.once('moveend', …)` 在移動結束才開（不會飛到一半就跳出）。

### 顏色 / marker

- marker 顏色取自 `categories.js`：food/attraction/shopping 用各自 ink；**備選用 `BACKUP_INK`（中性墨灰 `#6B6B66`，非品牌綠、非分類色）+ 空心環**。
- Google Maps 導航連結：優先用該點 `link`（地點頁）；無 `link` 才退用 `name+address` 搜尋字串（**不用裸經緯度**）。`buildMapsUrl` 在 `lib/maps.js`，開連結走 `openExternal`（PWA 相容）。
- 「離你最近」面板（`NearbyPanel`）：`navigator.geolocation` + `haversineMeters` 排序；是 sheet **內**的可收合 panel，非第二層彈窗。

### 已知限制 / 雷

- Leaflet 在「開啟時才長出來」「切模式高度改變」的容器需 `map.invalidateSize()`（`InvalidateOnMount` / `InvalidateOnModeChange` 處理），否則圖磚渲染成灰塊/灰條。
- 純函式（`parseLatLng`/`pointBucket`/`toMapPoints`/`listToMapPoints`/`mergeMapPoints`/`haversineMeters`/`sortByDistance`/`routePoints`/`formatDistance`/`buildMapsUrl`）集中在 `lib/maps.js` 並有測試；Leaflet 元件本身以手動驗收為主。

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
- **行程 modal（DetailModal）= 編輯排版**：彩色 eyebrow（`label` + `en`）→ 標題（`text-2xl`，同住宿卡）→ 一行 meta（`時間 · 地點`，**無地址不顯示**，已修掉 placeholder）→ 有 `image` 才放 hero 圖 → 髮絲線 eyebrow 分隔的「關於此處 / 街道亮點」。不再用 bordered pill。
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
