# Animation plans

Written by the `improve-animations` audit at commit `4fb28a7` (2026-10-11). Audit rule source: Emil Kowalski's animation principles (`AUDIT.md`), Apple "Designing Fluid Interfaces" gesture principles, and the `fixing-motion-performance` rule set.

| # | Plan | Severity | Status |
|---|------|----------|--------|
| 001 | [Motion tokens, press timing, hover gating, dead CSS, trip-halo](001-motion-tokens-and-press-timing.md) | HIGH + MEDIUM + LOW | DONE |
| 002 | [Day carousel: interruptible, velocity-aware, no per-touch re-render](002-day-carousel-gesture.md) | HIGH | DONE |
| 003 | [SegmentedControl pill: ≤300ms, transitionend, no keyboard animation](003-segmented-control-pill.md) | HIGH | DONE |
| 004 | [Reduced motion done right, DayNav press feedback](004-reduced-motion-and-daynav-feedback.md) | MEDIUM | DONE |
| 005 | [Sheets: dismiss from release point, interruptible grab, content retention](005-sheets-dismiss-and-content-retention.md) | MEDIUM | DONE |
| 006 | [Checklist: press feedback, progress bar final step](006-checklist-feedback.md) | MEDIUM | DONE |
| 007 | [TripMap: capped camera, reduced motion, NearbyStrip entrance](007-map-camera-and-nearby-strip.md) | MEDIUM | DONE |
| 008 | [Pull-to-refresh: stale reset, no re-render, settle, honest wait](008-pull-to-refresh.md) | MEDIUM | DONE |
| 009 | [Proposal easter egg polish](009-proposal-easter-egg-polish.md) | LOW | DONE |

## Execution order and dependencies

Run **sequentially** in numeric order; several plans edit `src/index.css` and the gesture hooks, so parallel execution would conflict.

- **001 first.** It introduces `--ease-out`, `--dur-press-in/out`, `--dur-panel-close`, the Tailwind `ease-out` override, and `src/lib/motion.js` (`prefersReducedMotion()`), which 002–009 consume. It also deletes dead CSS that 004/009 would otherwise have to reason about.
- **002** adds `rubberBand()` to `src/lib/gesture.js`; **003** and **008** import it.
- **004** replaces the two `prefers-reduced-motion` blocks with one; **007** adds `.nearby-enter` to that block.
- **005** relies on `--dur-panel-close` (001) and the already-removed BottomSheet dead branch (001).
- **009** last: lowest severity, isolated files.

## Findings → plans map

| Audit finding | Plan |
|---|---|
| #1 press-in timing / symmetric `.press-springy` | 001 |
| #2 day carousel interruptibility / velocity / re-render / will-change | 002 |
| #3 tab pill 520ms / colour spring / TRAVEL_MS / keyboard | 003 (colour curve in 001) |
| #4 reduced motion (CSS nuke, `!important` escape, JS leaks) | 004 (CSS), 002/003/007 (JS branches) |
| #5 sheet dismiss hitch / mid-flight grab / touchcancel | 005 |
| #6 trip-halo clipped infinite repaint | 001 |
| #7 sheet content unmounts on close | 005 |
| #8 no press feedback DayNav / checklist | 004 (DayNav), 006 (checklist) |
| #9 map camera / locate button / NearbyStrip | 007 |
| #10 pull-to-refresh | 008 |
| #11 checklist progress bar | 006 |
| #12 tokens / duplicate curves / `transition-colors` | 001 (+002 inline curve) |
| #13 raw `:hover` gating / reduced-transparency | 001 |
| #14 dead CSS / dead BottomSheet branch | 001 |
| #15 easter egg | 009 |

## Status legend

`TODO` → `IN PROGRESS` → `DONE` (executor sets DONE after mechanical verification; feel checks are recorded in the plan's Status line as "feel-check pending (device)" until a human confirms).

## Post-review decisions (2026-10-11)

After feeling out the audit's changes on device, the user reverted several timing values to the app's original iOS26-style rhythm:

- **Press-in kept at 220ms** (`--dur-press-in`), not the audit's 100-160ms budget.
- **Tab pill travel kept at 0.52s** (`.frosted-tab-pill` / `.frosted-tab-pill-fill`), not the audit's ≤300ms.
- **`--ease-out` override reverted**: no longer overrides Tailwind's built-in `ease-out` class; it's back to the same curve `(0,0,0.2,1)` and is used only by JS inline transitions and `.sheet-hidden`. The audit's stronger curve `(0.23,1,0.32,1)` was tried and not kept.
- **Body `overscroll-behavior-y: none` removed**: it fought Safari's native pull-to-refresh on iOS. The JS `preventDefault` in `usePullToRefresh` still handles the custom pull gesture.
- **Panel "grab during close" intentionally not supported**: out of scope for this round, left as-is.
