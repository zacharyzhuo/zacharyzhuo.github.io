# 002 — Day carousel: interruptible, velocity-aware, no per-touch re-render

- **Status**: DONE (mechanical verified; feel-check pending on device)
- **Commit**: 4fb28a7
- **Severity**: HIGH
- **Category**: Interruptibility · Performance · Physicality · Accessibility
- **Estimated scope**: `src/hooks/useDaySwipe.js` (rewrite of the gesture core), `src/lib/gesture.js` (+1 export), `src/__tests__/hooks/useDaySwipe.test.jsx` (adapt + add), `src/__tests__/lib/gesture.test.js` (+ tests)
- **Depends on**: plan 001 (`--ease-out` token, `src/lib/motion.js`)

## Problem

The 3-panel day carousel (prev / current / next) is the highest-frequency gesture in the app. Current code at `src/hooks/useDaySwipe.js`:

1. **Re-grab during snap-back jumps and lags.** Snap-back sets an inline `transition` and a 300ms timer; a new `touchstart` inside that window restarts `dx` at 0 (so the carousel jumps from its mid-flight position to the finger), the inline transition is still on (so the drag lags), and the pending timer later flips `isDragging` to false mid-drag.
   ```js
   // src/hooks/useDaySwipe.js:147-154 — current
   snapEl.style.transition = 'transform 300ms ease-out'
   snapEl.style.transform = 'translateX(0)'
   setTimeout(() => {
     if (carouselRef.current) carouselRef.current.style.transition = ''
     setIsDragging(false)
   }, 300)
   ```
2. **Commit locks input** for 300ms + 2 frames (`animatingRef` guard at `:52`). Apple: "never lock out input during a transition".
3. **Velocity is the average since touchstart**, threshold 0.5 px/ms. A slow drag that ends in a flick reads as slow. AUDIT: decide with velocity over the last samples; dismissal threshold `~0.11` px/ms.
   ```js
   // src/hooks/useDaySwipe.js:6, 107-108 — current
   const SWIPE_VELOCITY_THRESHOLD = 0.5
   const elapsed = Math.max(1, Date.now() - dragStartRef.current.time)
   const velocity = Math.abs(dx) / elapsed
   ```
4. **Edge damping is linear** (`damped = dx * 0.3`, `:84-90`), not rising friction.
5. **Every `touchstart` in the swipe zone calls `setIsDragging(true)` + `setDragX(0)`** (`:57-58`), and vertical scrolls call `setIsDragging(false)` again (`:77`). That is two full TripPage re-renders at the start of every page scroll. The hook's own comment says "拖動中直接操作 DOM transform，不走 state".
6. **`will-change: transform` is permanent** on the carousel (`:187-191`), a layer ~3× viewport width containing every backdrop-blurred card.
7. **300ms is written three times** (`:133` timer, `:149` inline, `:192` class) and the snap-back uses the CSS keyword `ease-out` `(0,0,0.58,1)` while the commit uses Tailwind's `(0,0,0.2,1)`.
8. **`peek()` ignores reduced motion**: under `prefers-reduced-motion` the CSS reset zeroes the inline transition but the timers still fire → the carousel teleports 56px, holds 700ms, teleports back.

## Target

### Public API (unchanged shape so `TripPage.jsx` needs no edits)

`useDaySwipe({ days, activeDay, setActiveDay, enabled })` still returns `{ containerProps, carouselRef, carouselStyle, carouselClassName, peek }`.
- `carouselStyle` becomes static: `{ position: 'relative' }` (no `transform`, no `willChange`). All transforms are written to `carouselRef.current.style` directly.
- `carouselClassName` becomes `''` always (kept for API compatibility; TripPage may keep spreading it).

### Constants

```js
const SWIPE_DISTANCE_THRESHOLD = 50     // px, unchanged
const SWIPE_VELOCITY_THRESHOLD = 0.11   // px/ms, AUDIT value; measured over the trailing window
const SWIPE_MIN_FLICK_DISTANCE = 24     // px, a velocity-only commit still needs this much travel
const VELOCITY_WINDOW_MS = 80           // trailing window for release velocity
const SETTLE_MS = 300                   // single source of truth for commit + snap-back
const SETTLE_TRANSITION = `transform ${SETTLE_MS}ms var(--ease-out)`
const EDGE_RUBBER_CONSTANT = 80         // rubber-band constant at first/last day
```

### Gesture core (describe-level spec; executor writes the code)

