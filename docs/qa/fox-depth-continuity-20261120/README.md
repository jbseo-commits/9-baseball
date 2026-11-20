# Red Fox depth departure and pass continuity

User direction supersedes the rightward-onset hypothesis. Start from3d50518c. Actual runtime correction, bounded to Red Fox presentation; no sprite/camera/actor changes.

## Pre-implementation impact
1 UI/layout: Fox ball only; single straight projected ray and monotonic size, no new HUD.
2 Input: unchanged; real card swing/take QA.
3 Rules/balance: unchanged;950ms release/1250ms contact/outcomes preserved.
4 Save/load: unchanged; storage/resume QA.
5 Mobile: inspect844×390 plus desktop/reduced-motion.
6 Scroll/overflow: unchanged, noCSS.
7 Existing flow: same reviewseed/route; no newmode.
8 Tests: exactendpoint/diameter and derivative continuity, hidden-outcome independence, other-roster/default behavior.
9 Build/deployment: full relative-base Vite ZIP, extracted-build QA; no deployment.

## Projection contract
Only Red Fox opts in. Let t=(elapsed−release)/flightDuration, depth=2−t. Projected progress=t/depth; radius=12/depth. Constant3Dvelocity through positive depth gives a straight image-space line with nonzero initial velocity and increasing size. Starts at actualhand radius6, reaches actualcontact radius12 exactly at1250ms. Existing hit/foul/contact response remains unchanged. Noncontacts continue the same ray and radius through impact, without outcome-based relocation; hide at nearplane depth0.4 rather than crossing the camera singularity. This visibility clip is cosmetic, not an engine timeline change.

No pending/outcome/zone data influence preimpact. Logical zone/result UI remains authoritative; generic noncontact flight does not purport to reveal a hidden selected zone. Arm still points more right than actual contact direction; no claim of an art/anatomy fix. Existing3→4pose continuity HELD retained.

## Verified exported runtime
- Full suite253files1720testsPASS; smoke10seeds/build/budget52.0MiB/60MiBPASS. Targeted13testsPASS. Independent read-only reviewPASS.
- Final ZIP52,158,684bytes, SHA256 `23fa93182f36c2bd5898c44960635f2d18a1e4b133628c6f07ab7b8cada235e4`;dist54,496,808bytes/630files/base`./`. Extracted all630files match built bytes. `/workspace/fox-depth-continuity-playable.zip`; serve dist via `python3 -m http.server 8000 --directory dist`, query `?battleUi=vnext&battlePlay=1&seed=20261119`.
- Extracted build actual Chromium844×390 mobile emulation,1440×900 desktop,reduced motion: card→zone2→swing hitHP60→42; take lookingstrike; publicbadge hide/restore,rotationnotice,reloadresume,localStorage unchanged,no404/page errorsPASS.
- Extra actual zone6 swing produced a genuine engine whiff. Baseline/new accepted engine state compared in full for hit/take/miss; identical (outcome-comparison.json), no fabricated outcome.
- Real RAF samples: hit first x479.135→477.211→475.302; spritebox width7.266→7.484→7.688px. Take x479.092→477.675→476.289; width7.266→7.500→7.719. Miss first observed x477.463→474.844→473.438; browser missed exactrelease sample, so not claimed initialhand error. All pre/postnoncontact observed center/size samples fit the same ray with maximum0.021px raster/layout residual. Spritebox width uses the unchanged spinning ball atlas; it is not claimed as a subpixel measurement of painted silhouette diameter.
- Exact functional checks at1249.99/1250/1250.01 prove endpoint,radius and firstderivative continuity for take/miss; at1250 radius12 andpositionexactlymatch incomingendpoint. Hit retains original contactC/radius12/freeze. See exact-projection-samples.json and flight-verification.json. Release950/contact1250 unchanged.
- At16.667ms afterrelease, fixed-time projected displacement is~1.853phone px instead of~0.200px withold squared easing. Starts at hand; now finite visible initialspeed. No arbitrary rightwardkick orcurvature.
- All20otherrosters/actions/phases/sampletimes/results deep-equal frozen3d50518c output oracle. Assets, camera, actorplacement, engine/card/save source diffs empty. OnlyFoxoptsin; original generic flight/pass lines untouched. Fox-only nearcurl removed so it does not imply a bent pitch or linger afternearclip.

## Visual review and remaining limits
Directly inspected ready/release/hit/take/miss captures and passvideo frames acrossapproach/result/nearclip. Actual pass enlarges continuously left/down and disappears atpositive-depthnearplane0.4 (180ms afterimpact). This intentionalvisibilityclip is not claimed continuous disappearance or literalphysicalcatcher simulation. Timelines, inputdeadlines and actual outcomes remainunchanged. Generic outcome-independent whiff trajectory still crosses cosmeticC withoutcontactflash; it does not physically model every hiddenmiss/foregroundocclusion. The supplied arm pointsmore right than the real contact; no drawing waschanged. The prior3→4pose snap and artHELD remain. No masterpiece claim orphysicalAndroid test.

QA script corrections: initialmeasurement readlast afterauto-next-batter and sawentry; changed to capture acceptedstate immediatelyafterinput. Then corrected expectedtake kind fromstrike topitch+루킹 text (actualenginecontract). These were assertions, not runtimefixes; both were rerun successfully. No failedgameplay check was erased.

Skills/workflow: AGENTS impactanalysis and codex-loop independentreview applied. No local pixelSKILL.md found. No newart/toolinstallation/Libraryretry/merge/main/Sites/deployment. PriorLibrarybridge failure remains; no newLibraryID.
