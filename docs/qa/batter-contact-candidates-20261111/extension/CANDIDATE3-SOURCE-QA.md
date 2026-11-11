# Candidate 3 source-art QA — final allowed contact experiment

**Status: REJECT as a three-pose contact candidate.** This is source-art feasibility QA only. No source sheet, repository art, or runtime asset was changed. Experiment count is now 3/3; no fourth image generation is recommended or performed.

## Composite inspection

I inspected `candidate3-dark.png`, `candidate3-light.png`, and the six source-over native frame composites (`candidate3-frame{0,1,2}-{dark,light}.png`). At those rendered sizes the warm edge matches the approved contact art; there is no material visible red/yellow fringe or detached speck problem. This corrects my earlier raw-RGBA interpretation of candidate 2. The approved original itself has the same narrow gold/orange/red rim. Raw RGB at alpha 1–2 is not visibility evidence.

For completeness, using near-pure red `(R≥224,G≤96,B≤96)` / yellow `(R≥224,G≥160,B≤96)` on all alpha≤2 pixels gives original contact frame `144/97`; candidate 2 frames 0–2 `763/605`, `1411/818`, `811/858`; candidate 3 frames 0–2 `912/880`, `833/1050`, `1050/637`. These are only RGB channel counts in alpha 1–2; the inspected composites show no material visible defect at native or game bitmap scale. Preserve the existing warm contour.

## Both planted-foot registration

I independently recomputed the fixed native patches at alpha≥128 after applying the one whole-canvas 768→724 reference ratio. The values match `candidate3-foot-registration.json`. Acceptance requires IoU≥0.75 for each shoe and maximum sole/toe boundary drift≤4 native pixels.

| Frame | Rear shoe IoU / drift | Front shoe IoU / drift | Foot gate |
|---|---:|---:|---|
| High (0) | 0.9627 / 2 px | 0.9039 / 1 px | Pass |
| Middle (1) | 0.9580 / 3 px | 0.9015 / 2 px | Pass |
| Low (2) | 0.3361 / 28 px | 0.5565 / 27 px | **Fail** |

The high and middle shoes retain the approved registration. The low pose shifts both shoes left substantially, beyond the allowed drift and well below the IoU floor. This alone fails the three-pose set's planted-foot gate.

## Full barrel mask at all nine targets

I used the guide's single 724/768 canvas ratio (`0.9427083`) for all target coordinates, with no individual fitting or movement. The contract's nine atlas target centers map to native-cell X≈538.25, 580.48, 622.72 and Y≈384.15, 449.20, 514.25. The proposed ball disk radius 8 world pixels equals 4.827 native pixels at this mapping.

For the semantic barrel ROI, I measured alpha masks at thresholds 16, 128, and 240 in the dark barrel/tip region x=520–649, y=300–529, excluding hands and grip/knob. Distances below are minimum Euclidean distances from each target center to the union of occupied pixel squares, converted to world units. A point passes only at distance≤8 world pixels.

| Frame / assigned row | Zone | α16 distance | α128 distance | α240 distance | Disk overlap at α128 |
|---|---:|---:|---:|---:|---|
| High | 0 | 20.14 | 21.80 | 23.46 | No |
| High | 1 | 13.51 | 15.17 | 16.83 | No |
| High | 2 | 17.89 | 19.31 | 21.58 | No |
| Middle | 3 | 25.60 | 27.24 | 28.66 | No |
| Middle | 4 | 18.73 | 20.24 | 21.88 | No |
| Middle | 5 | 19.56 | 21.14 | 23.23 | No |
| Low | 6 | 36.87 | 38.53 | 40.12 | No |
| Low | 7 | 29.55 | 30.35 | 32.00 | No |
| Low | 8 | 42.25 | 44.50 | 45.70 | No |

Distances are in world pixels, but only under the plan's diagnostic canvas ratio; this does not establish a registered physical strike plane. No target disk intersects the intended row's barrel mask at any alpha threshold. Threshold sensitivity does not change the classification. The low pose misses farthest and already fails the shoe registration gate. Visual identity and grip remain recognizable, but the hand/bat placement does not meet the contract's nine-point source-art test.

## Final decision

Reject candidate 3 for the three-pose contact-art contract. The high and middle feet pass, but their intended rows have zero-of-three barrel target disks; the low pose has zero-of-three and both feet fail registration. Do not rescue the sheet by moving feet/targets, lengthening the bat, or scaling individual cells. The proper composites do not call for fringe cleanup. Any future work requires a newly approved scope; the 3/3 authoring experiment allowance is exhausted.

This result does not approve the plane, validate continuous swing/contact, authorize asset intake, or prove that nine new drawings are required.
