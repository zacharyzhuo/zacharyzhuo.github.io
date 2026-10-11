# 006 — Checklist: press feedback, progress bar that animates its final step, compositor-only fill

- **Status**: DONE (mechanical verified; feel-check pending on device)
- **Commit**: 4fb28a7
- **Severity**: MEDIUM
- **Category**: Physicality · Missed opportunity (corrective) · Performance · Cohesion
- **Estimated scope**: `src/components/trip/ChecklistSection.jsx`, `src/index.css` (bar-complete keyframes only), `src/__tests__/components/ChecklistSection.test.jsx` (+1 test)
- **Depends on**: plan 001 (press tokens)

## Problem

1. **The toggle has no press feedback** (`ChecklistSection.jsx:158-163`, no press class; tap-highlight is globally transparent). It toggles on `touchend` with a 10px move guard (`:86-95`), which is fine.
2. **The final progress step never animates.** The bar is keyed on the celebrating flag:
   ```jsx
   // src/components/trip/ChecklistSection.jsx:145-148 — current
   <div
     key={isCelebrating ? `${category}-celebrating` : category}
     className={`h-full bg-jp-green transition-[width] duration-300 ease-out${isCelebrating ? ' bar-celebrate' : ''}`}
     style={{ width: `${pct}%` }}
   />
   ```
   Sequence on the last toggle: render at 100% (transition starts) → effect (`:40-75`) sets `celebrating` → the key changes → the bar **remounts** at a static 100%. The one fill that matters most teleports, and the glow plays on a bar that already jumped. 700ms later the key changes back and it remounts again.
3. `width` is a layout property; the JS timer (700ms, `:73`) and the CSS animation (0.6s, `index.css:993`) are unlinked.

## Target

### Progress bar

```jsx
{/* 進度條：填滿用 transform（compositor），完成瞬間在 track 上疊一層 overlay 播 bar-celebrate；
    bar 本身不下 key，否則最後一步會因 remount 直接跳到 100% 而沒有填滿動畫 */}
<div className="relative h-1 rounded-full bg-stone-200/60 overflow-hidden mb-3">
  <div
    className="absolute inset-0 bg-jp-green origin-left transition-transform duration-300 ease-out"
    style={{ transform: `scaleX(${pct / 100})` }}
  />
  {isCelebrating && (
    <div key={`${category}-celebrate-${celebrateTick}`} className="absolute inset-0 bar-celebrate pointer-events-none" aria-hidden="true" />
  )}
</div>
```
- `celebrateTick`: a counter incremented in the effect each time a category newly completes, so repeated completions restart the overlay animation (keyframes restart only on remount).
- `bar-complete` keyframes: the overlay is a white flash over the green fill, no `scaleX` (the fill underneath is still transitioning):
  ```css
  @keyframes bar-complete {
    0%   { background: rgba(255, 255, 255, 0);    }
    30%  { background: rgba(255, 255, 255, 0.55); }
    100% { background: rgba(255, 255, 255, 0);    }
  }
  .bar-celebrate {
    animation: bar-complete 0.6s ease-out forwards;
  }
  ```
  (Drop the `filter: brightness()` version; `filter` is paint-heavy and the overlay achieves the same flash.)
- Timer: `const CELEBRATE_MS = 600 // 與 index.css .bar-celebrate 同值`; use it in the `setTimeout` at `:73` instead of `700`.

### Press feedback

Item button: add `press-springy rounded-xl` to the class string at `:160`. (`.press-springy:active` lifts 1.03 and, after plan 001, transitions `background-color`; add `active:bg-white/25` via Tailwind so there is a tint on press too.)

## Repo conventions to follow

- Press classes: `.press-springy` for list rows (Sidebar menu items use it, `Sidebar.jsx:140`).
- `transition-transform duration-300 ease-out` is the house "state feedback" transition (after plan 001 `ease-out` resolves to `--ease-out`).
- Tests use `@testing-library/react`; see `src/__tests__/components/ChecklistSection.test.jsx` for the render helper and localStorage setup.

## Steps

1. Replace the bar markup per Target; add `celebrateTick` state; use `CELEBRATE_MS`.
2. Update `bar-complete` keyframes and `.bar-celebrate` in `index.css`.
3. Add `press-springy rounded-xl active:bg-white/25` to the item button.
4. Test: add one test that completing the last item of a category renders an element with class `bar-celebrate` (use fake timers; `success()` haptic is a no-op in jsdom — check `src/__tests__/setup.js` for existing haptic mocks). Existing 4 localStorage tests must stay green.
5. `npm test`.

## Boundaries

- Do NOT change the toggle/localStorage logic or the `touchend` guard.
- Do NOT touch `check-pop` (plan 001 already retuned it).
- No new dependencies. If an excerpt doesn't match, STOP and report.

## Verification

- **Mechanical**: `npm test` green (≥ 5 checklist tests). `grep -n "transition-\[width\]\|filter: brightness" src/components/trip/ChecklistSection.jsx src/index.css` → no output.
- **Feel check** (Animations panel at 10%):
  - Check the last item of a category: the green fill **slides** to 100% over 300ms, and a white flash plays over it at the same time; the ✓ pops in from 0.92.
  - Uncheck and re-check: the flash plays again.
  - Pressing any item lifts it 1.03 within ~140ms with a faint tint; releasing bounces back.
- **Done when**: all checks pass.
