# M03 — current landscape screenshot coverage

Before implementation impact, 2026-11-10, base844b0ca, execution masterpiece-exec-20261110 R3.

The old qa-shots script assumes all landscape windows use a portrait iframe, so it cannot inspect the current default landscape battle. Preserve its two explicit legacy portrait checks; add actual vnext landscape at568×320/667×375/844×390/1280×720/1440×900. Fixed real-engine saves and actual action submission remain mandatory. Renderer absence is a failure, not an empty selector PASS. Measure active renderer selectors and inspect folded-hand affordances separately from open legacy cards. Actor rectangles include transparent atlas pixels, so rectangle-overlap remains a diagnostic unless actual visible-pixel occlusion is verified; no new silhouette quality claim.

|Impact axis|Assessment and mitigation|
|---|---|
|UI/layout|No product edits. Assert actual renderer, action/zone boxes and viewport extent.|
|Input|QA only; perform actual free basic+zone+action and wait for landed result.|
|Logic/balance|No changes. Real-engine fixture deterministic; no reroll/model policy.|
|Storage|QA isolated browser contexts; set own fixture in localStorage; never access user browser.|
|Mobile|Keep legacy portraits, add five landscape sizes including568×320. Real device performance/comfort not inferred.|
|Scroll|Check document/app overflow and map page, don't override productCSS.|
|Flow|Map/battle/result/reward only; not claim full facilities/run/rotation coverage.|
|Tests|Actual QA execution compares current baseline. Existing failures stay reported, no blanket skip/threshold weakening. Fullsuite/smoke/build/dist remain gates.|
|Build/deploy|Tool/docs only, no game payload or runtime dependencies; existing Playwright/Chromium via env.|

## Actual validation
- Exact final script:119/119 browser checks PASS at immutable build52097c8 (port5364). Two explicit legacy portraits + five explicit vnext landscape viewports; map, actual basic action, landed result and reward. Report committed alongside this note. Mouse-only forced queries, not human/device/default-touch/full-run proof.
- Fullsuite242files1650tests PASS; smoke10 PASS; productionbuild +52.8MiB/60MiB PASS. Source script/doc only; no product runtime change. Independent code reviewer gpt-6.1-sol/high PASS after full bounds/screen presence/art loading guards.
- Initial selector failure (non-mounted `bv-result`) and old transparent-HUD-parent measurements are preserved externally in `/workspace/9zone-masterpiece-exec-20261110/current-landscape-qa{,-v2}`. The parent rectangle had100%/82.6%/84.3% overlap at568/667/844 while the pitcher remained visible. Corrected sensor uses actual drawn HUD child panels and retains original parent coverage, threshold0.35 unchanged. Rectangles do not establish silhouette quality or actor presence quality.
- Final script reports fixture-phase mismatch, missing renderer/map/reward, offscreen/hidden zone/action/hand handle, unloaded reward art, console errors and aborted run as failures. It does not silently reduce the viewport count after a timeout.
