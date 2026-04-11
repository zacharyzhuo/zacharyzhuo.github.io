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
| 部署 | GitHub Actions → gh-pages branch | 自動化取代手動 `cp -R build/* ../` |

---

## 3. 整體架構

```
Google Sheets (Public)
├── Index Sheet        → 所有行程清單
└── 每趟行程 Sheet     → flights / itinerary / accommodation / shopping / checklist

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

### 4.2 每趟行程 Sheet（固定 5 個 tab）

**`flights` tab**

| `date` | `route` | `time` | `flight_no` |
|---|---|---|---|
| 01/10 | TPE -> FUK | 12:40 - 16:00 | AirAsia AK 1510 |

**`itinerary` tab**

| `day` | `date` | `time` | `name` | `type` | `address` | `link` | `note` |
|---|---|---|---|---|---|---|---|
| 1 | 01/10 (五) | 12:40 | 搭機 | flight | | | |

`type` 可選值：`flight`、`hotel`、`food`、`sightseeing`、`shopping`、`transport`、`activity`

**`accommodation` tab**

| `day` | `name` | `address` | `check_in` | `check_out` | `link` |
|---|---|---|---|---|---|

**`shopping` tab**

| `area` | `building` | `name` | `floor` | `hours` | `link` | `is_building` |
|---|---|---|---|---|---|---|

**`checklist` tab**

| `category` | `item` |
|---|---|
| Money | 外幣 |
| Money | 護照 |

---

## 5. Component 架構

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx              # 抽屜導航
│   │   └── BottomSheet.jsx          # 共用底部彈出層
│   ├── home/
│   │   └── TripCard.jsx             # 首頁行程卡片（Liquid Glass 風格）
│   ├── trip/
│   │   ├── DayNav.jsx               # 日期橫向導航列
│   │   ├── FlightSection.jsx        # 航班資訊
│   │   ├── ItinerarySection.jsx     # 每日行程
│   │   ├── AccommodationSection.jsx # 住宿
│   │   ├── ShoppingSection.jsx      # 購物清單
│   │   └── ChecklistSection.jsx     # 打包清單
│   └── ui/
│       └── LoadingSpinner.jsx       # 資料載入中的 loading 狀態
├── pages/
│   ├── HomePage.jsx                 # 行程列表頁
│   └── TripPage.jsx                 # 行程詳細頁（通用）
├── hooks/
│   ├── useSheetData.js              # fetch & parse 單一 tab CSV
│   └── useTrips.js                  # fetch index sheet，取得所有行程
├── lib/
│   └── sheets.js                    # Google Sheets CSV 解析工具函式
├── trips/
│   └── tokyo-hokkaido-2026-03/
│       └── extras.jsx               # 求婚彩蛋（僅此行程）
└── App.jsx
```

### Trip Extras 機制

`TripPage.jsx` 在渲染時嘗試 dynamic import 該行程的 extras：

```js
const extras = await import(`../trips/${trip.slug}/extras.jsx`).catch(() => null)
```

找不到對應資料夾時回傳 `null`，不影響通用流程。`tokyo-hokkaido-2026-03/extras.jsx` 匯出 `ProposalEasterEgg` component，其邏輯直接從現有 `App.js` 移植。

---

## 6. UI / Design System

### 設計語言
- **風格：** 日系 warm tone × Liquid Glass
- **底色：** `#FDFBF9`（米白）
- **Accent：** `#6B9080`（抹茶綠）
- **文字色：** `stone` 系列
- **字型：** serif 標題 + sans-serif 內文

### Liquid Glass 應用

| 元素 | 效果 |
|---|---|
| BottomSheet | `backdrop-filter: blur(24px) saturate(180%)` + 白色半透明背景 |
| Sidebar | 同 BottomSheet，帶輕微磨砂質感邊框 |
| TripCard（首頁） | 封面圖上疊 glass 卡片，顯示行程名稱與日期 |
| DayNav | sticky 時啟用 glass 效果，透視下方內容 |
| 按鈕 | `liquid-glass-button` class（沿用 tokyo-hokkaido 現有實作） |

實作使用 Tailwind CSS 自訂 utility class，搭配 `liquid-glass-design` skill。

---

## 7. 資料流與錯誤處理

```
useTrips()
  → fetch index CSV
  → parse → Trip[]
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
  → 將 dist/ 推到 gh-pages branch
```

取代現有手動 `npm run build && cp -R build/* ../` 流程。

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
