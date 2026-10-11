# 008 — Pull-to-refresh: fix stale reset, no per-move re-render, settle animation, honest refresh wait

- **Status**: DONE (mechanical verified; feel-check pending on device)
- **Commit**: 4fb28a7
- **Severity**: MEDIUM
- **Category**: Interruptibility · Performance · Missed opportunity · Easing & duration
- **Estimated scope**: `src/hooks/usePullToRefresh.js`, `src/pages/HomePage.jsx`, `src/pages/TripPage.jsx` (indicator block), `src/hooks/useTrips.js`, `src/index.css` (one small block)
- **Depends on**: plan 001 (`--ease-out`)

## Problem

```js
// src/hooks/usePullToRefresh.js:73-77 — current
if (dy <= DEAD_ZONE || window.scrollY > 0) {
  pullYRef.current = 0
  if (pullY !== 0) setPullY(0)   // ← stale closure: the listener is registered once ([] deps), pullY is always 0 here
  return
}
// :85-86
pullYRef.current = damped
setPullY(damped)                  // ← React state on every touchmove → whole page re-renders
// :102
document.addEventListener('touchmove', onTouchMove, { passive: true })
```
```jsx
// src/pages/HomePage.jsx:73-74 — current
style={{ transform: `translateY(${pullY}px)` }}
className={`max-w-2xl mx-auto ${pullY === 0 ? 'transition-transform duration-200 ease-out' : ''}`}
```
```jsx
// src/pages/TripPage.jsx:276-283 (HomePage.jsx:59-65 identical) — current
{showPullIndicator && (
  <div
    className="fixed left-0 right-0 top-0 flex justify-center pointer-events-none z-30"
    style={{
      transform: `translateY(${refreshing ? 24 : Math.max(0, pullY - 30)}px)`,
      opacity: pullIndicatorOpacity,
    }}
  >
```
```js
// src/hooks/useTrips.js:21-25 — current
const refresh = useCallback(async () => {
  clearCached(TRIPS_CACHE_KEY)
  setRefreshTick(t => t + 1)
  // 等待一個 microtask 讓 effect 跑完，UI 端可 await 拿到 fresh 完成
  await new Promise(r => setTimeout(r, 600))
}, [])
```

1. Pull past the dead zone, drag back into it: the indicator (and Home content) **freezes** at its last offset until the finger lifts.
2. Every `touchmove` re-renders HomePage / TripPage (all cards / three day panels).
3. The indicator **teleports**: release below threshold → unmount instantly; release above → jumps 80→24px with no transition; refresh done → vanishes. Home content meanwhile eases back 200ms, so the two disagree.
4. `refresh()` doesn't wait for the fetch; it waits a flat 600ms.
5. `html/body` have no `overscroll-behavior`; with a passive listener, iOS's native top bounce likely stacks on the JS translate (needs device confirmation).
6. Past-threshold damping is linear (`* 0.35`).

## Target

### Hook API

`usePullToRefresh(onRefresh, { enabled })` returns `{ pullY, refreshing, triggerThreshold, indicatorRef, contentRef }` where:
- `pullY` is now **coarse** state updated only at: gesture start (0), when crossing the trigger threshold (so callers can change the icon), and on release (0). It is no longer updated per move.
- `indicatorRef`: callers attach it to the indicator element; the hook writes `style.transform` and `style.opacity` to it per move.
- `contentRef` (optional): if attached (HomePage does; TripPage does not), the hook writes `style.transform = translateY(px)` per move.
- Per-move math unchanged except damping: `effective < TRIGGER_THRESHOLD ? effective : TRIGGER_THRESHOLD + rubberBand(effective - TRIGGER_THRESHOLD, 60)` (import `rubberBand` from `../lib/gesture.js`).
- The stale-closure branch becomes: `if (pullYRef.current !== 0) { pullYRef.current = 0; writeIndicator(0) }` (no state).
- `writeIndicator(y)`: `indicator.style.transform = translateY(${Math.max(0, y - 30)}px)`, `indicator.style.opacity = Math.min(1, y / TRIGGER_THRESHOLD)`; content: `translateY(${y}px)`.
- **Settle on release** (both outcomes):
  - Set `indicator.style.transition = 'transform 200ms var(--ease-out), opacity 200ms ease'` and `content.style.transition = 'transform 200ms var(--ease-out)'` (only during settle; remove them on `transitionend` or after 220ms).
  - Below threshold: write `y = 0`, and keep the indicator element mounted with `opacity: 0` until the transition ends, then `setPullY(0)` (which unmounts it in the page).
  - Above threshold: write the indicator to `translateY(24px)`, `opacity: 1`, content to `translateY(0)`; `setRefreshing(true)`; `await onRefresh()`; then set the indicator transition again, write `opacity: 0`, `translateY(0)` and after 200ms `setRefreshing(false)`.
