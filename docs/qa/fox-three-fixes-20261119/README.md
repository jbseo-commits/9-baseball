# Actual game: pixel batter, camera-aligned stadium, public intent

User feedback on#139 authorized these three fixes. Branch derives from9ca09e7f8902e8abeadf4686771f26d076e3d7de. No main/merge/deploy; parent owns any private Site update. Actual existing ?battleUi=vnext&battlePlay=1&seed=20261119 route, not a new diagnostic mode.

## Impact analysis

UI/presentation affected: public badge, supplied background and batter. Input/gestures unchanged (badge pointer-events:none). Engine/balance/cards/timers/save/schema unchanged. Landscape/portrait gate and desktop verified. No global overflow changes. Same real battle lifecycle. Regression: public-only helper, phase visibility, pixel-only swing/contact, existing motion contract; full suite/smoke/build. Export all dist assets, no deployment.

## Inputs and registration

Parent delivered only two originals in05818fa5db32e9c0478c643a04bfc22576dee826: assets/pixel-batter-review-v1/batter-night-poses.webp (960×160,6×160cells,hardalpha) and stadium-camera-aligned.webp (1672×941). Both directly inspected. Generated assets, not hand-authored originals or final aesthetic approval.

Batter source0ready/1load/2swing/3contact/4follow/5recover. Registration uses rear pivot soles(49,152),(45,152),(24,152),(36,149),(31,150),(22,151). Uniform4×nearest into768cells, foot210,700; alpha-sum check proves no clipping. Existing14time slots map[0,1,1,1,1,2,2,2,3,4,4,5,5,0]. Exactly6unique drawings, not14unique motion frames. No old ready image or smooth swing-bridge flash remains. Pixelated browser sampling explicitly enabled for batter and Fox.

Main body head-to-pivot≈450cellpx; supplied ready≈492cellpx after4×packing. Canvas worldHeight1100 (old1200) keeps actual ready body scale close to main, foot remains200,960; one scale for every pose. Contact source(144,60) on supplied barrel maps cell642,344. Only cosmetic flight/contact hookup changes; zones/judgment/timing untouched. actorEvent() now consistently reads selected metadata in both atbat and cover paths.

Background imported directly without#139's piecewise vertical stretch. Same1672×941 world/camera. Main fence/grass≈y516, provided≈y520; rubber provided≈836,544 vs registered834,536 (8px vertical source uncertainty≈4screenpx atphone). Homey874 retained. No engine/actor anchor moved to conceal this residual. Main vs review844×390 camera matrix, pitcher rect, zone rects andHUD rect match exactly; see camera-comparison.json and comparison images. Source background itself is nearest-exported from400×225, not new high-resolution native painting.

## Public badge

BattleView passes only nine already-visible face strings. Helper accepts no engine object, pending target, RNG, probability distribution, or player aim. One'확정'face permits onecell+dot; otherwise all disclosed candidatefaces highlight as a group with'?'. No sole guessed cell. Existing projected Fox SET helmet-top anchorcell126,56 locates34pxbadge6px abovehead. Phase/playback gates hide during commit/flight/result; decision restores. Top-clipped placement suppressed. Existing hand/cards/zone overlay retained.

## Validation / limitations

250files1711testsPASS; smoke node scripts/zone-report.js10PASS; VITE_BASE=./ build+budgetPASS51.9MiB/60MiB. Chromium844×390mobile and1440×900desktop plusreduced-motion:actualplacecard→zone2→swing givesgroundballhit60→42;take giveslookingstrike;badgehides/restores;pixelatlas staysselected;sessionresume,portraitrotationgate,localStorageunchanged,noHTTP/pageerrors. ExtractedZIP repeats same flows atnested/dist/; all630distfilehashes match original. PhysicalAndroid/fullmanualcampaign notclaimed. Original sixpose stepping and high/backFoxrelease remainHELD. Foreground pixel scale is intentionally coarse and partial foreground crop follows main framing.

Independent reviewer verified every packedcell equals supplied4×pixels, public boundary, visualstyle, and flagged stale contact helper (fixed). Former bridge regression updated to require absence of smooth bridge and samecontact8timing, not skipped. Initial regression failure2tests is retained in worklog; finalfullsuitepasses. Video capture initially lacked Playwright bundledffmpeg; used existing/usr/bin/ffmpeg via temporary toolpath, no install. Stale localHTTPserver failed; fresh localserver used. No public deployment.

Local pixel SKILL.md unavailable in checkout/.agents/.codex; repositoryAGENTS/codex-loop independent review used. Library skill used for output delivery when supported. Art/camera review is not masterpiece approval.

Delivery: current Library prepared upload for ZIP+GIF failed before tool discovery with `library upload failed: hosted apps tools/list request failed: network`; no confirmed Library IDs, no direct fallback/retry. Exact ZIP preserved locally at/workspace/fox-three-fixes-playable.zip and in this QA folder. GIF is12fps browser capture excerpt with loading trimmed; PNGs preserve full-color inspection.
