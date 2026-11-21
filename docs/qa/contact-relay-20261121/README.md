# Contact: narrow two-strike relay reward

Base: exact #153 `5014032d542300f0dac88efec2f04af4f1180e05`. Separate review; no merge or deployment. #153 bare overhead HP and hold-for-details preserved. Normal review new games remain Slugger-only; Contact is exercised through explicitly constructed normal-route QA saved checkpoints, not a newly unlocked starter or an unassisted campaign run.

## Actual choice

`twoStrikeRelay` / **끝까지 연결** is Contact-only, cost 1, usable at two strikes, one-cell single. A main-card hit advances existing runners at least three bases through the existing `advance` contract. It adds no HP damage, draw, foul guarantee, or new outcome/RNG rule. Misses can strike out. Covering more cells with Cut Master is safer but does not clear the bases. New card appears on the first modern Contact `단타 순환` reward opposite the existing `풀카운트 생존` branch; subsequent rewards and other kits are unchanged. Existing saved tableSetter reward remains claimable and labeled. Generic draft/shop pool excludes the new reward before RNG draws.

With one runner on second, generic runSignal/relay advances off, the same covered actual pitch gives:

| Primary / coverage | Bases after single | Runs | Shaken after next batter and reload |
|---|---|---:|---:|
| 끝까지 연결, main hit | Batter first; old runner home | 1 | 1 |
| Cut Master, covered hit | Batter first; old runner third | 0 | 0 |
| 끝까지 연결 misses its cell; Cut Master support hits | Batter first; old runner third | 0 | 0 |

Putting the new card in support behind another primary also does not grant its runner advance. In uncovered/outside cases it retains ordinary foul/whiff/take risk. No hidden actual pitch is used by forecast or precommit UI. Tests cover all nine covered cells and forecast normalization/hidden-state invariance.

## Exact playable artifact

`playable-build.zip`: **52,245,117 bytes**, SHA256 **4a38f2237b82479de1c36700b7292f752b2110ecb18198814c3cab8feaba6c5e**. Contains `dist/` with **634 files / 54,588,084 bytes**. Vite base `./`. Serve extracted `dist` over HTTP and open `/` without battle/test query. This is the normal campaign review build with the existing `9zone-normal-review-v1` storage namespace, not an offline file:// page. `dist-manifest.json` records every path. These exact extracted bytes were browser-tested. Source commit is the commit containing this document; later CI status is reported in the PR.

Keep the host's separately installed private `roster-v2/`, `slugger-motion-v2/`, and `slugger-cards-v1/` files. No real private candidate files are included. No new Contact actor/loader or sprite bytes; existing actor and existing relay card image are reused, not represented as new art.

## Evidence and validation

- Full suite: **275 files, 1,852 tests passed**. Runner-on-second fixture corrected from an invalid next-batter/runner identity collision before final pass. Earlier stale run failed that fixture; no engine workaround was made.
- Targeted Contact tests: **10 passed**, including primary/support restrictions, reverse support, single-base/full-base scoring, ordinary strikeout/foul risk, forecast parity, legacy reward, and subsequent shaken state.
- 100-seed public-information first-pitcher smoke; review + production builds; budget **52.1 MiB / 60 MiB**. Smoke is not full-run or human balance proof.
- Against exact #153: **300 generic drafts + 800 existing-kit actions identical** (`parity.json`).
- Exact ZIP Chromium gameplay: **15 cases** at 667×375, 844×390, 1440×900, normal/reduced motion. Hit, whiff, foul, take, support-only result data matched engine expectations; no page errors. Explicit checkpoints use seed 1, 2, 22; no claim of blind play.
- **3 progression cases**: actual next-batter button, shake preserved, reload/title resume; no generic advance in the second-base fixture.
- Both modern Contact reward branches claimed via real UI to map; old tableSetter saved reward claimed and resumed.
- Fresh normal Slugger title/pack/guide/map/battle flow and optional synthetic Slugger atlas: fresh, delayed load (no mid-flight actor swap), reduced motion/rotation. Normal review locks and production title policy unchanged.
- #153 keyboard hold-details focus/tab/escape and rotate/reload regression passed. Existing full suite covers pointer/touch hold behavior.
- `narrow-single.mp4`, `broad-cover.mp4`, `support-only.mp4` are actual UI recordings of the explicit checkpoints, uncut apart from encoding to 666×374, 15fps. All under 300 KB. Native 667×375 screenshots and 1-second rendered frame series directly inspected; card text and HP-only pitcher view retained. Desktop rotated hand-card/header overlap is pre-existing and unchanged.

## Remaining limits

Contact remains unavailable as a new normal-review starter by design; ordinary users need a legitimate existing Contact save to encounter its reward. This slice is a reward choice, not new Contact art or a claim of finished class balance. Physical Android was not tested; Chromium viewport emulation only. Existing fixed bat geometry at extreme pitch courses remains unchanged.

Separate pre-existing copy issue, deliberately not fixed: at two strikes after two prior fouls, Cut Master Contact floor is 2 HP; Wear Down's advertised +3 does not add to a zero fatigue base before the floor. Measured cut damage for prior fouls 0/1/2/5 = 4/3/2/2; with Wear Down = 7/6/2/2. `foul-copy-audit.json` records this. Shared foul rule and text remain unchanged in this PR.
