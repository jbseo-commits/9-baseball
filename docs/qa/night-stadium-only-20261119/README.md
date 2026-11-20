# Existing game: night stadium + additive Red Fox

Latest user authorization: “좋아 그렇게해” permits registering Red Fox while keeping every existing pitcher. This supersedes the temporary background-only restriction. Earlier separate challenge/mode work is stashed and excluded. No new route, mode, controls, cards, intent UI, or save schema. No merge/deployment.

## Impact analysis recorded before implementation

|Axis|Impact and response|
|---|---|
|UI/layout|Background pixels and new actor only; original camera/UI geometry retained.|
|Input/gestures|No handlers changed; verify real card/zone/take/swing.|
|Logic/balance|One ordinary roster slot; preserve previous shuffle RNG, no new encounter/AI/card effect.|
|Save/load|No schema/storage changes; existing session route resume verified.|
|Viewport|Existing landscape/portrait gate; inspect844×390 anddesktop.|
|Overflow|NoCSS edits; existing world crop retained.|
|Flow|Existing route/map/battle/reward/facilities unchanged; full suite/smoke.|
|Tests|New registration/timing coverage, additive count updates, baseline seeded comparison.|
|Build/deploy|Full Vite dist with relative base; no deployment permitted.|

## Background registration

400×225 input from PR#135, preserved at assets/production-art/night-stadium/stadium-source.png. Piecewise nearest sampling maps to existing1672×941 world. Source mound(200,164)→(834,536), home(200,214)→(834,874); see mapping.json and build-background.py. Renderer import only; world/camera/zone/actor anchors unchanged. This intentionally distorts background geometry (vertical3.27× then6.76× vs horizontal4.18×). Ground/plate elongation and mixed actor/background styles remain HELD. This is not a new native pixel redraw or aesthetic approval.

## Additive identity and access

regular-07-red-fox / 붉은 여우 is an additional ordinary outside/rookie opponent, with no signature encounter. Prior20records unchanged. To avoid changing previous seeded first encounters, shuffle the prior roster with identical RNG draws, then append Fox to the battle pool. Normal later cycles necessarily include the new slot. Existing tutorial Red Rush remains first.

Documented review seed20261119 places Fox first in that same pool; this is an explicit seed-specific roster placement, not a new mode or hidden console step. Open `?battleUi=vnext&battlePlay=1&seed=20261119` in a fresh browser session. This existing main playable route uses its existing session storage. Other seeds retain the previous first battle cycle and all elite/boss placements. Existing saves keep their stored maps.

## Six-pose provenance and timing

Source PNGs from #138 commit e0ad972a7fb1df581a97669d545ddbca78e67056 preserved in assets/red-fox-sixpose. Generated then hard-alpha exported, not hand-authored96×96 originals. Six equal cells uniformly2× nearest packed into six256×256 atlas cells. See build-red-fox.py and red-fox-packing.json. Individual pivot/lead soles, never boot midpoint. Release source(31,12)→cell(108,82), normalized legacy release(0.421875,0.3203125). Main existing timing maps source release79 to delivery57ticks/950ms, contact1250ms. Six unique drawings held over120ticks, not79/120unique frames. Ends in empty-hand RECOVER; decision resets to SET through unchanged main lifecycle. High/back release anatomy and stepped motion remain HELD.

Existing engine, effects, saves, timing/controller, camera, CSS, hand, and other actors are byte-unchanged. New voice entry satisfies existing roster contract with neutral lines only. No old identity overwritten.

Independent reviewer compared1,000seeds ×normal/tutorial=2,000maps: original first cycles and all elite/boss objects equal. Background atlas pixel mapping and six-pose packing reviewed without clipping.

## Evidence and limits

before/after and flow-verification.json compare identical seed3 input/state for the background-only stage. Final build QA is recorded separately in export-verification.json and export-* captures. Automated Chromium mobile emulation is not physical Android testing. Technical pass does not imply masterpiece quality. Previously HELD art budgets and motion findings are retained.

Skills: repository AGENTS/codex-loop review workflow; no installed pixel SKILL.md was found in checkout/.agents/.codex. Existing Library skill is used for output delivery. Inputs came through authorized GitHub delivery after Library shell bridge failure; that failure is not claimed fixed. No external editor or untrusted script installed.
