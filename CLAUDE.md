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

         ↓ fetch CSV at runtime（module-level Map 快取，同 session 不重複 fetch）

Vite + React SPA (GitHub Pages)
├── 首頁 /#/           → fetch index sheet → 渲染行程卡片列表
└── 行程頁 /#/trip/:slug → fetch 行程 sheet → 渲染各 section
```

- Routing 使用 **Hash mode**，以相容 GitHub Pages 靜態 hosting
- `src/lib/sheets.js` — CSV 解析工具（`parseCSV`、`sheetURL`）
- `src/hooks/useSheetData.js` — fetch 單一 Sheet tab（含快取）
- `src/hooks/useTrips.js` — fetch index sheet，取得所有行程（已 reverse）
- `src/hooks/useScrollLock.js` — scroll lock，reference counting 防止多層 modal 衝突

---

## Component 架構

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx              # 抽屜導航（含 MENU_ITEMS 清單）
│   │   └── BottomSheet.jsx          # 共用底部彈出層
│   ├── home/
│   │   └── TripCard.jsx             # 首頁行程卡片（Liquid Glass 風格）
│   ├── trip/
│   │   ├── DayNav.jsx               # 日期橫向導航列
│   │   ├── DayBanner.jsx            # 每日 banner 圖 + 標題
│   │   ├── ItinerarySection.jsx     # 每日行程（含 DetailModal）
│   │   ├── TripInfoSection.jsx      # 旅程資訊（航班 / 行前準備 / 住宿，三 tab）
│   │   ├── ShoppingSection.jsx      # 購物清單（area tabs + building 分組）
│   │   ├── FoodSection.jsx          # 美食清單（area tabs + category 分組）
│   │   └── ChecklistSection.jsx     # 打包清單（localStorage 持久化）
│   └── ui/
│       └── LoadingSpinner.jsx
├── pages/
│   ├── HomePage.jsx                 # 行程列表頁
│   └── TripPage.jsx                 # 行程詳細頁（通用）
├── hooks/
│   ├── useSheetData.js
│   ├── useTrips.js
│   └── useScrollLock.js
├── lib/
│   └── sheets.js
├── trips/
│   └── tokyo-hokkaido-2026-03/
│       └── extras.jsx               # 求婚彩蛋（僅此行程）
└── App.jsx
```

### BottomSheet Props

| prop | 說明 |
|---|---|
| `isOpen` | 控制顯示 |
| `onClose` | 關閉回調 |
| `title` | 標題文字 |
| `noScroll` | 固定高度 `h-[79vh]`，子元件自行管理捲動，供浮動 tab 使用 |
| `noStickyTitle` | 不顯示固定標題，由子元件在 scroll 區自行渲染標題 |

### 側邊欄選單（MENU_ITEMS）

| key | 說明 |
|---|---|
| `info` | 旅程資訊（航班 / 行前準備 / 住宿） |
| `checklist` | 行李清單 |
| `shopping` | 逛街清單 |
| `food` | 美食清單 |

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

## Google Sheets 資料結構

### Index Sheet

| 欄位 | 說明 | 範例 |
|---|---|---|
| `slug` | 行程唯一識別碼（用於 URL） | `fukuoka-2026-01` |
| `name` | 行程顯示名稱 | `福岡` |
| `dates` | 旅行日期範圍 | `2026/01/10 - 01/14` |
| `cover_image_url` | 封面圖片 URL | `https://...` |
| `sheet_id` | 該行程 Google Sheet 的 ID | `1BxiMVs...` |
| `status` | `published` 或 `draft` | `published` |

首頁行程排序為 Index Sheet 的**反向順序**（越後面的 row 排越上面）。

### 每趟行程 Sheet（7 個 tab）

**`days` tab**

| `day` | `title` | `subtitle` | `banner_url` |
|---|---|---|---|

**`flights` tab**

| `date` | `route` | `time` | `flight_no` | `carry_on` | `checked_bag` |
|---|---|---|---|---|---|

**`accommodation` tab**

| `day` | `name` | `address` | `check_in` | `check_out` | `link` | `region` | `type` | `note` |
|---|---|---|---|---|---|---|---|---|

`type` 可選值：`hotel`、`airbnb`

**`checklist` tab**

| `category` | `item` |
|---|---|

**`itinerary` tab**

| `day` | `date` | `time` | `name` | `type` | `address` | `link` | `description` | `note` | `hours` | `parent` |
|---|---|---|---|---|---|---|---|---|---|---|

`type` 可選值：`attraction`（預設）、`hotel`、`food`、`shopping`、`transport`

欄位說明：
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
- 若 `food` tab 無資料，fallback 為 `itinerary` 中 `type === 'food'` 的行程

---

## UI / Design System

- **底色**：`#F9F8F4`（米白）
- **Accent**：`#5C6E58`（抹茶綠）
- **文字色**：`#2C2C2C`（jp-text）、`stone` 系列
- **字型**：全站 `"Noto Serif JP"`（font-serif），所有文字元素應帶 `font-serif`
- **Liquid Glass**：BottomSheet、Sidebar、浮動 Tab 使用 `backdrop-filter: blur(16px) saturate(200%) contrast(120%)` + 白色半透明背景
- CSS utility classes：`liquid-tab-track`、`liquid-tab-btn`、`liquid-glass-button`、`.safe-area-inset`、`.safe-area-bottom`

### 靜態資源路徑

圖片、音樂等靜態資源放於 `public/trips/<slug>/`，以絕對路徑存取：`/trips/<slug>/images/D1.jpg`

---

## 部署

GitHub Actions push to master → Vite build → 部署至 GitHub Pages（非 `gh-pages` 分支）。  
`public/.nojekyll` 防止 GitHub Pages 啟動 Jekyll。
