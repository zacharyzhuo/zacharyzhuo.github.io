# Travel Site Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將多個獨立 CRA 旅遊網站重構為單一 Vite + React SPA，以 Google Sheets 為 CMS，新增行程只需填 Sheet。

**Architecture:** HashRouter SPA 部署於 GitHub Pages（`gh-pages` branch）。App 啟動時 fetch index sheet 取得行程列表，點入行程後 runtime fetch 各 tab CSV 渲染頁面。Trip extras（如求婚彩蛋）以 dynamic import 掛載，不在通用模板內。

**Tech Stack:** Vite 5、React 19、React Router v6（HashRouter）、Tailwind CSS v3、lucide-react、Vitest、@testing-library/react、msw v2、GitHub Actions

---

## 檔案結構（建立後）

```
zacharyzhuo.github.io/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css                          # 移植現有 glass CSS + 字型
│   ├── lib/
│   │   └── sheets.js                      # CSV parser + URL builder
│   ├── hooks/
│   │   ├── useSheetData.js                # fetch 單一 tab
│   │   └── useTrips.js                    # fetch index sheet
│   ├── components/
│   │   ├── ui/
│   │   │   └── LoadingSpinner.jsx
│   │   ├── layout/
│   │   │   ├── BottomSheet.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── home/
│   │   │   └── TripCard.jsx
│   │   └── trip/
│   │       ├── DayNav.jsx
│   │       ├── FlightSection.jsx
│   │       ├── ItinerarySection.jsx
│   │       ├── AccommodationSection.jsx
│   │       ├── ShoppingSection.jsx
│   │       └── ChecklistSection.jsx
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   └── TripPage.jsx
│   ├── trips/
│   │   └── tokyo-hokkaido-2026-03/
│   │       └── extras.jsx                 # ProposalEasterEgg（彩蛋）
│   └── __tests__/
│       ├── setup.js
│       ├── lib/
│       │   └── sheets.test.js
│       └── hooks/
│           ├── useSheetData.test.jsx
│           └── useTrips.test.jsx
├── public/
│   └── proposal-photos/                   # 從 202603-tokyo-hokkaido/public/ 移過來
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── .env.example
└── .github/
    └── workflows/
        └── deploy.yml
```

---

## Task 1：Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `.env.example`
- Create: `src/__tests__/setup.js`

- [ ] **Step 1: 在 repo 根目錄初始化 package.json**

```bash
cd /Users/zacharyzhuo/Documents/zacharyzhuo.github.io
```

建立 `package.json`（直接寫入，不執行 `npm init`）：

