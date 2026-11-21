# Character careers and first reward build branches — review slice

Impact analysis before implementation: UI/layout affected (four full-body neutral silhouettes, no deck fan); scoped responsive CSS. Inputs affected only selection lock/confirm and existing reward choices. Rules affected only new class buildVersion 1 passive HP terms and deterministic first three reward offers; old runs retain old rules. Save affected by optional registered career receipt and separate durable profile key; old saves untouched, no retroactive credit. Mobile667×375 and844×390, portrait rotation/scroll require browser checks. Normal title/map/battle/reward/continue retained, no new game mode. Full suite/smoke/build and real-control QA required. No real candidate art, Library, merge or deployment.

## Delivered and verified

Character-first selection defaults to Contact; three locked full-body silhouettes show real career thresholds. No card previews remain in selection. New registered normal runs track durable deduplicated achievements separately from run saves. New classes receive their narrow traits and two actual first-three-reward build paths; old pack/class saves retain previous rules. See [CONTRACT.md](CONTRACT.md) for exact mechanics, optional fixed portrait paths, storage and approval boundaries.

Exact exported ZIP: `playable-build.zip`, 52,240,474 bytes, SHA256 `3dc757420c1370e98f85cd1034b9a108b4944136a119ddf8d64ed1cc66931c60`. 634 files / 54,580,080 extracted bytes. Built with `VITE_NORMAL_REVIEW=1 VITE_BASE=./`; open `/` with no query on a static HTTP server. Full `dist/` retained, not an offline single HTML. Optional `roster-v2/*.webp` portraits are absent by design; missing requests fall back to neutral silhouettes. No new battle sprites. All runtime files matched manifest after extracting this ZIP.

- Full suite: 264 files / 1801 tests passed. Zone report100 seeds/build completed (supplemental automated baseline, not player-quality proof). Review and normal production builds pass;52.1MiB/60MiB budget.
- Exact final build cold title, virgin storage, Contact only:4 ordinary variable runs,73 actual UI actions,3 extra-base hits/5 taken balls/10 runs. Seeds3934516870,2818905694,4160396591,1280524811. Decisions used visible hand/cost/coarse public zone cues; no hidden target read or injected achievement/save outcomes. Loss/new-run and normal map/facility/event/reward transitions were traversed. `career-play.json`, `earned-profile.json`; browser JavaScript errors0.
- From that exact earned profile: all4 unlocked character choices → real first pitch/result → reload with identical run and career saves, at667×375 and844×390. `final-new-runs.json`.
-8 additional legal public-policy engine checkpoints: actual final KO swing then either real branch reward, added-card and branch-record assertions; no career receipt/credit. These are targeted checkpoints, not eight complete cold-title victories. `review-browser.json`.
-3 portrait adapter cases: valid decoded local approved-actor clone, missing404, corrupt bytes. Four fixed URLs verified; never a new candidate art integration. Production build with query `normalRun=1` makes zero portrait requests.
- Selection checked at667×375,844×390,1440×900 and390×844; portrait scroll and confirmation accessible. Current approved combat actor remains. No physical Android claim.
-60 old-pack exact engine parity cases and3 actual old-map resumes preserve IDs/decks/opening hands. Old locked-class resume covered in UI tests. Crash/retry/rewind receipts, memory-only storage refusal, tutorial/fixture exclusions, two-strike fatigue floor and forecast equivalence covered in unit tests.
-Independent read-only reviewer checked code, suite evidence, final career results and all634 ZIP/extracted hashes; no remaining code blocker reported.

## Review media

`media/career-cold-start-native.mp4` and `media/career-unlock-final-native.mp4` are beginning/ending excerpts of the final actual normal run recording (reduced motion), not composites. `*-fresh.mp4` are normal-speed, real newly unlocked character starts/first-result/reload. `*-branch-*.mp4` and `slugger-v1-tableSetter.mp4` are explicitly targeted checkpoint reward clips. Every MP4 is below1MB for connector retrieval; hashes in `media-manifest.json`. `cold-selection.png` is the final virgin profile; `earned-selection.png` is the final3/5/10 earned profile. Neutral silhouettes deliberately do not claim four finalized character identities.

## Preserved failures and limits

Initial UI tests expected old card fans/default no selection; updated to the expressly changed character-first requirement. Initial QA recording invocation lacked its ffmpeg path; used the already installed workspace runtime, no external install. First automation attempt tried an unaffordable card; it now observes the real disabled action and uses an affordable fallback. One final cold-profile QA repeat stopped at an incorrect relic selector after2/5/6; the selector was corrected and an entirely fresh final-build run reached3/5/10 with no JS errors. No gameplay was changed to force that success.

Review balance values and eight build branches are a small playable slice, not full commercial balance certification. No newly demonstrated full3-act unassisted victory. Actual class portrait art remains uninspected/absent; rejected candidate atlases and held generic atlas adapter are not used. Main/#146/v8/private Site unchanged; no merge or deployment.