- **Refs only during the gesture**: `startRef` (`{x, y, time}`), `baseXRef` (translateX the carousel had when the finger landed), `dxRef` (current visual offset), `samplesRef` (array of `{x, t}` for the last `VELOCITY_WINDOW_MS`), `horizontalRef`, `settleTimerRef`, `phaseRef` (`'idle' | 'dragging' | 'settling' | 'committing'`).
- **touchstart**:
  - If `!enabled || days.length <= 1` return.
  - Do NOT return when `phaseRef === 'committing'` or `'settling'`. Instead: clear `settleTimerRef`, read the live transform with `new DOMMatrixReadOnly(getComputedStyle(el).transform).m41` (fallback 0 if `'none'`), store it in `baseXRef`, set `el.style.transition = 'none'`, set `el.style.willChange = 'transform'`. If we interrupted a **commit**, the content has NOT been swapped yet (swap happens at settle), so the 3-panel layout is still valid and the drag simply continues from `baseXRef`.
  - Record `startRef`, reset `samplesRef = [{x, t}]`, `horizontalRef = null`, `phaseRef = 'dragging'`. **No React state updates here.**
- **touchmove** (non-passive, unchanged registration):
  - Direction decision as today (first move: `|dx| > |dy|` → horizontal, else abandon: `phaseRef = 'idle'`, clear `willChange`, return). No state updates on abandon.
  - `preventDefault()` once horizontal.
  - `raw = baseXRef + (clientX - startRef.x)`.
  - Edge rubber-band: when `idx === 0 && raw > 0` or `idx === last && raw < 0`, `visual = rubberBand(raw, EDGE_RUBBER_CONSTANT)` (see gesture.js below), else `visual = raw`.
  - Write `el.style.transform = \`translateX(${visual}px)\``; `dxRef = visual`.
  - Push `{x: clientX, t: now}` to `samplesRef`; drop samples older than `VELOCITY_WINDOW_MS`.
- **touchend / touchcancel**:
  - If `phaseRef !== 'dragging'` → return (nothing to settle).
  - Release velocity: `v = (last.x - first.x) / max(1, last.t - first.t)` over `samplesRef` (signed px/ms). If only one sample, `v = 0`.
  - Decision (velocity sign wins, per Apple "decide reverse vs commit by velocity sign"):
    - `flick = |v| >= SWIPE_VELOCITY_THRESHOLD && |dxRef| >= SWIPE_MIN_FLICK_DISTANCE`
    - `far = |dxRef| >= SWIPE_DISTANCE_THRESHOLD`
    - `dir = flick ? sign(v) : sign(dxRef)` ( +1 = finger moved right = go to **previous** day, −1 = next day )
    - commit if `(flick || far)` and the target index exists; else snap back.
    - Edge case: `flick` with `v` opposite to `dxRef` (user dragged right, then flicked left) → `dir = sign(v)`, and commit only if `|dxRef|` for that direction makes sense; simplest rule: if `sign(v) !== sign(dxRef)` treat as snap-back.
  - **Commit**: `bump()`; `phaseRef = 'committing'`; `el.style.transition = SETTLE_TRANSITION`; `el.style.transform = \`translateX(${dir * window.innerWidth}px)\``; `settleTimerRef = setTimeout(settle, SETTLE_MS)`.
    - `settle()`: `el.style.transition = 'none'`; `setActiveDayRef.current(days[nextIdx].day)`; `el.style.transform = 'translateX(0)'`; double-`requestAnimationFrame` then `el.style.transition = ''`, `el.style.willChange = ''`, `phaseRef = 'idle'`. (The double rAF is the existing pattern; keep it.)
  - **Snap back**: `phaseRef = 'settling'`; `el.style.transition = SETTLE_TRANSITION`; `el.style.transform = 'translateX(0)'`; `settleTimerRef = setTimeout(() => { el.style.transition = ''; el.style.willChange = ''; phaseRef = 'idle' }, SETTLE_MS)`.
  - If `dxRef === 0` → just clear `willChange`, `phaseRef = 'idle'`.
- **`isCarouselAnimating` state** is no longer needed (transitions are inline). Remove it and the `useState` for `dragX` / `isDragging`.
- **`peek()`**: first line `if (prefersReducedMotion()) return` (import from `../lib/motion.js`). Also return if `phaseRef !== 'idle'`. Use `var(--ease-spring-soft)` instead of the hand-typed `cubic-bezier(0.34, 1.4, 0.64, 1)`:
  ```js
  el.style.transition = 'transform 600ms var(--ease-spring-soft)'
  ```
  Keep the 56px / 700ms / 600ms timings.
- Keep `containerProps.style = { touchAction: 'pan-y' }` and the `onTouchCancel: onTouchEnd` wiring.

### `src/lib/gesture.js` (+ export)

Move the rubber-band formula here so both gesture hooks share it. `useSegmentedDrag.js` keeps its own `rubberBand` export for now (plan 003 switches it to this import); do not edit that file in this plan.

