# Hybrid battle verification — 2026-10-11

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
