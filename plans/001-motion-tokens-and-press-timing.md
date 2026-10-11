# 001 — Motion tokens, press timing, hover gating, dead CSS, trip-halo

- **Status**: DONE (mechanical verified; feel-check pending on device)
- **Commit**: 4fb28a7
- **Severity**: HIGH (press timing) + MEDIUM (trip-halo perf) + LOW (tokens / hover / cleanup)
- **Category**: Easing & duration · Cohesion & tokens · Performance · Accessibility
- **Estimated scope**: `src/index.css` (large), `tailwind.config.js`, `src/lib/motion.js` (new), `src/components/home/TripCard.jsx`, `src/components/layout/Sidebar.jsx`, `src/components/trip/FoodSection.jsx`, `src/components/trip/ShoppingSection.jsx`, `src/components/layout/BottomSheet.jsx` (dead branch only)

This plan is the **foundation** for plans 002–009: it adds the tokens and the helper the others consume. Execute it first.

## Problem

### P1. Press-in feedback is too slow, and `.press-springy` is symmetric (HIGH)

AUDIT budget: "Button press feedback | 100–160ms". The house language is "iOS26 lift": press = scale UP, release = 0.4s `--ease-spring` Q-bounce. The release bounce is a settled decision and stays. The **press-in** is 220ms everywhere, and on `.press-springy` (every card, every sidebar item) press-in is a full **400ms** because `:active` has no transition override.

```css
/* src/index.css:549 — current (.frosted-glass-button, rest state) */
  transition:
    transform 0.4s var(--ease-spring),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```
```css
/* src/index.css:577-582 — current (.frosted-glass-button:active) */
  transition:
    transform 0.22s var(--ease-spring),
    box-shadow 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
```
```css
/* src/index.css:600-605 — current */
.press-springy {
  transition: transform 0.4s var(--ease-spring);
}
.press-springy:active {
  transform: scale(1.03);
}
```
```css
/* src/index.css:610-619 — current */
.glass-card.press-springy {
  transition:
    transform 0.4s var(--ease-spring),
    background-color 0.25s ease,
    box-shadow 0.25s ease;
}
.glass-card.press-springy:active {
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 12px 28px rgba(0,0,0,0.12);
}
```
```css
/* src/index.css:625-631 — current */
.press-lift {
  transition: transform 0.4s var(--ease-spring);
}
.press-lift:active {
  transform: scale(1.15);
  transition: transform 0.22s var(--ease-spring);
}
```
```css
/* src/index.css:653-656 — current */
.stepper-squish.pressed {
  transform: scaleX(1.07) scaleY(0.93);
  transition: transform 0.22s var(--ease-spring);
}
```
```css
/* src/index.css:908-914 — current */
.frosted-tab-pill.lifted .frosted-tab-pill-fill {
  transform: scale(1.32);
  transition:
    transform 0.22s var(--ease-spring),
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}
```

Note on `.glass-card.press-springy:active` paint properties (background + box-shadow on a ~300×100px card): this is a **one-shot** ≤200ms change, which `fixing-motion-performance` allows. Do NOT move the shadow to a pseudo-element: itinerary cards are `overflow-hidden`, an outset shadow on a child would be clipped (that is exactly the trip-halo bug below). Only shorten it.

### P2. No shared `--ease-out` token; two different "ease-out" curves in play (LOW)

Tailwind's `ease-out` class is `cubic-bezier(0, 0, 0.2, 1)`; the CSS keyword `ease-out` (used inline in `useDaySwipe.js:149`) is `cubic-bezier(0, 0, 0.58, 1)`. `.sheet-hidden` hand-types `cubic-bezier(0, 0, 0.2, 1)`. AUDIT: "Built-in CSS easings are too weak for deliberate motion"; target token `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`.

```css
/* src/index.css:699-702 — current */
.sheet-hidden {
  visibility: hidden;
  transition: transform 300ms cubic-bezier(0, 0, 0.2, 1), visibility 0s linear 300ms;
}
```

