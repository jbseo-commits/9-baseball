# R4 batter contact candidate 2 — independent review

**Status: HELD.** This is a read-only review of an external feasibility sheet. It is not a physical plane, gameplay, motion or commercial-quality approval. Source assets were not changed.

## Common-canvas comparison

I compared `candidate2-source-sheet.png` and its three unpacked frames with `candidate2-reference-guide.png` using the guide's specified single uniform ratio, `724/768 = 0.942708`. I did not apply the older candidate 1 `.711462` standardization scale. Candidate 1's earlier standard-space comparison was illustrative only; it does not establish a candidate-to-world mapping or contact.

The guide maps target x coordinates 570.96, 615.76, 660.56 and y rows 407.5, 476.5, 545.5 into candidate-cell coordinates as x≈538.2, 580.5, 622.7 and y≈384.2, 449.2, 514.2. I measured Euclidean distance to alpha≥64 pixels in the right-side bat region (x≥400), in source-cell pixels. This is a nominal image-mask check only:

| Intended pose | Target row y | Distance to mask at x≈538 / 581 / 623 |
|---|---:|---:|
| High, frame 0 | 384.2 | 10.2 / 6.2 / 18.7 px |
| Middle, frame 1 | 449.2 | 24.7 / 22.2 / 31.8 px |
| Low, frame 2 | 514.2 | 43.2 / 40.6 / 48.0 px |

The high pose gets close to the center point, while both outer points sit beyond or beside the barrel mask. The middle targets miss by about 22–32 pixels. The low targets miss by about 41–48 pixels; frame 2's barrel instead runs through two middle-row points. Thus the intended reach height drifts progressively high, and none of the three poses covers its full three-point row. This is not a world-space overlap result; the experiment's image-to-atlas ratio is explicitly diagnostic and does not prove that the authoring pipeline followed registration.

## Identity, scale and planted feet

All three cells preserve the same batter identity, uniform, helmet, camera direction, two hands on one bat and right-handed stance. Both shoes remain on the same local baseline. The guide anchor `(210,700)` maps to candidate `(197.9,660.4)`; the three frames' rearfoot bottoms are at y=658–659 and their local rearfoot band spans x≈147–223, placing the anchor inside the same shoe region in every cell. The front shoe also stays planted and moves only slightly between frames.

At alpha≥128, candidate silhouette boxes are 475×428, 473×418 and 470×395 source pixels. Dividing by the one guide ratio gives approximately 504×454, 502×443 and 498×419 guide-equivalent pixels. The registered frame-8 guide art is about 500×455 (atlas bounds `[142,247,642,702]`). Width remains stable; the shorter middle/low silhouettes read as torso/head lowering with the feet fixed, rather than independent per-frame scaling. The high pose closely matches the reference scale.

## Remaining art issues and decision

The source sheet has conspicuous red/yellow fringe and detached faint pixels around the figures. The fringe is strongest around frame 1's arm/hip region and remains visible around the other poses. Inspect and clean those source edges while preserving the gold outline before any asset intake.

Keep candidate 2 as an external feasibility reference. If another candidate is authorized, retain the current identity, scale and foot anchor, but bring each barrel onto its corresponding target row and extend the high pose to both x extremes. The middle and low poses need the largest vertical corrections; the low pose must be lowered relative to the same planted feet. Recheck all nine target points against the whole alpha mask at the same single canvas ratio, plus the outside crossing if defined. Do not infer physical contact, runtime registration or approval from this guide-space diagnostic.
