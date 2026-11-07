# Authored pitching in-betweens — 2026-11-07 KST

User instruction: **“부드럽게하는 보간 프레임 완료해주고 메인 병합해줘”**.

20 pitchers retain their twelve original grounded drawings exactly. **85 authored in-between drawings** are inserted where they actually bridge the adjacent originals: knee lift/lowering, stride, held-ball forearm whip, empty-hand follow-through and selected recovery. Each character now has 15–18 unique drawings, according to its curated selection. G023 replaces13 visibly defective middles and adds10 drawn hand-gather recoveries; unhelpful endpoint redraws and rejected alternatives were not adopted. Every pitcher ends on the exact original ready0. The source export remains **120 playback ticks at 60fps, 256px cells, 10×12**; that is not 120 newly drawn poses per pitcher.

- `sources/`: lossless preservation of image_gen outputs, including unused/rejected cells. `selection.json` identifies the actual cells adopted and their purpose.
- `base-registration.json`: immutable previous registration, including original file, timing, release/landing and anatomical pivot.
- `runtime/`: five-column compact lossless WebP, storing each adopted drawing once. Only these files are imported by the game.
- `atlases/`: complete authoring exports; not included in the game bundle.
- `review/`: labeled source-size contact sheets; not included in the game bundle.
- `manifest.json`: exact drawing count, pixel/file hashes, individual provenance and one registration transform per generation batch.

Build with `python scripts/build-pitcher-inbetweens.py` (Pillow). The builder does no pose generation or limb manipulation. Original key pixels are copied, then decoded from the final compact atlas and checked for exact equality. A single scale fits each generated batch to its original reference key. G023 uses recorded reference bounds or a named same-side sole for registration. Three newly authored drawings additionally have explicit integer canvas offsets (Gale +31,0; Amber +16,0; Jade2 +22,+2), accepted after comparing head, pelvis and both feet. Pre/post-registration pixel hashes remain in the manifest. These place an already drawn pose; they do not invent limb motion or warp anatomy. The additional three-cell whip batches use original key5 as their shared registration reference. Generated endpoint redraws are not substituted for originals.

The scene keeps existing source release ticks76/79 and the current shorter live delivery tempo. In-between runs exclude the next key so an empty release hand never appears before the ball departs. Contact freeze samples one fixed drawing; the original landing/release coordinates, handedness, RNG, damage, energy, cards and save schema remain unchanged. The separate batter package adds one actual bat-rotation drawing between original keys6 and7 while retaining original contact8.

## Rejections and limits

Automatic 13-per-pitcher insertion was rejected: several generated cells copied endpoints, lifted a recovering foot again, recocked an arm, or introduced an unnecessary hand gather. Earlier opaque Vulcan/Jade sheets and Violet's checkerboard whip source were replaced with image_gen background-removal outputs before selection. Generic optical-flow/RIFE trials showed translucent ghost limbs or disappearing contours and were **not adopted**. These are authored additional drawings, not procedural anatomy or alpha crossfades.

This is implementation and integration of the user's chosen direction. Historical G020 HELD3/3 and G021 HELD1/3 judgements remain unchanged. Technical checks and added frames do not establish a commercial-quality or “masterpiece” PASS; remaining art/animation judgement is distinct from the functional verification recorded in G022.


## G023 finish pass

User: **“모든 투수 확인하고 완성한다음 깃허브 올려줘”**. The previous75-drawing release is main `e4225dd`; its verification records remain historical records.

Two independent reviewers inspected all20 actual sheets, every adjacent adopted drawing and the last-key-to-idle transition. Replacements correct support-leg reversal, wide transient stance, misplaced body canvas, head-height/body-size pops and a premature high ball hand. Cobalt's mirrored knee role was redrawn; it was not hidden with a canvas translation. Ten meaningful recovery poses were adopted; near-endpoint redraws for Ivory/Gale/Vulcan were skipped.

`recoveryDrawings` is an explicit forward sequence `[original key11, optional new gather, original ready0]`. Numerically interpolating a descending atlas index would replay the pitch backwards and is forbidden. The live host duration, input unlock, release, landing and contact freeze stay intact. Only the original upright/gather source tail is redistributed, giving every gather/ready source cell at least3 ticks, within the existing120 ticks. A defeated pitcher retains its original final recovery key during the KO hold, rather than playing the new gather-to-ready sequence.

The review distinguishes original artwork, new authored poses, batch registration and the three measured drawing-anchor corrections. Original240 key pixels are still checked exactly; post-processing or added holds are not counted as new drawings. See `docs/art/quality/roster-finish-g023/` and G023 for current verification, limitations and actual game playback evidence.