### P3. `.frosted-tab-btn` colour uses a 400ms overshoot curve (MEDIUM, HIGH frequency)

A colour cannot overshoot. AUDIT: "Hover / color change → `ease`". The btn only ever changes `color` (see `:967-977`), the other three properties never change.

```css
/* src/index.css:943-947 — current */
  transition:
    color 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-color 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
```

### P4. `check-pop` uses a near-duplicate spring and starts at `scale(0.5)` (LOW)

AUDIT target entrance: `scale(0.9–0.97) + opacity: 0`.

```css
/* src/index.css:986-990, 996-999 — current */
@keyframes check-pop {
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1);   opacity: 1; }
}
.check-pop {
  display: inline-block;
  animation: check-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

### P5. `.trip-halo` repaints forever and is never visible (MEDIUM)

`TripCard.jsx:123` puts `trip-halo` on a `<Link>` that has `overflow-hidden`; the `::after` is `inset: 0`, so its **outset** `box-shadow` is clipped away. Result: an infinite 2.2s `box-shadow` repaint on a ~360×240px card with nothing to show for it. The same card already has a `animate-pulse` dot in the "進行中" pill (`TripCard.jsx:33`), which is the live indicator.

```css
/* src/index.css:160-173 — current */
.trip-halo::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 2px solid rgba(185, 54, 50, 0.72);
  border-radius: 1rem; /* 對齊 rounded-2xl */
  pointer-events: none;
  animation: tripHalo 2.2s ease-in-out infinite;
}

@keyframes tripHalo {
  0%, 100% { box-shadow: 0 0 0 0 rgba(185, 54, 50, 0); }
  50% { box-shadow: 0 0 16px 2px rgba(185, 54, 50, 0.5); }
}
```

### P6. Raw CSS `:hover` not gated for touch (LOW)

Tailwind's `hoverOnlyWhenSupported` wraps **Tailwind** `hover:` utilities in `@media (hover: hover)`, but not hand-written CSS. On iOS a tap leaves `:hover` stuck.

```css
/* src/index.css:555-561 — current */
.frosted-glass-button:hover { … }
/* src/index.css:967-970 — current */
.frosted-tab-btn:hover:not(.active) { … }
```

### P7. TripCard cover hover zoom is 500ms on Tailwind's default curve (LOW)

```jsx
// src/components/home/TripCard.jsx:134 — current
className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
```

### P8. `transition-colors` that never applies (LOW)

Custom classes in `index.css` come after `@tailwind utilities` and set the `transition` shorthand, so at equal specificity they override the Tailwind utility. `Sidebar.jsx:140` (`transition-colors … press-springy`) therefore has no colour transition at all; `FoodSection.jsx:103` and `ShoppingSection.jsx:77` (`frosted-glass-button … transition-colors`) are redundant.

### P9. Dead CSS and a dead JS branch (LOW)

Zero references in `src/**/*.{js,jsx}` (verified with `grep -rna`): `.animate-slide-up` + `@keyframes slideUp`, `.animate-fade-in` + `fadeIn`, `.animate-scale-in` + `scaleIn`, `.animate-float-heart` + `floatHeart`, `.animate-sparkle` + `sparkle` (contains `scale(0)`), `@keyframes heartPop` (contains `scale(0)`), `@keyframes heartExpand`, `.animate-heart-expand` + `@keyframes heartFullSequence` (carries a permanent `will-change`), `.frosted-glass-button-dark` (+ `:hover`, `:active`). Keep `@keyframes heartShake` (used by `.animate-heart-pop-shake`).

`BottomSheet.jsx:51-95` ("可捲動內容：捲到頂時繼續往下拉") never runs: all five `<BottomSheet>` usages in `TripPage.jsx` pass `noScroll`, so `contentScrollRef` is never attached.

### P10. No `prefers-reduced-transparency` handling (LOW)

Apple guidance: under reduced transparency, make translucent surfaces frostier/solid.

## Target

### Tokens (in `src/index.css :root`, next to `--ease-spring`)

```css
  /* 強 ease-out（AUDIT 標準曲線）：關閉 / 輪播 commit / 下拉歸位等「結束型」位移共用。
     Tailwind 的 `ease-out` class 經 tailwind.config.js 指到這個變數。 */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  /* press-in 一律 140ms（AUDIT 預算 100–160ms）；放開回彈 0.4s 彈簧維持（iOS26 lift 定案） */
  --dur-press-in: 140ms;
  --dur-press-out: 0.4s;
  /* 面板關閉時長：.sheet-hidden 的 visibility 延遲與 JSX 的 duration-[…] 必須同值 */
  --dur-panel-close: 300ms;
