# 005 — BottomSheet / Sidebar / DetailModal: dismiss from the release point, interruptible grab, touchcancel, content stays during close

- **Status**: DONE (mechanical verified; feel-check pending on device)
- **Commit**: 4fb28a7
- **Severity**: MEDIUM (HIGH for DetailModal drag-to-close, which is the common way to close it)
- **Category**: Interruptibility · Physicality · Missed opportunity (corrective)
- **Estimated scope**: `src/components/layout/BottomSheet.jsx`, `src/components/layout/Sidebar.jsx`, `src/components/trip/ItinerarySection.jsx` (DetailModal only), `src/pages/TripPage.jsx` (modal mounting), `src/index.css` (one helper class)
- **Depends on**: plan 001 (`--dur-panel-close`, `--ease-out`, dead BottomSheet branch already removed)

## Problem

All three panels share one drag-to-dismiss implementation. On release:

```js
// src/components/layout/BottomSheet.jsx:99-111 — current (same shape in Sidebar.jsx:72-82 and ItinerarySection.jsx:153-166)
  const handleDragRelease = (e) => {
    if (touchStartY.current === null) return
    const elapsed = Math.max(1, Date.now() - touchStartTime.current)
    const velocity = dragYRef.current / elapsed
    const captured = dragYRef.current
    touchStartY.current = null
    setIsDragging(false)
    setDragY(0)
    dragYRef.current = 0
    if (captured > 120 || velocity > 0.5) {
      if (e?.cancelable) e.preventDefault()
      onCloseRef.current()
    }
  }
```
```jsx
// src/components/layout/BottomSheet.jsx:119-125 — current
  const sheetClass = [
    'fixed inset-x-0 bottom-0 z-50 max-w-2xl mx-auto',
    isDragging ? '' : (isOpen ? 'transition-transform duration-500 ease-spring-soft' : 'transition-transform duration-300 ease-out'),
    dragY === 0 ? (isOpen ? 'translate-y-0' : 'translate-y-full sheet-hidden') : '',
  ].filter(Boolean).join(' ')
```

1. **Spring-up hitch on dismiss.** `onClose` is `closePanel = () => navigate(-1)` (`TripPage.jsx:81`); the resulting `popstate` → `isOpen=false` lands on a later task. In between, `dragY=0` + `isOpen=true` re-applies `translate-y-0 ease-spring-soft`, so the sheet starts springing back up before retargeting to `translate-y-full`. (Visible frame count needs a device check.) The close is also always a fixed 300ms from wherever it is.
2. **Velocity** is the average since `touchstart` with threshold 0.5. AUDIT: dismiss when `Math.abs(distance)/elapsedMs > ~0.11` measured at release; Apple: use the trailing velocity.
3. **BottomSheet can be grabbed mid-open / mid-close with no guard** (`onHeaderTouchStart`, `:113-117`, has no `isOpen` check and no live-transform base): grabbing a closing sheet makes it flash back near-open plus the drag delta; grabbing mid-open snaps to the end.
4. **Missing `onTouchCancel`** on Sidebar (`Sidebar.jsx:108-109`) and the DetailModal pill (`ItinerarySection.jsx:224-225`): an iOS system gesture mid-drag leaves `isDragging=true` and the panel frozen off its resting position. BottomSheet already wires it (`BottomSheet.jsx:162`).
5. **Sheet content unmounts the instant the close starts** (`TripPage.jsx:383, 393, 403, 413, 424`: `{activeModal === 'info' && (…)}` / `{mapOpen && (…)}`), so an empty glass panel slides away; for the map the tiles vanish and leave bare glass. `DetailModal` already solves this with `displayRow` (`ItinerarySection.jsx:98-118, 179`).

## Target

### A. Shared release logic (apply identically to all three panels)

New refs: `samplesRef` (trailing `{pos, t}` samples, window 80ms), `closingRef` (boolean: a dismiss transition is in flight).

**touchstart** (header / pill / sidebar):
- BottomSheet & DetailModal: if `!isOpen && !closingRef.current` → ignore. If `closingRef.current` (grabbing a closing sheet) → cancel the close: `closingRef.current = false` and continue as a normal drag from the live position.
- Read live position: `const m = getComputedStyle(sheetRef.current).transform; base = m && m !== 'none' ? new DOMMatrixReadOnly(m).m42 : 0` (Sidebar: `.m41`). Store `baseRef`. (When the sheet is at rest open, base is 0.)
- `setIsDragging(true)` (one render; acceptable, it is once per gesture).
- Reset samples: `samplesRef.current = [{ pos: clientY, t: Date.now() }]`.

