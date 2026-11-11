# Candidate 2 actual-host temporal and cue review

Reviewed the local frozen DEV host at `http://127.0.0.1:5397/?battleUi=vnext&courseReview=2` at 844×390. Ran zone 1/4/7 with the actual speed control at 0.5×, 1× and 2× (nine captured real-host videos, pose/source samples, screenshots and no page errors). Also ran an out-of-zone zone9 pitch with center aim as a deterministic whiff probe. Art, order, UI and repo files were not changed. The attempt is local diagnostic evidence only; it is not a fresh blind score or public-game approval.

## Path and speed observations

All nine rate/row samples visited the expected order: original0–4, the target-specific PRE path after LOCK, contact, the appropriate POST recovery, original9 early-follow, course9 late-follow, original10 wrap, original11–13 recovery. I saw no pose-order reversal or wrong-hand/bat discontinuity in the .5×/1× captures. Plant-to-PRE reads as coil and compression on the same stance. For the low target, high→middle→low preparation and low→middle→high recovery read in sequence with the bat moving from lag through contact into extension; no obvious foot slide appeared in the captured screen-size footage.

The revised POST→old9→late-follow→old10 path is directionally coherent at .5× and 1×. Original9 keeps the bat extended; the new late-follow visibly bends the elbows and lifts the joined grip/bat above the helmet; original10 completes the wrap across the shoulder. I did not see it reload for a second swing or reverse the bat path. The 80ms scheduled late-follow interval is materially easier to perceive at .5×/1×. At 2×, the sampled late-follow-to-old10 interval is about 33–63ms by row, and contact about 19–26ms; they are fast beats and may be hard to distinguish on some refresh schedules. Captured 2× sequences preserve the expected order and no contradictory backward pose was visible, but this speed is not strong evidence that each of those brief poses is independently readable. I do not infer a need for more art from this; any clock floor should be verified in the new renderer after the planned change.

## Confirmed first-source switch dropout

In the low-row 2× WebM, the batter is fully absent for successive captured frames around 3.10–3.20s and reappears around 3.25s. The event aligns with the first switch from `/assets/production-art/mockup-rebuild/batter-atlas.avif` (original4) to `/assets/production-art/batter-course-v1/batter-courses.webp` (course PRE). A separate visibility telemetry run shows the actor wrapper remained `display:block`, `visibility:visible`, `opacity:1`, nonzero size, and the source image reached `naturalWidth=3072`; it does not show a deliberate CSS hide or an empty source cell. This points to a first-paint/source-switch gap or capture/raster issue. The blank is also visible in the captured source video; it should be treated as a material defect until the persistent-layer/predecode renderer change is tested. I did not sample the new renderer. Evidence: `page@1071…webm`, `low2-3.00.png`–`low2-3.30.png`, and `actual-qa-dropout-check/report.json` in this directory.

## Whiff probe

The zone9 outside-pitch/center-aim case completed the same swing pose sequence without browser errors. Engine odds for zone9 are an automatic whiff, but this capture script records poses and visible screen only, not the final structured outcome; I therefore cannot confirm the result label or classify it as a passed whiff-feedback UX check. The take path was not exercised.

## R7 information hierarchy critique

This is a cue critique, not a re-score. At 844×390, several elements compete: the 3×3 zone panel occupies a large area over home plate; a bright “읽었다!” callout sits above the pitcher; a glowing ball/aim trail draws attention near the center; and the right-side explanation card contains small, dense Korean text. The primary result (“정확 적중” plus result type) is less prominent than the floating callout and the grid. In the captured whiff probe, the out-of-zone mark and small status copy are especially difficult to distinguish from the board at a glance. A single clear outcome near the target/ball path, with the grid/trajectory as supporting cues and reduced competition from the oversized callout, would improve the hierarchy while retaining the art. This aligns with the sealed R7 decline without repeating its numeric score.

## Decision

**HOLD candidate 2 host rendering** because of the captured batter disappearance at the first AVIF→WebP switch. **Qualified temporal PASS for source order at .5×/1×**, and a qualified but brief 2× read: no backward jump was observed, while contact/late-follow readability is limited at 2×. The new late-follow pose is the right in-between; no additional drawing is indicated. Re-run cold-cache actual-host QA after the renderer change, including all target rows/rates and a real whiff/take result assertion. The separate sealed blind NOT_IMPROVED verdict remains controlling for product release.
