# Travel Site Refactor Design

**Date:** 2026-04-11
**Status:** Approved
**Scope:** 將現有多個獨立 CRA React 旅遊網站，重構為單一 Vite + React SPA，以 Google Sheets 作為 CMS

---

## 1. 背景與目標

### 現況痛點
- 每趟旅行需複製整個 CRA 專案（重複的 `node_modules`、config、build 流程）
- `App.js` 為單一巨大檔案（> 800 行），難以維護
- Create React App 已停止維護
- 新增行程需要改程式碼，無法只更新資料

### 目標
- 單一 App 支援多個行程
- 以 Google Sheets 作為 CMS，新增行程只需填表，不需動程式碼
- 現代化工具鏈（Vite 取代 CRA）
- 保留日系 warm tone 設計語言，加入 Liquid Glass UI 元素
- 保留 tokyo-hokkaido 行程的求婚彩蛋，不影響其他行程

---

## 2. 技術選型

| 項目 | 選擇 | 理由 |
|---|---|---|
| 框架 | Vite + React | 取代停止維護的 CRA，build 速度快 |
| Sheets 整合 | Google Sheets CSV API（public）| 靜態網站無後端，public sheet 直接 fetch CSV，無需 OAuth |
| Routing | React Router v6（Hash mode）| GitHub Pages 不需 server 設定 |
| 樣式 | Tailwind CSS v3 | 沿用現有設定 |
| Icons | lucide-react | 沿用現有設定 |
| 部署 | GitHub Actions → GitHub Pages（官方 deploy-pages action）| 自動化取代手動流程 |

---

## 3. 整體架構

```
Google Sheets (Public)
├── Index Sheet        → 所有行程清單
└── 每趟行程 Sheet     → flights / itinerary / accommodation / shopping / checklist / food / days

         ↓ fetch CSV at runtime

Vite + React SPA (GitHub Pages)
├── 首頁 (/)           → fetch index sheet → 渲染行程卡片列表
└── 行程頁 (/trip/:slug) → fetch 行程 sheet → 渲染各 section
```

**URL 結構：**
- `/#/` — 首頁，所有行程列表
- `/#/trip/fukuoka-2026-01` — 福岡行程頁
- `/#/trip/tokyo-hokkaido-2026-03` — 東京・北海道行程頁

**Sheets CSV 端點格式：**
```
https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet={TAB_NAME}
```

---

## 4. Google Sheets 資料結構

### 4.1 Index Sheet（一個，管所有行程）

| 欄位 | 說明 | 範例 |
|---|---|---|
| `slug` | 行程唯一識別碼（用於 URL） | `fukuoka-2026-01` |
| `name` | 行程顯示名稱 | `福岡` |
| `dates` | 旅行日期範圍 | `2026/01/10 - 01/14` |
| `cover_image_url` | 封面圖片 URL | `https://...` |
| `sheet_id` | 該行程 Google Sheet 的 ID | `1BxiMVs...` |
| `status` | `published` 或 `draft` | `published` |

首頁行程排序為 Index Sheet 的**反向順序**（越後面的 row 排越上面）。

### 4.2 每趟行程 Sheet（7 個 tab）

**`days` tab**（DayBanner 用）

| `day` | `title` | `subtitle` | `banner_url` |
|---|---|---|---|
| 1 | 出發 · 福岡 | 天神周邊探索 | /trips/fukuoka-2026-01/images/D1.jpg |

**`flights` tab**

| `date` | `route` | `time` | `flight_no` | `carry_on` | `checked_bag` |
|---|---|---|---|---|---|
| 01/10 | TPE -> FUK | 12:40 - 16:00 | AirAsia AK 1510 | 7kg | 20kg |

**`accommodation` tab**

| `day` | `name` | `address` | `check_in` | `check_out` | `link` | `region` | `type` | `note` |
|---|---|---|---|---|---|---|---|---|

`type` 可選值：`hotel`、`airbnb`

**`checklist` tab**

