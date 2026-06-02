# 行程地圖（TripMap）設計文件

- **日期**：2026-06-03
- **狀態**：設計定案，待寫實作計畫
- **範圍**：在行程頁新增一個地圖功能，含「探索」與「今日路線」兩種模式

---

## 1. 目標與動機

安排行程時常有一些「想去但還沒排進某天」的備選點，需要一個地方收納；當下若有空檔，也希望能直接在一張地圖上看哪個點最近、直接導航過去，不必在 app 與 Google Maps 之間來回查。

兩個需求收斂成**一張地圖、兩種模式**：

- **探索模式（主）**：跨日、不分天。顯示所有想去的點（美食 / 景點 / 購物 / 備選），可分類篩選、可定位找最近、可一鍵跳 Google Maps 導航。
- **路線模式（附）**：綁定某一天，把當天的點按時間順序連成動線（編號 + 虛線）。

---

## 2. 資料模型

### 2.1 只動 `itinerary` tab

`itinerary` tab **新增兩欄**：

| 欄位 | 說明 |
|---|---|
| `lat` | 緯度（從 Google Maps 複製座標貼上） |
| `lng` | 經度 |

- **有座標才上地圖**；`lat`/`lng` 任一為空的點自動略過，不報錯（漸進式補資料，不阻塞）。
- 沿用既有規則：**空 `date` = 備選點**（不綁任何一天）。
- 不新增 `backup` tab，不動 `food` / `shopping` tab。

### 2.2 地圖點的 4 個 bucket（= 4 顆篩選 chip）

每個上圖的點剛好屬於一個 bucket：

| chip | 條件 | 視覺 | 顏色來源 |
|---|---|---|---|
| 美食 | 有日期 + `type=food` | 實心 marker | `categories.js` 弁柄 `#9C5A43` |
| 景點 | 有日期 + `type=attraction` | 實心 marker | 苔 `#656E3C` |
| 購物 | 有日期 + `type=shopping` | 實心 marker | 葡萄鼠 `#8A5A6E` |
| 備選 | **空 `date`**（不分 type） | **空心墨灰環** | 中性墨灰（非品牌綠） |

- `type=transport` / `type=hotel` 的點**不進探索地圖**（它們不是「想去的點」）。後續若需要再加，v1 不做。
- **備選顏色決策**：`CLAUDE.md` 規定抹茶綠 `#5C6E58` 是全站唯一主 accent、不可當分類色。因此備選**不用綠**，改用**中性墨灰的空心環 marker**，造型語意 = 「候選、尚未鎖定」，與實心的已排點區隔。

---

## 3. 入口與容器

### 3.1 兩個入口

| 入口 | 位置 | 開啟模式 |
|---|---|---|
| 地圖 icon | 行程頁**右上角**，與左上漢堡（側邊欄）對稱 | 探索模式（全局、跨日） |
| 「🗺 今日路線」膠囊 | **DayBanner 右下**（毛玻璃膠囊，與左下日期/標題對稱） | 路線模式，帶入當下選取的那天 |

### 3.2 單一元件、雙入口

兩個入口開**同一個 `TripMap` 元件**，包在**加高版 BottomSheet（約 `h-[92vh]`）**裡：

- 沿用既有 `BottomSheet` + `useModalA11y`（ESC / focus trap / focus restore）+ scroll lock。
- 採 `noScroll noStickyTitle` 變體（子元件自行管理畫面），與 ShoppingSection / FoodSection 同結構。
- 標準 sheet 是 `h-[79vh]`；地圖需要更多空間，故用加高變體（新增一個高度選項，不改既有 sheet）。
- `TripMap` 接兩個 prop：
  - `mode`：`'explore'` | `'route'`
  - `day`：選填，route 模式帶入的日期
- 進入後**仍可在頂部切換 explore / route**；入口只決定初始狀態。

---

## 4. 探索模式

- 所有「有座標」的點上圖，頂部 4 顆 chip（美食 / 景點 / 購物 / 備選）獨立 toggle 顯示。
- **點 marker → popup**：分類 eyebrow + 名稱 + `desc` + 「開啟 Google Maps 導航」連結。
- **Google Maps 連結邏輯**（重點）：
  1. 優先用該筆的 **`link`**（Google Maps 地點頁網址）→ 打開是有介紹/評論的地點頁。
  2. 沒 `link` 才退用 `https://www.google.com/maps/search/?api=1&query=<encodeURIComponent(名稱 + address)>` → 一樣落在地點頁。
  3. **不使用裸經緯度當導航連結**（經緯度只用於戳點與算距離）。
