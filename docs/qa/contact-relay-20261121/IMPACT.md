# Contact two-strike relay — implementation impact
Final base: #153 5014032d542300f0dac88efec2f04af4f1180e05. Initial pre-edit audit was on #152; checkpoint rebased without changing #153. Separate draft; no deployment.

Pre-edit audit: Contact has broad singles/cut survival. Immediate draw 2 was rejected after reviewer measured only 0–1 retained card beyond automatic next-batter refill. One narrow two-strike single instead advances existing runners three bases through the existing `advance` contract, with ordinary uncovered/outside strikeout risk. No new engine outcome or RNG.

| Axis | Impact / mitigation |
|---|---|
| UI/layout | Existing card face and branch label; inspect 667×375, no layout changes |
| Input | Existing card/main/support/zone controls; test condition and class rejection |
| Rules/balance | New Contact reward only, 2S one-cell single/runner clearance versus broad cut; forecast/resolution parity and genuine strikeouts |
| Save/load | Stable new card ID; old saved tableSetter rewards remain claimable/labeled; no schema/earned flags edits |
| Mobile | Actual small landscape and desktop combat, rotation |
| Scroll | No CSS/overflow changes; ordinary route regression |
| Flow | First Contact reward pair changes, starter lock and other classes unchanged; checkpoint clearly labeled |
| Tests | New reward isolation, main/support constraints, runner moves, forecasts, foul/miss, legacy rewards; full suite/smoke |
| Build | Review and production build; exact extracted artifact, delta against #153 preserving private optional files |

Art: no new approved Contact contract supplied, no new loader or candidate bytes. Existing approved actor/family card artwork only. Existing Slugger optional atlas/card/roster paths preserved.

## Historical paused checkpoint (superseded by final README)
Owner's new pitcher long-press priority supersedes current scheduling. Work preserved only on Contact branch, not shipped. Initial full suite found three catalog/fixture assumptions (old total155, generic unconstrained attacks, excluded family master); corrections prepared, final suite/art mapping still must be rechecked/rebuilt. Fourteen extracted-build combat cases, reward claim/legacy resume, Slugger optional atlas flow and800 unchanged old-kit actions were exercised. Art map added afterward: existing relay image explicitly reused; no new image. Current ZIP is not final. No PR/overlay created for Contact.

## Resumed after #153
Rebased checkpoint onto exact5014032d542300f0dac88efec2f04af4f1180e05. Preserve long-press/HP-only HUD. No Contact starter unlock or sprite loader. Additional audit: runner on second without generic advance, support-only hit, actual bases and subsequent shaken state. Existing Cut Master/Wear Down copy discrepancies are documentation-only; shared foul rules stay untouched.
