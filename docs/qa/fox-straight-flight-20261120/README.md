# Straight-flight request: geometry gate before changing runtime

Started from cbb16b5911ae9b362acf5bd3c8fd5dd71f41d9cb. V4 side view discarded. No new art, mirroring, engine timing, camera, HUD, zone, other pitcher or gameplay changes authorized by this record.

Pre-implementation impact: UI/layout and mobile trajectory readability require verification; input, rules/balance, save/load, scroll, existing flow, and deployed runtime remain unchanged while investigating. Tests inspect endpoint projection and extracted existing play loop. Build/deployment: preserve exact prior ZIP; no deployment. No local pixel SKILL.md exists; AGENTS and Codex read-only reviewer workflow applied.

The actual source contact pose was directly inspected. Existing source point642,344 projects left of Fox release230,59. Even using the rightmost painted bat tip cannot put contact to the right of the hand with the retained actor transforms. Positive-depth perspective projection of a straight 3D segment remains a straight 2D line and cannot reverse horizontal direction between these fixed endpoints. Easing or depth changes can alter speed and apparent size, but cannot change that sign. A temporary rightward kick followed by a return would violate the requested no-curve/no-loop condition. No such runtime change will be published.

## BLOCKED — not a completed visual fix
Runtime source and all art bytes remain exactly cbb16b5. No curve, kick, V4 camera, mirroring, rescale or actor translation was shipped.

Release world(947.215640,384.465220); true swing contact(818.75,450.104167). Horizontal difference−128.465640world=−64.847488screen px at844wide. Actual farthest opaque bat pixel sourcex158 maps898.958333world, still48.257307world left of the hand. Independent reviewer confirmed the constant-sign projective-line constraint.

Fresh extracted baseline first three external-ball samples:
- Swing x479.0591→478.5835→476.0467; y132.1059→132.3491→133.6560. Sprite width3.6406→3.7188→4.1406px. All pose8. Browser screenshot load may skip rendered intermediate frames; these are first three observed RAF samples, not claimed exact physics ticks.
- Take x478.9920→478.5608→477.8354; y132.1952→132.5608→133.1791; width3.6563→3.7656→3.9375px.
- Swing first result center(414.9846,165.0196) is at existing barrel/contact, with existing shared impact camera shake. Take retains an additional pre-existing pass transition: last observed flight width13.3594 then first result8.8906; this was not corrected or claimed continuous. Adjusting that alone would not solve the incompatible launch direction.

## Considered alternatives, not shipped
- Change speed/depth/radius only: cannot change x direction; rejected as solution.
- Rightward initial tangent then old contact: requires turn/curvature; explicitly prohibited.
- Use far bat tip: still left; insufficient.
- Translate batter/contact to right: needs at least~24px phone just to reach hand x using furthest tip, or~65px retaining existing contact. It is a visible stance/contact layout change; it does not establish zone/bat alignment or readable early rightward launch. Not silently introduced as a safe offset.
- Revise the release drawing to aim toward the existing contact: geometrically coherent, but violates this request's unchanged12pose/no-new-art constraint. Requires a future art decision; not performed.

## Preserved playable artifact and checks
The unchanged baseline ZIP SHA256 is `7230717c5ec1d283c8a606ef457b9cd665298ab959176a619068054cb8a95e44`,52,158,486bytes; full dist54,496,154bytes/630files/base`./`. Local `/workspace/fox-twelve-pose-playable.zip`. Its immutable repository URL remains the cbb16b5 `docs/qa/fox-twelve-pose-20261120/playable-build.zip`. This is NOT a new fixed build.

Fresh baseline QA:844×390 mobile emulation,1440×900 desktop,reduced motion; real card/zone2/swing hit60→42,take lookingstrike,badge lifecycle,resume,portrait gate,localStorage unchanged,no404/page errors PASS. Runtime/art diff againstcbb16b5 is empty, so other pitchers and timing remain byte-identical. Focused shared-effects/all-roster/twelve-pose tests rerun; see test-results.txt. Original cbb16b5 PR Verify44649750148 and Impact44649791681 passed. No main/merge/Sites/deploy/Library actions. Android physical device untested.

Current screenshots/GIF demonstrate the baseline failure honestly; they are not a successful corrected-trajectory showcase.