```json
{
  "name": "travel-diaries",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "lucide-react": "^0.562.0",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.23",
    "jsdom": "^25.0.1",
    "msw": "^2.7.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.1",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: 安裝所有 dependencies**

```bash
npm install
```

Expected: `node_modules/` 建立完成，無 peer dependency 錯誤。

- [ ] **Step 3: 建立 `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    globals: true,
  },
})
```

- [ ] **Step 4: 建立 `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'jp-bg': '#F9F8F4',
        'jp-text': '#2C2C2C',
        'jp-sub': '#666666',
        'jp-green': '#5C6E58',
        'jp-red': '#B93632',
        'jp-light-gray': '#E5E5E5',
      },
      fontFamily: {
        serif: ['"Noto Serif JP"', '"Hiragino Mincho ProN"', 'serif'],
        sans: ['"Noto Sans JP"', '"Hiragino Kaku Gothic ProN"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 5: 建立 `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: 建立 `index.html`**

```html
<!DOCTYPE html>
<html lang="zh-TW">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#F9F8F4" />
    <title>Trip Diaries</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 7: 建立 `src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 8: 建立 `.env.example`**

```
# 複製此檔為 .env 並填入你的 Google Sheet ID
VITE_INDEX_SHEET_ID=your_index_sheet_id_here
```

同時建立 `.env`（本機用，加入 .gitignore）：

```
VITE_INDEX_SHEET_ID=（填入你的 index sheet ID）
```

確認 `.gitignore` 有 `.env`（若無則加上）。

- [ ] **Step 9: 建立測試 setup 檔 `src/__tests__/setup.js`**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 10: 確認 dev server 可啟動**

```bash
npm run dev
```

Expected: `Local: http://localhost:5173/` — 空白頁無報錯即可（root 尚未建立）。`Ctrl+C` 停止。

- [ ] **Step 11: Commit**

```bash
git add package.json vite.config.js tailwind.config.js postcss.config.js index.html src/main.jsx .env.example src/__tests__/setup.js
git commit -m "feat: init vite + react project scaffold"
```

---

## Task 2：CSV Parser（`lib/sheets.js`）

**Files:**
- Create: `src/lib/sheets.js`
- Create: `src/__tests__/lib/sheets.test.js`

- [ ] **Step 1: 建立測試檔 `src/__tests__/lib/sheets.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { parseCSV, sheetURL } from '../../lib/sheets.js'

describe('parseCSV', () => {
  it('returns empty array for empty string', () => {
    expect(parseCSV('')).toEqual([])
  })

  it('returns empty array when only header row exists', () => {
    expect(parseCSV('"name","date"')).toEqual([])
  })

  it('parses simple quoted CSV', () => {
    const csv = '"name","date"\n"福岡","2026-01"'
    expect(parseCSV(csv)).toEqual([{ name: '福岡', date: '2026-01' }])
  })

  it('parses multiple rows', () => {
    const csv = '"a","b"\n"1","2"\n"3","4"'
    expect(parseCSV(csv)).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ])
  })

  it('handles commas inside quoted fields', () => {
    const csv = '"name","note"\n"A, B","has comma"'
    expect(parseCSV(csv)).toEqual([{ name: 'A, B', note: 'has comma' }])
  })

  it('handles escaped double quotes ("")', () => {
    const csv = '"name"\n"He said ""hi"""'
    expect(parseCSV(csv)).toEqual([{ name: 'He said "hi"' }])
  })

  it('handles empty fields', () => {
    const csv = '"a","b","c"\n"val","",""'
    expect(parseCSV(csv)).toEqual([{ a: 'val', b: '', c: '' }])
  })

  it('trims header whitespace', () => {
    const csv = '" name "," date "\n"foo","bar"'
    expect(parseCSV(csv)).toEqual([{ name: 'foo', date: 'bar' }])
  })
})

describe('sheetURL', () => {
  it('builds correct URL', () => {
    expect(sheetURL('ABC123', 'flights')).toBe(
      'https://docs.google.com/spreadsheets/d/ABC123/gviz/tq?tqx=out:csv&sheet=flights'
    )
  })

  it('URL-encodes tab names with spaces', () => {
    expect(sheetURL('ABC123', 'my sheet')).toBe(
      'https://docs.google.com/spreadsheets/d/ABC123/gviz/tq?tqx=out:csv&sheet=my%20sheet'
    )
  })
})
```

- [ ] **Step 2: 執行測試確認 FAIL**

```bash
npm test -- sheets.test.js
```

Expected: FAIL — `Cannot find module '../../lib/sheets.js'`

- [ ] **Step 3: 建立 `src/lib/sheets.js`**

```js
/**
 * 解析 Google Sheets gviz/tq CSV 格式
 * 第一行為 header，其後每行為一筆資料
 */
export function parseCSV(text) {
  const trimmed = text.trim()
  if (!trimmed) return []

  const lines = trimmed.split('\n')
  if (lines.length < 2) return []

  const headers = parseLine(lines[0]).map(h => h.trim())
  return lines.slice(1).map(line => {
    const values = parseLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

function parseLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

/**
 * 建立 Google Sheets public CSV 端點 URL
 */
export function sheetURL(sheetId, tabName) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`
}
```

- [ ] **Step 4: 執行測試確認全部 PASS**

```bash
npm test -- sheets.test.js
```

Expected: `✓ 10 tests passed`

- [ ] **Step 5: Commit**

```bash
git add src/lib/sheets.js src/__tests__/lib/sheets.test.js
git commit -m "feat: add Google Sheets CSV parser"
```

---

## Task 3：Data Hooks（`useSheetData` + `useTrips`）

**Files:**
- Create: `src/hooks/useSheetData.js`
- Create: `src/hooks/useTrips.js`
- Create: `src/__tests__/hooks/useSheetData.test.jsx`
- Create: `src/__tests__/hooks/useTrips.test.jsx`

- [ ] **Step 1: 建立 `src/__tests__/hooks/useSheetData.test.jsx`**

```jsx
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { useSheetData } from '../../hooks/useSheetData.js'

const SHEET_ID = 'test-sheet-123'
const CSV = '"name","time"\n"福岡","12:00"'
const BASE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`

const server = setupServer(
  http.get(BASE_URL, () => HttpResponse.text(CSV))
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useSheetData', () => {
  it('starts with loading=true', () => {
    const { result } = renderHook(() => useSheetData(SHEET_ID, 'flights'))
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('returns parsed data on success', async () => {
    const { result } = renderHook(() => useSheetData(SHEET_ID, 'flights'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([{ name: '福岡', time: '12:00' }])
    expect(result.current.error).toBeNull()
  })

  it('sets error on fetch failure', async () => {
    server.use(http.get(BASE_URL, () => HttpResponse.error()))
    const { result } = renderHook(() => useSheetData(SHEET_ID, 'flights'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
    expect(result.current.data).toEqual([])
  })

  it('does nothing when sheetId is empty', () => {
    const { result } = renderHook(() => useSheetData('', 'flights'))
    expect(result.current.loading).toBe(true)
  })
})
```

- [ ] **Step 2: 建立 `src/__tests__/hooks/useTrips.test.jsx`**

```jsx
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { useTrips } from '../../hooks/useTrips.js'

// mock env variable
vi.stubEnv('VITE_INDEX_SHEET_ID', 'index-sheet-id')

const INDEX_ID = 'index-sheet-id'
const BASE_URL = `https://docs.google.com/spreadsheets/d/${INDEX_ID}/gviz/tq`

const CSV_WITH_DRAFT = `"slug","name","dates","cover_image_url","sheet_id","status"\n"fukuoka-2026-01","福岡","2026/01/10 - 01/14","https://img.example.com/fuk.jpg","sheet-fuk","published"\n"draft-trip","Draft","2026/06","","sheet-draft","draft"`

const server = setupServer(
  http.get(BASE_URL, () => HttpResponse.text(CSV_WITH_DRAFT))
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useTrips', () => {
  it('returns only published trips', async () => {
    const { result } = renderHook(() => useTrips())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.trips).toHaveLength(1)
    expect(result.current.trips[0].slug).toBe('fukuoka-2026-01')
  })

  it('sets error on fetch failure', async () => {
    server.use(http.get(BASE_URL, () => HttpResponse.error()))
    const { result } = renderHook(() => useTrips())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBeNull()
  })
})
```

- [ ] **Step 3: 執行測試確認 FAIL**

```bash
npm test -- hooks/
```

Expected: FAIL — `Cannot find module`

- [ ] **Step 4: 建立 `src/hooks/useSheetData.js`**

```js
import { useState, useEffect } from 'react'
import { sheetURL, parseCSV } from '../lib/sheets.js'

