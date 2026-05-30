# 側邊欄即時匯率 Widget — 設計文件

- 日期：2026-05-31
- 狀態：已核可（設計）
- 範圍：在側邊欄底部加入依目的地國家自動換算的台幣匯率顯示

## 目標

在 Sidebar 底部（「回行程列表」按鈕上方）顯示該行程目的地幣別對台幣的匯率，讓使用者旅途中能快速心算花費。國家碼取自 index sheet 既有的 `destination_country` 欄位，**新增國家零改動、零維護**。

## 非目標（YAGNI）

- 多基準幣切換（固定 TWD）
- 手動刷新鈕 / 與 pull-to-refresh 連動
- 歷史走勢、圖表
- 一趟多目的地多幣別
- 秒級即時報價（資料源為日級，符合旅遊心算場景）

## 關鍵決策（已與使用者確認）

| 項目 | 決定 |
|---|---|
| 基準幣 | TWD（固定） |
| 顯示方向 | 雙向，點一下切換：`100 <CUR> ≈ X TWD` ⇄ `1 TWD ≈ Y <CUR>` |
| 資料源 | open.er-api（`https://open.er-api.com/v6/latest/TWD`），免 key、CORS、日更、166+ 幣別 |
| 國家→幣別 | `country-to-currency` npm 套件（v2.0.3，零依賴，ISO 3166-1 alpha-2 → ISO 4217，有 ESM build） |
| 更新頻率 | 日級（API 一天更新一次） |

## 資料源驗證紀錄（2026-05-31 實測）

`GET https://open.er-api.com/v6/latest/TWD` 回傳：

```json
{
  "result": "success",
  "base_code": "TWD",
  "time_last_update_utc": "Sat, 30 May 2026 00:02:31 +0000",
  "time_next_update_utc": "Sun, 31 May 2026 00:29:01 +0000",
  "rates": { "TWD": 1, "JPY": 5.076464, "KRW": 47.948936, "THB": 1.036048, "PHP": 1.955637, "USD": 0.031821, ... }
}
```

- `rates[CUR]` = 1 TWD 可換多少 CUR。
- 共 166+ 幣別，涵蓋日韓泰菲等預期目的地。

`country-to-currency` v2.0.3：`main: index.cjs`、`module: index.esm.js`，零依賴，預設匯出為 `{ JP: 'JPY', ... }` 物件。

## 架構

```
trip.destination_country (e.g. "JP")
   │  resolveCurrency() → country-to-currency 查表
   ▼
currency = "JPY"
   │  useExchangeRate(currency)
   │    fetch open.er-api/latest/TWD（SWR 快取，key 帶日期）
   ▼
rate = rates["JPY"]   // 1 TWD = 5.08 JPY
   │
   ▼  <ExchangeRate> 依 direction state 換算 + 格式化
"100 JPY ≈ 19.7 TWD"  ⇄  "1 TWD ≈ 5.08 JPY"   // 點擊切換
```

### 換算數學

設 `rate = rates[CUR]`（1 TWD = rate 個 CUR）：

- 方向 A（`100 CUR ≈ ? TWD`）：`100 / rate`
- 方向 B（`1 TWD ≈ ? CUR`）：`rate`

範例（JPY，rate=5.0765）：A = `100/5.0765 ≈ 19.7 TWD`；B = `5.08 JPY`。

## 新增 / 修改檔案

| 檔案 | 類型 | 職責 |
|---|---|---|
| `src/lib/currency.js` | 新增 | `resolveCurrency(countryCode)`（包 country-to-currency，回 ISO 4217 或 `null`）、`convert(rate, direction)` 純函式、`formatRate(value)` 格式化。全純函式，好測。 |
| `src/hooks/useExchangeRate.js` | 新增 | fetch `open.er-api/latest/TWD`，沿用 `lib/swrCache.js`，key=`fx:TWD:<YYYY-MM-DD>`。回 `{ rate, updatedAt, loading, error }`。執行階段驗 `result === 'success'` 且 `rates` 存在。 |
| `src/components/layout/ExchangeRate.jsx` | 新增 | 顯示元件。`direction` state，點擊切換（`.press-springy` + `haptic.tap()`）。空 / 失敗 / TWD 時回傳 `null`。 |
| `src/components/layout/Sidebar.jsx` | 修改 | 新增 `countryCode` prop；在「回行程列表」按鈕上方渲染 `<ExchangeRate countryCode={countryCode} />`。 |
| `src/pages/TripPage.jsx` | 修改 | `<Sidebar>` 多傳 `countryCode={trip.destination_country}`。 |
| `package.json` | 修改 | 新增 dependency `country-to-currency`。 |
| `src/__tests__/currency.test.js` | 新增 | `currency.js` 純函式測試。 |
| `src/__tests__/useExchangeRate.test.js` | 新增 | hook 測試（mock fetch）。 |

## UI / 視覺

維持現有 low-key 玻璃層級，與 `tripNameEn` / 版本號同一視覺權重。位置在「回行程列表」按鈕**上方**：

```
        ¥ 100 JPY ≈ 19.7 TWD
         updated 5/30 · tap to flip
        ────────────────────────
          [ ⌂ 回行程列表 ]
            FUKUOKA TRIP
              v1a2b3c
```

- 字級：`text-xs` / `text-2xs`，`font-serif`，`text-stone-500/600`。
- 互動：整塊可點，點擊切換 direction，套 `.press-springy` + `haptic.tap()`，`aria-label` 描述當前換算 + 可切換。
- 觸控目標 ≥ 44×44，`touch-manipulation`。

## 邊界處理（優雅降級，絕不破版）

| 情況 | 行為 |
|---|---|
| `destination_country` 空 / 查不到幣別 | 不渲染 widget |
| 幣別不在 API `rates` | 不渲染 |
| 幣別 = TWD（國內行程） | 不渲染（換算無意義） |
| fetch 失敗且無快取 | 不渲染（靜默，符合 widget 性質） |
| 載入中且有快取 | 顯示快取值 |
| 載入中且無快取 | 一行 skeleton 或不顯示 |

## 快取策略

沿用 `lib/swrCache.js`，key = `fx:TWD:<YYYY-MM-DD>`：

- 同日命中快取秒回、不重抓。
- 跨日 key 改變 → 自動 revalidate。
- 與既有 sheet 快取互不干擾。

## 測試（Vitest + jsdom）

`currency.js`（純函式）：

- `resolveCurrency('JP') === 'JPY'`
- `resolveCurrency('XX') === null`（未知國家）
- `convert(5.0765, 'toTwd')` ≈ 19.7；`convert(5.0765, 'toForeign')` ≈ 5.08
- `formatRate` 四捨五入位數

`useExchangeRate`：

- mock fetch 成功 → 回正確 rate
- mock `result:"error"` → error 降級
- mock 網路失敗 → error 降級
- SWR 快取命中

## 風險與緩解

| 風險 | 緩解 |
|---|---|
| open.er-api 停服 / 改格式 | 執行階段驗 schema；失敗即靜默隱藏，不影響其餘功能 |
| `country-to-currency` ESM interop 在 Vite 出問題 | 退路：將該對照表 vendor 成本地 JSON 常數（同資料、零行為差異） |
| 冷門幣別 API 不支援 | 邊界處理已涵蓋（不渲染） |
