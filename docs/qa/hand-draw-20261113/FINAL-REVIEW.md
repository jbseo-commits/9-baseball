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