**touchmove**: `delta = (clientY - startY) + baseRef` (Sidebar: X). Keep the existing `resist()` on the non-dismiss direction. Push a sample, drop samples older than 80ms. Keep `setDragY(next)` (the children's element identity is stable so React skips them; see audit note) — do not refactor this to refs in this plan.

**touchend / touchcancel** (`handleDragRelease`):
```js
const samples = samplesRef.current
const first = samples[0], last = samples[samples.length - 1]
const v = samples.length > 1 ? (last.pos - first.pos) / Math.max(1, last.t - first.t) : 0   // px/ms, + = toward dismiss (down / left for sidebar use the sign convention of that panel)
const captured = dragYRef.current
touchStartY.current = null
const shouldClose = captured > 120 || (v > 0.11 && captured > 24)
if (shouldClose) {
  // 從放開點直接滑出，不先歸零（否則 isOpen 仍 true 的那幾幀會先彈回頂再被 navigate(-1) 關掉）
  closingRef.current = true
  setIsDragging(false)
  setDismissing(true)          // new state: renders translate-y-full with the close transition while isOpen is still true
  if (e?.cancelable) e.preventDefault()
  onCloseRef.current()
} else {
  setIsDragging(false)
  setDragY(0)
  dragYRef.current = 0
}
```
- `dismissing` state: while true, the sheet class is `transition-transform duration-[var(--dur-panel-close)] ease-out translate-y-full` regardless of `isOpen`, and `dragY` is ignored. Reset `dismissing=false`, `closingRef=false`, `dragY=0` in the existing `useEffect` that watches `isOpen` (when `isOpen` becomes false) **and** on `transitionend` of the sheet element (`propertyName === 'transform'`) as a fallback if history never changes (e.g. `navigate(-1)` lands on another route).
- Duration from release velocity (optional but cheap): when `v > 0.11`, set an inline `style.transitionDuration` of `clamp(120, remaining / v, 300)` ms where `remaining = sheetHeight - captured` (`sheetRef.current.offsetHeight`); otherwise leave the token 300ms. Clear the inline duration when `dismissing` resets.
- Sidebar: sign convention is captured `< 0` = toward close; mirror the conditions (`captured < -80 || (v < -0.11 && captured < -24)`) and use `-translate-x-full`.

**JSX class strings** (BottomSheet shown; Sidebar and DetailModal analogous):
```jsx
const sheetClass = [
  'fixed inset-x-0 bottom-0 z-50 max-w-2xl mx-auto',
  isDragging
    ? ''
    : (dismissing || !isOpen)
      ? 'transition-transform duration-[var(--dur-panel-close)] ease-out'
      : 'transition-transform duration-500 ease-spring-soft',
  (dismissing || (dragY === 0 && !isOpen)) ? 'translate-y-full' : (dragY === 0 ? 'translate-y-0' : ''),
  (!isOpen && !dismissing && dragY === 0) ? 'sheet-hidden' : '',
].filter(Boolean).join(' ')
```
Keep the inline `style={{ transform: translateY(dragY) }}` for `dragY !== 0 && !dismissing`.

Replace the three hard-coded `duration-300` close classes with `duration-[var(--dur-panel-close)]` so the `.sheet-hidden` visibility delay (plan 001) and the JSX can never drift.

Add `onTouchCancel` to Sidebar (`onTouchCancel={onTouchEnd}`) and the DetailModal pill (`onTouchCancel={onPillTouchEnd}`).

### B. Keep sheet content mounted through the close (TripPage)

In `TripPage.jsx`, derive a `renderedModal` that lags `activeModal` by the close duration:
```js
// 關閉時內容多留 --dur-panel-close，讓滑下去的面板裡還有東西（空玻璃板滑走很突兀）；DetailModal 用 displayRow 做同一件事
const [renderedModal, setRenderedModal] = useState(activeModal)
useEffect(() => {
  if (activeModal) { setRenderedModal(activeModal); return }
  const id = setTimeout(() => setRenderedModal(null), PANEL_CLOSE_MS)
  return () => clearTimeout(id)
}, [activeModal])
```
with `const PANEL_CLOSE_MS = 300 // 與 index.css --dur-panel-close 同值`. Use `renderedModal === 'info'` (etc.) for the five content conditions, keep `isOpen={activeModal === 'info'}` for the `isOpen` props. For the map: `mapOpen` is presumably `activeModal === 'map'` (check); apply the same lag.

## Repo conventions to follow

- Open/close asymmetry (spring open, ease-out close) is a settled decision; keep both curves.
- `resist()` from `src/lib/gesture.js` for reverse-direction stretch.
- `useModalA11y`, `useScrollLock` usage unchanged.
- `DetailModal` content retention pattern: `ItinerarySection.jsx:98-118`.

## Steps

1. BottomSheet: implement A (samples, base from live transform, `dismissing`, `closingRef`, `transitionend` fallback, velocity duration, class string).
2. DetailModal (`ItinerarySection.jsx`): same, plus `onTouchCancel`.
3. Sidebar: same with X axis and mirrored signs, plus `onTouchCancel`. Keep its existing `if (!isOpen) return` guard but allow the `closingRef` case.
4. TripPage: `renderedModal` lag for the five content blocks.
5. Run `npm test`; the ItinerarySection smoke test and useModalA11y tests must still pass.

## Boundaries

- Do NOT change the open animation (500ms `ease-spring-soft`) or the single-layer extended glass structure.
- Do NOT portal/unportal anything; do NOT change the `noScroll` layout.
- Do NOT edit `useDaySwipe.js`, `usePullToRefresh.js`, `TripMap.jsx`.
- No new dependencies. If an excerpt doesn't match, STOP and report.

## Verification

- **Mechanical**: `npm test` green. `grep -n "duration-300" src/components/layout/BottomSheet.jsx src/components/layout/Sidebar.jsx src/components/trip/ItinerarySection.jsx` → only the backdrop `transition-opacity duration-300` lines (if any), none on the sheet transform.
- **Feel check** (real iPhone):
  - Drag a BottomSheet down 150px and release: it continues downward from exactly where you let go, no upward blip. Record with the Animations panel at 10% on desktop to confirm no reverse motion.
  - Flick it down fast after only ~40px: dismisses, and faster than a slow release.
  - Start closing (release past threshold), then immediately grab the sheet again: it follows the finger and can be pulled back open; the panel state stays consistent (no empty panel, no stuck state) after a second release.
  - While a sheet is opening, grab the handle: it follows from its current position, no jump.
  - Close the map sheet: tiles stay visible during the slide-down. Close 旅程資訊: the content stays visible during the slide-down.
  - Sidebar: drag halfway, trigger an iOS system gesture (swipe up from the bottom edge) mid-drag, return: the sidebar is either fully open or fully closed, never stuck.
- **Done when**: all checks pass.
