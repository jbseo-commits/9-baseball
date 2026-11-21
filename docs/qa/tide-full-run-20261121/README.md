# Tide full-run playtest

Base unmerged #141 c74cdd14caf23f8f6537af0b8b36dc07c4fd9681. Unique review branch. No main/merge/deployment. Existing21actors/stadium/approval gates retained; no unapproved art imported.

Pre-implementation impact analysis:
1. UI/layout affected: gated landing, small Tide wave alongside existing publicbadge; scoped CSS; mobile844×390/667×375.
2. Inputs affected only landing start/resume; actual existing Duel route/card inputs preserved.
3. Rules/balance unaffected: existing encounter distribution and +5aftertake unchanged. Tide presentation path only, same917/1217ms timing.
4. Saves affected: gated dedicated session namespace, no personal run read/write; normal mode untouched. Inspect legacy sidecars too.
5. Viewport affected: retain rotation gate; badge/marker edge and HUD review.
6. Scroll affected only local landing; no global overflow rules.
7. Flow: landing→fresh real seeded map→earlyTide→normal rewards/routes/terminal; no forcedvictory or reachability mutations in playable mode.
8. Tests: public cue freezing, allactions commonflight/continuity, odd/even/bonus/outside, reducedmotion, actualrun flow and normalregression.
9. Build/deployment: relative-base ViteZIP with allruntimeassets; exactextractedbuild QA; durableofficialreviewref. No deployment.

Seed4 naturally assigns Tide to a1-entry in createRunMap(seed), with encounters enabled. No map rewriting. Optional accelerated QA is separate from playable UI.

## Review build and entry

Download `playable-build.zip`, extract it, serve its `dist/` directory with a static HTTP server, then open `/?battleUi=vnext&tidePlaytest=1`. Vite base is `./`; all 632 runtime files are included. The landing offers a fresh canonical seed-4 run and resume. Tide naturally occurs at the first map node. Rewards, subsequent encounters, all three acts and terminal screens remain the existing game. There is no forced victory or private target in the playable UI.

Save namespace: sessionStorage `9zone-tide-playtest-v1:`. Personal localStorage progress, animation speed and shot settings remain untouched. Resume lasts within the same browser tab/session; this is intentionally not a permanent personal save. Pilot starts at 1×. Normal mode remains available without the query gate.

ZIP SHA256: `a78fb7651f78019ccb9a80419f568e2d22ba65d95441f59c5c6ef74fdbba2da6`; 52,234,320 compressed bytes, 54,573,040 extracted bytes. Every extracted file was byte-compared with the build. Tests below ran against that extracted ZIP, not the dev server.

## What changed

Only gated Tide uses the new common incoming trajectory. Its projected depth and ballistic sag share the same release/contact endpoints across hit, take and whiff. The old action-dependent take endpoint offset is bypassed for this pilot. Noncontact continues the same function and radius through crossing, without the decorative near-miss curl; actual hits retain the established contact response. Release/contact remain 917/1217 ms at 1×. No engine, encounter odds, damage, sprites, camera or timeline data changed.

The existing frozen public encounter cue drives a small wave/낙차형 beside the public intent badge. It describes presentation, not a guaranteed downward target. Existing parity preference and after-take +5 eligibility remain probabilistic/public contracts. All 21 existing intent badges remain. Actual landed zone appears only in result, and the head badge hides during flight/result. Unapproved pitcher masters and stadium candidates were not imported.

## Verification

- Full suite: **257 files, 1,735 tests passed**. Zone smoke and build/budget passed (52.0 MiB / 60 MiB). Pre-existing Happy DOM iframe warnings remain in test output.
- Extracted-build browser QA at **844×390 and 667×375**: real landing → map → Tide → take, card selection and swing; hit/take/whiff at both sizes; reduced motion, resume, rotation, no runtime 404/page errors and no personal-save changes. See `runtime-verification.json`, `flight-verification.json` and `normal-regression/`.
- All six sampled flight runs match the common position/radius model within 0.1 CSS px. Unit tests cover contact continuity, tangent continuity, outside endpoint and reduced motion. Real hit transitions intentionally depart into the existing batted-ball response.
- Natural fourth pitch outside (zone 9) was reached with real takes; no early actual-zone marker, then real ball/result marker. See `outside-verification.json`.
- High/low × bonus eligible/ineligible: real engine history and hits confirm 5/0 damage bonus without changing RNG, odds, HP or outcomes. The QA-only strategy reads the target to choose legal aiming inputs; the playable UI never does. See `public-cycle-verification.json`.
- **Actual browser terminal:** ten real take pitches → normal loss screen; terminal resume and fresh-map restart passed. See `canonical-terminal.png` and `terminal-verification.json`. No forced result.
- **Separate accelerated engine verification:** legal-input target-aware QA strategy completed a real seed-4 run through 18 nodes and 70 pitches to victory, checking serialization across progression. This is not a human/browser win and does not alter the user build. See `progression-verification.json`.
- Normal mode without gate: existing Fox card hit/take/reduced-motion/resume/rotation and existing Tide flight passed. Settings isolation, conflicting legacy query, personal save and global speed preservation passed (`settings-verification.json`).
- Independent read-only reviewer passed after fixes to centralized vnext selection and noncontradictory accessible wave wording.

`mobile-play.gif` is an actual 844×390 browser recording of the extracted build, not a composite. Captures were visually inspected at actual size. Android hardware has not been tested. The small wave reads beside the badge at 667×375; the existing narrow-screen hand layout remains unchanged.

## Remaining limits / approval status

This is a playable Tide presentation pilot, not approval of new art or a claim of masterpiece quality. Tide still uses its existing atlas; the other 20 actors and current stadium are unchanged. The visible late drop is modest at phone scale and uses a shared cosmetic projection, not new pitch physics. Public hints remain uncertain unless the existing rules reveal certainty. Session-only persistence is deliberate. No main modification, merge, Sites access or deployment occurred. The stacked PR does not trigger the repository's main-only PR Verify workflow; equivalent full checks ran locally, and available impact CI is reported separately.