```js
/**
 * iOS 風格 rubber-band 阻尼：把超出邊界的 overshoot 壓成有上限、單調遞增的小位移。
 * 回傳值與 overshoot 同號，magnitude 趨近 constant 但永不超過。
 * resist() 是同一族（max 固定 24px 的面板反向拉伸版）；這個給輪播邊界等需要較大上限的場景。
 *
 * @param {number} overshoot 超出邊界的位移（帶正負號）
 * @param {number} [constant] 位移上限（px）
 */
export function rubberBand(overshoot, constant = 60) {
  return (constant * overshoot) / (constant + Math.abs(overshoot))
}
```

## Repo conventions to follow

- The hook already keeps latest props in refs (`enabledRef`, `daysRef`, `activeDayRef`, `setActiveDayRef`) so listeners mount once. Keep that.
- Direct DOM writes pattern exemplar: `useSegmentedDrag.js` `onMove` (`pill.style.transform = …`) and its "從膠囊「當下視覺位置」接手" `DOMMatrixReadOnly` read at `useSegmentedDrag.js:184-186`.
- Haptics: `bump()` on commit (existing).
- Comments in Traditional Chinese; keep the header JSDoc, update its bullet list to describe the new behaviour (interruptible, trailing-window velocity, no state during gesture).

## Steps

1. Add `rubberBand` to `src/lib/gesture.js` and tests in `src/__tests__/lib/gesture.test.js` (sign preserved, bounded by constant, monotonic). Mirror the existing `rubberBand` tests in `src/__tests__/hooks/useSegmentedDrag.test.js`.
2. Rewrite `src/hooks/useDaySwipe.js` per Target. Remove `useState` entirely from the hook (it should import only `useRef, useEffect, useCallback`).
3. Update `src/__tests__/hooks/useDaySwipe.test.jsx`:
   - Read it first. Existing tests fake timers and fire touch events; they should still pass if the DOM element they attach to is the `carouselRef` element. If they relied on `carouselStyle.transform` / `carouselClassName`, switch assertions to `carouselRef.current.style.transform`.
   - The "未達距離與速度閾值 → 不切日" test holds the finger 100ms to get velocity 0.3; under the new threshold (0.11 over the trailing window) that case **would commit**. Change that test to a genuinely slow release: e.g. move 30px, then wait 200ms with no further moves (so the trailing window has a single sample → `v = 0`), then release → no commit. Add a comment explaining the trailing-window semantics.
   - Add tests: (a) flick: move 30px within 40ms → commits (velocity path, distance < 50); (b) re-grab during snap-back: after release, advance 100ms, fire `touchstart` → `carouselRef.current.style.transition === 'none'` and no error; release at 0 → no commit; (c) `touchstart` during commit cancels the settle timer: advance 100ms into the commit, touchstart, touchend with no move → the day did **not** change until… keep it simple: assert `setActiveDay` not called at 350ms if the commit was interrupted and released at < threshold. Use `getComputedStyle` mocking only if jsdom returns `'none'` (then `baseX = 0` and the test still exercises the interrupt path).
4. `npm test`.

## Boundaries

- Do NOT edit `src/pages/TripPage.jsx` (the returned API is shape-compatible). If `TripPage` turns out to read `swipe.isDragging` or similar, STOP and report.
- Do NOT edit `useSegmentedDrag.js` (plan 003).
- Do NOT change the swipe-hint localStorage logic in TripPage.
- No new dependencies.
- If any excerpt above does not match the file, STOP and report.

## Verification

- **Mechanical**: `npm test` passes (≥ 177 + new tests). `grep -n "useState" src/hooks/useDaySwipe.js` → no output. `grep -n "300" src/hooks/useDaySwipe.js` → only the `SETTLE_MS` constant line.
- **Feel check** (real iPhone, trip with ≥ 3 days):
  - Flick left quickly over ~30px: commits to next day.
  - Drag 100px and hold still for a second, then lift: commits (distance path) with no "flick" needed.
  - Drag 40px, release (snap-back starts), immediately grab again mid-flight: the carousel sticks to the finger from where it was, no jump, no lag.
  - Swipe to commit, grab again mid-slide: the panel follows the finger; releasing near the original spot snaps back and the day does **not** change.
  - Pull past the first day: resistance increases progressively and caps (~80px), no hard stop.
  - Scroll the page vertically: React DevTools Profiler shows **no** TripPage render on touchstart.
  - DevTools → Rendering → emulate `prefers-reduced-motion`: clear the swipe-hint key (`localStorage.removeItem('swipeHintShown:v1')`), reload → no 56px peek jump.
- **Done when**: tests pass and the four feel checks above behave as described.
