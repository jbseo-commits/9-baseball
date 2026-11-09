# R1 shop candidate — independent same-baseline verification

Candidate: 24 added lines in `src/duel/stop-readability.css`, served at http://127.0.0.1:5350/. Product/test files were not edited by this reviewer.

## Verdict

PASS for the R1 shop fix and scoped regression checks. No new regression found. Existing short-screen compression in other facilities remains separately recorded below.

## Shop visual and input checks

The exact validated seed2 fixture from `../shop-before/fixture.json` was resumed through the normal title Continue UI. Five landscape sizes: 568×320, 667×375, 844×390, 1280×720, 1440×900.

- Card rows now149.5/154.3/156.2/199.1/215.5px; relic rows74px at every size.
- Asserted every product name and effect description stays within its own item rectangle, minimum item height70px.
- Real registered relics display one art icon with fallback badge hidden. The missing-registration branch was tested separately through a QA-only intercepted JS response; it displays no icon and one52px 2X badge inside the74px tile.
- All confirmation/skip buttons fit the viewport.
- Actual CDP touch swipes scroll only the offer list at small sizes (0→145/228/131px), without page movement. Larger sizes fit the complete list without needing scroll.
- Actual keyboard Tab reaches the last awayBadge offer and then confirmation button at all five sizes. Inspection/navigation preserves the exact saved game.
- Actual first-card confirm, last-relic confirm, and skip at568×320 each return to map. Full stored state deep-equals the actual engine option resolution, with storage validation passing.
- No page errors. The568×320 candidate screenshot was visually inspected against the before image.

## Other-facility regression comparison

Training, locker, rest and reward states were generated using legal engine actions, then validated. At568×320 and1440×900, each was loaded with the actual old HEAD CSS browser response and with the candidate CSS. All eight final geometry comparisons deep-equal (root/offer viewport/items/name/effect/actions/page position).

Reward reveal initially sampled at1200ms had different intermediate flip transforms. It was rechecked after2000ms, beyond the final normal reveal; both sizes then match exactly. The original transient measurements remain in `gestures-facilities-initial.json`, with corrected stable comparison in `reward-stable.json`. This was a QA timing issue, not a product regression.

Existing short-screen failures were not treated as successes: training/locker still have14px card rows and rest22px rows at568×320, in **both** old and candidate CSS. They are outside the scoped R1 shop fix and should be addressed separately.

## Evidence and reusable helpers

- `report.json`, `shop-WxH.png`, `shop-WxH-last.png`: same-case before/after metrics and screenshots.
- `actions-fallback.json`, `actions-fallback.cjs`: exact engine/save outcomes and actual fallback branch.
- `gestures-facilities.json`: final five-size assertions, touch/keyboard, and eight stable facility comparisons.
- `gestures-facilities.cjs`: reusable external QA helper; `QA_REWARD_ONLY=1` performs stable reward rechecks.
- `other-fixtures.json`, `make-other-fixtures.mjs`: legal engine fixture provenance.
- `shop-WxH-keyboard.png`, `{facility}-WxH-{baseline,candidate}.png`.

## Limits

Chromium emulated touch/keyboard, not physical phone/Safari. Fixture-based normal-save continuation is distinguished from manual full-run playthrough. Current legal shop relics all have art, so fallback is explicitly a QA simulation. No claim of broad visual redesign or correction of the existing other-facility defects.