| `category` | `item` |
|---|---|
| Money | 外幣 |
| Money | 護照 |

**`itinerary` tab**

| `day` | `date` | `time` | `name` | `type` | `address` | `link` | `description` | `note` | `hours` | `parent` |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 01/10 (五) | 12:40 | 搭機 | transport | | | | | | |
| 2 | 01/11 (日) | 14:00 | 由布院溫泉街散策 | shopping | | | 湯の坪街道散步... | | | |
| 2 | 01/11 (日) | | 湯布院金賞コロッケ | food | | | 九州第一名可樂餅 | | | 由布院溫泉街散策 |

`type` 可選值：`attraction`（預設）、`hotel`、`food`、`shopping`、`transport`

> **欄位說明：**
> - `day`：第幾天（數字），用於 DayNav 分頁及篩選當日行程
> - `date`：日期字串（格式 `MM/DD (週X)`，選填），有填時 DayNav 顯示「週五 / 15」；留空則 fallback 顯示「Day1 / 01」
> - `time`：當天行程的時間點，顯示在卡片左側的時間軸；子項目留空
> - `description`：**卡片外可直接看到**的簡短介紹（最多三行 line-clamp），對應舊版 `activities.desc`
> - `note`：**點開卡片後**才顯示的詳細說明，對應舊版 `activities.about`；支援 `\n` 換行
> - `hours`：營業時間（如 `10:00–18:00`），顯示在卡片底部的小 badge，景點/餐廳填，交通/住宿留空即可
> - `address`：地址或地名，點開詳情時顯示，也作為 Google Maps 導航的查詢字串（`link` 若有填則優先用 `link` 導航）
> - `parent`：**子項目專用**。填入父卡片的 `name` 欄位值（字串完全比對），有值的 row 不出現在主時間軸，改為顯示在父卡片 modal 的「街道亮點」section。子項目顯示順序：food → attraction → shopping（同類型保留 sheet row 順序）；主卡片底部自動出現「N 個亮點」badge

**`shopping` tab**

| `area` | `building` | `name` | `floor` | `hours` | `link` |
|---|---|---|---|---|---|

- `building` 空白：獨棟店，單獨顯示一個 block
- `building` 有值：該店屬於同名建築，合併顯示在同一個 block（第一筆該 building 名稱的 row 作為建築標頭，其 `hours`/`link` 代表整棟；後續同 building 的 rows 為子店面）

**`food` tab**

| `area` | `category` | `name` | `hours` | `desc` | `link` |
|---|---|---|---|---|---|

- `area`：用於浮動 tab 分區（若空白則不顯示 area tabs）
- `category`：用於分組標題（若空白則不分組）
- `desc`：店家描述，顯示在卡片下方（程式碼同時支援 `note` 欄位名稱）
- 若 `food` tab 無資料，fallback 為 `itinerary` 中 `type === 'food'` 的行程

---

