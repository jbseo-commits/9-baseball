# Bridge source-set review

**Checkpoint: HOLD the PRE bridge; POST is provisionally usable as static source art.** No complete PRE→contact→POST motion set passes the current fixed-registration review. This is not a production-motion or plane approval.

The review gallery is `bridge-calls-review-gallery.png`. It shows the three generated bridge calls on light composites, followed by unmodified atlas crops for original frames 7–9. Each candidate is shown as supplied, with a single common canvas mapping and no per-pose fitting.

## Bridge calls

| Call | Source | Independent registration outcome |
|---|---|---|
| 1 — PRE | `bridge-pre-source.png`; metrics in `bridge-pre-feet.json` | **FAIL.** High: rear IoU .559 / drift 11 px; front .250 / drift 73 px. Middle: .711 / 11 px rear, .337 / 56 px front. Low: .480 / 14 px rear, .386 / 38 px front. All three poses fail the fixed-foot gate. |
| 2 — POST | `bridge-post-source.png`; metrics in `bridge-post-feet.json` | **PASS for static feet.** All six patches pass; minimum IoU .851, maximum toe/sole boundary drift 3 px. The composites show a consistent batter, two-hand grip, and post-contact bat follow-through progression. This does not establish animation continuity or runtime readiness. |
| 3 — corrected PRE | `bridge-pre-corrected-source.png`; metrics in `bridge-pre-corrected-feet.json` | **FAIL as a three-pose set.** High passes (rear IoU .956 / drift 1 px; front .909 / 2 px). Middle fails (rear .558 / 16 px; front .686 / 15 px). Low fails (rear .544 / 16 px; front .653 / 17 px). The mid/low characters visibly shift within the fixed cells. |

The corrected PRE’s high pose meets the foot gate, but its middle and low poses do not. Keeping the high pose alone would not provide a PRE progression across the planned sequence. Do not move either pose or foot target independently to rescue the failing rows. The previously reviewed contact triplet (attempts 4–6) remains a static contact-source PASS; that does not cure the missing registered PRE.

## Existing approved atlas poses

I reviewed the actual 14-cell source at `assets/production-art/mockup-rebuild/batter-atlas.png`, including original frames 7, 8, and 9. Frame 8 is the registered contact pose. Frame 7 is an adjacent low/downward-bat swing transition and could be considered as one generic neighboring beat if the sequence timing supports it; it cannot replace the missing three-pose PRE set. It is a single pose, does not demonstrate row-specific PRE coverage, and its lead-foot placement differs visibly from frame 8. Frame 9 raises the bat into follow-through after contact and is not a PRE substitute. The remaining atlas drawings are load, plant, or follow-through poses rather than registered high/middle/low PRE variants.

This review does not rule out using frame 7 later as an unmodified transition between a valid PRE sequence and the registered contact pose. That would need an explicit sequence review; it should not be inserted automatically or treated as a replacement for the failed PRE set.

## Preservation and limits

This review added only `BRIDGE-SOURCE-SET-REVIEW.md` and `bridge-calls-review-gallery.png` under the external workspace. I did not edit `CANDIDATE2-REVIEW.md`, `CANDIDATE3-SOURCE-QA.md`, any repository file, or any source artwork. The corrected PRE and POST metric JSON files are referenced as supplied.

These checks cover static pose registration and visual source consistency. They do not approve continuous motion, hit timing, swept contact, the proposed physical plane, or game integration. The missing PRE registration remains a concrete authoring gap.
