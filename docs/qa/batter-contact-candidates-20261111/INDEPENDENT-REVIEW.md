# R4 external batter contact candidate 1 — independent review

**Status: HELD.** Read-only visual and pixel measurement review; this is not a blind score or commercial-quality verdict. No files were edited and no candidate-to-runtime/world contact is approved.

## What reads well

I inspected the source sheet, all three unpacked source cells, and `contact-authoring/reference-standard.png`. They retain the same adult male batter, navy helmet, cream/navy/gold uniform, side camera, and right-handed stance. Each has one bat held with both hands; the hands stay together on the grip, with no obvious arm/hand swap or duplicated prop. The shoes use a stable rearfoot: candidate local rearfoot band is x=128–232, 129–233, and 128–233, all ending at y=642. The front shoe shifts about 6–9 source pixels in the low candidate, so stance-base registration should be checked during any later pack step.

The bat is clearly distinguishable at three heights. Measured barrel-band y ranges are 229–264 (high), 301–337 (middle), and 391–427 (low); centers are 246.5, 319, and 409 source pixels. The lower pose also bends the knees and drops the torso, so the set does communicate a progression rather than three copies with a moved bat.

## Why it is held

Using the plan's single scale (0.711462) and anchoring the shared rearfoot band to the standardized baseline foot `(284.5, 559.2)` yields a provisional common-foot comparison. It requires only one shared scale and a foot translation for all cells; no per-pose fit or warp. Converting the plan's three target rows through its stated world-to-atlas and atlas-to-standard formulas puts their y positions at approximately **351.0, 400.3, 449.0** standard pixels. The three candidate barrel centers under that same mapping land at approximately **277.9, 329.5, 393.3**. Each barrel is therefore about **73, 71, and 56 standard pixels above its corresponding target row**. The row-to-row spacing is broadly similar, but the whole authored reach set sits too high relative to the established foot. The low pose is visibly lower than the other two yet still does not read as low enough for the mapped low row. This makes the sheet a useful feasibility attempt, but it fails the current fixed-foot/target-height comparison.

Horizontal reach looks less problematic in that same provisional comparison. The target row x values map to about 541.7, 573.4, and 605.3 standard pixels. Candidate barrel spans begin near x=537 after foot registration; their tips land around x=634, 627, and 612. Thus all three x positions fall within the broad barrel span, although the low pose leaves only about 7 standard pixels past the rightmost target to its tip. This is a diagnostic bounding-span check only; the y mismatch prevents a contact-overlap pass, and no physical plane is approved.

At alpha ≥64, the full candidate silhouette boxes are 543×549, 534×526, and 512×486 source pixels, versus the plan's 506×462 source subject box for the baseline. Under the plan's common 0.711462 scale these become about 386×390, 380×374, and 364×346, compared with the baseline's 360×329. Some height difference is intended crouch/action, but the high/middle poses are notably taller overall. Do not shrink frames independently; review head, hands, torso, and feet at one common scale before accepting a redraw.

The source render also shows bright red/yellow fringe pixels around some contours and detached faint specks against transparency. They may be generation artifacts or effects, but they need inspection against both dark and light backgrounds before extraction/packing. Keep the original sheet and distinguish cleanup from redrawing.

## Review decision

Keep candidate 1 as an external reference only. For any candidate 2, preserve its recognizable identity and two-hand grip while lowering the hand/barrel reach relative to the same planted foot: roughly 55–75 standardized pixels across the three respective rows is the current diagnostic gap. Recheck barrel dimensions against the baseline at the same transform, especially the low pose's short remaining x margin. Inspect alpha fringes and detached specks. Then rerun the common-foot mask comparison for all nine mapped points and the outside point.

This report cannot validate world-space overlap or approve physical geometry: `PLAN.json` labels the target plane a hypothesis, and the candidate cell-to-atlas registration has not been approved. No runtime/integration, transition-motion, or quality verdict is made.
