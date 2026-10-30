# 20-character articulated pitcher runtime integration

User instruction: `게임에 적용해줘` (2026-10-31 KST), following the delivered standalone 20-character rig revision. This explicitly authorizes runtime integration of that revision on a feature branch. It does not assert commercial art acceptance or authorize a main merge/deployment. Known joint seam/grip/weight-transfer limitations remain documented.

## Impact analysis before implementation

1. UI/layout — affected pitcher atlas bounding boxes and mound anchors only. Derive each character's anchor and rendered scale from the rig export; retain world camera, batter and central zone.
2. Input/gestures — no changes. Verify cards, zones, hand folding and speed selector in an actual run.
3. Game logic/balance — no engine or balance changes. Align visual release frame76 and projectile socket with existing host presentation clock. One ball held through75, projectile from76. Verify seeded state parity.
4. Save/load — no schema or storage changes; verify existing resume and isolated playable session.
5. Viewports — verify landscape667x375,844x390,1440x900 plus rotation/small height. Portrait gets regression checks, not a new design.
6. Scroll/overflow — no CSS/global overflow changes; verify map scroll and route/facility flows.
7. Existing flows — title/map/battle/result/reward/facility/next route/resume. Legacy DOM/Pixi atlas registration must remain coherent when shared atlas mappings change.
8. Tests/regression — add20-character registration/provenance/frame76/release-socket invariants; update superseded historical runtime mapping expectations without weakening source asset tests. Run full tests, zone smoke and actual browser gameplay.
9. Build/deploy — compact alpha atlases replace old reachable runtime atlases. Preserve masters outside the runtime import graph; source bundle already delivered separately. Check60MiB budget and decode only current actor. No main deployment in this integration instruction.

## Runtime representation

Independently articulated cutout rigs are baked to120 atlas cells at60fps. Runtime plays those cells on the game's shared clock; this is not runtime continuous mesh skinning or120 independently painted frames. Export metadata carries per-character scale, anchor and projected3D hand socket. Left/right anatomy and documented/proposed slot status are preserved. Source PNGs and rig code remain in the delivered source kit; runtime derivatives record hashes and source revision.
