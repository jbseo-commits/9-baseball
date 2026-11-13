# Final independent review — hand draw reveal

Reviewed 2026-11-13 UTC. Product source was read-only throughout this review. This document is outside the product repository.

## Outcome

No blocking source defect found in the final candidate. The explicit ephemeral draw receipt, deciding-phase opening, result receipt queue, stable card identities, and scoped compact layout implement the requested interaction without changing engine rules or serialized saves. This is a functional and regression review, not a claim of commercial art quality or a positive blind quality verdict.

## Bounded visual history

1. Candidate 1 retained the third incoming card below the visible short-landscape row. Its original blind result was **NOT_IMPROVED**. That result and the candidate evidence are preserved; later functional success does not reverse it.
2. Candidate 2 attempted compact rows but assigned `44px minmax(0,1fr) 24px` tracks while the existing thumb-hand stylesheet explicitly places copy in column 1 and art in column 2. The reading column became 44px wide, producing tall wrapped cards and clipping the third card again. The second-failure consultation identified this concrete cause.
3. Candidate 3 corrects the list to `minmax(0,1fr) 44px`, or a 36px art column at heights up to 360px. It preserves copy column 1/art column 2 and the existing static cost. The separate >=4-card compact grid remains scoped to incoming multi-card presentation. Fresh captured three-card cases at 844×390 and 568×320 report all three cards fully visible and three landing cues.

The new issue's visual allowance is **3/3 exhausted**. Existing M22 art history/caps remain intact. No further visual attempt is implied by this review. The sealed final fresh blind assessment is now revealed: mean **3.583333 → 3.604167**, gain **0.020833**, with **three axes worse and a maximum drop of 0.5**; verdict **NOT_IMPROVED**, **NOTBAR** (`blind-final-verdict.txt`). Functional and readability checks do not override that quality verdict.

## Source and input audit

- Engine receipts record actual pushed instance IDs in order, including consume/reshuffle/same-ID redraw. They live in a WeakMap and disappear after JSON serialization. No new RNG calls or serialized fields are introduced.
- Receipts are withheld from the presentation during committing/flight. Result receipts wait for deciding and combine with the next draw, filtered to current hand instances.
- Initial/reloaded hand presentation opens automatically without inventing a NEW receipt or landing sound. Manual close, selection and aiming do not create another draw event.
- Existing card keys, card buttons, callbacks, pointer handlers, selection state and stack state remain in use. Compact CSS changes card geometry within the hand, not board/camera geometry. The pointer and placement source routines read current element rectangles, so the compact geometry does not require a second input path.
- The >=4-card grid hides its art thumbnail and small coverage glyph to fit the hand. Card name/cost/effect remain in the actual button; detail/placement still use the same underlying card data and art mapping. This is a readability tradeoff, not evidence of higher art quality.
- Automatic scrolling detects actual computed grid/flex layout. Landing audibility requires at least 45% card intersection with the hand row. Hidden, muted, cancelled, late and reduced-motion arrivals do not produce a queued cue burst.
- A speed change during an already running reveal can suppress a later chime because the lateness deadline uses the initial speed; WAAPI follows the shared speed observer. This is a minor audio limitation and does not affect cards or gameplay.

## Evidence independently inspected

- New unit suites independently rerun before the final CSS-only adjustment: 12/12 tests passed across hand-draw hook, receipt and tracker suites.
- `final/report.json`: seven fresh cases all pass with exact-engine and production-save preservation. Three-card draws at 0.5×/1×/2× on 844×390, at 667×375, and at 1280×720 each record three landing sounds. The full-hand take case records one; reduced motion records no animation and zero landing sounds.
- `live-material3/report.json`: 844×390 and 568×320 three-card cases both pass. The settled 568×320 capture was visually inspected: all three names, costs and effect lines are present.
- `material3/battle-568-entry.png` was visually inspected: all five card names are exposed in the compact entry grid. This does not establish animation or aesthetic quality.
- `flow/report.json`: actual menu/map/first battle opens without a handle click and matches the engine; attack-result draw followed by next-batter draw passes the receipt queue, engine comparison and no-preimpact-face checks.

