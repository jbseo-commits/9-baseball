# Contact two-strike relay — implementation impact
Base: #152 b38f5214522b09d7628b7a604496b3c751caa06d. Separate draft; no deployment.

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
| Build | Review and production build; exact extracted artifact, delta against #152 preserving private optional files |

Art: no new approved Contact contract supplied, no new loader or candidate bytes. Existing approved actor/family card artwork only. Existing Slugger optional atlas/card/roster paths preserved.

## Paused checkpoint
Owner's new pitcher long-press priority supersedes current scheduling. Work preserved only on Contact branch, not shipped. Initial full suite found three catalog/fixture assumptions (old total155, generic unconstrained attacks, excluded family master); corrections prepared, final suite/art mapping still must be rechecked/rebuilt. Fourteen extracted-build combat cases, reward claim/legacy resume, Slugger optional atlas flow and800 unchanged old-kit actions were exercised. Art map added afterward: existing relay image explicitly reused; no new image. Current ZIP is not final. No PR/overlay created for Contact.
