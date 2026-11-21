# Visible public pitcher mini-map — #161 follow-up

Owner explicitly superseded HP-only: show a compact9zone mini-map over HP without holding. Detailed strategy still requires sprite hold/keyboard. Base413d53e (#161), no held #160.

## Runtime change

34×34 CSS-pixel map above the72×7 HP gauge,4px gap, bounded shared positioning. Neutral unknown/range and dotted range cells; confirmed singleton uses a dot/!; earned public outside uses 볼!. No personality label or expanded panel. Pointer-events remain none; existing hold hitbox is unchanged. A copied face9+confirmedOutside snapshot refreshes only at deciding without any playback. Preparation/flight/result retain that PUBLIC snapshot, never the rolled actual course. Opponent remount or playback without a prior snapshot starts unknown. The current public badge semantics and forecast/odds are unchanged.

A real result screenshot caught the persistent map overlapping the existing decorative verdict. Only that verdict moves beside the map in scenes with this overhead stack; damage rail, camera, actor registration, flight, timing and all outcomes stay unchanged. No art changes. Copper preloading and only-Slugger ordinary selection are retained.

## Verification

-281test files /1879tests PASS; zone-report10 PASS; production build +52.1MiB/60MiB budget PASS.
-25browser cases:20encounter roster IDs at667×375,3bosses844×390,Emerald desktop1440×900 and reduced667×375. All map/HP/head/HUD bounds pass. Red Rush is not present in the generated normal encounter checkpoints; all21 registered anchors still have existing unit coverage.
-Real touch short press does not open;550ms hold opens details; Escape dismisses. HP equals committed saved result. Rotation back retains visible badge. Replay trace stays identical through flight/result and refreshes on next decision.
-Normal fresh `/` flow with no forced seed: Slugger selection→guide→map→real battle→public scout→Basic swing→result→next decision. Visible without hold, synthetic optional Slugger loaded. Recording is actual UI, not real private copper proof. This is a first-battle test, not full-campaign completion.
-Matrix states are reconstructed QA checkpoints with reachability set before launch, not naturally earned boss runs. No mid-play changes to rolled course.
-Existing public-intent tests cover all10targets through legal public scout, unknown/range/exact/outside and no probability inference. New snapshot tests cover preparation/flight/result, first playback mount, outside freezing and clipping. No private engine state is accepted by the new component.
-Independent reviewer checked source and12relevant tests; no blocker. Result-overlap follow-up measured actual strong text bounds at667/844/1440 and keeps badge separated.

## Honest failed checks / corrections

Initial fresh script assumed scout in every random hand; fixed to select an actually present prep card. It also needed to reopen the hand after preparation. These were test-control mistakes, not game changes. Reduced motion intentionally lacks the decorative result spotlight in one case; only existing spotlight is measured, while the public map and result rail remain tested. Final packaging removed15obsolete hashed files left by rebuilding outside the repo without emptyOutDir. Every retained runtime file was byte-identical; rebuilt clean ZIP was extracted and actual controls/layout checked again.

## Artifact / parent check

Exact ZIP and SHA256 in build.json, full634-path manifest in dist-manifest.json. Normal entry `/`, no query; relative base `./`. No local harness or private candidate is included. Keep parent's existing optional private directories unchanged when applying transfer.

Compare baseline-161-emerald-667.png with boss-01-emerald-tyrant-667-False-ready.png. fresh-before/after-scout/flight/result are actual rendered captures. fresh-public-intent.mp4 is small enough for connector retrieval and uses synthetic approved-art loader bytes, NOT the owner's copper art. In the actual owner build, verify visible map before any hold, long-press details, prior public cue through release/result, refresh at next decision, and unchanged copper actor.

No merge, deployment, main change or private asset upload.