The final logs completed during review: `full-tests-final.log` reports **255/255 test files and 1,751/1,751 tests passed**; `regression-final.log` reports **119/119 checks passed**; `build-final.log` reaches the completed distribution-budget check at **54.8 MiB / 60 MiB**. `edge.log` reports **5/5 course-preview edge cases passed with zero page errors**. The edge report explicitly says `hiddenActuallyExercised: false` for its browser tab-switch case; that case establishes reload/session handling, not a real hidden-document transition. No physical-device validation is claimed.

## Publication boundary

Continue existing PR 121 as **Draft** only. This review does not authorize Ready status, merge, main activation or deployment. Both the preserved initial rejection and final **NOT_IMPROVED / NOTBAR** blind verdict remain part of the record.

## Subsequent public scroll failure and functional hotfix

Public verification of deployed `d8200cf` matched the four checked asset hashes and passed three-card draw cases at 568 and 844, but **failed the one-card take case at 844**: the new instance `c3` moved above the hand row and produced no landing cue. The original `public/live.log` failure and `public/live/take-844-1-settled.png` are retained. This means the first public check did not establish complete deployed functionality.

The follow-up product diff consists only of a scoped rule in `hand-draw.css`: while `data-hand-dealing=true`, the existing hand row uses `overflow-anchor:none` and `scroll-snap-type:none`. The rule prevents the translated incoming card from becoming a browser scroll anchor or snap target. It changes neither card geometry/art nor engine/save state and is a functional scroll repair, not a fourth visual candidate. The **3/3 exhausted** allowance and final **NOT_IMPROVED / NOTBAR** verdict remain unchanged.

The first follow-up QA check applied a >=95% whole-slot criterion to every viewport and rejected the existing wide 1280 layout's 90.6% decorative slot extent. That was broader than the reproduced single-card scroll defect. The retained failed log is not erased. The refined test keeps >=95% settled vertical slot visibility for one-card take cases and adds a separate >=95% **two-dimensional name/cost/effect intersection** for every drawn receipt ID, clipped against row, card button and viewport. It computes those intersections from exact element rectangles and records nonempty text with visibility fractions. This preserves the reproduced defect's strict requirement and checks the user's readable content across every viewport, rather than changing a threshold to ignore a failure.

Independent inspection of `scroll-verified/report.json` found **8/8 local browser cases passed**, every drawn name/cost/effect intersection fraction **1.0**, and zero page errors. One-card take cases at 568/667/844 have settled vertical slot visibility **1.0** and one landing cue each. Three-card 844 cases at 0.5×/1×/2× and the wide case have three cues; reduced motion has zero. All cases match exact engine IDs/state and preserve the production-save sentinel.

The portable `scripts/qa-hand-draw.mjs` was read for this audit. Its field check uses row/button/viewport clipping and matches receipt IDs. One test-only follow-up was requested: include take667 and the actual take844 reproducer in default cases, so they are covered without a CASES override. At this review point the full suite/build and manual scroll/inspector checks were rerunning, and the repaired source had **not yet completed a new public deployment verification**. Earlier full-suite/build figures above refer to the source before this CSS hotfix; they must not be represented as new-source or public hotfix completion.


## 통합 후 실제 결과 — 주작성자 기록

이후 동일 전체255파일/1,751테스트와54.8/60MiB production build 재실행이 통과했다. 단일카드568/667/844의2차원 전체면적/텍스트는각100%, 소리1회이며 수동 정보창/손패 스크롤2화면도 통과했다. QA기본목록에take667/844를 추가했고 실제rect/clip과2D비율을 기록하도록 보강했다. 새 커밋의 Pages검증은 PR121에 따로 기록한다.
