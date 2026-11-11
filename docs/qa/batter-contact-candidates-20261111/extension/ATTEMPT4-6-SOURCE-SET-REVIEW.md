# Attempts 4–6 source-set review

**Decision: PASS for starting bridge authoring from this three-pose source set.** This is a static source-art gate only. It does not approve the proposed plane, continuous motion, runtime integration, or production quality.

Reviewed the corrected, no-fit 3×1254 pack at `corrected-contact-sheet.png`, its light and dark source-over composites, the approved original atlas frame 8, the fixed-target criteria, and the validator JSON. The source-over composites are clean on both backgrounds; red/yellow RGB values present only at alpha 1–2 in transparent pixels are not visible fringe evidence. Character identity, uniform, helmet, handedness, and bat remain consistent across the three poses. Both hands visibly stay on the same bat. The high-to-mid-to-low poses form a legible progression; the low frame is a deeper crouch, with no apparent foot sliding in the common registration.

## Independent geometry checks

With one whole-sheet ratio, 1254/768 (canonical 724-cell factor 724/1254), I independently inspected the alpha masks in the annotated barrel ROIs. Alpha≥128 bounds and PCA major/minor dimensions, reported as canonical 724-cell pixels:

| Pose | Alpha≥128 bbox in cell pixels | Barrel major × perpendicular minor (canonical px) | Grip-to-tip estimate (canonical px) |
|---|---:|---:|---:|
| High | x875–1077, y654–710 | 116.7 × 31.0 | about 173–179 |
| Middle | x878–1086, y749–809 | 121.2 × 31.5 | about 173–182 |
| Low | x895–1091, y850–910 | 114.7 × 30.0 | about 171–178 |

The grip-to-tip estimates use the visible bat emergence at the joined gloves as the starting point and the farthest rounded barrel tip as the endpoint; glove overlap makes the start uncertain by about 5–8 canonical pixels. On that interval, length tracks the approved frame-8 bat and sits at or just above the stated 162±10% guideline. It does not show the over-length concern suggested by measuring from a rough hand center. Because this is a hand-occluded endpoint, retain the approved-frame comparison as a review constraint during bridge authoring rather than stretching or scaling the bat to improve target margin.

The middle ROI’s left boundary includes at most a couple of wood/handle pixels in the hand-overlap region; the visible black barrel begins around x880. This annotation uncertainty does not change the black barrel’s measured width or the contact result: all target disks are well inside the barrel’s interior region. High/mid/low black barrel lengths visibly stay consistent, with plausible thickness and a single continuous bat silhouette.

The strict validator reports all six registered feet passing the fixed-atlas alpha-128 IoU threshold (minimum observed IoU 0.8950) and toe/sole boundary drift (maximum observed 1.7321 canonical pixels versus 4 allowed). I checked the foot registration on the common sheet and it agrees with the displayed composites; the rear heel can move slightly within the patch while the toe/sole anchors remain stable.

The validator also reports all nine fixed r=8 target disks overlapping the full intended-row barrel at alpha thresholds 16, 128, and 240. I visually confirmed that the three target-column x positions fall across each black barrel interior, not merely the handle or a faint isolated speck. At alpha 128, the only nonzero center-to-mask distance reported is 3.47 world pixels (high right column), below radius 8; at alpha 240 the largest is 4.24. The three-pose pack used only the common 1254/768 canvas mapping, with no per-pose fit or target movement.

## Hand-off scope

Bridge authoring can proceed using these high/middle/low sources and the existing registered middle pose as the visual standard. Preserve the same batter and bat dimensions, fixed toe/sole registration, two-hand grip, and all nine authored target positions. Bridge review still needs to check each transition and the actual game-size source-over result. Do not infer physical 3D contact or authorize the plane from this static-mask result.
