# 007 — TripMap: capped camera moves, reduced-motion aware, locate button on transform, NearbyStrip entrance

- **Status**: DONE (mechanical verified; feel-check pending on device)
- **Commit**: 4fb28a7
- **Severity**: MEDIUM
- **Category**: Easing & duration · Accessibility · Performance · Missed opportunity
- **Estimated scope**: `src/components/trip/TripMap.jsx`, `src/components/trip/NearbyStrip.jsx`, `src/index.css` (one small block)
- **Depends on**: plan 001 (`src/lib/motion.js`)

## Problem

```js
// src/components/trip/TripMap.jsx:48 — current (FitBounds, explore mode)
map.fitBounds(bounds, { padding: [44, 44], maxZoom: 16 })
// :178 — locate
mapRef.current?.flyTo([ll.lat, ll.lng], 14)
// :187 — focusPoint (NearbyStrip card)
mapRef.current?.flyTo([p.lat, p.lng], 16)
// :215 — route overview
map.fitBounds(L.latLngBounds(…), { padding: [44, 44], maxZoom: 16, duration: 0.5 })
// :220-222 — stepper step
map.flyTo([p.lat, p.lng], 16, { duration: 0.6 })
const openPopup = () => markerRefs.current[p.id]?.openPopup()
map.once('moveend', openPopup)
```
```jsx
// src/components/trip/TripMap.jsx:388-391 — current
<div
  className={`absolute right-4 z-[601] transition-[bottom] duration-300 ${
    geoStatus === 'idle' ? 'bottom-6' : 'bottom-[112px]'
  }`}
>
```
```js
// src/components/trip/NearbyStrip.jsx:21 — current
if (status === 'idle') return null
```

1. **Stepper** (HIGH frequency) spends 0.6s flying + waits for `moveend` before the popup. AUDIT: UI < 300ms; stacking a wait on a high-frequency control is a finding.
2. **Locate / focusPoint `flyTo` have no duration cap**; Leaflet scales the default by distance, so locating from far away can fly for seconds. The repo's own comment at `:220` already knows this.
3. **All camera moves ignore `prefers-reduced-motion`** (they run on Leaflet's rAF loop; CSS cannot reach them). Leaflet honours `{ animate: false }` on `flyTo`, `fitBounds`, `setView`.
4. **Locate button animates `bottom`** (layout) instead of `transform`.
5. **NearbyStrip pops in with no motion** while the locate button glides 88px to make room; `locating → ok` swaps also teleport.

## Target

### Camera

```js
import { prefersReducedMotion } from '../../lib/motion.js'
const CAM_STEP_S = 0.35     // 路線 stepper 逐站（高頻）
const CAM_FLY_S = 0.6       // 定位 / 最近卡（偶發，可稍長但要有上限）
const CAM_FIT_S = 0.35      // 總覽 fitBounds
const camOpts = (duration) => (prefersReducedMotion() ? { animate: false } : { duration })
```
- `:48` → `map.fitBounds(bounds, { padding: [44, 44], maxZoom: 16, ...camOpts(CAM_FIT_S) })`
- `:178` → `flyTo([…], 14, camOpts(CAM_FLY_S))`
- `:187` → `flyTo([…], 16, camOpts(CAM_FLY_S))`; the popup there opens immediately (unchanged).
- `:215` → `...camOpts(CAM_FIT_S)` instead of `duration: 0.5`
- `:220` → `flyTo([…], 16, camOpts(CAM_STEP_S))`; keep the `moveend` popup, but when reduced motion is on, `moveend` fires synchronously inside `flyTo`, so register the listener **before** calling `flyTo` (reorder the two lines) — otherwise the popup never opens under reduced motion.

### Locate button wrapper

```jsx
<div
  className={`absolute right-4 bottom-6 z-[601] transition-transform duration-500 ease-spring-soft ${
    geoStatus === 'idle' ? 'translate-y-0' : '-translate-y-[88px]'
  }`}
>
```
(88px = 112 − 24; `ease-spring-soft` so it moves in the same family as the strip arriving below it.)

### NearbyStrip entrance (CSS `@starting-style`, no JS)

`index.css` (append near the frosted-glass-panel section):
```css
/* 地圖底部「離你最近」卡片條 / 狀態膠囊：掛載時從下方滑入（@starting-style，無需 JS）。
   stagger 只做裝飾，不阻擋點擊；舊瀏覽器沒有 @starting-style 就直接出現，無害。 */
.nearby-enter {
  transition: transform 0.5s var(--ease-spring-soft), opacity 0.3s ease;
  transition-delay: var(--enter-delay, 0ms);
}
@starting-style {
  .nearby-enter {
    transform: translateY(100%);
    opacity: 0;
  }
}
```
Note: the strip's outer `div` is `absolute … bottom-0`; `translateY(100%)` = its own height, which is the intended "from below" reveal (AUDIT §8: use percentages, not px).

`NearbyStrip.jsx`:
- Add `nearby-enter` to the outer `div` of all three branches (locating/error pill, empty pill, card strip).
- Cards: `style={{ '--enter-delay': \`${Math.min(i, 5) * 40}ms\` }}` and `nearby-enter` on each card button (cards stagger 0–200ms; they are tappable from the first frame since `pointer-events` is never disabled).

Reduced motion: plan 004's block zeroes `.transition-transform`; add `.nearby-enter` to that block's first selector list (`transition-duration: 0.01ms !important; transition-delay: 0s !important`). Coordinate: plan 004 may already be applied — if so, edit its block; if not, add the selector in this plan and note it.

## Repo conventions to follow

- Haptic `bump()` on camera moves stays.
- Panel family curve: `ease-spring-soft` (500ms) for things that slide in from an edge.
- `frosted-glass-panel` for static glass containers (NearbyStrip pills).

## Steps

1. TripMap: constants + `camOpts`, apply to the five call sites, reorder the `moveend` registration.
2. TripMap: locate wrapper to transform.
3. index.css: `.nearby-enter` + `@starting-style`; add it to the reduced-motion block.
4. NearbyStrip: classes and `--enter-delay`.
5. `npm test` (map pure functions are tested in `src/__tests__/lib/maps.test.js`; nothing here should affect them).

## Boundaries

- Do NOT change the stepper squish/lift classes, the `FitBounds` mounting rules, or `InvalidateOnMount`.
- Do NOT touch `mapIcons.js`, `maps.js`.
- No new dependencies. If an excerpt doesn't match, STOP and report.

## Verification

- **Mechanical**: `npm test` green. `grep -n "flyTo\|fitBounds" src/components/trip/TripMap.jsx` → every call passes `camOpts(...)`. `grep -n "transition-\[bottom\]" src/components/trip/TripMap.jsx` → no output.
- **Feel check** (desktop Chrome + real iPhone):
  - Route mode, press › repeatedly: each step lands in ~350ms and the popup opens when the camera stops; it feels brisk.
  - Explore mode, tap locate: camera flies at most 0.6s even if you are far from the trip; the locate button rises with a soft spring while the "定位中…" pill slides up from the bottom edge; when cards appear they slide up with a quick 0–200ms stagger and are tappable immediately.
  - Emulate `prefers-reduced-motion`: all camera moves are instant, the stepper popup still opens, the strip appears without sliding.
- **Done when**: all checks pass.
