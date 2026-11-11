# Candidate 2 edge analysis and candidate 3 reference control

Read-only review. No new image was generated; source art, atlases, and repository files were not edited. Measurements compare the exact 768×768 `contact-plane-contract/contact-frame-8.png` source with the three 724×724 candidate 2 unpacked cells. The unpacked cells are pixel-identical to their 724px crops in `candidate2-source-sheet.png`, so any edge pixels described here are already present in the generated sheet, not introduced by sprite-gen extraction.

## Alpha and edge pixels

All masks use the file's RGBA alpha without a resave. Connected components are 8-connected.

| Image | Alpha ≥1: components | Detached pixels at alpha ≥1 | Alpha ≥64 | Alpha ≥128 | Alpha ≥240 |
|---|---:|---:|---:|---:|---:|
| Approved contact frame 8 | 11 | 35 across 10 tiny pieces (largest 8px) | 1 component | 1 component | 1 component |
| Candidate 2 high | 1,176 | 4,208 | 1 component | 1 component | main + 1 isolated pixel |
| Candidate 2 middle | 1,180 | 4,125 | 1 component | 1 component | 1 component |
| Candidate 2 low | 1,041 | 5,134 | 1 component | 1 component | main + 2 isolated pixels |

The candidate's detached components are all alpha 1 (out of 255); the original's detached pieces are alpha 1–2. Candidate 2 has 17,082–17,430 pixels at alpha 1–7, versus 3,997 in the original. At alpha ≥8, each candidate is effectively one main connected silhouette, with only 5–15 tiny detached pieces (8–24 pixels total). These raw channel counts do not establish visibility.

The approved original already has a warm gold/orange/red rim. I inspected the browser source-over composites `candidate2-dark.png` and `candidate2-light.png` at native scale, along with the corresponding game-bitmap composites. Candidate 2 shows no material visible fringe on either background; its warm edge reads consistently with the original. Candidate 2's high-opacity red/yellow edge counts are comparable to the original, and raw RGB values at alpha 1–2 are not reliable visibility evidence. The earlier description of a stronger visible fringe was incorrect. Preserve the approved rim; the composites do not support an edge-cleanup requirement.

A requested near-pure raw RGB count at alpha ≤2 (red: R≥224/G≤96/B≤96; yellow: R≥224/G≥160/B≤96) gives original 144/97 pixels, candidate 2 frames 0–2 763/605, 1411/818, and 811/858. All pixels in these counts are alpha 1–2, not alpha 0. These values are channel diagnostics only: the source-over composites show that they are not materially visible at the reviewed native or game bitmap sizes.

Pixel analysis shows more alpha-1 detached residue in the generated sheet than in the approved source, but the inspected composites show that residue is not materially visible at the reviewed sizes. The unpacked cells are pixel-identical to source-sheet crops, so extraction did not change the image. Do not treat this as a reason to reject a pose or remove its warm edge.

## Whole-body references for a lower reach

Use the existing art as posture guidance only:

- `assets/production-art/mockup-rebuild/source/poses/batter/return-low.png` (atlas frame 12) shows the deepest established crouch with both hands on the bat. It is a return/recovery pose, and its bat points up/right behind the shoulder; it is useful for knee, hip, torso, and planted-shoe structure, not as a registered contact pose.
- `.../source/poses/batter/downswing.png` (frame 7) has a low center of mass and active forward leg drive, but the bat is still moving downward before the registered frame-8 contact. It is useful for transition/body mechanics only.
- `.../source/poses/batter/recover.png` (frame 11) has a lowered forward body and two-hand grip, but is also a recovery shape. It can inform the torso/leg silhouette.
- `contact.png` (frame 8) remains the exact identity, costume, camera, grip, bat, and scale reference. Frame 9 is early follow-through with the barrel rising; neither 7 nor 9 is a spare registered contact endpoint.

## Safe built-in image_gen reference controls for a third experiment

If another candidate is authorized, give image_gen the unmodified approved `contact-frame-8.png` as the identity/style/camera/scale/handedness/feet reference and `candidate2-reference-guide.png` as geometry only. State that the magenta crosshairs and circles are temporary targets, not output art. Make three discrete whole-body contact poses with one batter per cell: high, middle, low. For each cell, the complete drawn barrel mask should pass through the three target centers in that cell's corresponding row; don't settle for a bat angle that only comes close to the middle point. Ask for one imagegen-authored pose per cell, a transparent background, the same right-handed batter, two hands on one unchanged bat, both feet planted at the guide anchor, one camera, same apparent size and costume, and non-stretched anatomy. Use frame 12/7/11 only as secondary body-posture references for deeper knee/hip flex; explicitly retain the frame-8 face, helmet, proportions, uniform, grip, and lighting.

For edges, preserve the approved narrow gold/orange outline. Review any later output with actual source-over composites on dark and light backgrounds; do not infer visible defects from RGB values of nearly transparent pixels or strip the approved warm edge.

Review with a separate diagnostic overlay only: render the unchanged three output cells at the guide's single `724/768` canvas ratio, then place the mapped row targets and foot anchor in a separate review image. Never include those magenta markers in the art export, never individually fit/translate/warp poses to force target overlap, and do not call image-plane proximity world-space contact. Before a fourth-generation attempt, review candidate 3 against the same mask-distance table and inspect both feet, helmet/head height, and body scale. Candidate 2 was followed by candidate 3; the separate final review records that experiment's result.

No alpha threshold, mask operation, image transform, source modification, tool installation, or provider request was used for this audit.
