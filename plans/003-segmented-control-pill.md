# 003 — SegmentedControl pill: ≤300ms travel, transitionend instead of timer, no keyboard animation

- **Status**: DONE (mechanical verified; feel-check pending on device)
- **Commit**: 4fb28a7
- **Severity**: HIGH
- **Category**: Purpose & frequency · Easing & duration · Performance · Accessibility
- **Estimated scope**: `src/index.css` (tab pill section ~836-920), `src/hooks/useSegmentedDrag.js`, `src/components/ui/SegmentedControl.jsx`, `src/__tests__/hooks/useSegmentedDrag.test.js`
- **Depends on**: plan 001 (`src/lib/motion.js`), plan 002 (`rubberBand` in `src/lib/gesture.js`)

## Problem

SegmentedControl is HIGH frequency (TripInfo / Food / Shopping tabs, map explore/route). AUDIT: "UI animations stay under 300ms"; tens-of-times actions → "drastically reduce".

```css
/* src/index.css:845-847 — current (.frosted-tab-pill) */
  transition:
    transform 0.52s var(--ease-spring),
    width 0.52s var(--ease-spring);
```
```css
/* src/index.css:872-875 — current (.frosted-tab-pill-fill) */
  transition:
    transform 0.52s var(--ease-spring),
    background-color 0.3s ease,
    box-shadow 0.3s ease;
```
```js
// src/hooks/useSegmentedDrag.js:8-9 — current
/** 切換 tab 時膠囊「透明玻璃態」維持時間（ms），約等於外層 translateX 彈簧時長 */
const TRAVEL_MS = 520
```
```js
// src/hooks/useSegmentedDrag.js:88-95 — current
const beginTravel = () => {
  const pill = pillRef.current
  if (!pill) return
  pill.classList.add('traveling')
  clearTimeout(travelTimerRef.current)
  travelTimerRef.current = setTimeout(() => pill.classList.remove('traveling'), TRAVEL_MS)
}
```
```js
// src/components/ui/SegmentedControl.jsx:50-61 — current (keyboard)
  const handleKeyDown = (e) => {
    …
    if (nextIdx !== idx) {
      tap()
      beginTravel()
      onChange(keys[nextIdx])
    }
  }
```
```js
// src/components/ui/SegmentedControl.jsx:46 — current
e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
```

Also:
- `width` is a layout property (`fixing-motion-performance` §3: prefer FLIP). The pill is small (~100×36px, absolutely positioned), so this is LOW; fix it only via the cheap route below.
- While `.traveling` the fill switches to `--glass-tab-lifted` = `blur(14px)` and moves for the whole travel (`fixing-motion-performance` §7: keep moving blur ≤ 8px). It's small, LOW.
- `movePill` writes `width` then reads `offsetLeft` (forced layout, `useSegmentedDrag.js:85-86`); `reposition` reads after that write too (`:115-117`). LOW, once per change.
- A local `prefersReducedMotion` helper is defined at `useSegmentedDrag.js:49-51` and never called.

## Target

### CSS

```css
.frosted-tab-pill {
  …
  /* iOS26 Q 彈：較大 overshoot 的彈簧曲線；高頻互動，時長壓在 300ms 內 */
  transition:
    transform 0.3s var(--ease-spring),
    width 0.3s var(--ease-spring);
}
```
```css
.frosted-tab-pill-fill {
  …
  transition:
    transform 0.3s var(--ease-spring),
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}
```
`.traveling` state: use the 8px tab blur, not 14px, while moving. Split the shared rule at `index.css:895-905`:

```css
.frosted-tab-pill.lifted .frosted-tab-pill-fill,
.frosted-tab-pill.traveling .frosted-tab-pill-fill {
  background: rgba(255, 255, 255, 0.015);
  border-color: rgba(255, 255, 255, 0.75);
  box-shadow: …unchanged…;
}
/* 按住（靜止）才上最強 frosted；滑行中保持 8px（移動中的大 blur 每幀重取樣，iOS 易掉幀） */
.frosted-tab-pill.lifted .frosted-tab-pill-fill {
  backdrop-filter: var(--glass-tab-lifted);
  -webkit-backdrop-filter: var(--glass-tab-lifted);
}
.frosted-tab-pill.traveling:not(.lifted) .frosted-tab-pill-fill {
  backdrop-filter: var(--glass-tab-active);
  -webkit-backdrop-filter: var(--glass-tab-active);
}
```
Update the comment at `index.css:907` ("放開時回到 base fill 的 0.52s 彈簧") to say 0.3s.

### JS

