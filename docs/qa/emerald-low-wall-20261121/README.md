# Emerald Tyrant low-wall presentation review
Base: exact #150 d6aa046b8df198f7c8154684b282f9646574d449. Normal campaign `/`, no forced matchup/query. No deployment.

## Changed
- Removed universal roster footer art claim. Does not assert optional art loaded or approved.
- Only `boss-01-emerald-tyrant` with matching public encounter cue gets a small crenellated wall symbol and 낮은 성벽 label. It is separate from the actual public zone badge; low preference is NOT certain. Reduced motion keeps this static decision cue.
- Single sinking ball: x follows existing projected progress q, y follows q². This is stylized presentation, not straight physical projection. Exact hand release, committed actual arrival and 300ms deadline remain; position/radius and incoming tangent continue through take/whiff. Hit/foul originate at the same endpoint. Compact release950ms/contact1250ms unchanged.
- One short descending synthesized cue through existing mute/cancel/reduced-motion routing. No external audio or new art.

## Existing rules and balance assessment
No engine, cards, RNG, odds, HP or timing changes. The +8 requires actual low hit, aim=actual, primary exactly one, total coverage exactly one (not assist-only). Low coverage >=3 applies .7 base damage on actual low hit. Foul/miss/take get no +8. These existing alternatives already distinguish narrow investment versus broad insurance; no redundant mechanic was added. Tests are correctness evidence, not proof of commercial balance/fun.

## Verification
- Full 271 files /1829 tests pass; 100-seed zone smoke; review + production builds; dist52.0MiB/60MiB.
- 594 non-Tyrant samples exactly equal #150 (independent reviewer also checked448). No other actor assets changed.
- Exact extracted ZIP 634 per-path hashes verified. 14 resumed legacy-campaign cases plus14 saved Slugger cases: take/hit/foul/whiff across844x390,667x375,1440x900, reduced667, half-speed844. Exact saved result/last/combat equal unchanged engine. `alt` QA label means existing0.5x select control, NOT an Alt keyboard shortcut.
- Additional cold-title Slugger start/card/swing, saved Slugger late optional asset adoption, reduced motion and rotation:3 cases using approved-atlas synthetic texture only. Real private copper atlas is NOT present in this export and not re-reviewed here; its same-site loader contract remains unchanged.
- Public cue absent while a ball exists; exactly one ball; no page errors. All10 destination endpoints/pre-release gate/contact/pass continuity covered in unit tests. Captured boss seeds1/2 resolve low cell6; no outside boss throw found in initial seed scan, so outside continuity is unit evidence, not captured footage.
- Audio runtime instrumented oscillator frequency AND duration: mute/reduced no pitch signal, enabled one, cancellation stops it. No perceptual listening claim.
- Mobile/desktop browser emulation, not Android hardware. No new full3-act run; normal fresh-flow and explicit Act1 boss save checkpoints. Prior #149 normal-run outcomes remain unchanged.

## Footage provenance and limits
`before-take-844.mp4` is exact #150. `take-844.mp4`, `hit-667.mp4`, `foul-844.mp4` are actual browser UI actions on resumed normal-campaign boss checkpoints (fixture reachability set to boss; no scripted result). Capture scripts use known outcome only to select test aim; runtime presentation uses durable committed course after release. All clips<1MB. Viewed native ready and flight/result frame series: lower approach reads, but300ms is brief and fixed bat-pose reach remains an inherited limitation. This is a VFX/tell pilot, NOT an approved lower stance or new boss silhouette. Existing atlas, regular/elite roster, camera/stadium, Slugger lock/career/save contracts untouched.

## Failures retained
Initial harness sampled save4seconds after action, after existing automatic next-pitch entry; fixed to100ms committed save and kept footage later. Initial broad-worker test run produced socket noise; stopped overlapping run and completed maxWorkers2 suite. Audio's first220Hz-only detector counted music chords; narrowed to the actual185ms pitch voice. These were harness/environment corrections, not gameplay changes.

## Delivery
See build.json for ZIP SHA256,size,base and entry, dist-manifest.json for all files. Parent may add private `slugger-motion-v2` and `roster-v2` files after verifying manifest; they are intentionally absent here. Transfer overlay is supplied separately vs exact #150. No Library access attempted. No candidate raw art uploaded. See ART-ACCEPTANCE.md for held motion acceptance gates.