- **📍 我的位置**：
  - `navigator.geolocation.getCurrentPosition`（GitHub Pages 為 HTTPS，可用）。
  - 取得位置 → haversine 算各點距離 → **地圖內的可收合面板**（非第二層彈窗）列出「離你最近」排序清單。
  - 點清單任一列 → 地圖 `flyTo` 該點並開 popup。
  - 權限被拒 / 不支援 / timeout：顯示明確提示，面板不出現排序（不靜默失敗）。

---

## 5. 路線模式

- 由「今日路線」入口帶入 `day`，或在地圖內切到 route。
- 取**當天有座標的點**，按 `time` 升序排序，畫**編號 marker（1→2→3）+ 綠色虛線 polyline**（對標熊本市截圖那種動線）。
- 虛線用品牌綠（此處綠是「動線」語意，非分類色）。
- 備選點（空日期）**不進路線模式**。
- route 模式內亦提供「開啟 Google Maps 導航」（同探索的連結邏輯）。

---

## 6. 技術選型

| 項目 | 選擇 | 理由 |
|---|---|---|
| 地圖庫 | `leaflet` + `react-leaflet` **v5** | 免費、免 API key、純靜態可跑；v5 對應專案 React 19（勿裝 v4） |
| 底圖 tiles | **CARTO Positron**（`light_all`） | 免費、免 key、淡色調貼合和紙風 |
| 載入 | **dynamic import** 切出 chunk | 不拖累首頁 / 行程頁初載（同 trip extras 的 lazy 作法） |
| marker | Leaflet `divIcon` | 自繪鼠色系實心點 / 編號點 / 空心墨灰環，避開預設 icon 打包壞圖問題 |
| 分類色 | 沿用 `src/lib/categories.js` | 單一 source of truth，不散寫 hex |

### 實作必處理的雷

- **`map.invalidateSize()`**：BottomSheet 從 0 高度動畫長出，地圖容器初始尺寸為 0，**必須在 sheet 開啟動畫結束後呼叫 `invalidateSize()`**，否則圖磚渲染成灰塊或只畫左上角。
- react-leaflet **不會自動載入 Leaflet CSS**，需顯式 import `leaflet/dist/leaflet.css`。
- `prefers-reduced-motion`：`flyTo` 等動畫降級為瞬時（沿用全站 reduced-motion 原則）。

---

## 7. 風格

- 延續**日式和紙 + 毛玻璃**：BottomSheet 用既有 glass token；分類色用 `categories.js`；字型 Noto Serif JP。
- 篩選 chip 沿用淡玻璃 chip 樣式（`categoryChipStyle`）。
- marker / popup / 最近面板的視覺與全站卡片同語言。

---

## 8. 無障礙

- 地圖 icon 入口與「今日路線」按鈕用 `<button>` + `aria-label`，觸控目標 ≥ 44×44。
- BottomSheet 已具 `role="dialog"` + `aria-modal` + ESC + focus trap（`useModalA11y`）。
- 最近清單列為可鍵盤操作的按鈕。
- 捲動容器加 `overscroll-contain`。

---

## 9. 邊界與錯誤處理

| 情況 | 行為 |
|---|---|
| 點缺 `lat`/`lng` | 略過該點，不報錯 |
| 整趟無任何有座標的點 | 地圖顯示空狀態（沿用 `EmptyState`），提示「尚無地圖座標」 |
| 某天無座標點（route） | route 模式空狀態 |
| 定位被拒 / 失敗 | 明確提示，不靜默失敗；探索仍可手動瀏覽 |
| `link` 與 `address` 皆空 | popup 不顯示導航連結（不印壞連結） |

---

## 10. 範圍外（v1 不做）

- 不繪製獨立的 `food` / `shopping` tab 清單（無座標、且與 itinerary 重複）；地圖點只來自 `itinerary` tab。
- 不做自動 geocoding（座標一律手動貼）。
- 不顯示 `transport` / `hotel` 點於探索地圖。
- 不做多日路線疊加（route 一次一天）。

---

## 11. 受影響檔案（預估）

- `src/components/trip/TripMap.jsx`（新增，主元件）
- 探索 / 路線 / 最近面板可能各拆子元件（沿用「多小檔」原則）
- `src/components/layout/BottomSheet.jsx`（新增加高高度選項）
- `src/components/trip/DayBanner.jsx`（新增「今日路線」按鈕）
- `src/pages/TripPage.jsx`（右上地圖 icon 入口 + 開關狀態）
- `src/lib/categories.js`（如需備選墨灰常數）
- `package.json`（新增 `leaflet`、`react-leaflet`）
- Google Sheet 各行程的 `itinerary` tab（新增 `lat` / `lng` 欄並補座標）
