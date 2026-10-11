# 004 — Reduced motion done right, DayNav press feedback, DayNav scroll

- **Status**: DONE (mechanical verified; feel-check pending on device)
- **Commit**: 4fb28a7
- **Severity**: MEDIUM
- **Category**: Accessibility · Physicality
- **Estimated scope**: `src/index.css` (the two `prefers-reduced-motion` blocks), `src/components/trip/DayNav.jsx`
- **Depends on**: plan 001 (`src/lib/motion.js`, dead CSS removed, `--dur-*` tokens)

## Problem

### P1. The global reduced-motion reset nukes **all** feedback (MEDIUM)

AUDIT §6: "Reduced motion means fewer and gentler animations, **not zero** — keep transitions that aid comprehension, remove position changes."

```css
/* src/index.css:125-134 — current */
@media (prefers-reduced-motion: reduce) {

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
Consequences: every `transition-opacity` / `transition-colors` / `.frosted-tab-btn` colour / `.traveling` fade / press background change becomes instant, and `animate-spin` on the refresh icon freezes (the only "refreshing" signal). A second, targeted block exists at `index.css:923-935`.

### P2. `.animate-heart-transition` escapes the reset (MEDIUM)

```css
/* src/index.css:419 — current */
  animation: heartTransition 2.5s cubic-bezier(0.2, 0, 0.1, 1) forwards !important;