```

### `tailwind.config.js`

```js
      transitionTimingFunction: {
        spring: 'var(--ease-spring)',
        'spring-soft': 'var(--ease-spring-soft)',
        // 覆蓋內建 ease-out（(0,0,0.2,1) 太弱），全站 `ease-out` class 一律走強曲線 token
        out: 'var(--ease-out)',
      },
```

### `src/lib/motion.js` (new file)

```js
/**
 * 使用者是否要求減少動態（prefers-reduced-motion: reduce）。
 * CSS 端由 index.css 的 @media 區塊處理；這個 helper 給 JS 驅動的動畫
 * （Leaflet flyTo / smooth scroll / 教學 peek / inline transition）分支用。
 * SSR / 測試環境（無 matchMedia）一律回 false。
 */
export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
```

### Press classes

```css
.frosted-glass-button {
  …
  transition:
    transform var(--dur-press-out) var(--ease-spring),
    box-shadow 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}
.frosted-glass-button:active {
  …
  transition:
    transform var(--dur-press-in) var(--ease-spring),
    box-shadow 0.15s ease,
    background-color 0.15s ease,
    border-color 0.15s ease;
}

.press-springy {
  transition:
    transform var(--dur-press-out) var(--ease-spring),
    background-color 0.2s ease;
}
.press-springy:active {
  transform: scale(1.03);
  transition:
    transform var(--dur-press-in) var(--ease-spring),
    background-color 0.15s ease;
}

.glass-card.press-springy {
  transition:
    transform var(--dur-press-out) var(--ease-spring),
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}
.glass-card.press-springy:active {
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  transition:
    transform var(--dur-press-in) var(--ease-spring),
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.press-lift { transition: transform var(--dur-press-out) var(--ease-spring); }
.press-lift:active {
  transform: scale(1.15);
  transition: transform var(--dur-press-in) var(--ease-spring);
}

.stepper-squish { transition: transform var(--dur-press-out) var(--ease-spring); }
.stepper-squish.pressed {
  transform: scaleX(1.07) scaleY(0.93);
  transition: transform var(--dur-press-in) var(--ease-spring);
}

.frosted-tab-pill.lifted .frosted-tab-pill-fill {
  transform: scale(1.32);
  transition:
    transform var(--dur-press-in) var(--ease-spring),
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}
```

### `.frosted-tab-btn`

```css
  transition: color 0.2s ease;
```

### `.sheet-hidden`

```css
.sheet-hidden {
  visibility: hidden;
  transition: transform var(--dur-panel-close) var(--ease-out), visibility 0s linear var(--dur-panel-close);
}
```

### `check-pop`

```css
@keyframes check-pop {
  0%   { transform: scale(0.92); opacity: 0; }
  60%  { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1);    opacity: 1; }
}
.check-pop {
  display: inline-block;
  animation: check-pop 0.3s var(--ease-spring) forwards;
}
```

### `.trip-halo`

```css
/* active 行程卡：靜態紅框。呼吸光暈已移除：外擴 box-shadow 在 overflow-hidden 的卡片內
   永遠被裁掉看不到，卻無限重繪整張卡；「進行中」pill 內的 animate-pulse 紅點已是 live 指示。 */
