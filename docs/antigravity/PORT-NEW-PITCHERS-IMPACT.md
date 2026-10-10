# Autonomous pitcher port — impact analysis

Target: port Sky Phantom, Gale Twister, and Vulcan Blaze from `ag/20261001-sky-phantom` onto the current Cinematic V2 main without importing stale battle presentation code.

1. UI/layout — 영향 있음: three pitcher atlases enter the existing actor slot. No Ballpark layout or actor anchor CSS changes.
2. Input/gestures — 영향 없음.
3. Game logic/balance — 영향 있음: roster gains three authored pitcher entries using the already-developed archetype values. No engine algorithm changes.
4. Save/load — 영향 없음: no schema or storage-key change.
5. Mobile viewport — 확인 필요: atlases use existing pitcher render bounds; verify portrait/landscape preview.
6. Scroll/overflow — 영향 없음: no layout/CSS changes.
7. Existing user flow — 영향 있음: the three pitchers can appear through the existing roster/run flow.
8. Tests/regression — 영향 있음: roster/visual mapping and release/stance/stride metadata require regression coverage.
9. Build/deploy — 확인 필요: three additional imported atlases increase bundle assets; branch build/Pages preview must pass.

Mitigation: preserve current Cinematic V2 `BallparkActors`/`BallparkBattle`; port only pitcher assets, roster metadata, authored coordinates, visual mapping, and voice data. Do not merge the stale autonomous branch wholesale.