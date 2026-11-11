# Bridge calls 4–5 and sequence review

**Static source decision: PASS for the middle and low PRE drawings. Sequence decision: HOLD before integration pending the transition gate below.** The approved high PRE, calls 4–5 middle/low PRE, contact attempts 4–6, and call 2 POST were reviewed as the selected source set. No source image or repository file was edited.

## New middle and low PRE sources

I inspected the source-over light composites and compared the figures and props at common full-cell scale with the retained high PRE, the registered contact triplet, and the original atlas lag pose (frame 6). The two new poses keep the same adult batter, helmet, cream/navy/gold kit, handedness, cleats, and two-hand grip. Arms and wrists connect naturally to the shoulders; one bat remains in both hands. The middle pose has a compact crouch and inward lag, while the low pose keeps a visibly deeper hinge and knee bend. I saw no detached limbs, hand swaps, doubled bat, or material alpha fringe on the composites.

The fixed-foot metrics supplied for the unchanged 1254×1254 images pass comfortably:

| PRE | Rear-foot IoU / toe-sole drift | Front-foot IoU / boundary drift |
|---|---:|---:|
| Middle, call 4 | .954 / 1.155 px | .960 / 0.577 px |
| Low, call 5 | .930 / 2.309 px | .889 / 1.732 px |

These use the one common whole-cell mapping and the approved frame-8 foot reference; no pose-specific shift or fit was applied.

My first rough bat-length comparison against horizontal contact frames made the new lag bats look longer. That comparison was misleading because the bat orientations differ. Comparing to the original frame-6 lag pose instead, the middle PRE grip-to-tip span is about 225 canonical 724-cell pixels versus roughly 230 for frame 6. The low PRE estimate is about 205–215 pixels; its grip is partly hidden and its barrel angle differs. This does not show a material size jump. The black barrel and wood-handle proportions also appear consistent enough for this source review; exact 3D length cannot be inferred from these projected drawings.

## Browser playback and boundary checks

I opened the local review page at `http://127.0.0.1:5398/` in Chromium and used both the slider and Play control. I scrubbed immediately before and after the key boundaries at 449/450 ms (old frame 4→PRE), 524/525 ms (PRE→contact), 594/595 ms (contact→POST), 669/670 ms (POST→old frame 10), and 769/770 ms (old frame 10→recovery). I also ran the displayed 1× and 0.5× playback and sampled the visible phases through POST, old frame 10, and recovery. Timestamped browser captures and the state log are in `sequence-review/reviewer-check/`; the compiled static strips are `row-0-strip.png` through `row-2-strip.png`.

The old-frame-4 to PRE handoff reads cleanly for the high row. The middle and especially low PRE introduce a more compressed torso and knee pose at the row-specific transition; their feet remain fixed, but the body-height change is pronounced in one pose step. PRE to contact is more convincing: the same bat rotates from the lagged up-left position as both hands extend, and contact to POST continues that follow-through. POST to old frame 10 has the largest visible pose change: the arms and bat wrap from extended up-right to across the shoulder/back. It reads as an intentional follow-through in the sampled sequence, without a foot or whole-character pop, but the angular step is noticeable. Keep this boundary in the transition gate rather than treating the static foot pass as a motion pass.

Original frame 6 is a closer bat-path predecessor to the lagged PRE than frame 4: its hands and bat already sit up-left, and their projected grip-to-tip lengths are close. The supplied `predecessors.png` makes that direction clear. I did not validate frames 5–6 against the fixed contact foot registration, so this is not a recommendation to insert them automatically. If the sequence needs a smoother wrist/bat lead-in, compare the unshifted old 0–6 progression with its actual planted-foot timing before selecting the predecessor.

## Scope

The browser captures support a static art and boundary review only. They do not prove continuous motion between drawings, physical contact, timing against an incoming ball, or production suitability. No ball, audio, roulette, or runtime interaction was connected in this review.
