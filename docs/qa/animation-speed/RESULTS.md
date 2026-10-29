# Animation speed — 2026-10-30 KST

The current vnext sample preview has a HUD speed selector: **0.25×, 0.5×, 0.75×, 1×, 1.5×, 2×**. Default is 1×. `battleSpeed=0.5` opens a slower preview; the selection survives fixture changes/reload through a separate session preference and URL. [Prior impact analysis](../../design/atbat-hand/ANIMATION-SPEED.md).

Placement, hand transitions, stack assembly, body card effects, actor poses, ball, impact effects and result/HP presentation use the selected rate. The existing engine result and energy costs do not change. Input gesture thresholds do not change. The selector locks during a placement/pending drop, stack commit, pitch or menu so one action keeps one clock. Swing remains available during decorative placement; slow motion adds no new confirmation.

Sound onsets share the rate, while pitch and individual sound envelopes remain natural. Scoped slow judgement cues stop all scheduled sources on mute, hidden tab, new presentation, fixture reset or unmount. Reduced motion retains the existing short 60ms pitch-result path. The ordinary game/fallback and embedded/legacy comparisons keep their existing 1× behavior.

## Captures and actual timing

[Small landscape](control-667.jpg) · [Phone landscape](control-844.jpg) · [Desktop](control-1920.jpg) · [Slow pitch after normal wall duration](slow-pitch-025.jpg).

The [production browser report](speed-browser.json) measures native browser time, rather than freezing screenshots to pretend an effect lasts longer. At 844×390:

| Rate | Placement lifetime | Pitch presentation |
| --- | ---: | ---: |
| 0.25× | 4,201ms | 4,947ms |
| 0.5× | 2,096ms | 2,492ms |
| 0.75× | 1,415ms | 1,572ms |
| 1× | 1,038ms | 1,228ms |
| 1.5× | 712ms | 819ms |
| 2× | 530ms | 604ms |

Targets are the existing virtual duration divided by rate; measurements include browser scheduling/render latency. All six rates produced the same real seeded result (HP60→48 and energy2→0). At 0.25× the actor RAF continues changing poses after the original 1× wall duration. Actual CSS animations/transitions expose the selected playbackRate, seating audio is scheduled at the matching lock beat, and native mute stops already scheduled future judgement sources. Audio evidence is scheduling/stop measurement, not a claim of human listening.

## Verification

- Full Vitest: **220 files /1,474 tests passed**. New regressions cover accepted/invalid rate, URL/session preference and production-save isolation, receipt lifetime/lock, scaled stack commit, wall-clock stale sound tolerance, reduced motion, legacy/embedded defaults, body effect safety deadlines/cancellation, natural sound envelopes and cancellation on mute/reset/unmount.
- Actual nested Pages-base production build, six rate runs and six landscape layouts (667×375,740×360,844×390,1024×768,1440×900,1920×1080). Speed control has a 44px touch height and does not overlap the painted HUD bar, hand energy or zone. Actual body effects and reduced-motion path passed. No page errors.
- [Existing one-card touch regression](solo-browser.json) and [two/three-card regression](multi-browser.json) passed at all six landscape sizes: real drags, independent support aims, removal/renumbering, budget rejection, overlap, tap-add, original 1× commit720ms, actual HP/energy, isolated save, reduced motion and rotation.
- [Existing default/vnext fallback flows](smoke.json): prepare/take/next, Inspector pause, save/resume, rotation and identical seeded saved states. [Map/reward/locker nine cases](noncombat.json): scrolling and next transitions passed.
- Engine smoke [zone10](zones.json), [v9 30](v9.json), [growth2](growth.json), [deck1](deck.json) passed.
- Build budget59.8MiB/60MiB; CSS350 resource paths resolved. No new raster art or save schema changes. `git diff --check` passed.
- Independent read-only review identified delayed judgement audio cancellation; the implementation and native pending-source mute regression now cover it. No remaining code blocker was reported.

This is the existing opt-in sample-actor preview branch. Tests establish behavior and regressions, not commercial quality or fun.