export function useSheetData(sheetId, tabName) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!sheetId || !tabName) return
    setLoading(true)
    setError(null)

    fetch(sheetURL(sheetId, tabName))
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then(text => setData(parseCSV(text)))
      .catch(err => setError(err))
      .finally(() => setLoading(false))
  }, [sheetId, tabName])

  return { data, loading, error }
}
```

- [ ] **Step 5: 建立 `src/hooks/useTrips.js`**

```js
import { useState, useEffect } from 'react'
import { sheetURL, parseCSV } from '../lib/sheets.js'

const INDEX_SHEET_ID = import.meta.env.VITE_INDEX_SHEET_ID

export function useTrips() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(sheetURL(INDEX_SHEET_ID, 'trips'))
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then(text => {
        const rows = parseCSV(text)
        setTrips(rows.filter(r => r.status === 'published'))
      })
      .catch(err => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { trips, loading, error }
}
```

- [ ] **Step 6: 執行測試確認全部 PASS**

```bash
npm test -- hooks/
```

Expected: `✓ 6 tests passed`

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useSheetData.js src/hooks/useTrips.js src/__tests__/hooks/
git commit -m "feat: add useSheetData and useTrips hooks"
```

---

## Task 4：Design System（`index.css` + App shell）

**Files:**
- Create: `src/index.css`
- Create: `src/App.jsx`

- [ ] **Step 1: 建立 `src/index.css`**

將 `202603-tokyo-hokkaido/src/index.css` 整份複製，並在頂部保留 Tailwind directives：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 以下內容直接從 202603-tokyo-hokkaido/src/index.css 複製 */
/* Import Google Fonts ... */
/* 所有 glass-bottom-sheet、liquid-glass-button、animate-heart-* 等 CSS class 皆在此 */
```

> 注意：完整 CSS 已在 `202603-tokyo-hokkaido/src/index.css` 定義，直接複製貼上即可，無需修改。

- [ ] **Step 2: 建立 `src/App.jsx`（skeleton）**

```jsx
import { HashRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import TripPage from './pages/TripPage.jsx'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/trip/:slug" element={<TripPage />} />
      </Routes>
    </HashRouter>
  )
}
```

- [ ] **Step 3: 建立 placeholder pages（讓 App 可以 compile）**

建立 `src/pages/HomePage.jsx`：

```jsx
export default function HomePage() {
  return <div className="bg-jp-bg min-h-screen p-4 font-serif text-jp-text">Home</div>
}
```

建立 `src/pages/TripPage.jsx`：

```jsx
export default function TripPage() {
  return <div className="bg-jp-bg min-h-screen p-4 font-serif text-jp-text">Trip</div>
}
```

- [ ] **Step 4: 確認 dev server 渲染正確**

```bash
npm run dev
```

打開 `http://localhost:5173/` — 應看到米白背景 + "Home" 文字（正確字型）。
打開 `http://localhost:5173/#/trip/test` — 應看到 "Trip" 文字。`Ctrl+C` 停止。

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/App.jsx src/pages/HomePage.jsx src/pages/TripPage.jsx
git commit -m "feat: add design system CSS and app routing shell"
```

---

## Task 5：共用 UI — `LoadingSpinner` + `BottomSheet`

**Files:**
- Create: `src/components/ui/LoadingSpinner.jsx`
- Create: `src/components/layout/BottomSheet.jsx`

- [ ] **Step 1: 建立 `src/components/ui/LoadingSpinner.jsx`**

```jsx
export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-jp-green border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
```

- [ ] **Step 2: 建立 `src/components/layout/BottomSheet.jsx`**

BottomSheet 是共用元件，接收 `isOpen`、`onClose`、`title`、`children` props：

```jsx
import { X } from 'lucide-react'

export default function BottomSheet({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="glass-bottom-sheet min-h-[60vh] max-h-[79vh] flex flex-col relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 flex-shrink-0">
            <h2 className="text-xl font-serif font-bold text-jp-text">{title}</h2>
            <button
              onClick={onClose}
              className="p-3 liquid-glass-button rounded-full text-stone-500 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="關閉"
            >
              <X size={18} />
            </button>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide safe-area-bottom">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/LoadingSpinner.jsx src/components/layout/BottomSheet.jsx
git commit -m "feat: add LoadingSpinner and BottomSheet components"
```

---

## Task 6：`Sidebar` 元件

**Files:**
- Create: `src/components/layout/Sidebar.jsx`

Sidebar 展示所有可切換的 section，props：`isOpen`、`onClose`、`onSelect(sectionKey)`、`sections`（陣列）。

- [ ] **Step 1: 建立 `src/components/layout/Sidebar.jsx`**

```jsx
import { X } from 'lucide-react'

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSelect: (key: string) => void,
 *   sections: Array<{ key: string, label: string, subLabel: string, icon: React.ReactNode }>
 * }} props
 */
