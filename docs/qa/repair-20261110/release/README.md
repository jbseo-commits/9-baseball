# Independent deployed release verification

Target: https://jbseo-commits.github.io/9-baseball/ . Actual public Chromium navigation and browser fetch, not localhost. Expected release main1317119, PR97shop and PR98rest. Product/test files and external application state were not modified; only isolated browser localStorage/sessionStorage held QA games.

## Verdict

PASS for the affected deployed shop/rest flows and the normal entry/rotation sample. No page errors or HTTP asset errors recorded in the executed browser cases. R3 remains held and is absent from this release.

## Release identity

The public GitHub Actions API confirms Pages run42719887182 completed successfully with head SHA `1317119b52ad076b120e7191a985956f933f0730`.

Actual loaded assets (HTTP200), full SHA256 in report.json:

- `assets/index-5Jd0MGvB.js` — sha256 `4411d8d899fd9737742667929773673f221b756766f916ad613137dda6b81d6a`
- `assets/index-yqkr4yA7.css` — sha256 `6d0fcddbc25f217e4b738923a4d0b4c5054c4e6839fc4d550a21ab2fd52e2f81`

The loaded JS contains recovery/upgrade/back test markers and the final short rest copy. The loaded CSS contains shop intrinsic rows. None of the entry assets contains `bv-hand-flow`, and an actual new game's first battle has the previous folded hand, consistent with R3 not being deployed.

## Actual normal new-game sample (no utility fixture)

At667×375: title → new seed3 → power pack → map → first battle → manually open hand and place card/center-zone plan. Rotate portrait then back landscape: full game save and placed card remain identical. This verifies actual initial routing and rotation, not a manual full-run completion.

## Actual deployed shop

The same validated engine-generated shop state from ../shop-before/fixture.json was resumed through title Continue. This fixture provenance is deliberately distinct from normal progression.

At568×320,844×390,1440×900:

- Five actual offers appear with meaningful heights (cards149.5/156.2/215.5px, relics74px).
- Names/effects fit their own item boxes, and registered relic fallback marks are hidden.
- Wheel scroll reaches last content where needed; footer remains inside viewport.
- Last awayBadge offer can be selected, deselected, selected again and confirmed.
- Full actual saved result equals the current released engine option resolution and returns to map.

The568×320 last-offer PNG was visually inspected.

## Actual deployed rest

Same validated diagnostic runOuts2 rest fixture used in local before/after QA, resumed through real Continue at568×320:

- Recovery selection/cancellation does not save; confirmation changes2→1 and leaves cumulative stats.outs0 and deck unchanged.
- Upgrade mode → choose the second duplicate place → Back preserves save and clears selection. Re-enter and confirm changes only IDc1, keeping runOuts2.
- Full committed saves equal completeV10UtilityNode, pass validation, and survive actual reload/Continue.
- Enter the actual reachable next battle through map UI: full state equals enterV10Node and battle.outs starts at1 for recovery and2 for upgrade.

The recovery selected PNG was visually inspected. New-game path and these fixture-driven utility checks are labeled separately in report.json.

## What was not repeated on production

Other facilities' unchanged-layout evidence remains the prior local4facilities×2sizes baseline/candidate comparison at ../shop-validated/gestures-facilities.json. It is not a fresh deployed regression test. Missing-art fallback, disabled/rest edge cases, reduced motion and broad local tests were not repeated against production here. No physical Safari/phone, sound listening or full-run balancing is claimed.

## QA harness corrections

The initial APIRequest path chose unreachable IPv6 while actual Chromium navigation worked; bundle/API reads were rerun through Chromium fetch. The initial utility helper also reinjected its fixture on every reload, invalidating that reload test. It now seeds once per tab, so real saved outcomes survive reload. These were QA transport/setup mistakes, not product defects. `initial-harness-run.json` preserves them; `retry-report.json` records the corrected bundle/rest run; final report.json consolidates successful actual cases and explicitly records both corrections.

`check.cjs` is the reusable external procedure. `QA_FINAL_RETRY=1` reruns bundle/rest only; a normal invocation runs all cases with the corrected one-time seeding.