## 5. Component 架構

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
│       └── LoadingSpinner.jsx       # 資料載入中的 loading 狀態
├── pages/
│   ├── HomePage.jsx                 # 行程列表頁
│   └── TripPage.jsx                 # 行程詳細頁（通用）
├── hooks/
│   ├── useSheetData.js              # fetch & parse 單一 tab CSV
│   └── useTrips.js                  # fetch index sheet，取得所有行程（reversed）
├── lib/
│   └── sheets.js                    # Google Sheets CSV 解析工具函式
├── trips/
│   └── tokyo-hokkaido-2026-03/
│       └── extras.jsx               # 求婚彩蛋（僅此行程）
└── App.jsx
```

> **已廢棄（保留檔案但不使用）：** `FlightSection.jsx`、`AccommodationSection.jsx`

### BottomSheet Props

| prop | type | 說明 |
|---|---|---|
| `isOpen` | boolean | 控制顯示 |
| `onClose` | () => void | 關閉回調 |
| `title` | string | 標題文字 |
| `noScroll` | boolean | 固定高度（`h-[79vh]`），子元件自行管理捲動，供浮動 tab 用 |
| `noStickyTitle` | boolean | 不顯示固定標題（標題由子元件自行在 scroll 區渲染） |

### 側邊欄選單（MENU_ITEMS）

| key | 說明 |
|---|---|
| `info` | 旅程資訊（航班 / 行前準備 / 住宿） |
| `checklist` | 行李清單 |
| `shopping` | 逛街清單 |
| `food` | 美食清單 |

### Trip Extras 機制

`TripPage.jsx` 在渲染時嘗試 dynamic import 該行程的 extras：

```js
const extras = await import(`../trips/${trip.slug}/extras.jsx`).catch(() => null)
```

找不到對應資料夾時回傳 `null`，不影響通用流程。`tokyo-hokkaido-2026-03/extras.jsx` 匯出：
- `easterEggDay`：number，觸發彩蛋的天數（Day 4）
- `HeartIcon`：愛心 icon 組件
- `ProposalModal`：求婚彩蛋 modal（Instagram 風格）

彩蛋觸發條件：在已選取的 `easterEggDay` 上**連續快速點擊 9 次**（每次間隔 < 2s）。

---

## 6. UI / Design System

### 設計語言
- **風格：** 日系 warm tone × Liquid Glass
- **底色：** `#F9F8F4`（米白）
- **Accent：** `#5C6E58`（抹茶綠）
- **文字色：** `#2C2C2C`（jp-text）、`stone` 系列
- **字型：** 全站統一 `"Noto Serif JP"`（font-serif），Google Fonts 透過 `<link>` 載入

### Liquid Glass 應用

| 元素 | 效果 |
|---|---|
| BottomSheet | `backdrop-filter: blur(16px) saturate(200%) contrast(120%)` + 白色半透明背景 |
| Sidebar | 同 BottomSheet，帶輕微磨砂質感邊框 |
| TripCard（首頁） | 封面圖上疊 glass 卡片，顯示行程名稱與日期 |
| 浮動 Tab | `liquid-tab-track` + `liquid-tab-btn`，支援水平滑動，active 態為 Liquid Bubble 效果 |
| 按鈕 | `liquid-glass-button` class |

### 靜態資源
圖片、音樂、影片等靜態資源放在 `public/trips/<slug>/` 下，以絕對路徑 `/trips/<slug>/images/D1.jpg` 存取。

---

## 7. 資料流與錯誤處理

```
useTrips()
  → fetch index CSV
  → parse → Trip[] → reverse()
  → 顯示行程卡片（loading / error state）

useSheetData(sheetId, tabName)
  → fetch tab CSV
  → parse → Row[]
  → 各 Section component 消費

錯誤情境：
- fetch 失敗（網路）→ 顯示 retry 按鈕
- Sheet 格式不符 → graceful fallback，顯示空 section，不 crash
- status = draft → 不在首頁顯示
```

---

## 8. 部署

**GitHub Actions workflow（`.github/workflows/deploy.yml`）：**

```
push to master
  → npm ci
  → npm run build（vite build）
  → actions/upload-pages-artifact（上傳 dist/）
  → actions/deploy-pages（直接部署，不產生 gh-pages 分支）
```

GitHub Pages 設定：**Source → GitHub Actions**（非 Deploy from a branch）。

`public/.nojekyll` 確保 GitHub Pages 不啟動 Jekyll。

---

## 9. 現有旅行資料遷移

| 行程 | 動作 |
|---|---|
| `202601-fukuoka` | 將 `data.js` 內容整理進新 Google Sheet |
| `202603-tokyo-hokkaido` | 同上；`ProposalEasterEgg` component 移至 `trips/tokyo-hokkaido-2026-03/extras.jsx` |
| 舊 CRA 子資料夾 | 待新站確認無誤後手動刪除 |

---

## 10. 不在此次範圍內

- 後端 / API server
- 使用者認證
- 評論或互動功能
- SEO 優化（非 GitHub Pages 靜態網站需求）
- 離線支援 / PWA
