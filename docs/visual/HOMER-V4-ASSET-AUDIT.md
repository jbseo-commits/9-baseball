# Home Run V4: asset audit and shot acceptance gate

## Existing assets verified in repository
- `assets/production-art/phone-assets-v18/A01-homerun-batter-9.png`: batter cutout, NOT a full shot
- `assets/production-art/phone-assets-v18/A02-homerun-stadium-plate.png`: stadium background, NOT outfield wall
- `assets/production-art/phone-assets-v18/A03-homerun-ball-trail.png`: trail overlay, NOT a tracked ball camera shot
- `assets/production-art/phone-assets-v18/A07-ending-batter-9.png`: ending pose, NOT home-plate celebration
- `assets/production-art/phone-assets-v18/A08-ending-stadium-plate.png`: ending background
- `assets/production-art/mockup-world-v15/homerun-scene.png`: legacy scene; verify perspective before reuse
- `assets/production-art/battle-portrait-v15/batter-contact.png`: contact pose
- `assets/production-art/battle-portrait-v15/batter-follow-through.png`: follow-through pose

## Required six shots
| Shot | Camera and action | Source status | Acceptance |
|---|---|---|---|
| 01 CONTACT | behind/side home plate, #9 strikes ball | existing batter/plate usable as source, composite needed | bat-ball contact physically legible |
| 02 LAUNCH | side profile, ball leaves bat into fair territory | missing dedicated full-frame art | ball direction and continuity clear |
| 03 OUTFIELD | camera behind outfielder facing fence; ball above field | missing dedicated art | not another batter closeup |
| 04 WALL CLEAR | wall-level camera; ball visibly passes OVER fence | missing dedicated art | no trajectory through spectators |
| 05 HOME RUN | scoreboard or wide stadium payoff, no batter repeat | missing dedicated art | legible score and result |
| 06 HOME PLATE | low home-plate angle, #9 touches plate, teammates nearby | missing dedicated art | NOT reused ending pose or dugout scene |

## Hard gates
1. Do not represent zooming a single stadium plate as different camera angles.
2. Do not use procedural gradients, stripes or a white dot as finished shot art.
3. Use only one coherent full-frame image per shot, no split-screen collage.
4. Each shot needs a distinct camera position, subject and spatial context.
5. Ball travels home plate -> fair outfield -> above fence -> outside field, never across the stands.
6. Record art provenance and approval for every shot; missing art means NOT READY, not a fake preview.
7. QA should show shot name, current art status and replay controls. No merge to main before user visual approval.

## Implementation status
- This branch contains the V3.1 prototype inherited from V3.
- This document is an asset audit and V4 gate only, not an implemented V4 preview.
- The prior images generated in chat are not automatically committed as binary assets to this repository.
