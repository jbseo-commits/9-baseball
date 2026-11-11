# Independent pre-plan review — existing-source continuity

Reviewed read-only against main `fb8e7b13f043e2c17376138abe6696f48c2d8022`. No product edits, rendering run, generation, or production approval by this reviewer. Source inspection: all 14 originals in `original-14-frames-light.png`, selected PRE/contact/POST strips, `post-existing-poses.png`, original 9 and low POST at full-cell resolution, prior source mapping/review, current motion and presentation-clock code.

## Decision

PASS for a bounded external temporal/landmark audit and one explicitly counted frozen local candidate if its source joins justify it. HOLD production integration pending the existing motion, visual, privacy, regression and actual-host gates. Static feet/contact-mask PASS does not settle continuity.

## Source findings

- Original 0–4 provide load/stride/plant. They intentionally move the leading foot; the near-impact contact-foot IoU gate cannot be applied to every earlier stride or later recovery pose.
- Originals 5 and 6 add hip drive and barrel lag omitted by the failed old0..4→PRE candidate. Original6 is directionally closer to the new lag PRE: bat up-left, hands beginning to turn. Inspect old4→5→6→each PRE at the unchanged full-cell mapping, especially front-foot relocation and the middle/low head/hip drop. It is a plausible ordering hypothesis, not an independently passed motion sequence.
- Original7 is already downswing with the bat down-right. Placing it BEFORE the new up-left PRE risks phase reversal. Placing it between PRE/contact also needs explicit row/foot evidence; it is not a universal missing inbetween.
- New POST positions differ by row. Low and middle POST→original9 is a plausible upward recovery step. High POST already has the hands/barrel as high or higher than original9; forcing original9 after it risks a small downward/backward beat. Do not force an identical cell list across rows merely for implementation symmetry.
- Original9 may reduce part of the POST→10 jump for low/middle. It does not supply the absent intermediate between fully extended early-follow and the wrapped shoulder pose10. Old10→11 also has a substantial bat/body reset; original11–13 are recovery, not interchangeable impact bridges.
- Raw alpha RGB fringes remain non-evidence by themselves. Judge source-over light/dark/checker composites; no actor fit, shifts, limb warps, crossfades or particle cover should conceal a mismatch.

## Freeze before a candidate

Record source hashes and one whole-cell canvas transform, exact per-row order and one-clock intervals, release/LOCK/impact/contact-hold/recovery deadlines. Keep prior meaningful minimum holds and all host deadlines. Inspect join frames on both sides, 0.5x/1x and all six host rates, each row, representative short/long freeze+slowmo grades, whiff/take, late callback/background resume, reduced motion/mute/fallback. Do not infer these from a GIF alone.

Before LOCK, changing accepted hidden target with all public inputs fixed must not change pose, asset request, scan or ball. At/after LOCK use the accepted saved result only, with one ball and continuous incoming/outgoing contact point. Inspect actual 568/667/844 and desktop same-state composition, not only isolated actors. Existing global blind quality gate and previous NOT_IMPROVED result remain binding; temporal evidence is additional.

## Counts

Contact generation remains 6/6 and bridge generation 5/5. This run does not authorize a new image call. Read-only annotation and order diagnostics do not consume a generation call or erase a failed candidate. A materially revised timing/order assembly submitted to validation is the next cumulative candidate of the same M22 motion issue; preserve the previous failed whole-feature assembly. Do not rename it as a new issue or infer a new visual-retry allowance from the scoped generation extensions. Reconcile the exact historical candidate count before implementation; this review does not invent an unused count.

If a source discontinuity remains after honest ordering, keep the feature HELD and record the exact missing predecessor/successor drawing. Public-course foundation already on main is not an implemented roulette or a production physical-plane approval.
