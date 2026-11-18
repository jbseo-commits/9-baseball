# G030 PR124 swipe rule check — correction 1

Read-only probe of the candidate implementation in `review/pitch-swing-prototype-20261118`.

## Identity and setup

- Source commit: `06aa22d`; current candidate branch head: `92a583942eb07a1be13f124620dfdc52af13561c`.
- The prototype module's Git blob SHA-1 is `344115b6bc26786768b32b78b3499a9aad36f337` at both the source commit and branch head. Its SHA-256 is `55e36fc51e5636fe6663fa29badfd6e9b026a86e668119599f69d2ef0aa05f35`.
- The trajectory module's Git blob SHA-1 is `a339c593958db339b8cc803038f7fe866e355045`; SHA-256 is `fb6cb3654cce31ac389a65c1d72dcec720c0f4a3dfa56deeacb45ffdffd6505b`.
- Probe descriptor is synthetic: release `(800,350)`, target `(550,700)`, release time `1317`, impact `1617`, 300ms flight, seed `23`. It is not a calibrated current UI or batter target.
- Each profile sampled every integer contact time from release through impact +700ms (1,001 samples/profile). Same descriptor, target, and contact time were supplied for small, medium, and large. Starting strikes were 0, 1, and 2; score started at 0.

## Result

Across fastball, slider, and curve, all three swipe sizes had identical ball position, distance, timing error, and contact eligibility. The model uses a 22-world-unit circle and size multipliers small `1`, medium `1.5`, large `3`; size only changes the contact result/score rule. Of 3,003 geometry/time comparisons, none differed by swipe size. Across 27,027 outcome evaluations (three starting-strike states), there were no cases where a smaller swipe had a higher prototype score or fewer strikes than a larger swipe.

This is **weak conditional dominance**, not strict dominance at every sample: misses tie. In the 36 contact samples for this synthetic descriptor, medium scored 150 and large scored 300; small overlap was a zero-point cut-foul. The contact-time windows were the same for all sizes: fastball −7…+7ms, slider −5…+4ms, curve −5…+5ms relative to impact. These are only this descriptor's computed windows, not current UI-calibrated or live-game windows.

The model has no swipe duration, effort, latency, motor error, or live-engine reward cost. This result does not establish which gesture a person should choose or that large is generally best.

## Timing clarification

With 300ms from release to impact and 160ms lead from pointer release to bat contact, the input deadline is **140ms after pitch release**, which is **160ms before contact**. At that time this sampler's slider is already +34.95 world units laterally from fastball, and the curve is −105.53 world units vertically from fastball. Therefore a player cannot see the entire trajectory before committing, but early profile differences are already present; this probe does not establish human recognition or reaction performance.

## References

- `src/duel/battle-vnext/pitch-swing-prototype.js`: multiplier, contact radius, actual contact sample, small cut-foul and scoring rules (source lines 3–7, 33–50).
- `src/duel/battle-vnext/pitch-trajectory.js`: sampled synthetic profiles and flight.
- Machine-readable result and reproducible evaluator: `result.json`, `evaluate.mjs`; execution output: `run.log` (explicitly tracked despite the repository log ignore rule).
- The original uncorrected probe remains preserved in the parent `/tmp/g030-swipe-dominance/` directory.