- Mount-state helper: expose `showIndicator = pullY > 0 || refreshing || settling` from the hook (`settling` is an internal state flipped by the two paths above) so pages can keep the element mounted while it fades out.
- Listener options: keep `passive: true` for `touchstart`/`touchend`; change `touchmove` to `{ passive: false }` and call `e.preventDefault()` **only** once the gesture is decided vertical and `window.scrollY === 0` and `dy > DEAD_ZONE` (this is what stops iOS's native bounce from stacking). Add `overscroll-behavior-y: none` on `body` in `index.css` as belt-and-braces (comment: 由 JS 下拉刷新接管頂端過拉).

### Pages

HomePage:
```jsx
const { pullY, refreshing, triggerThreshold, indicatorRef, contentRef, showIndicator } = usePullToRefresh(refresh, …)
…
{showIndicator && (
  <div ref={indicatorRef} className="absolute left-0 right-0 top-0 flex justify-center pointer-events-none z-10" style={{ transform: 'translateY(0px)', opacity: 0 }}>
    <div className="frosted-glass-button rounded-full p-3 text-muted">
      <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
    </div>
  </div>
)}
<div ref={contentRef} className="max-w-2xl mx-auto">
```
(remove the `style={{ transform }}` and the `transition-transform duration-200 ease-out` class; the hook owns both.)

TripPage: same for the indicator (`fixed … z-30`), no `contentRef` (the day carousel owns its transform; keep the existing comment).

### `useTrips.refresh` waits for the real fetch

```js
const refresh = useCallback(() => {
  clearCached(TRIPS_CACHE_KEY)
  return new Promise((resolve) => {
    refreshResolveRef.current = resolve        // effect 完成（成功或失敗）時 resolve
    setRefreshTick(t => t + 1)
  })
}, [])
```
In the fetch effect's completion (`finally`-equivalent where `setLoading(false)` happens), call `refreshResolveRef.current?.(); refreshResolveRef.current = null`. Keep a **minimum** spinner time of 300ms on the hook side: in `usePullToRefresh`, `await Promise.all([onRefresh(), new Promise(r => setTimeout(r, 300))])`. Check `src/__tests__/hooks/useTrips.test.jsx` and `useSheetData.test.jsx`; adapt if they time the old 600ms.

## Repo conventions to follow

- Direct-DOM-during-gesture pattern: `useDaySwipe.js` (after plan 002) and `useSegmentedDrag.js`.
- `rubberBand` lives in `src/lib/gesture.js` after plan 002.
- Indicator markup and `frosted-glass-button` unchanged.

## Steps

1. `usePullToRefresh.js`: refs for indicator/content, per-move DOM writes, rubber-band, non-passive move with guarded `preventDefault`, settle transitions, `showIndicator`.
2. HomePage / TripPage: attach refs, remove per-render transform styles, use `showIndicator`.
3. `useTrips.js`: promise resolved by the effect; hook enforces the 300ms floor.
4. `index.css`: `body { overscroll-behavior-y: none; }` with comment.
5. Add a hook test `src/__tests__/hooks/usePullToRefresh.test.jsx`: (a) drag past dead zone then back inside → indicator `style.opacity === '0'`/transform 0 (the stale-closure regression); (b) release above threshold calls `onRefresh` once; (c) `touchmove` does not call a React `setState` (spy on a render counter: render count stays constant across 10 moves).
6. `npm test`.

## Boundaries

- Do NOT change the trigger geometry constants (`TRIGGER_THRESHOLD 110`, `DEAD_ZONE 18`, `TOP_GRAB_ZONE_PX 140`, `DIRECTION_DECISION_MS 80`).
- Do NOT touch the day-swipe container or `useRevalidateOnVisible`.
- Do NOT change `invalidateSheet`/`revalidateSheet` semantics in `useSheetData`.
- No new dependencies. If an excerpt doesn't match, STOP and report.

## Verification

- **Mechanical**: `npm test` green including the new test file. `grep -n "setPullY(damped)" src/hooks/usePullToRefresh.js` → no output. `grep -n "600" src/hooks/useTrips.js` → no output.
- **Feel check** (real iPhone PWA, scrolled to top):
  - Pull 60px, then slide the finger back up into the dead zone: the indicator fades back to 0 while the finger is still down.
  - Pull 60px and release: indicator fades/slides back over 200ms, Home content eases back in sync.
  - Pull past 110px and release: indicator settles at 24px with a 200ms ease, spinner spins until the trips actually reload (not a fixed 0.6s), then fades out over 200ms.
  - The page content never moves faster than the finger (no native bounce stacking).
  - React Profiler: no HomePage render during the drag.
- **Done when**: all checks pass.
