# 可拖拉跟手的玻璃膠囊分段控制器

**Date:** 2026-05-30
**Status:** Approved

## 目標

把專案中三個共用 `frosted-tab-track` 的分段控制器，從「每顆 tab 各自獨立長出玻璃底」改成 **單一個會移動、可手勢拖拉跟手的玻璃膠囊 indicator**（iOS 風格 segmented control 拖拉）。

受影響頁面（同一套 markup）：

- `TripInfoSection.jsx` — 航班 / 行前準備 / 住宿（固定 3 tab，截圖來源）
- `FoodSection.jsx` — area tabs（數量不固定）
- `ShoppingSection.jsx` — area tabs（數量不固定）

> `ItinerarySection.jsx` 雖借用 `frosted-tab-track` 樣式，但那是一顆 Google Maps 按鈕，非分段控制器，**不在範圍內**。

## 互動決策（已確認）

1. **互動層級：完整拖拉跟手** — 按住膠囊或軌道任一點，膠囊 1:1 跟著手指水平移動，邊緣 rubber-band 阻尼，放開吸附到最近 tab。點按單一 tab 時膠囊彈簧滑過去。**不做**液態形變（stretch）。
2. **捲動衝突：自適應降級** — 裝得下時 tab 平分容器寬度 + 啟用拖拉跟手；area 太多裝不下時退回現狀（橫向可捲動 + 點按，膠囊只做 tap-to-slide，不掛 pointer drag）。

## 架構

### 共用元件 `src/components/ui/SegmentedControl.jsx`

通用受控元件，取代三處重複 markup。

```jsx
<SegmentedControl
  tabs={[{ key, label }]}   // 受控選項
  value={activeKey}          // 目前選中 key
  onChange={(key) => ...}    // 切換回調（元件內已 stopPropagation + haptic）
  itemClassName="px-5"       // 各 section 微調 padding
/>
```

職責：渲染軌道 + 單一膠囊 + 各 tab 按鈕；掛手勢；自適應降級；a11y；haptic。

### 手勢 hook `src/hooks/useSegmentedDrag.js`

把手勢與量測邏輯獨立成 hook，元件只管渲染。

- **膠囊呈現**：`position: absolute` 的 div，用 `transform: translateX(x)` + `width` 表現（compositor-friendly，不動 layout 屬性）。
- **量測**：`getBoundingClientRect` 取各段 left/width，`ResizeObserver` 在尺寸變動時重算。
- **Pointer Events**（統一滑鼠/觸控）：
  - `pointerdown`：記錄起點，setPointerCapture，關閉膠囊 transition。
  - `pointermove`：膠囊跟手；超出軌道範圍用阻尼公式 rubber-band。
  - `pointerup` / `pointercancel`：找最近段，開啟 transition 用既有彈簧 `cubic-bezier(0.34, 1.56, 0.64, 1)` 吸附，`onChange`。
- **點按**：`onChange` 後膠囊用同一條彈簧滑過去。
- **Haptic**（`lib/haptic.js`）：拖拉跨段瞬間 `tap()`，吸附落定 `bump()`。

### 自適應降級

- 量測 `scrollWidth > clientWidth` 判斷是否裝得下。
- 裝得下：tab `flex: 1` 平分、啟用拖拉膠囊。
- 裝不下：橫向可捲動 + 點按，膠囊只做 tap-to-slide（不掛 pointer drag，避免跟捲動打架），保留現有 `scrollIntoView` 置中行為。

## CSS（`index.css`）

- 新增 `.frosted-tab-pill`（膠囊）：沿用現有 `--glass-tab-active` token 與該組 liquid bubble box-shadow，**不新增 blur/saturate 數值**（守玻璃 token 規範）。
- `.frosted-tab-btn.active`：移除自身玻璃底，只保留文字色變化 — 玻璃感改由單一移動膠囊呈現，避免「兩塊玻璃」。

## a11y / 相容性

- 維持 `<button>`；容器 `role="tablist"`、按鈕 `role="tab"` + `aria-selected`；鍵盤左右鍵切換（膠囊同步滑動）。
- 觸控目標 ≥44px、`touch-manipulation`。
- `prefers-reduced-motion`：關閉跟手與彈簧，退回瞬切。

## 測試

Vitest 針對純函式：

- 最近段計算（snap）。
- rubber-band 阻尼公式。
- 降級判斷（寬度比較）。

拖拉互動在 jsdom 難穩定模擬，著重邏輯單元測試；視覺手感本機 `npm run dev` 實機驗。

## 與專案取捨的一致性

CLAUDE.md 載明「刻意不追 iOS 26 邊緣折射扭曲的 Liquid Glass」。本設計加的是 **拖拉互動 + 單一移動膠囊**，視覺材質沿用現有 frosted token，不碰折射，與既有取捨不衝突。
