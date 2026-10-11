# 009 — Proposal easter egg: easing order, ShareSheet gesture, progress bar, photo crossfade, layer hacks

- **Status**: DONE (mechanical verified; feel-check pending on device). Video progress bars stay on the interval path (`scaleX(progress)`, driven by `currentTime`); only image slides use the `story-progress` animation.
- **Commit**: 4fb28a7
- **Severity**: LOW (rare, one-off cinematic surface; durations are allowed to be long)
- **Category**: Easing & duration · Interruptibility · Performance · Cohesion
- **Estimated scope**: `src/index.css` (easter-egg keyframe section ~380-500), `src/trips/2026-03-tokyo-hokkaido/extras.jsx`, `src/trips/2026-03-tokyo-hokkaido/extras/ShareSheet.jsx`
- **Depends on**: plan 001 (dead keyframes already removed; `--ease-out`)

The sequence's long durations and the no-focus-trap decision are settled. Only the items below change.

## Problem → Target (one line each; executor reads the surrounding code)

### CSS (`src/index.css`)

1. `.animate-bubble-out { animation: bubbleFadeOut 0.3s ease-in forwards; }` (`:480-482`) → `ease-out` is wrong for an exit too per AUDIT ("Entering or exiting → ease-out"): use `0.3s var(--ease-out) forwards`.
2. `@keyframes bgFadeIn` 90% step `animation-timing-function: ease-in` (`:404`) → `ease` (colour change). Keep the white→black timing itself (Safari chrome resample, see `extras.jsx:238`).
3. `.animate-heart-transition` (`:418-434`): remove the layer-hack lines `transform: translateZ(0); -webkit-transform: translateZ(0); -webkit-perspective: 1000; perspective: 1000; filter: brightness(1) !important; isolation: isolate; shape-rendering/image-rendering/font-smoothing` — keep only `animation`, `will-change: transform, opacity`, `transform-origin`, `backface-visibility`, `position: absolute`. Keep the `!important` on `animation` (plan 004's `html .animate-heart-transition` overrides it for reduced motion).

### `extras.jsx`

4. Story swipe engages with a 10px jump (`:383-385`): `setSwipeY(Math.max(0, dy - 10))` so the panel starts from 0 at the threshold.
5. Story swipe release (`:395-404`, `swipeY > 120` distance only) → also dismiss on velocity: keep a trailing sample (`{y, t}`) in a ref during `handleTouchMove`; at release `v = Δy/Δt` over ≤80ms; dismiss if `swipeY > 120 || (v > 0.11 && swipeY > 24)`.
6. Snap-back transition `'transform 0.3s ease'` (`:601`) → `'transform 0.3s var(--ease-out)'`.
7. Heart bounce (`:439-443`): quick double taps don't restart the keyframes and the first timeout cuts the second short. Replace the boolean + timeout with a counter: `setHeartBounceTick(t => t + 1)` and render the heart with `key={heartBounceTick}` + class `animate-heart-bounce` when `heartBounceTick > 0`; no timeout.
8. Photo crossfade (`:612-622`): both layers transition simultaneously → mid-fade dips to black. Only the **incoming** layer should fade: `transition: isVisible ? 'opacity 200ms ease' : 'opacity 0ms linear 200ms'` (outgoing waits 200ms, then snaps to 0 — its `onTransitionEnd` still fires, so the buffer-swap logic at `:623-631` is preserved).
9. Progress bar (`:676-686`): `transition-all duration-75 ease-linear` on `width` driven by a 50ms `setInterval` → drive the **current** bar with a CSS animation instead: `className="h-full bg-white origin-left"` and for the current index `style={{ animation: \`story-progress ${PHOTO_DURATION}ms linear forwards\`, animationPlayState: isPaused ? 'paused' : 'running' }}`; past bars `transform: scaleX(1)`, future `scaleX(0)`. Add to `index.css`: `@keyframes story-progress { from { transform: scaleX(0) } to { transform: scaleX(1) } }`. Keep the `setInterval` **only** for advancing `currentPhotoIndex` (it may still call `setProgress`, but stop rendering from `progress`; if `progress` is used elsewhere, e.g. `handleTouchStart` elapsed math at `:371`, keep the state but it no longer drives DOM). Restart the animation on index change by keying the current bar with `currentPhotoIndex`. Videos: if a layer is a video and its duration drives progress differently, leave that branch on the interval path and note it in Status.

### `ShareSheet.jsx`

10. Entry (`animate-share-slide-up` keyframe) overwritten by `style.animation = 'none'` on grab (`:18-21`): replace the keyframe with a transition-based entry: initial inline `style={{ transform: 'translateY(100%)' }}`, in a `useEffect` on mount set `transform: 'translateY(0)'` with `transition: 'transform 0.3s var(--ease-out)'` (double-rAF so the start state paints). Grab mid-entry: read `new DOMMatrixReadOnly(getComputedStyle(el).transform).m42` as base and set `transition = 'none'` — same pattern as plan 005.
11. Dismiss by velocity like item 5 (threshold 0.11 px/ms over 80ms, min 24px) in addition to `dy > 80`.
12. Rubber-band above the top instead of `Math.max(0, dy)`: `dy < 0 ? resist(dy) : dy` (import `resist` from `../../../lib/gesture.js`).
13. Backdrop tap `onClick={onClose}` (`:87`) unmounts instantly → route it through the same slide-down exit (`transform: translateY(100%)`, 0.25s `var(--ease-out)`, then `onClose` after 250ms — reuse the dismiss branch of `handleDragEnd`).
14. Overlay opacity: stop rewriting `backgroundColor` per move; set the overlay to a static `rgba(0,0,0,0.4)` and write `style.opacity = 1 - dy/300` instead (opacity is compositor-only).
15. Exit/snap-back curves `'transform 0.25s ease'` / `'transform 0.3s ease'` → `var(--ease-out)`.

## Repo conventions to follow

- Easter-egg code is isolated under `src/trips/2026-03-tokyo-hokkaido/`; no shared components depend on it.
- `resist()` / `rubberBand()` from `src/lib/gesture.js`.
- `PHOTO_DURATION` constant already exists in `extras.jsx`.

## Steps

1. CSS items 1–3 (+ `story-progress` keyframes).
2. `extras.jsx` items 4–9.
3. `ShareSheet.jsx` items 10–15; delete `.animate-share-slide-up` + `@keyframes shareSlideUp` from `index.css` once unused.
4. `npm test` (no tests cover this; make sure the module still imports: `node -e` is not enough for JSX, so run `npm run build`).

## Boundaries

- Do NOT shorten `heartTransition` (2.5s), `bgFadeIn`, `heartShake`, or the 1200/3700ms sequence timers (cinematic by design). If you align the 1200ms timer to the 1300ms shake end, do it as an explicit one-line change with a comment; otherwise leave it.
- Do NOT add a focus trap to `ProposalModal` (signed off).
- Do NOT touch anything outside the three files.
- No new dependencies. If an excerpt doesn't match, STOP and report.

## Verification

- **Mechanical**: `npm test` green; `npm run build` succeeds. `grep -n "transition-all\|ease-in\b" src/index.css src/trips -r` → no output (the `ease-in-out` in `heartShake` is allowed; grep for `ease-in;` and `ease-in ` specifically).
- **Feel check** (real iPhone; trigger: Day 4 of the Tokyo/Hokkaido trip, 9 quick taps):
  - Story: swipe down slowly 30px → the panel starts moving from 0 (no 10px jump); flick down fast → closes; drag down then up past the top → gentle resistance.
  - Double-tap the heart quickly: it bounces twice.
  - Photo change: no darkening dip mid-crossfade (frame-step in DevTools).
  - Progress bar: smooth linear fill; pausing (touch-hold) freezes it mid-way and resumes from the same point.
  - ShareSheet: grab it while it is sliding up: it follows the finger from its current position. Tap the dark backdrop: it slides down, not blink out. Pull it upward: rubber-bands.
  - Emulate reduced motion: the heart zoom and plane fly are instant; the story still works.
- **Done when**: all checks pass.