.trip-halo::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 2px solid rgba(185, 54, 50, 0.72);
  border-radius: 1rem; /* 對齊 rounded-2xl */
  pointer-events: none;
}
```
Delete `@keyframes tripHalo`. Update the comment block above `.trip-scrim` (`index.css:147-151`): remove the sentence about the breathing halo and reduced-motion.

### Hover gating

```css
@media (hover: hover) and (pointer: fine) {
  .frosted-glass-button:hover { …existing body unchanged… }
  .frosted-tab-btn:hover:not(.active) { …existing body unchanged… }
}
```

### TripCard cover

```jsx
className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
```

### `transition-colors` cleanup

- `Sidebar.jsx:140`: remove `transition-colors` (the new `.press-springy` now transitions `background-color`).
- `FoodSection.jsx:103`, `ShoppingSection.jsx:77`: remove `transition-colors` (the `frosted-glass-button` branch only; leave the `ShoppingSection.jsx:76` non-glass branch as is).

### Reduced transparency (append near the end of `index.css`)

```css
/* 使用者要求減少透明（iOS「降低透明度」）：玻璃改為近實色、關掉 backdrop blur。
   只動材質，不動版面與動效。 */
@media (prefers-reduced-transparency: reduce) {
  .glass-card { background: rgba(255, 255, 255, 0.92); backdrop-filter: none; -webkit-backdrop-filter: none; }
  .glass-bottom-sheet, .glass-sidebar { background: rgba(251, 250, 245, 0.96); backdrop-filter: none; -webkit-backdrop-filter: none; }
  .glass-day-nav { background: rgba(251, 250, 245, 0.94); backdrop-filter: none; -webkit-backdrop-filter: none; }
  .frosted-glass-button, .frosted-glass-panel, .frosted-tab-track { background: rgba(255, 255, 255, 0.85); backdrop-filter: none; -webkit-backdrop-filter: none; }
  .frosted-glass-button:active { background: rgba(255, 255, 255, 0.75); backdrop-filter: none; -webkit-backdrop-filter: none; }
  .frosted-tab-pill-fill,
  .frosted-tab-pill.lifted .frosted-tab-pill-fill,
  .frosted-tab-pill.traveling .frosted-tab-pill-fill { background: rgba(255, 255, 255, 0.95); backdrop-filter: none; -webkit-backdrop-filter: none; }
}
```

## Repo conventions to follow

- Tokens live in `src/index.css :root` with a Traditional Chinese comment explaining intent (see `--ease-spring` at `index.css:34-38`). Tailwind exposes them through `theme.extend.transitionTimingFunction` (`tailwind.config.js:28-33`).
- Press-in/out asymmetry exemplar: `.press-lift` / `.press-lift:active` (`index.css:625-631`).
- Comments are Traditional Chinese, English for code. Keep the existing comment style and density.
- `src/lib/*.js` are plain ES modules with a JSDoc header (see `src/lib/gesture.js`).

## Steps

1. `src/index.css :root`: add `--ease-out`, `--dur-press-in`, `--dur-press-out`, `--dur-panel-close` as in Target, right after `--ease-spring-soft`.
2. `tailwind.config.js`: add `out: 'var(--ease-out)'` to `transitionTimingFunction` with the comment shown.
3. Create `src/lib/motion.js` exactly as in Target.
4. Rewrite the press classes (`.frosted-glass-button`, `.frosted-glass-button:active`, `.press-springy`, `.press-springy:active`, `.glass-card.press-springy`, `.glass-card.press-springy:active`, `.press-lift`, `.press-lift:active`, `.stepper-squish`, `.stepper-squish.pressed`, `.frosted-tab-pill.lifted .frosted-tab-pill-fill`) to the Target values. Update the Chinese comments that mention "0.22s" / "0.3s" to say press-in `--dur-press-in`(140ms) / release `--dur-press-out`.
5. `.frosted-tab-btn`: replace the four-property transition with `transition: color 0.2s ease;` and fix the comment above it.
6. `.sheet-hidden`: use `var(--dur-panel-close)` and `var(--ease-out)`.
7. `check-pop`: apply Target keyframes and class.
8. `.trip-halo::after`: remove `animation`, delete `@keyframes tripHalo`, update comments.
9. Wrap `.frosted-glass-button:hover` and `.frosted-tab-btn:hover:not(.active)` in `@media (hover: hover) and (pointer: fine)` (bodies unchanged).
10. `TripCard.jsx:134`: `duration-500` → `duration-300 ease-out`.
11. Remove `transition-colors` from `Sidebar.jsx:140`, `FoodSection.jsx:103`, `ShoppingSection.jsx:77`.
12. Delete the dead CSS listed in P9 (classes and their keyframes). Keep `heartShake`, `heartTransition`, `bgFadeIn`, `photoFadeIn`, `heartBounce`, `shareSlideUp`, `bubbleFadeIn/Out`, `planeFly`, `bar-complete`, `check-pop`.
13. `BottomSheet.jsx`: delete the `contentScrollRef` effect (lines 51-95 region), `contentDragActiveRef`, and the `contentScrollRef` ref itself plus wherever it is attached in JSX (search `contentScrollRef`). Keep the header drag (`headerDragRef`) untouched. Keep the `noScroll` prop and its layout behaviour untouched.
14. Append the `prefers-reduced-transparency` block.
15. Run `npm test`. Also run `npm run build` once to make sure Tailwind still compiles (`ease-out` override must not error).

## Boundaries

- Do NOT touch the `prefers-reduced-motion` blocks (plan 004 owns them).
- Do NOT touch `.frosted-tab-pill` / `.frosted-tab-pill-fill` base transitions (`index.css:845-847, 872-875`) or `useSegmentedDrag.js` (plan 003 owns them).
- Do NOT change any `0.4s` release spring to a shorter value. The Q-bounce on release is a documented design decision.
- Do NOT restructure `.glass-card` shadows into pseudo-elements.
- Do NOT touch `useDaySwipe.js`, `HomePage.jsx`, `TripMap.jsx`, `ChecklistSection.jsx`, `DayNav.jsx`, the easter-egg files.
- No new dependencies.
- If any excerpt above does not match the file, STOP and report.

## Verification

- **Mechanical**: `npm test` → 18 files / 177 tests pass. `npm run build` succeeds. `grep -n "animate-slide-up\|animate-fade-in\|animate-scale-in\|animate-float-heart\|animate-sparkle\|animate-heart-expand\|frosted-glass-button-dark\|heartPop\|heartExpand\|tripHalo\|contentScrollRef" src/index.css src/components/layout/BottomSheet.jsx` → no output. `grep -c "0.22s" src/index.css` → 0.
- **Feel check** (iPhone PWA or Safari responsive mode, DevTools Animations panel at 10%):
  - Press any itinerary card: the lift reaches 1.03 within ~140ms (noticeably snappier than before); release still Q-bounces over 0.4s.
  - Press the map stepper ‹ ›: same timing; squish still directional.
  - Switch a SegmentedControl tab: the label colour change is a plain 200ms fade, no "front-loaded" snap.
  - Home page with an active trip: the red border is static, no pulsing glow; the small white dot in "進行中" still pulses. In DevTools Performance, no continuous paint activity while idle on the home page.
  - On a touch device, tapping a frosted glass button no longer leaves it in the brighter hover state.
  - DevTools Rendering → emulate `prefers-reduced-transparency: reduce`: glass surfaces become near-solid and readable.
- **Done when**: all mechanical checks pass and the diff touches only the files listed in scope.
