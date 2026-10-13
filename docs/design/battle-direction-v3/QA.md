# Hybrid battle verification — inline portrait correction, 2026-10-11

## Current popup-free correction

981/981 tests across167 files passed;33/33 hybrid tests also passed after the final CSS change. Production build and56.3/60MB budget passed. Original20-seed smoke passed with16 rewards and1 win. No engine, actor geometry or original route/storage changes in this correction.

The9-zone section stays mounted in every orientation. Portrait uses44×44px targets with no course dialog, beside the selected MAIN/SUPPORT strip and actions. Manual actions cancel spectator playback; the spectator can still execute its own preparation and pitches. Dedicated regressions verify both paths.

Production browser at localhost4322,seed90210: scout preparation→MAIN7/SUPPORT9→rotate across375×667/390×844/844×390/1280×720→add third card and observe3/2 energy error→remove it→real2-card lucky single,HP60→43,1st-base runner→next batter,energy3/3. The first error capture exposed an inherited46px panel; final align-self:stretch uses the full63px row and separates44px strip from14px error (3px gap), with7px before the commit button. Final screenshots include inline-energy-error.png and inline-result-375x667.png.

inline-viewport-evidence.json records13 states, including final ready4, support4, selected-support edit, energy error, result and next batter. All recorded states have document=viewport,scrollY0,0 dialogs and9 reachable aim centers; primary and existing support-add centers are reachable. Earlier support rotation measurements precede the final panel-height-only fix; final ready4/error/result were recaptured after it. Screenshots inline-{375x667,390x844,844x390,1280x720}.png show final built layout. Phone touch ergonomics and browser chrome/safe-area behavior remain unverified on physical devices.

Independent review caught stale compositor dimensions in the first resize-and-capture batch. The three affected screenshots were recaptured in separate calls after viewport changes and decoded independently:390×844,844×390,1280×720. All seven saved inline screenshots are PNG with verified dimensions; no visual alteration beyond lossless format encoding. The375px support/error/result screenshots were already correctly sized.

Independent reviewer approved final source and correctly sized four-viewport images, support editing, separated energy error and real result: no remaining P1/P2 blocker. They directly ran8 UI tests; the full981 and final33 subset/build/smoke are root-run evidence. Tall portrait letterboxing preserves the authored actor/field proportions and was accepted as a non-blocking limitation.

## Prior art/deck revision4

## Current correction

- Final source: **979/979 tests, 167 files**. Hybrid subset **31/31** includes deck conservation and real effects, public-only decisions, per-kind art, contact lifecycle and geometry/crop containment.
- Production build with `VITE_BASE=/9-baseball/` passed; **56.3MB/60MB** dist budget passed. Existing chunk-size warning remains.
- `node scripts/v9-report.js 20`: exit0, 16 rewards and 1 win. This is original route/reward/facility/save coverage, not balance/fun evidence.
- `git diff --check`: passed.

Built browser on localhost4321: ready and selected-support states at **375×667, 390×844, 844×390, 1280×720** had document=viewport, scrollY0 and reachable primary/support centers. The viewport JSON contains ready4, support4 and portrait foul-result1 measurements. Real contact screenshots cover all four sizes; these are separately observed evidence, not four additional result measurements in JSON. MAIN zone7 / SUPPORT zone6 survived the four-size rotation and a real two-card action consumed both cards.

Manual behavior fixtures (URL seed1 then deck change produces seed2):

| Deck / renderer | Real sequence | Observed result |
| --- | --- | --- |
| Grind / DOM / 375×667 | wearDown prep → foulTip zone7 | Foul −7HP (60→53), 1 strike, same batter, next-pitch energy3/3. |
| Grind / DOM | longAtBat zone7 + defend support zone6 | Single −10HP (53→43), 2 consumed cards, real 1st-base runner. |
| Relay / Pixi | tableSetter zone5 → next batter → flow prep → hitAndRun zone6 | First single −15HP with 1st-base runner; prep keeps pitch and spends energy; second single −16HP scores the existing runner (+1 run). |
| Precision / Pixi / seed90210 | scout → focusBreath → pinpoint zone7 | Preparation uses two energy without pitching, then real −63HP homer, energy0/3. One outcome, not a win-rate claim. |

