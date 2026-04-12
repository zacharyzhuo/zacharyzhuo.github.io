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

## Architecture Overview

這是 Vite + React SPA，以 Google Sheets 作為 CMS，部署於 GitHub Pages。

### 資料流

```
Google Sheets (Public) → gviz/tq CSV → useSheetData() → Section component
```

- `src/lib/sheets.js` — CSV 解析工具（`parseCSV`、`sheetURL`）
- `src/hooks/useSheetData.js` — fetch 單一 Sheet tab 的 React hook
- `src/hooks/useTrips.js` — fetch index sheet，取得所有行程清單（已 reverse）
- Routing 使用 **Hash mode**（`/#/`、`/#/trip/:slug`），以相容 GitHub Pages

### 行程資料 Sheet 欄位

`itinerary` tab 的關鍵欄位：

| 欄位 | 說明 |
|---|---|
| `description` | 卡片外直接可見的簡短介紹（line-clamp），對應舊版 `activities.desc` |
| `note` | 點開卡片後才顯示的詳細說明，支援 `\n` 換行，對應舊版 `activities.about` |
| `parent` | 子項目填入父卡片 `name`，子項目不出現在主時間軸，改顯示在父卡片 modal 的「亮點」區 |
| `hours` | 營業時間，顯示於卡片底部的小 badge |
| `address` | Google Maps 導航查詢字串（`link` 有值時優先用 `link`） |

子項目在父卡片 modal 的排序：`food → attraction → shopping`（同類保留 sheet row 順序）。

### UI / Design System

- **底色**：`#F9F8F4`（米白）
- **Accent**：`#5C6E58`（抹茶綠）
- **字型**：全站 `"Noto Serif JP"`（font-serif），所有文字元素應帶 `font-serif`
- **Liquid Glass**：BottomSheet、Sidebar、浮動 Tab 使用 `backdrop-filter: blur(16px) saturate(200%) contrast(120%)` + 白色半透明背景
- CSS utility classes：`liquid-tab-track`、`liquid-tab-btn`、`liquid-glass-button`、`.safe-area-inset`、`.safe-area-bottom`

### Trip Extras 機制（求婚彩蛋）

`TripPage.jsx` 在渲染時嘗試 dynamic import：

```js
const extras = await import(`../trips/${trip.slug}/extras.jsx`).catch(() => null)
```

目前只有 `trips/tokyo-hokkaido-2026-03/extras.jsx` 有此檔案。找不到時回傳 `null`，不影響通用流程。

### BottomSheet 重要 Props

| prop | 說明 |
|---|---|
| `noScroll` | 固定高度 `h-[79vh]`，子元件自行管理捲動，供浮動 tab 使用 |
| `noStickyTitle` | 不顯示固定標題，由子元件在 scroll 區自行渲染標題 |

### 靜態資源路徑

圖片、音樂等靜態資源放於 `public/trips/<slug>/`，以絕對路徑存取：`/trips/<slug>/images/D1.jpg`


## 部署

GitHub Actions push to master → Vite build → 部署至 GitHub Pages（非 `gh-pages` 分支）。  
`public/.nojekyll` 防止 GitHub Pages 啟動 Jekyll。
