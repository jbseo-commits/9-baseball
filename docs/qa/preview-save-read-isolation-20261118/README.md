# G026 — Production-save reads in memory preview routes

Freshmain fb8e7b1, branch review/preview-save-read-isolation-20261118. Common relic decoration installed a MutationObserver and called getItem9zone-v10-run on memory fixture/comparison routes. Its trigger() reads before checking for a legacy combat target. No save writes/deletes or visible foreign relic contamination were reproduced. This is an unnecessary production-save access defect, not a claimed visual leak.

The guard now reuses battleUiMode/comparisonMode at observer installation and at state() reads. Recognized nonempty fixture, comparison page, child and standalone routes are excluded. Unknown nonempty forced-vnext fixture opens fallback preview and is correctly excluded. Empty/invalid non-preview flags, ordinary forcedlegacy/vnext and automatic layout preserve observation. Existing raw battlePlay1 suppression is retained, including its pre-existing legacy&battlePlay1 false-positive; fixing that different behavior is outside this patch.

No save parsing/schema/write/delete, engine/RNG/balance, markup/CSS/art, audio or input change. PR125 has its own exact card-decision lab guard on the same file: eventual integration must preserve both guards. PR125/G003 visual3/3HELD and its preview remain untouched; this is not another art attempt.

## Evidence and distinctions

- Before first focused suite:5 failing memory-route tests, raw red.log preserved. Product correction1/3. Final focused20 tests across2files, including unknown fixture fallback, queued observer refresh after URL changes, and ordinary legacy-markup rack/trigger positive.
- A synthetic valid engine-format V10 save with firstPitch and engine-generated event text is used in browser checks. No natural acquisition/run completion claim. Before production baseline is G025 build with old relic module byte-identical to main, not a complete main build. After is this independent G026 build without G025 audio repair.
- Actual V10 ordinary and preview screens use Ballpark markup and have no .duel-combat. Therefore no rack/trigger contamination was observed before. Normal DOM decoration positive is an isolated happy-dom legacy-markup test, not proof of that widget on current V10 UI. Ordinary browser save access and exact-byte retention are separate positive controls.
- Compare parent and both same-origin children must each have key-scoped get/set/remove instrumentation. BGM preference access is allowed and reported separately; no claim of zero storage access globally.
- Existing observer's raw battlePlay behavior and PR125 laboratory isolation are not broadened here. No deployment, main modification or merge. Human/physical-device/visual-quality claims are outside this nonvisual correction.

## Final checks

- Full249files1721tests PASS, focused2files20tests, smoke10, production build/checkdist52.8/60MiB. General119/119 and query-free touch/rotation42/42 PASS. Actual native browser full route matrix: production-key reads0 across memory/unknownfixture/standalone/direct children/compare parent and both children; writes/removes0. Before reads3–9 per context. Ordinary fallback/nooptin/legacy continues reads; resume writes the exact original32638-character JSON once, no remove. Data is synthetic valid engine-generated save, not a completed human run.
- Normal legacy markup rack/trigger unit positive; actualV10Ballpark has no legacy rack target. One worker portrait-iframe visual attempt was inconclusive/empty; independent production browser confirmed ordinary resume and exact bytes without claiming rack visibility.
- Fullplay diagnostic reached reward/map/nextnode but failed existing .5x wall-time bound4000–5500ms under concurrent fullsuite/browserQA; first failed run did not print actual elapsed. Saved as playable.txt. No causal claim about contention is established yet. A quiescent rerun preserves every assertion and adds only elapsed logging; result PASS, measured4072.6ms. First failure actual elapsed was not logged, so its cause remains uncharacterized; no assertion or timing threshold changed. Do not silently turn the first failure into PASS.
- Original main11-pitch fixed expectation vs actual6 remains an independent known QA issue. The diagnostic derives from reviewed PR126 with adjusted import paths and retains initial browser-edge bootstrap (PR127 unmerged). It is an exact-preview technical policy, not human limited-information play.

- Probe naming correction: worker reused its probe output path after the fix; it is archived as after-dev-probe.json, NOT before evidence. Independent before.json is the genuine pre-guard production record.

- Independent reviewer approved Draft posting after final matrix and unchanged-threshold retry. Nonblocking test hygiene note: last happy-dom positive uses stubGlobal/spy without restoring those mocks; Vitest file isolation and placement as the final test avoid observed cross-test effects, but future additions should clean them up. No product code expansion was made for this note.
