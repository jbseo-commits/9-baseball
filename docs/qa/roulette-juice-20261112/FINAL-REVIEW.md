# Final independent review — roulette spin → lock

Review date: 2026-11-11 UTC / 2026-11-12 KST. Read-only product review; this external report is the reviewer's only write. Checkout: `/workspace/9zone-juice100-implementation`, branch `codex/roulette-course-connection-20261111`, base HEAD `05529e4`.

**Disposition: no remaining product-code blocker found for the scoped Draft PR preview.** Frozen-source live replay is complete and passed. Publication and deployment verification remain outstanding completion checkpoints.

## Reviewed implementation

- `courseScanSchedule` uses the public frozen candidate plan and existing `courseLockAt`. Its increasing dwell does not change host deadlines, consult engine RNG, or steer toward a private destination. Singleton candidates retain one static scan step without tick sounds. Zero/tiny intervals are bounded.
- `courseFrameAt` still avoids the destination getter before lock. Added scan index, previous zone and ages come from public scheduling; result/contact fields remain gated until landed impact.
- `useCourseAudio` observes the already sampled render model and accepted playback token. It adds no independent RAF, timer or destination read. The existing visual capability latch gates both audio and optics, covering query-off and atlas failure/delay fallback. Event identity consumption, newest-sample selection and wall-time age tolerance prevent catchup bursts. Mute, hidden-tab changes, replacement and unmount abort existing audio nodes.
- Cell-local SVG and band treatment retain nine native buttons, input lock and existing coordinate systems. Lock conveys course confirmation independently of hit, damage and score effects.
- A blocking portrait issue found during review was corrected: SVG positioning and pointer isolation originally existed only inside landscape CSS. The final stable-scoped absolute/inset/pointer rules apply in both orientations. Existing buttons and outside band provide positioned containing blocks.

Product-source aggregate SHA-256 at review: `3e64a764ac785c4b949c80332c287aacf19e772cd63e658c1a1b20376474e90c` (ordered path + NUL + bytes + NUL for audio.js, BattleView.jsx, DecisionPanel.jsx, course-presentation.js, course-projection.css, course-render-model.js, course-audio.js, CourseLockFx.jsx).

## Passed evidence

- Independently ran six relevant Vitest files: **63/63 tests passed**, including new rhythm/audio tests and existing presentation/privacy tests.
- Inspected the completed full-suite log: **252 files, 1,739 tests passed** in `full-tests-escalated.log`. The preceding sandbox run's four subprocess-related failures remain preserved in `full-tests.log`; this report does not call that first run a pass. Full-suite logs contain existing React/happy-dom diagnostic output despite the passing exit summary.
- Inspected production build/budget output: successful build; **54.8 MiB / 60 MiB**.
- Five landscape viewport geometry reports preserve square board bounds and button identity, with 0 px measured movement across sampled stages.
- Inspected portrait zone 4 and zone 9 reports at 412×743 and 375×667: same-frame removal of only decorative SVG changes cell/board/band bounds by **0 px**; computed position is `absolute`, pointer behavior is `none`, nine buttons remain, engine oracle matches, and no reported page errors/overflow. Also visually inspected the 375×667 zone 9 lock capture.
- Inspected the completed frozen-source `live-final/report.json`: **8/8 actual-play cases passed** (zones 4/9 × rates 0.25/0.5/1/2), each with one lock sound, no early result, exact engine result, preserved production save and zero page errors. The copied repository `live-summary.json` matches every retained field of that report; only raw `samples` are omitted. Verification.json's eight product-source hashes match current files. At 2×, zone 9 showed seven of eight scan steps; other frozen runs showed eight.
- Inspected regression report/log evidence: **119 screen checks**, **42 default coarse-pointer checks**, and **5 edge cases** passed. Edge cases include multi-card action, reload, atlas abort/delay whole-pitch fallback and reduced motion.
- Inspected research documentation: seven named official sources, three short trailer excerpts, still/video/audio limits and proposed adaptations are separated. Deceleration and pulse durations are correctly described as this game's design choices, not measured source-game facts.
- Inspected blind score/verdict: **+0.3125 mean, four improved axes, IMPROVED, not BAR_MET**. This supports the bounded static comparison only.

## Completion checkpoints

- The initial actual-play session included a source change and is retained as historical evidence. The final eight-case frozen-source run supersedes it for acceptance. The main agent replaced the linked video/audio/contact-sheet artifacts with this rerun; this reviewer independently checked the final report, retained summary fields and source hashes.
- The QA README now records the completed local full-suite/build checkpoint and explicitly leaves public Pages verification pending. Its live-summary records match the frozen-source report.
- Commit/push/Draft PR publication and Pages verification have not been performed or verified by this reviewer. Public verification must identify the deployed commit and check both opt-in and query-off behavior.

## Limits retained

- Portrait retains the legacy nonsquare, state-dependent layout: measured planning→scan displacement is about 19.7 px and planning→settled displacement is 163 px. Same-frame SVG isolation proves the new decoration contributes 0 px; it does not prove a fixed portrait board or a finished portrait redesign.
- The browser edge report explicitly says real hidden-tab visibility was not exercised (`hiddenActuallyExercised: false`). Hidden-state consumption and tail cancellation have independent hook/clock test coverage; do not present the edge browser scenario as an actual background-tab test.
- Audio event timing, duplicate prevention, cancellation and recorded signal are supported. Perceived sync, timbre, listening quality, physical-phone audio and haptics remain unverified.
- At 2×, some individual scan steps may not be visibly sampled. Neither the static blind score nor automated tests establish continuous-motion readability, human enjoyment, commercial quality or the art quality bar.
- This is one scoped visual candidate. Previous M22 art/visual caps remain historical and unchanged. No new character art, contact registration or actor motion was authored in this change.

No product files were edited by this reviewer.
