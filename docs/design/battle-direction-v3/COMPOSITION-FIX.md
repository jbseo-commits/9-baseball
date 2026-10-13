# Composition correction — impact before implementation

User finding: the batter does not stand inside the drawn batter's box and the field composition is wrong. Accepted as a real visual regression; prior functional QA did not establish spatial correctness.

Root causes observed: stadium uses `background-size:100% 100%` at different aspect ratios; mobile changes actor anchors separately; plate/box baked into art do not share actor coordinates; camera transforms actors without transforming the stadium, sliding feet across the ground; field footer obscures part of the baseline.

## Nine-axis assessment

| Axis | Classification | Response before coding |
| --- | --- | --- |
| UI/layout | Impact | Fix a 1280×720 (16:9) stage; render stadium, authored ground markings and live actors in one camera world. Both feet must lie inside the left batter's box, plate beside him, pitcher stance on rubber. |
| Input | No intended change | Keep existing buttons/card/zone controls. Inspect portrait and short-landscape reachability after scene height changes. |
| Logic/balance | No rule change; visual verification required | Keep V10 actions and hit clock. Derive plate from the batter's shared contact geometry; inspect swing/contact/foot positions, including DOM fallback. |
| Save/load | No impact | No storage changes; original entry remains separate. |
| Mobile | Impact | Uniform stage scale, no independent mobile actor repositioning or stretched art. Verify 390×844 and 844×390, no horizontal overflow. |
| Scroll | Impact | Scene height follows width plus separate status strip. Existing scene-return and fixed action controls retained; inspect scroll after commit. |
| Existing flows | Verification required | Shared renderer behavior must remain opt-in; full suite and original-entry smoke. |
| Regression | Impact | Add geometry tests for feet-in-box, plate beside feet, contact above plate, pitcher/rubber anchor, uniform scale; targeted actor/UI tests, full suite and report. |
| Build/deploy | Impact | Replace one background within existing asset budget; production build and same local preview URL. |

## Planned art and geometry contract

- Edit only the original stadium's foreground plate and chalk out using builtin ImageGen. Keep its environment and mound; root integrates the selected compressed artifact.
- Use real vector field markings (chalk rectangles and pentagonal plate), not approximate background art, to make the relationship deterministic.
- The canonical batter cell is placed beside the plate. Existing sprite/rig/pitcher identity and authored motion remain. Verify actual opaque foot bounds, not just the sprite rectangle.
- Camera motion must move the entire field together. Every responsive screen must show the same composition and aspect ratio; no actor-only zoom or aspect stretching.

Plan review requested from independent reviewer before implementation. Root is the only source writer.

## DOM contact follow-up — impact checked before coding

Actual contact capture exposed a renderer mismatch: the fallback ball uses a fixed 6px diameter against Pixi's actor-scaled radius, and advances immediately while Pixi holds the hit for 90ms. UI/motion, mobile readability, regression tests and build are affected; add the same radius and hit-stop to the fallback clock. Input, rules/probability/consumption, save/load and scrolling are unchanged. The same actual engine result still commits at the impact milestone; settling waits for the visual hold. Existing flow verification and final production responsive capture remain required.

## Final implementation and evidence — 2026-10-11

Ground markings use one homography in src/hybrid/geometry.js: equal 4×6ft boxes, 6in plate gap, 17in home plate and 60.5ft mound distance. Plate's straight 17in edge faces the pitcher; catcher-facing point is at the origin. Dimensions/orientation checked against [MLB official rules, field diagram](https://img.mlbstatic.com/mlb-images/image/upload/mlb/ub08blsefk8wkkd2oemz.pdf). Opaque shoe pixels across authored poses stay inside the left box; contact uses the actual barrel pixel in the runtime sheet. One camera transforms the entire world.

Follow-up user finding about page scrolling supersedes the initial width-only scene layout: fit uniformly in both available dimensions, with no independent actor movement. All four production viewport checks and actual frame19 contact are recorded in QA.md. DOM and Pixi share opt-in contact geometry and a 90ms hit stop. Independent review found no P1/P2 blocker after correction.
