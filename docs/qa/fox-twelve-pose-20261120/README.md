# Approved twelve-pose integration — bounded follow-up to #140

Input 8b1b1aec; approved PNG and JSON hashes verified before edits. Direct source pixel inspection includes frames0,4,8. No new art generation, autonomous batch, deployment or main changes.

## Pre-implementation impact analysis
1. UI/layout: affected Fox sprite and helmet badge anchor only; preserve camera, scale and HUD.
2. Input/gestures: no changes; exercise card/swing/take.
3. Rules/balance: no changes; preserve release950ms/contact1250ms and actual engine results.
4. Save/load: no changes; compare storage and resume.
5. Mobile: affected sprite registration; inspect844×390, portrait rotation gate and desktop.
6. Scroll/overflow: no changes; no CSS edits.
7. Existing flow: same seed/route and roster; no new mode; existing regression suite.
8. Tests: update authored-pose expectations; prove release pose8 and planted sole continuity.
9. Build/deployment: same relative-base complete Vite dist; extract ZIP and test it. No deployment.

## Registration plan
Uniform nearest3× packing into256 cells, never pose-specific scale. Rear source(40,96)→cell(100,233); lead source(82,96)→cell(194,248). Frames0–3 use rear; frame4 transition uses lead registration (source left-to-right stride is already almost planted); frames5–11 lock lead. Ready visible height231cell px maps to the unchanged201.175484world px. Source frame8 hand ends(93,33); ball center(94,33) maps tocell(230,59). Original release tick79 / delivery tick57 remain unchanged. Twelve source drawings are held on the existing120tick clock, not120 unique drawings or the supplied1105ms timing verbatim.

Skills: repository AGENTS and codex-loop workflow applied; no local pixel SKILL.md found in .agents/.codex. No external editor/script installed. Existing Library transfer failure is not resolved; official GitHub asset handoff used.

## Final extracted build results
- ZIP SHA256 `7230717c5ec1d283c8a606ef457b9cd665298ab959176a619068054cb8a95e44`;52,158,486bytes. Complete dist54,496,154bytes/630files; base `./`. Every extracted file matches built bytes. Serve dist with `python3 -m http.server 8000 --directory dist`, open `/?battleUi=vnext&battlePlay=1&seed=20261119`.
- Chromium mobile emulation844×390, desktop1440×900 and reduced-motion: actual placecard+zone2+swing=hit,HP60→42; take=lookingstrike. Public badge hides during pitch and returns; reload resumes state; portrait rotation notice; localStorage unchanged; no page errors or runtime404.
- Real browser RAF, no fake clock: all12poses observed. First visible ball uses pose8. Registered hand screen(479.1425,132.0686), first observed ball(479.0200,132.1763), distance0.163px (frame sampled just after release). Pose5–8 actor box constant; source lead sole5–11 remains cell(194,248). Shared existing impact camera movement is unchanged. See release-verification.json and release-samples.json.
- Full existing suite251files1713testsPASS; added2testsPASS separately (CI will run252files1715). Targeted18testsPASS; smoke10seedPASS; production build+52.0MiB/60MiB budgetPASS. Existing chunk-size warning and happy-dom disabled-iframe stderr remain, tests passed.
- Independent read-only reviewer checked source hashes/packing/timing/anchors; no runtime blocker. Direct actual-size screenshots inspected for ready/release/swing and desktop. Screenshot comparison baseline remains ../fox-three-fixes-20261119/phone-ready.png; new phone-ready.png preserves camera/HUD/batter with the approved new pitcher poses.

## Failures and honest limits
Initial video recording failed because the Playwright ffmpeg path was missing; linked existing system ffmpeg (no installation), retried successfully. Initial fixed200ms rotation assertion was too early after reduced-motion remount; waiting for the actual badge completed successfully without application changes. Both failures retained here.

The approved twelve drawings are held; no fabricated tween frames. Frame3→4 changes from rear to lead registration and still has a visible small backward torso/stride step; perfect biomechanical continuity is NOT claimed. Source artwork has soft edge color clusters despite transparent pixel packaging; not claimed as hand-drawn native pixel art. Existing background landmark mismatch and overall art/motion HELD records remain. Source1105ms relative durations are NOT runtime duration; release950ms/contact1250ms engine presentation contract preserved. No physical Android test, no new deployment, no Library ID (known transfer bridge failure; not retried). Parent handles private Site updates.
