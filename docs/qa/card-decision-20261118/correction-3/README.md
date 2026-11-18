# Same candidate, correction 3/3 — HELD, runtime not published

Continuation of G-003 / PR125, baseline `a1aaca96aaa371fdaad4dda60504161ff7cddbd4`. This is the last permitted correction; earlier toolbar/roster and save-read corrections remain2/3, this candidate consumes3/3. No gate/issue rename or fourth product revision. Existing preview still serves runtime `a4b36ad`; this folder is evidence, not a new shipped candidate.

Candidate removes the permanent top lab strip, shows a short public hint only when the hand is open/unselected/deciding and no inspector is open, and moves reset into the existing HUD tools. Default game has neither lab hint nor reset. Engine, card data, rules, multipliers, timing helper and save isolation remain unchanged. Product diff fingerprint (src+tests): SHA256 `6d3d8ed8ee443eeccd13bf4d34ba4feb1d99e2b309c5881da61d2ec119c9f487`. Failed source is retained locally; not pushed or deployed.

## Fixed diagnostic comparison

All screenshots use actual seed20261118 first opponent, same hand-open/unselected state, no resolved pitch, loaded fonts, reduced-motion/static actors,568×320 and844×390 Chromium touch emulation. Physical devices were not tested.

- A: original #125 banner/reset, unchanged historical baseline.
- A′: diagnostic A with original reset visually hidden while reserving its space; a computed-style clone of candidate reset inserted BEFORE menu in existing HUD. Relative reset/HUD bounds exactly match B/C at both sizes. This is screenshot-only normalization, not a second product candidate or playable variant.
- B: candidate with only `[data-testid=cdl-context-hint]` hidden by QA-injected CSS. No production flag or engine change.
- C: full candidate, unchanged.

A′/B isolates strip removal with matched HUD reset. B/C isolates contextual hint presence. A/C measures the actual whole change. Reset normalization initially had wrong insertion order and failed its equality check; QA-only normalization was corrected before blind capture, with no product edits. `ablation.json` contains final equal geometry. Removing the strip restores53px of scene height in these viewports.

Fresh independent gpt-6-luna/high received only reference|A|B six sheets and8axes. All scores sealed before key reveal. Group mapping and keys are retained; every sheet is reported, no best-pair selection.

| Comparison | Mean before→after | Gain | Improved axes | Relative verdict | Absolute bar |
|---|---:|---:|---:|---|---|
| Strip removal, reset normalized |3.28→3.47|+0.19|3/8|NOT_IMPROVED|NOT BAR_MET|
| Contextual hint increment |3.50→3.28|−0.22|0/8|NOT_IMPROVED|NOT BAR_MET|
| Actual full change |3.06→3.31|+0.25|4/8|IMPROVED|NOT BAR_MET|

The hint itself added visual competition/readability cost in this judgment. Overall relative improvement does not establish a useful hint, human understanding, or an acceptable release. Pairwise scores are subjective/context-dependent and are not additive effect estimates. The prior folded-hand3.00→2.94 NOT_IMPROVED record is preserved separately; these opened-hand/new-judge scores do not replace it.

## Mandatory failed gate

Original `scripts/qa-card-decision-boundaries.cjs` **FAIL**, exit1 at568×320: reset bounds x203.71875,y−2,width44,height44. Only42px of its height is inside the viewport. This violates the already-declared fully visible44px target. Independent reviewer final: **CHANGES / HELD**. Candidate3/3 is exhausted; no product correction after this finding and no runtime publication/preview update.

A separate diagnostic copy records the same geometry failure and continues the remaining checks, still exit1. It is not a lowered threshold or PASS replacement. Other four viewports, native taps, repeated/cancel events, rotation/plan retention, flight reset/old-clock cancellation and game-save/animation-rate read/write checks completed. Pointer-cancel/repeat use synthetic dispatch alongside native taps, not physical-device evidence.

Independent actual-play review also found that the hint pushes public energy (x598–653) and basic swing (x656–724) off the 568px screen until a card is selected. This is a second release-blocking layout failure; see [independent-ux.md](independent-ux.md), including the portrait orientation-notice distinction.

## Other verification (cannot override failed gate)

- Full suite250files/1719tests PASS, exit0.
- Build PASS;52.8MiB/60MiB; existing >500kB chunk warning.
- zone10 output identical to preceding validated candidate.
- Default touch routing/rotation42/42 and general legacy/vnext screenshot checks119/119 pass.
- Actual lab public-only fixed policy completed12pitches→natural defeatHP19; same-seed reset restores hand, no writes/errors. No claim of human skill/fun.
- Native menu/flight reset and hint gates pass at568/844; no premature result; folded/selected/menu/flight states omit hint.
- Independent visual and code reviews performed; logic acceptance superseded by observed layout failure.

Historical390×844/no-scroll/card-readability feedback supplied by the parent is interpretive context only. Current contract remains landscape-first with portrait orientation notice and preserved state; no legacy portrait requirement was silently reinstated, and no extra product edits were started from that feedback.

Publication policy: docs-only checkpoint to existing Draft125; failed product diff local only. Existing owner-private preview stays unchanged. No main edits, merge, production-root deployment, new branch/worktree, rule/save changes or extra feature expansion.

General production playthrough diagnostic also completed actual first match→reward→map→reload/title resume→next node, natural defeat and six layouts. As previously recorded, that existing diagnostic uses exact preview values and is not limited-information human-play evidence. Facilities fixture script cannot import `/src/duel/engine.js` from a production build; that attempted run failed before product interaction (log retained). Its compatible dev run checked engine-generated map/reward/locker at568/844/1280 with no overflow/page errors and expected map/reward transitions. Do not label the production facilities attempt PASS.
