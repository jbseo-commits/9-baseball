# HOME RUN CUTSCENE V3 — Shot-by-shot rebuild

Status: DESIGN LOCK / DO NOT MERGE V2

## Why V2 is rejected
Phone QA showed a collage instead of one continuous baseball event: batter and field split into separate visual halves, the ball has no readable origin/destination, the camera never transfers attention from contact to flight, and HOME RUN behaves like UI rather than the climax.

V3 does not reuse the V2 composition. Existing A01/A02/A03 are reference only.

## Non-negotiable visual grammar
Every result cinematic preserves physical continuity:
contact point -> ball launch vector -> camera handoff -> flight landmark -> result confirmation.
No decorative trail may contradict bat/ball direction. No hard seam between actor art and stadium art. The baseball remains the visual subject after contact.

## SHOT 01 — CONTACT / 0.00–0.28s
Tight three-quarter camera on #9 batter and home plate. Bat and ball meet at one readable contact point. Ball starts at the barrel. Compact impact flash cannot hide bat angle. Freeze 2–3 frames. Exit vector is explicit. No HOME RUN text.
Acceptance: a still frame clearly shows ball, barrel, contact point, outgoing direction.

## SHOT 02 — LAUNCH / 0.28–0.62s
Camera leaves the batter and pans/tilts into the ball path. Batter exits composition naturally, not by crossfading against another image. Trail begins only after ball separates from bat. Perspective matches SHOT 01.
Acceptance: first/last frames connect spatially to SHOT 01 and SHOT 03.

## SHOT 03 — BALL TRACK / 0.62–1.15s
Ball is the hero. Camera tracks it across sky/outfield. Trail follows actual trajectory. Landmarks/parallax establish distance and direction. Support pull / center / opposite. No HOME RUN declaration yet.
Acceptance: direction is identifiable without text.

## SHOT 04 — WALL CLEAR / 1.15–1.52s
Reveal wall/foul pole/stands as distance reference. Ball visibly clears wall on the same trajectory. Crowd/light response begins only after clearance. Camera eases rather than teleporting.
Acceptance: viewer understands why this ball is a home run.

## SHOT 05 — HOME RUN PAYOFF / 1.52–2.25s
Only now display HOME RUN. Full-frame payoff, not a bottom verdict card. Score/runner consequence follows title peak. Hold, then return to review.
Acceptance: title is the climax of the baseball event.

## Direction contract
The cinematic accepts a semantic exitDirection instead of baking one composition: pull, center, opposite. Later hit/extra/foul cinematics should share this contract.

## Architecture
Use a dedicated cinematic director/state machine for these five shots. Game outcome calculation remains untouched. Engine provides result + exitDirection; cinematic only presents it. Art layers and camera transforms belong to each shot, not one giant static takeover image.

## Mobile QA gates
Primary 412x743. Also 844x390 and 1440x900.
For each shot capture first/middle/last frame and verify: no actor/HUD/9ZONE leak, no seam, no crop of contact point, ball readable, trajectory continuous, document height unchanged.

## Production order
Do not build all art at once.
1. Implement SHOT 01 only.
2. Expose ?qa=homer-v3&shot=1 for instant replay.
3. Mobile-review SHOT 01.
4. Only after approval build SHOT 02.
5. Repeat through SHOT 05.
6. Wire approved sequence to real home-run results.
7. Retire V2 only after V3 full-sequence QA.

## Current decision
V2 visual QA: REJECTED.
PR #17 remains unmerged.
Next implementation target: SHOT 01 CONTACT only.
