# Zone-first battle preview

User-authorized scope: retain deckbuilding; choose a zone before revealing cards;
keep attention around the board; give truthful, proportionate feedback on results.
This is an isolated playable battle study, not a replacement for the main game.

## Impact analysis (before implementation)

| Axis | Assessment | Response |
| --- | --- | --- |
| UI / layout | Impact | New `?showcase=zone-first` entry and separately scoped `.zf-preview` styles; no edits to BallparkBattle or its styles. Keep board and action dock stationary. |
| Input / gestures | Impact | Zone tap opens hand; card selection closes it; support placement is explicit and cancellable. Keep horizontal card scrolling, keyboard buttons, and take/basic actions. |
| Logic / balance | Check required | Call existing engine functions for costs, prerequisites, preparation, stacks, public information, results and advancement. Never alter odds, rewards or hidden pitches. Near-miss interpretation only after actual reveal and only for a grid-adjacent miss. |
| Save / load | No impact | Preview state is in React memory. Never read/write production saves. Reload resets the study. |
| Mobile viewport | Check required | Verify 360/375/390px portrait, short landscape, desktop, safe areas and reduced motion. Preview owns a scrollable shell, without changing global layout mode. |
| Scroll / overflow | Check required | Scope all new CSS; allow short-height vertical scroll and independent hand swipe. No body/html/root overflow edits. |
| Existing flow | Check required | Default entry remains Duel; verify title/map scroll/battle/card-stack/pitch/HP/reward/facility/next route/resume/rotation using existing browser regression. Preview terminates at battle completion with replay. |
| Tests / regression | Impact | Add interaction tests for zone-first selection, re-aim, swap/support/preparation, locked pitch and true result feedback; run full existing suite and smoke report. |
| Build / deploy | Check required | Lazy-load preview from main entry; reuse shipped art. Build and size gate; push branch and use existing isolated Pages preview workflow. Do not merge to main. |

## Interaction contract

- Initial state: nine zones, compact HP/count/energy, one instruction and take action. Hand is collapsed.
- Zone selection reveals the current hand below the board; cards never cover zones.
- Selecting an attack shows its actual coverage and one compact plan. Re-aim directly; swap cards or add support without an intermediate confirmation page.
- Preparation cards require an explicit use action; explain cost and limitation before use. Basic swing remains available without a card.
- Resolve through the current engine exactly once, retain pre-pitch HP/count during flight, then reveal the actual pitch, damage and short contextual feedback.
- Audio is opt-in; respect reduced motion; no fake near misses and no hidden-probability disclosure.
- Main saves and game screen are untouched. A small preview label identifies this study.

## Validation

- Full Vitest suite: **173 files / 1,037 tests passed**, including **19** new preview tests.
- Existing game browser regression: **53/53** checks passed (title/map/battle/card-stack/pitch/HP/reward/facility/next route/resume/rotation).
- Built preview browser QA: **90/90** checks passed on 360×640, 375×667, 390×844 and 1440×900, plus reduced motion and touch rotation. Includes actual CDP touch swipes on phones and a horizontal wheel on PC, board-coordinate invariance through selection/results, support controls, HP staging, shell overflow and no failed resources. Preparation behavior is covered by the interaction tests.
- Smoke: `node scripts/zone-report.js 10` completed and remained byte-identical before/after the change.
- Build with the exact branch Pages base path passed. Shipped size: **58.4 MB / 60 MB**.
- Independent review found a level-zero numeric-summary information leak; the preview now displays only coverage at that level. A same-visible-cells/different-hidden-mass regression test covers the fix. No production information helper was changed.
- Native-swipe QA found the 640px shell had 12px of internal overflow, moving the board after selecting an offscreen card. A compact field layout fixes this while retaining >44px zone targets; the original invariant assertion then passed.
- An intermediate dev-server QA run was interrupted by source reload. The first local production server also used the wrong base-path configuration (asset 404s). Final verification used an immutable production build and matching `VITE_BASE`; neither failure was waived.

## Preview scope and access

Branch: `codex/zone-first-preview`. Entry: `?showcase=zone-first`.
The root route continues to open the original game. The existing Pages workflow
builds production from main and this branch into its own preview directory; no main
merge is part of this change. Remote deployment and live-site verification are recorded
in the pull request after the workflow finishes.

Preview URL: https://jbseo-commits.github.io/9-baseball/previews/codex-zone-first-preview/?showcase=zone-first

The preview uses a varied nine-card study deck built from existing cards and a real
seeded opponent. It supports basic swings, taking, preparation, support placement,
removal, re-aiming and consecutive pitches/batters. It ends at defeat or pitcher
knockout with replay; reward/map progression belongs to the unchanged original game.
It does not persist state. Audio is opt-in synthesized feedback, not final production sound.

## Built mobile screenshots

| Aim | Hand | Ready | Result |
| --- | --- | --- | --- |
| ![Aim](zone-first-preview/aim.png) | ![Hand](zone-first-preview/hand.png) | ![Ready](zone-first-preview/ready.png) | ![Result](zone-first-preview/result.png) |