export default function Sidebar({ isOpen, onClose, onSelect, sections }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-64 glass-sidebar z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/20 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-serif font-bold text-jp-text">Trip Menu</h2>
          <button
            onClick={onClose}
            className="p-3 liquid-glass-button rounded-full text-stone-500 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="關閉選單"
          >
            <X size={18} />
          </button>
        </div>
        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-2 scrollbar-hide">
          {sections.map(({ key, label, subLabel, icon }) => (
            <button
              key={key}
              onClick={() => { onSelect(key); onClose() }}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/20 transition-all text-left group touch-manipulation min-h-[44px]"
            >
              <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center text-jp-green flex-shrink-0">
                {icon}
              </div>
              <div>
                <span className="block font-serif font-bold text-jp-text text-base">{label}</span>
                <span className="block text-xs text-stone-400 font-sans tracking-wide">{subLabel}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/Sidebar.jsx
git commit -m "feat: add Sidebar drawer component"
```

---

## Task 7：`HomePage` + `TripCard`

**Files:**
- Modify: `src/pages/HomePage.jsx`
- Create: `src/components/home/TripCard.jsx`

- [ ] **Step 1: 建立 `src/components/home/TripCard.jsx`**

TripCard 顯示封面圖 + Liquid Glass 疊層資訊，點擊導航至行程頁：

```jsx
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar } from 'lucide-react'

/**
 * @param {{ trip: { slug: string, name: string, dates: string, cover_image_url: string } }} props
 */
export default function TripCard({ trip }) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/trip/${trip.slug}`)}
      className="w-full relative rounded-2xl overflow-hidden h-56 touch-manipulation group"
      aria-label={`查看 ${trip.name} 行程`}
    >
      {/* Cover image */}
      {trip.cover_image_url ? (
        <img
          src={trip.cover_image_url}
          alt={trip.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-stone-200" />
      )}

      {/* Glass info overlay — bottom */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="liquid-glass-button rounded-xl p-4 text-left">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={14} className="text-jp-green flex-shrink-0" />
            <h3 className="font-serif font-bold text-jp-text text-lg leading-tight">{trip.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-stone-400 flex-shrink-0" />
            <span className="text-xs text-stone-500 font-sans">{trip.dates}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
```

- [ ] **Step 2: 更新 `src/pages/HomePage.jsx`**

```jsx
import { useTrips } from '../hooks/useTrips.js'
import TripCard from '../components/home/TripCard.jsx'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'

export default function HomePage() {
  const { trips, loading, error } = useTrips()

  return (
    <div className="bg-jp-bg min-h-screen safe-area-inset">
      {/* Header */}
      <header className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-serif font-bold text-jp-text">Trip Diaries</h1>
        <p className="text-sm text-jp-sub font-sans mt-1">旅行記錄</p>
      </header>

      {/* Content */}
      <main className="px-4 pb-8">
        {loading && <LoadingSpinner />}

        {error && (
          <div className="flex flex-col items-center gap-4 mt-12 text-center px-6">
            <p className="text-jp-sub font-sans text-sm">無法載入行程資料</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-jp-green text-white rounded-xl font-sans text-sm touch-manipulation"
            >
              重試
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {trips.map(trip => (
              <TripCard key={trip.slug} trip={trip} />
            ))}
            {trips.length === 0 && (
              <p className="text-center text-jp-sub font-sans text-sm mt-12">尚無行程</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: 啟動 dev server 確認首頁渲染**

```bash
npm run dev
```

打開 `http://localhost:5173/` — 應看到行程列表（需已設定 `.env` 的 `VITE_INDEX_SHEET_ID` 指向有資料的 sheet）。若 sheet 尚未建立，`error` 狀態會顯示「重試」按鈕，屬正常。

- [ ] **Step 4: Commit**

```bash
git add src/components/home/TripCard.jsx src/pages/HomePage.jsx
git commit -m "feat: add HomePage and TripCard with Liquid Glass overlay"
```

---

## Task 8：`TripPage` shell + `DayNav`

**Files:**
- Modify: `src/pages/TripPage.jsx`
- Create: `src/components/trip/DayNav.jsx`

- [ ] **Step 1: 建立 `src/components/trip/DayNav.jsx`**

DayNav 是頂部橫向日期選擇列，支援 sticky + glass 效果：

```jsx
import { useRef, useEffect } from 'react'

/**
 * @param {{
 *   days: Array<{ day: number, date: string }>,
 *   activeDay: number,
 *   onSelect: (day: number) => void,
 *   easterEggIcon?: React.ReactNode   // 選填：特定天的 icon 替換（彩蛋用）
 *   easterEggDay?: number
 * }} props
 */
export default function DayNav({ days, activeDay, onSelect, easterEggIcon, easterEggDay }) {
  const scrollRef = useRef(null)

  // 切換天時自動 scroll 到 active button
  useEffect(() => {
    if (!scrollRef.current) return
    const activeBtn = scrollRef.current.querySelector('[data-active="true"]')
    activeBtn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeDay])

  return (
    <div className="sticky top-0 z-20 border-b border-stone-200/50 bg-jp-bg/80 backdrop-filter backdrop-blur-sm">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide px-4 py-3 gap-2"
      >
        {days.map(({ day, date }) => {
          const isActive = activeDay === day
          const isEasterDay = easterEggDay !== undefined && day === easterEggDay

          return (
            <button
              key={day}
              data-active={isActive}
              onClick={() => onSelect(day)}
              className={`flex flex-col items-center min-w-[4rem] px-2 py-2 rounded-xl transition-all touch-manipulation flex-shrink-0 ${
                isActive ? 'liquid-glass-button' : 'hover:bg-white/30'
              }`}
              aria-label={`選擇第 ${day} 天`}
            >
              {isEasterDay && easterEggIcon ? (
                easterEggIcon
              ) : (
                <span className={`text-sm font-serif font-bold ${isActive ? 'text-jp-text' : 'text-stone-400'}`}>
                  Day {day}
                </span>
              )}
              <span className="text-xs font-sans text-stone-400 mt-0.5">{date}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 更新 `src/pages/TripPage.jsx`**

```jsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Menu, ArrowLeft, Info, Plane, Hotel, ShoppingBag, ClipboardList } from 'lucide-react'
import { useTrips } from '../hooks/useTrips.js'
import { useSheetData } from '../hooks/useSheetData.js'
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx'
import Sidebar from '../components/layout/Sidebar.jsx'
import DayNav from '../components/trip/DayNav.jsx'
import FlightSection from '../components/trip/FlightSection.jsx'
import ItinerarySection from '../components/trip/ItinerarySection.jsx'
import AccommodationSection from '../components/trip/AccommodationSection.jsx'
import ShoppingSection from '../components/trip/ShoppingSection.jsx'
import ChecklistSection from '../components/trip/ChecklistSection.jsx'

const SECTIONS = [
  { key: 'info', label: '旅程資訊', subLabel: 'Flight & Info', icon: <Info size={20} /> },
  { key: 'itinerary', label: '每日行程', subLabel: 'Itinerary', icon: <Plane size={20} /> },
  { key: 'accommodation', label: '住宿', subLabel: 'Accommodation', icon: <Hotel size={20} /> },
  { key: 'shopping', label: '購物清單', subLabel: 'Shopping', icon: <ShoppingBag size={20} /> },
  { key: 'checklist', label: '打包清單', subLabel: 'Checklist', icon: <ClipboardList size={20} /> },
]

export default function TripPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { trips, loading: tripsLoading } = useTrips()
  const trip = trips.find(t => t.slug === slug)

  const [activeSection, setActiveSection] = useState('itinerary')
  const [activeDay, setActiveDay] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { data: flights, loading: flightsLoading } = useSheetData(trip?.sheet_id, 'flights')
  const { data: itinerary, loading: itineraryLoading } = useSheetData(trip?.sheet_id, 'itinerary')
  const { data: accommodation } = useSheetData(trip?.sheet_id, 'accommodation')
  const { data: shopping } = useSheetData(trip?.sheet_id, 'shopping')
  const { data: checklist } = useSheetData(trip?.sheet_id, 'checklist')

  // 計算行程天數列表
  const days = [...new Set(itinerary.map(r => Number(r.day)))]
    .sort((a, b) => a - b)
    .map(day => {
      const row = itinerary.find(r => Number(r.day) === day)
      return { day, date: row?.date ?? '' }
    })

  if (tripsLoading || flightsLoading || itineraryLoading) {
    return <div className="bg-jp-bg min-h-screen safe-area-inset"><LoadingSpinner /></div>
  }

  if (!trip) {
    return (
      <div className="bg-jp-bg min-h-screen safe-area-inset flex flex-col items-center justify-center gap-4">
        <p className="text-jp-sub font-sans">找不到此行程</p>
        <button onClick={() => navigate('/')} className="text-jp-green font-sans text-sm underline">
          返回首頁
        </button>
      </div>
    )
  }

  return (
    <div className="bg-jp-bg min-h-screen safe-area-inset">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-jp-bg/80 backdrop-blur-sm border-b border-stone-100">
        <button
          onClick={() => navigate('/')}
          className="p-2 touch-manipulation"
          aria-label="返回"
        >
          <ArrowLeft size={20} className="text-jp-text" />
        </button>
        <h1 className="font-serif font-bold text-jp-text">{trip.name}</h1>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 touch-manipulation"
          aria-label="開啟選單"
        >
          <Menu size={20} className="text-jp-text" />
        </button>
      </div>

      {/* Day Nav（只在 itinerary section 顯示）*/}
      {activeSection === 'itinerary' && days.length > 0 && (
        <DayNav days={days} activeDay={activeDay} onSelect={setActiveDay} />
      )}

      {/* Section Content */}
      <main className="pb-8">
        {activeSection === 'info' && <FlightSection flights={flights} trip={trip} />}
        {activeSection === 'itinerary' && (
          <ItinerarySection
            rows={itinerary.filter(r => Number(r.day) === activeDay)}
          />
        )}
        {activeSection === 'accommodation' && <AccommodationSection rows={accommodation} />}
        {activeSection === 'shopping' && <ShoppingSection rows={shopping} />}
        {activeSection === 'checklist' && <ChecklistSection rows={checklist} />}
      </main>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={setActiveSection}
        sections={SECTIONS}
      />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/trip/DayNav.jsx src/pages/TripPage.jsx
git commit -m "feat: add TripPage shell and DayNav component"
```

---

## Task 9：`FlightSection`

**Files:**
- Create: `src/components/trip/FlightSection.jsx`

- [ ] **Step 1: 建立 `src/components/trip/FlightSection.jsx`**

```jsx
import { Plane, ExternalLink } from 'lucide-react'

/**
 * @param {{
 *   flights: Array<{ date: string, route: string, time: string, flight_no: string }>,
 *   trip: { name: string, dates: string }
 * }} props
 */
export default function FlightSection({ flights, trip }) {
  return (
    <div className="px-4 py-6 space-y-4">
      {/* Trip Info Header */}
      <div className="bg-white/60 rounded-2xl p-5 border border-stone-100">
        <h2 className="font-serif font-bold text-jp-text text-lg mb-1">{trip.name}</h2>
        <p className="text-sm text-jp-sub font-sans">{trip.dates}</p>
      </div>

      {/* Flight Cards */}
      {flights.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-serif font-bold text-jp-text px-1">航班資訊</h3>
          {flights.map((f, i) => (
            <div key={i} className="bg-white/60 rounded-2xl p-5 border border-stone-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <Plane size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="font-sans text-xs text-stone-400">{f.date}</p>
                  <p className="font-serif font-bold text-jp-text">{f.route}</p>
                </div>
              </div>
              <p className="text-sm font-sans text-jp-sub">{f.time}</p>
              <p className="text-sm font-sans text-stone-400 mt-1">{f.flight_no}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/trip/FlightSection.jsx
git commit -m "feat: add FlightSection component"
```

---

## Task 10：`ItinerarySection`

**Files:**
- Create: `src/components/trip/ItinerarySection.jsx`

`type` 對應 icon 的對照表：`flight` → Plane、`hotel` → Hotel、`food` → Utensils、`sightseeing` → Camera、`shopping` → ShoppingBag、`transport` → Train、`activity` → MapPin（預設）。

- [ ] **Step 1: 建立 `src/components/trip/ItinerarySection.jsx`**

```jsx
import {
  Plane, Hotel, Utensils, Camera, ShoppingBag, Train, MapPin, ExternalLink, Clock
} from 'lucide-react'

const TYPE_ICON = {
  flight: Plane,
  hotel: Hotel,
  food: Utensils,
  sightseeing: Camera,
  shopping: ShoppingBag,
  transport: Train,
}

const TYPE_COLOR = {
  flight: 'bg-blue-50 text-blue-500',
  hotel: 'bg-purple-50 text-purple-500',
  food: 'bg-orange-50 text-orange-500',
  sightseeing: 'bg-green-50 text-green-600',
  shopping: 'bg-pink-50 text-pink-500',
  transport: 'bg-gray-50 text-gray-500',
}

/**
 * @param {{ rows: Array<{ time: string, name: string, type: string, address: string, link: string, note: string }> }} props
 */
export default function ItinerarySection({ rows }) {
  if (rows.length === 0) {
    return <p className="text-center text-jp-sub font-sans text-sm mt-12">此天尚無行程資料</p>
  }

  return (
    <div className="px-4 py-6 space-y-3">
      {rows.map((row, i) => {
        const Icon = TYPE_ICON[row.type] ?? MapPin
        const colorClass = TYPE_COLOR[row.type] ?? 'bg-stone-50 text-stone-500'

        return (
          <div key={i} className="bg-white/60 rounded-2xl p-5 border border-stone-100">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {row.time && (
                    <span className="flex items-center gap-1 text-xs text-stone-400 font-sans">
                      <Clock size={11} />
                      {row.time}
                    </span>
                  )}
                </div>
                <p className="font-serif font-bold text-jp-text text-base leading-snug">{row.name}</p>
                {row.address && (
                  <p className="text-xs text-jp-sub font-sans mt-1 truncate">{row.address}</p>
                )}
                {row.note && (
                  <p className="text-xs text-stone-400 font-sans mt-2 leading-relaxed">{row.note}</p>
                )}
                {row.link && (
                  <a
                    href={row.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-jp-green font-sans touch-manipulation"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink size={11} />
                    Google Maps
                  </a>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/trip/ItinerarySection.jsx
git commit -m "feat: add ItinerarySection component"
```

---

## Task 11：`AccommodationSection`

**Files:**
- Create: `src/components/trip/AccommodationSection.jsx`

- [ ] **Step 1: 建立 `src/components/trip/AccommodationSection.jsx`**

```jsx
import { Hotel, ExternalLink, Clock } from 'lucide-react'

/**
 * @param {{ rows: Array<{ day: string, name: string, address: string, check_in: string, check_out: string, link: string }> }} props
 */
export default function AccommodationSection({ rows }) {
  if (rows.length === 0) {
    return <p className="text-center text-jp-sub font-sans text-sm mt-12">尚無住宿資料</p>
  }

  return (
    <div className="px-4 py-6 space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="bg-white/60 rounded-2xl p-5 border border-stone-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Hotel size={18} className="text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-stone-400 font-sans mb-1">Day {row.day}</p>
              <p className="font-serif font-bold text-jp-text text-base">{row.name}</p>
              {row.address && (
                <p className="text-xs text-jp-sub font-sans mt-1">{row.address}</p>
              )}
              <div className="flex items-center gap-4 mt-2">
                {row.check_in && (
                  <span className="flex items-center gap-1 text-xs text-stone-400 font-sans">
                    <Clock size={11} /> IN {row.check_in}
                  </span>
                )}
                {row.check_out && (
                  <span className="flex items-center gap-1 text-xs text-stone-400 font-sans">
                    <Clock size={11} /> OUT {row.check_out}
                  </span>
                )}
              </div>
              {row.link && (
                <a
                  href={row.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-jp-green font-sans touch-manipulation"
                >
                  <ExternalLink size={11} />
                  查看地圖
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/trip/AccommodationSection.jsx
git commit -m "feat: add AccommodationSection component"
```

---

## Task 12：`ShoppingSection`

**Files:**
- Create: `src/components/trip/ShoppingSection.jsx`

Shopping 資料按 `area` 分組，`is_building === 'TRUE'` 的店家為百貨/複合式建築（顯示 `building` 欄位）。

- [ ] **Step 1: 建立 `src/components/trip/ShoppingSection.jsx`**

```jsx
import { ShoppingBag, ExternalLink, Clock, Building2 } from 'lucide-react'

/**
 * @param {{ rows: Array<{ area: string, building: string, name: string, floor: string, hours: string, link: string, is_building: string }> }} props
 */
export default function ShoppingSection({ rows }) {
  if (rows.length === 0) {
    return <p className="text-center text-jp-sub font-sans text-sm mt-12">尚無購物清單</p>
  }

  // 按 area 分組
  const byArea = rows.reduce((acc, row) => {
    const area = row.area || '其他'
    if (!acc[area]) acc[area] = []
    acc[area].push(row)
    return acc
  }, {})

  return (
    <div className="px-4 py-6 space-y-6">
      {Object.entries(byArea).map(([area, items]) => (
        <div key={area}>
          <h3 className="font-serif font-bold text-jp-text text-base px-1 mb-3">{area}</h3>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="bg-white/60 rounded-2xl p-5 border border-stone-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0">
                    {item.is_building === 'TRUE' ? (
                      <Building2 size={18} className="text-pink-400" />
                    ) : (
                      <ShoppingBag size={18} className="text-pink-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    {item.building && item.is_building !== 'TRUE' && (
                      <p className="text-xs text-stone-400 font-sans mb-0.5">{item.building}</p>
                    )}
                    <p className="font-serif font-bold text-jp-text">{item.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {item.floor && (
                        <span className="text-xs text-jp-sub font-sans">{item.floor}</span>
                      )}
                      {item.hours && (
                        <span className="flex items-center gap-1 text-xs text-stone-400 font-sans">
                          <Clock size={11} /> {item.hours}
                        </span>
                      )}
                    </div>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-jp-green font-sans touch-manipulation"
                      >
                        <ExternalLink size={11} />
                        Google Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/trip/ShoppingSection.jsx
git commit -m "feat: add ShoppingSection component"
```

---

## Task 13：`ChecklistSection`

**Files:**
- Create: `src/components/trip/ChecklistSection.jsx`

Checklist 按 `category` 分組，用戶可打勾（本地 state，不回寫 Sheet）。

- [ ] **Step 1: 建立 `src/components/trip/ChecklistSection.jsx`**

```jsx
import { useState } from 'react'
import { Check } from 'lucide-react'

/**
 * @param {{ rows: Array<{ category: string, item: string }> }} props
 */
export default function ChecklistSection({ rows }) {
  const [checked, setChecked] = useState(new Set())

  if (rows.length === 0) {
    return <p className="text-center text-jp-sub font-sans text-sm mt-12">尚無打包清單</p>
  }

  const toggle = (key) => {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // 按 category 分組
  const byCategory = rows.reduce((acc, row) => {
    const cat = row.category || '其他'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(row.item)
    return acc
  }, {})

  return (
    <div className="px-4 py-6 space-y-6">
      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category}>
          <h3 className="font-serif font-bold text-jp-text text-base px-1 mb-3">{category}</h3>
          <div className="bg-white/60 rounded-2xl border border-stone-100 divide-y divide-stone-100">
            {items.map((item, i) => {
              const key = `${category}:${item}`
              const isChecked = checked.has(key)
              return (
                <button
                  key={i}
                  onClick={() => toggle(key)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left touch-manipulation"
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isChecked ? 'bg-jp-green border-jp-green' : 'border-stone-300'
                  }`}>
                    {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className={`font-sans text-sm transition-colors ${
                    isChecked ? 'line-through text-stone-400' : 'text-jp-text'
                  }`}>
                    {item}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/trip/ChecklistSection.jsx
git commit -m "feat: add ChecklistSection with local toggle state"
```

---

## Task 14：Trip Extras — ProposalEasterEgg 移植

**Files:**
- Create: `src/trips/tokyo-hokkaido-2026-03/extras.jsx`
- Modify: `src/pages/TripPage.jsx`（加入 dynamic import）
- Modify: `src/components/trip/DayNav.jsx`（已支援 `easterEggIcon` prop）

- [ ] **Step 1: 移植 `public/proposal-photos/`**

```bash
cp -r 202603-tokyo-hokkaido/public/proposal-photos public/proposal-photos
```

- [ ] **Step 2: 建立 `src/trips/tokyo-hokkaido-2026-03/extras.jsx`**

從 `202603-tokyo-hokkaido/src/App.js` 擷取以下內容，移入此檔：

- `PROPOSAL_PHOTOS` 陣列（將 `process.env.PUBLIC_URL` 改為 `import.meta.env.BASE_URL`）
- `isVideoUrl` 函式
- `ProposalModal` component（完整複製，無需修改邏輯）

檔案結構：

```jsx
import React, { useState, useEffect } from 'react'
import { Heart, X, Send, Music } from 'lucide-react'

const PROPOSAL_PHOTOS = [
  `${import.meta.env.BASE_URL}proposal-photos/1.MOV`,
  `${import.meta.env.BASE_URL}proposal-photos/2.MOV`,
  // ... 完整列表從原 App.js 複製
]

const isVideoUrl = (url) => /\.(mov|mp4|webm)(\?|$)/i.test(url || '')

// ProposalModal：完整從 202603-tokyo-hokkaido/src/App.js 複製
const ProposalModal = ({ isOpen, onClose, heartPosition }) => {
  // ... 完整複製原始碼，無需修改
}

// EasterEgg Day config（Day 4 = 求婚日）
const EASTER_EGG_DAY = 4

/**
 * extras.jsx export 格式：
 * {
 *   easterEggDay: number,                         // 哪天觸發
 *   DayIcon: React.Component,                     // DayNav 顯示的特殊 icon
 *   Panel: React.Component,                       // 觸發後顯示的 modal/panel
 * }
 */

function HeartIcon({ activated }) {
  return (
    <Heart
      size={32}
      className={activated ? 'animate-heart-pop-shake' : ''}
      style={{ color: '#89CFF0', fill: activated ? '#89CFF0' : 'none' }}
    />
  )
}

export default {
  easterEggDay: EASTER_EGG_DAY,
  HeartIcon,
  ProposalModal,
}
```

- [ ] **Step 3: 在 `TripPage.jsx` 加入 dynamic import 與彩蛋邏輯**

在 `TripPage` 的 import 區後方，加入：

```js
import { useEffect, useState, lazy, Suspense } from 'react'
```

在 component 內加入 state 與 dynamic import：

```js
const [extras, setExtras] = useState(null)
const [easterEggOpen, setEasterEggOpen] = useState(false)
const [heartPosition, setHeartPosition] = useState(null)
const [easterEggActivated, setEasterEggActivated] = useState(false)

useEffect(() => {
  if (!slug) return
  import(`../trips/${slug}/extras.jsx`)
    .then(m => setExtras(m.default))
    .catch(() => setExtras(null))  // 找不到 extras → 靜默忽略
}, [slug])
```

DayNav 改為傳入 easterEgg props：

```jsx
{activeSection === 'itinerary' && days.length > 0 && (
  <DayNav
    days={days}
    activeDay={activeDay}
    onSelect={(day) => {
      setActiveDay(day)
      if (extras && day === extras.easterEggDay) {
        setEasterEggActivated(true)
      }
    }}
    easterEggDay={extras?.easterEggDay}
    easterEggIcon={
      extras && easterEggActivated ? (
        <button
          onClick={(e) => {
            setHeartPosition({ x: e.clientX, y: e.clientY })
            setEasterEggOpen(true)
          }}
        >
          <extras.HeartIcon activated />
        </button>
      ) : null
    }
  />
)}

{/* Easter Egg Modal */}
{extras?.ProposalModal && (
  <extras.ProposalModal
    isOpen={easterEggOpen}
    onClose={() => setEasterEggOpen(false)}
    heartPosition={heartPosition}
  />
)}
```

- [ ] **Step 4: 確認彩蛋在 dev 環境正常運作**

```bash
npm run dev
```

打開 tokyo-hokkaido 行程 → 切到 Day 4 → 確認心形 icon 出現 → 點擊 → 確認 ProposalModal 開啟並播放 BGM。

- [ ] **Step 5: Commit**

```bash
git add src/trips/ public/proposal-photos/ src/pages/TripPage.jsx
git commit -m "feat: migrate ProposalEasterEgg to trip extras system"
```

---

## Task 15：GitHub Actions 自動部署

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: 建立 `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_INDEX_SHEET_ID: ${{ secrets.VITE_INDEX_SHEET_ID }}

      - name: Deploy to gh-pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: gh-pages
```

- [ ] **Step 2: 在 GitHub repo 設定 Secret**

到 GitHub repo → Settings → Secrets and variables → Actions → New repository secret：
- Name: `VITE_INDEX_SHEET_ID`
- Value: 你的 index Google Sheet ID

- [ ] **Step 3: 在 GitHub repo 設定 Pages 來源**

Settings → Pages → Source 選 **Deploy from a branch** → Branch 選 `gh-pages` → `/` (root)。

- [ ] **Step 4: Commit 並確認 Action 觸發**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions deploy workflow"
git push origin master
```

到 GitHub Actions tab 確認 workflow 執行成功，`gh-pages` branch 被建立。

---

## Task 16：Google Sheets 資料遷移

這個 task 沒有程式碼，是手動操作步驟。

- [ ] **Step 1: 建立 Index Sheet**

在 Google Drive 新建 Spreadsheet，命名為「Trip Diaries - Index」。
將 tab 重命名為 `trips`，第一列設定 headers：

```
slug | name | dates | cover_image_url | sheet_id | status
```

- [ ] **Step 2: 建立福岡行程 Sheet**

新建 Spreadsheet，命名「202601 福岡」。建立 5 個 tab：`flights`、`itinerary`、`accommodation`、`shopping`、`checklist`。

將 `202601-fukuoka/src/data.js` 的資料逐一填入對應 tab，依照 spec 第 4 節的欄位格式。

- [ ] **Step 3: 建立東京・北海道行程 Sheet**

同上，從 `202603-tokyo-hokkaido/src/data.js` 遷移資料。

- [ ] **Step 4: 設定所有 Sheet 為「任何人可以查看（限定人可編輯）」**

每個 Sheet → Share → General access → Anyone with the link → Viewer。

- [ ] **Step 5: 將兩個行程的 Sheet ID 填入 Index Sheet**

Sheet ID 在網址中取得：`https://docs.google.com/spreadsheets/d/**{SHEET_ID}**/edit`

在 Index Sheet 的 `trips` tab 新增兩行，`status` 欄填 `published`。

- [ ] **Step 6: 將 Index Sheet ID 設為環境變數**

更新本機 `.env`：
```
VITE_INDEX_SHEET_ID=（Index Sheet 的 ID）
```

更新 GitHub Secrets：`VITE_INDEX_SHEET_ID`

- [ ] **Step 7: 確認整個 app 從 Sheet 正確讀取資料**

```bash
npm run dev
```

確認：首頁顯示兩個行程卡片 → 點入確認各 section 資料正確 → tokyo-hokkaido 的彩蛋可觸發。

- [ ] **Step 8: 最終 build 確認**

```bash
npm run build
npm run preview
```

確認 production build 無錯誤，`http://localhost:4173/` 正常渲染。

---

## 完成後清理

- [ ] 確認新網站正常運作後，刪除舊 CRA 子資料夾：

```bash
rm -rf 202601-fukuoka 202603-tokyo-hokkaido
git add -A
git commit -m "chore: remove legacy CRA sub-projects"
```
