# Card-first viewport correction — impact before implementation

User finding: the original game lets a player choose cards and play in one screen. The hybrid makes the player scroll repeatedly between the scene, forecast, hand and plan. Accepted as an interaction regression. Upload requested; publish this correction together with the prior spatial correction.

| Axis | Impact | Planned response |
| --- | --- | --- |
| UI/layout | Yes | Bound only `.hybrid-app` to the viewport. Keep scene, hand, selected plan and action visible together. Compact header, tabs, scoreboard and duplicate prose. |
| Input/gestures | Yes | Keep card tap, horizontal hand swipe, support editing, aim and commit. On cramped portrait screens, open the course board in an in-screen drawer; no page scroll. Keep target + covered zones visible in the control strip. |
| Rules/balance | No | Preserve real V10 action planning, card instances, information bounds, consumption and contact commit. |
| Save/load | No | Hybrid still has independent in-memory state; original saves unaffected. |
| Mobile | Yes | Check 390×844, 375×667 and 844×390. Use inline course board when it fits; drawer on short portrait. Keep useful touch targets. |
| Scroll | Yes | Remove the document scroll loop and automatic scroll-to-scene. Hand may scroll horizontally; expanded support details can scroll locally if necessary. Do not lock the original game or route page. |
| Existing flows | Verify | Original entry, route/battle/save still isolated. Hybrid prepare, aim, support, take/basic and next pitch all remain reachable. |
| Regression | Yes | Test drawer/course selection and card/support/commit in the viewport workflow; browser bounds must show no vertical overflow and visible actions/cards. Keep spatial tests and actual contact verification. |
| Build/upload | Yes | Rebuild both entries and check asset budget; upload working branch and use repository's isolated branch preview. Do not replace main's existing game. |

The field remains one canonical 1280×720 world. Fit it uniformly inside available space by observing the field viewport, never stretching art or repositioning actors independently. Separate plan review requested before implementation; root is sole source writer.

## Completion — 2026-10-11

Implemented scoped viewport grid, native portrait course dialog, persistent MAIN/SUPPORT aim through rotation, no automatic page scroll. Added always-visible coverage/card-consumption/damage-efficiency or bunt-risk summary, energy/cost HUD, and card cost markings after integrating upstream main65d8394. Preparation confirmation occupies the status strip rather than covering cards. Corrected short-landscape grid sizing after observing real clipping.

Production measurements: document equals viewport, scrollY0, primary/support controls unobstructed at 375×667, 390×844, 844×390, 1280×720. Native Escape returned focus to course button. Hybrid22/full970 tests and 56.3/60MB build budget pass. Independent reviewer found no P1/P2 blocker. Details and limits: QA.md.

Original-map regression: 375×667 retained document height853 and actual page scroll0→186; original map→battle and reload/resume also passed. Evidence: original-map-scroll.png.