`identity-pitch.gif` is a resized recording of 36 consecutive live screenshots with measured timestamps in `identity-motion-evidence.json`. Frame22 simultaneously shows HP0, impact and contact feedback; frame35 settles. No forced result, paused animation or static actor composite. `identity-contact-*.png` contains four real contact captures. Original title → local saved battle → take action was rechecked on this build; prior map-scroll proof below remains applicable because the original UI/storage/engine was not changed in revision4.

Independent final reviewer directly passed 31 hybrid tests, checked 1,710 public-policy decisions (0 illegal/hidden-read cases), compared the saved five-seed report to a new run, and inspected ready/contact4 + foul/relay images. A support-description P2 was fixed and regressed; no remaining P1/P2 found. This verifies implementation and visual consistency within the slice. The five grind spectator records do not show foul keyword damage; the separate manual fixture does.

Limits: viewport emulation, not physical-phone QA; OS reduced-motion and listening/audio quality not manually tested; campaign depth, long sessions, balance and player fun still need validation. Public upload/run results are maintained in PR26.

## Previous one-screen/geometry revision (historical 971-test baseline)

Integrated with origin/main at `65d8394`. This is a playable alternative hybrid.html entry, not a replacement for the original game or proof of commercial quality.

## Automated checks

- Hybrid model, action lifecycle and spatial regression: **23/23**, including preparation without pitch, contact-time commit, duplicate/stale events, take/basic consumption, support aim and rotation, energy cost, actual opaque shoe bounds and all nine barrel-contact targets.
- Full suite: **971/971 tests, 166 files** passed on the final source; the independent engine reviewer also passed the prior 970-test revision.
- `node scripts/v9-report.js 20`: completed 20 seeds; 16 reached reward, 1 win. This checks route/reward/facility/save flows; it does not measure fun or balance.
- Production build with `VITE_BASE=/9-baseball/`: passed, both entries emitted. Dist budget **56.3MB / 60MB** passed. Existing large-chunk warning remains.
- `git diff --check`: passed.

## Production browser checks

Tested the built game on 127.0.0.1:4321, seed 90210, in the in-app Chromium browser. These are viewport simulations, not physical-phone tests.

| Viewport | Document size | Page scroll | Primary/support control center |
| --- | --- | --- | --- |
| 375×667 | 375×667 | 0 | reachable |
| 390×844 | 390×844 | 0 | reachable |
| 844×390 | 844×390 | 0 | reachable |
| 1280×720 | 1280×720 | 0 | reachable |

Evidence: viewport-evidence.json and play-*.png. Horizontal hand scrolling is intentional; offscreen cards are not counted as vertically clipped controls. The desktop detail panel can scroll locally while hand and commit remain visible.

Actual input sequence: prepare → MAIN at zone 8 → add cut support → support zone 7 → rotate portrait/landscape/desktop with both choices preserved → commit → HP 60→50 → next batter. Take then next pitch recharged energy to 4/4 and produced six cards. No automatic page scrolling. Native course dialog entered the modal top layer; Escape closed it and returned focus to the course button. Opening it disables autoplay; both the timing regression and built portrait UI verified that manual course selection is preserved.

Pixi real pitch: verified-pitch.gif contains 29 consecutive scene captures with measured frame timing; verified-contact.png is frame 19. Ready/load/trigger/swing/contact/follow-through/finish/settle appeared during a real engine action. HP changed 60→48 at contact. No injected result, frozen animation or static actor composite. DOM fallback was used for the responsive interaction sequence and passed the same contact/geometry model checks.

Original entry: title, start pack, map → battle, card/9-zone selection, hit HP60→48 and reload → resume were checked on a separate localhost save origin. At 375×667 the map document was 853px high and real scrolling moved scrollY from 0 to 186 (original-map-scroll.png). Rewards/facilities and further save transitions are covered by the existing suite and 20-seed smoke. Hybrid does not import the original UI stylesheet or call its storage API.

## Review and limits

Independent final reviewer inspected source, small portrait/landscape/contact images, viewport measurements, reran hybrid tests and budget check: no P1/P2 blocker found. Physical devices, browser chrome/safe-area changes and OS reduced-motion settings were not manually tested. Hybrid is an in-memory match slice: campaign progression and persistent hybrid saves are outside this implementation. Gameplay depth still needs player validation.

Code uploaded as PR [#26](https://github.com/jbseo-commits/9-baseball/pull/26). Initial Pages run38092557210 was cancelled by a concurrent branch deployment; it was not a build-code failure. Final deployment URL, workflow result and public-browser verification are maintained in that PR description.
