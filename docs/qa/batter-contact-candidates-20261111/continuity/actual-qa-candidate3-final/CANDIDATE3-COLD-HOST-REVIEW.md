# Candidate 3 cold-host rendering and swing review

Reviewed the frozen local DEV host at 844×390 using fresh Chromium contexts, route `?battleUi=vnext&courseReview=2`, and the actual visible animation-speed selector. The 18-case matrix covers zones 1/4/7 at 0.25×, 0.5×, 0.75×, 1×, 1.5×, and 2×. Each case starts with a new browser context/cache. The three 0.25× clips were extended to include full recovery; the initial shorter capture had stopped before old9–13. Separate visible-control probes captured one whiff and one take. Evidence (videos, screenshots and JSON samples) is in this directory and `actual-qa-candidate3-slow25` / `actual-qa-candidate3-outcomes-final`.

## Cold first-paint/source switch

Across all 18 matrix cases, the RAF telemetry found exactly one visible batter atlas layer at each sample, matching the current pose family. That visible layer remained `display:block`, `visibility:visible`, `opacity:1`, nonzero size, `complete=true`, with decoded natural size 3072×2304 for the course atlas. There were no page errors, missing poses, wrong visible layers, or visible-but-undecoded images in the saved samples. The extracted low-row 2× host clip at the original AVIF→course-WebP transition shows the batter continuously through the first PRE frame; the blank gap captured in candidate 2 did not reproduce. This is a qualified technical pass for the tested fresh-context renderer path, not a claim about every browser/device/cache state.

## Sequence and speed

The visible phase chain is preserved across all rows and all six rates: original0–4, row-specific PRE(s), contact, row-specific POST(s), original9 early-follow, course9 late-follow, original10, and original11–13 recovery. At 0.25×, all three extended captures reached original13 and ready. At .5× and 1× the full bat path reads as one action: plant/coil, height-ordered preparation, contact, rising extension, late-follow, wrap and recovery. The feet show no visible pop or slide at the rendered viewport, and the grip does not swap or detach. I saw no backward return to load. At 2× the phase holds are brief—contact is roughly 21–34ms by row, late-follow roughly 33–50ms—but the sampled order and captured low-row clip remain directional; the speed makes individual poses harder to parse, rather than showing a contradictory swing.

The new late-follow is between old9 and old10 in all applicable captures. At .5×/1× it reads as the expected connected wrap; at 2× it is a quick beat. I do not identify a need for another drawing from this host QA.

## Landed-outcome probes

The first out-of-zone swing probe used zone9 with roll .01 and produced `foul` / `파울` (the zone9 foul branch), not a whiff. Do not cite that attempt as a whiff pass or as evidence of physical ball/barrel contact: the zone9 foul location is outside the approved 3×3 rendered-barrel registration, so physical contact there remains unvalidated. The corrected zone9 roll .5 visible-swing probe captured the first landed result before auto-next as `whiff` / `헛스윙`, with one strike and the `course-4-late-swing` pose (not the contact pose). The visible watch-control probe at zone9 captured `ball` / `볼`, zero strikes, and no batter swing sequence. These checks confirm the host can route both selected outcomes into distinct visible actions; they do not validate a physical plane or all foul locations.

## R7 cue critique

At 844×390, the large 3×3 grid at home plate and the bright “읽었다!” callout above the pitcher compete with the ball/aim glow. The right-side Korean outcome/explanation text remains small and dense relative to those bright cues. The primary result could be clearer if it were visually grouped with the target/ball path and given stronger weight than the floating callout, with the zone grid kept as supporting context. This is a hierarchy observation only; the blind panel’s NOT_IMPROVED result remains controlling.

## Decision

**PASS for the candidate 3 cold first-paint path, tested pose ordering and visible-control whiff/take routing. HOLD motion/product approval.** Contact holds and late-follow remain quick at 2×; zone9 foul contact is outside the registered 3×3 evidence; reduced-motion, a full missed-swing variant matrix, and device/browser diversity were not covered. Most importantly, the sealed candidate 3 blind review is NOT_IMPROVED, so this local technical pass does not authorize production activation.