- Delete `TRAVEL_MS` and `travelTimerRef`. `beginTravel` only adds the class. Remove it on the pill's own `transitionend`:
  ```js
  // 掛一次：膠囊 translateX 結束 → 解除透明玻璃態（不再用與 CSS 時長手抄同步的 timer）
  useEffect(() => {
    const pill = pillRef.current
    if (!pill) return
    const onEnd = (e) => { if (e.propertyName === 'transform') pill.classList.remove('traveling') }
    pill.addEventListener('transitionend', onEnd)
    pill.addEventListener('transitioncancel', onEnd)
    return () => { pill.removeEventListener('transitionend', onEnd); pill.removeEventListener('transitioncancel', onEnd) }
  }, [pillRef])
  ```
  Also remove `traveling` in `onUp` (already does) and, for safety, in `beginTravel` when `prefersReducedMotion()` is true (no transition will fire): `if (prefersReducedMotion()) return` before adding the class.
- Replace the local `prefersReducedMotion` const with `import { prefersReducedMotion } from '../lib/motion.js'`.
- Replace the local `rubberBand` **implementation** with `import { rubberBand } from '../lib/gesture.js'` and keep `export { rubberBand }` so `src/__tests__/hooks/useSegmentedDrag.test.js` keeps importing it from the hook (or update that test to import from `../../lib/gesture.js` and drop the re-export; either is fine, pick one and keep the tests green).
- `movePill`: read before write.
  ```js
  const movePill = (btn) => {
    const pill = pillRef.current
    if (!pill || !btn) return
    const { offsetWidth, offsetLeft } = btn   // 先讀後寫，避免 write→read 強制 layout
    pill.style.width = `${offsetWidth}px`
    pill.style.transform = `translateX(${offsetLeft}px)`
  }
  ```
  In `reposition`, compute `padRight`, `last.offsetLeft`, `last.offsetWidth`, `track.clientWidth` **before** calling `movePill`.
- Keyboard path (`SegmentedControl.jsx handleKeyDown`): no animation. Replace `beginTravel()` with an instant move:
  ```js
  if (nextIdx !== idx) {
    tap()
    // 鍵盤切換不動畫（AUDIT：鍵盤觸發的動作不該有動畫）：暫關 transition 讓膠囊瞬移
    const pill = pillRef.current
    if (pill) {
      pill.style.transition = 'none'
      requestAnimationFrame(() => requestAnimationFrame(() => { pill.style.transition = '' }))
    }
    onChange(keys[nextIdx])
  }
  ```
  (The `useLayoutEffect` reposition runs synchronously after `onChange` re-renders, while `transition: none` is still set; the double rAF restores it afterwards. This is the same trick the hook already uses for first placement at `useSegmentedDrag.js:121-127`.)
- `scrollIntoView` in `handleClick`: `behavior: prefersReducedMotion() ? 'auto' : 'smooth'` (import the helper in `SegmentedControl.jsx`).

## Repo conventions to follow

- Glass tokens are `--glass-tab` / `--glass-tab-active` / `--glass-tab-lifted` in `index.css :root`; never inline blur values.
- First-placement "transition: none + reflow" trick: `useSegmentedDrag.js:121-127`.
- Tests for the hook's pure helpers live in `src/__tests__/hooks/useSegmentedDrag.test.js`.

## Steps

1. CSS edits (`.frosted-tab-pill`, `.frosted-tab-pill-fill`, the `.lifted/.traveling` split, comment fixes).
2. `useSegmentedDrag.js`: imports, remove `TRAVEL_MS`/timer, `transitionend` effect, read-before-write in `movePill` and `reposition`, guard `beginTravel` with `prefersReducedMotion()`.
3. `SegmentedControl.jsx`: keyboard path instant move; `scrollIntoView` behaviour branch.
4. Tests: keep `rubberBand`/`nearestIndex`/`isOverflowing` tests green. Add a test that `beginTravel` does not add `traveling` when `matchMedia` reports reduced motion (mock `window.matchMedia`), if the hook's `beginTravel` is reachable from a test render; otherwise document in the plan's Status why not.
5. `npm test`.

## Boundaries

- Do NOT change the drag-follow logic (`onMove` / `onUp`), the `.dragging` escape hatch, or the `lifted` scale (settled decisions).
- Do NOT change the `--ease-spring` curve.
- Do NOT touch `index.css` outside the tab pill section (~836-935) except the one comment line.
- No new dependencies. If an excerpt doesn't match, STOP and report.

## Verification

- **Mechanical**: `npm test` green. `grep -n "TRAVEL_MS\|0.52s\|travelTimerRef" src/index.css src/hooks/useSegmentedDrag.js` → no output. `grep -n "const prefersReducedMotion" src/hooks/useSegmentedDrag.js` → no output.
- **Feel check** (DevTools Animations panel at 10%, then real device):
  - Tap a non-selected tab: pill arrives within 300ms with a small overshoot, label colour fades 200ms, the glassy "traveling" look ends exactly when the pill stops (not before, not after).
  - Press and hold a tab: fill scales 1.32 in ~140ms and shows the strongest blur; drag across segments: content switches live as before.
  - Focus the tablist and press ArrowRight: the pill **jumps** to the new tab with no travel animation; the content switches.
  - Emulate `prefers-reduced-motion`: the pill repositions instantly and never gets stuck in the transparent `traveling` state.
- **Done when**: all checks pass.