```
Both rules are `!important`; the class selector (0,1,0) beats `*` (0,0,0), so the full-screen 2.5s `scale(0.125)→scale(15)` zoom plays regardless of the preference. The easter egg is allowed long durations, but not a reduced-motion exemption for a full-viewport zoom.

### P3. DayNav smooth scroll ignores the preference (LOW)

```js
// src/components/trip/DayNav.jsx:50 — current
el.scrollTo({ left: el.scrollLeft + delta, behavior: 'smooth' })
```
An explicit JS `behavior` overrides the CSS `scroll-behavior: auto`.

### P4. DayNav buttons have no press feedback (MEDIUM, highest-frequency tap)

`-webkit-tap-highlight-color: transparent` is global (`index.css:59, 121`), so these buttons give **zero** pointer-down feedback. AUDIT: "pressable elements with no press feedback"; Apple: "respond on pointer-down".

```jsx
// src/components/trip/DayNav.jsx:78 — current (compact)
className="grid place-items-center px-2.5 min-h-[44px] flex-shrink-0 touch-manipulation relative snap-center"
// src/components/trip/DayNav.jsx:99 — current (regular)
className="flex flex-col items-center gap-1 min-w-[4rem] flex-shrink-0 min-h-[44px] justify-center touch-manipulation px-2 relative snap-center"
```

## Target

### One reduced-motion block (replace both existing blocks; place it at the **end** of `index.css`, after the easter-egg and tab sections, so it wins ties)

```css
/* ── prefers-reduced-motion ─────────────────────────────────────
   原則（AUDIT §6）：拿掉「位移 / 縮放」，保留「顏色 / 透明度」等幫助理解的回饋。
   不用 `*` 通殺：那會連 spinner、淡入淡出、按壓底色都一起凍住。
   JS 驅動的動畫（Leaflet flyTo、smooth scroll、教學 peek）各自用 lib/motion.js 的
   prefersReducedMotion() 分支，CSS 管不到它們。 */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto !important; }

  /* 位移類 transition 瞬切：面板開關、輪播、卡片 hover 放大、.sheet-hidden 的 visibility 延遲 */
  .transition-transform,
  .sheet-hidden,
  .frosted-tab-pill,
  .frosted-tab-pill-fill {
    transition-duration: 0.01ms !important;
    transition-delay: 0s !important;
  }

  /* press lift / squish：不縮放，但保留底色與投影的變化（顏色回饋留著） */
  .press-springy:active,
  .glass-card.press-springy:active,
  .press-lift:active,
  .stepper-squish.pressed,
  .frosted-glass-button:active,
  .frosted-tab-pill.lifted .frosted-tab-pill-fill {
    transform: none !important;
  }

  /* 一次性 keyframe（縮放 / 位移）：瞬間到終態 */
  .check-pop,
  .bar-celebrate,
  .animate-heart-pop-shake,
  .animate-heart-bounce,
  .animate-plane-fly,
  .animate-share-slide-up,
  .animate-bubble-in,
  .animate-bubble-out,
  .animate-photo-fade-in,
  .animate-bg-fade-in {
    animation-duration: 0.01ms !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
  }
  /* 全螢幕放大過場：比 .animate-heart-transition 自己的 !important 高一層特異性才壓得過 */
  html .animate-heart-transition {
    animation-duration: 0.01ms !important;
    animation-delay: 0s !important;
  }

  /* 保留：animate-spin（refresh 進行中唯一訊號）、animate-pulse（opacity）、
     transition-opacity / transition-colors、.frosted-tab-btn color、.traveling 淡入淡出。 */
}
```
Remove the old block at `index.css:125-134` and the old targeted block at `index.css:923-935` (its rules are folded in above). Update any comments that say "由全域 reset 自動降級" (e.g. `.press-springy` comment at `index.css:598-599`, `Skeletons.jsx:2`): they should now say the reduced-motion block targets position/scale only.

### DayNav

```js
import { prefersReducedMotion } from '../../lib/motion.js'
…
el.scrollTo({ left: el.scrollLeft + delta, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
```

Press feedback: add `press-lift` to both button class strings. `.press-lift:active` is `scale(1.15)` — too big for a 4rem-wide day cell with neighbours 0px apart; add a calmer variant in `index.css` right after `.press-lift`:

```css
/* 緊鄰排列的小格（DayNav 日期）：lift 收到 1.06，避免放大時壓到隔壁格 */
.press-lift.press-lift-sm:active {
  transform: scale(1.06);
}
```
and use `press-lift press-lift-sm` on both DayNav buttons. (Reduced motion: `.press-lift:active { transform: none }` above already covers it.)

## Repo conventions to follow

- CSS comments in Traditional Chinese; section headers use the `/* ── … ── */` style.
- `press-lift` is the "no glass material, pure lift" press class (see its comment at `index.css:620-624`).
- `DayNav` already imports from `../../lib/*.js` (`haptic.js`, `tripDate.js`).

## Steps

1. Delete the two existing reduced-motion blocks; append the new single block at the end of `index.css`.
2. Fix the comments that reference the old global reset (`index.css` `.press-springy` comment; `src/components/ui/Skeletons.jsx:2` comment).
3. Add `.press-lift.press-lift-sm:active` after `.press-lift:active`.
4. `DayNav.jsx`: import helper, branch `behavior`, add `press-lift press-lift-sm` to both buttons.
5. `npm test`.

## Boundaries

- Do NOT touch `TripMap.jsx`, `useDaySwipe.js`, `SegmentedControl.jsx` (their JS reduced-motion branches are in plans 007 / 002 / 003).
- Do NOT change the panel JSX class strings (plan 005).
- Do NOT add a "fade instead of slide" variant for panels: instant is acceptable under reduced motion and keeps the `sheet-hidden` visibility logic simple.
- No new dependencies. If an excerpt doesn't match, STOP and report.

## Verification

- **Mechanical**: `npm test` green. `grep -n "prefers-reduced-motion" src/index.css` → exactly one `@media` line. `grep -n "animation-duration: 0.01ms" src/index.css` → lines only inside that block.
- **Feel check**: DevTools → Rendering → `prefers-reduced-motion: reduce`:
  - Open a BottomSheet: appears instantly (no slide), backdrop still fades 300ms.
  - Pull to refresh: the spinner still rotates while refreshing.
  - Press a card: no scale, but the background/shadow still change.
  - Trigger the proposal easter egg (Day 4, 9 quick taps on the DayNav day): the heart does not zoom across the screen; the next screen appears directly.
  - Switch tabs: pill jumps, label colour still fades.
  - DayNav: tapping a day gives a visible lift at ~140ms (with the preference off) and the strip re-centres without animation (with the preference on).
- **Done when**: all checks pass.
