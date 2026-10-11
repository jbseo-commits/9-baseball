# Hybrid battle — impact record

User authorized implementation with existing and new assets, then upload. Their subsequent findings (batter placement and repeated page scrolling) are incorporated before publication. Source writer: root only; plan/final reviewers read-only.

| Axis | Impact | Isolation and verification |
| --- | --- | --- |
| UI/layout | Yes | Independent hybrid.html; scoped viewport grid keeps field, hand and actions together. |
| Input/gestures | Yes | Card tap, horizontal hand swipe, MAIN/SUPPORT aim, native modal, duplicate-action lock and stale-event tokens. |
| Rules/balance | Opening decks | Three nine-card packs with only one shared card per pair, two complementary openers and three shuffled choices. Existing V10 owns actual rules, energy, pitch, rolls, consumption and state transitions; no forced result. |
| Save/load | No schema change | Hybrid uses only memory. Original title/resume verified; existing save tests pass. |
| Mobile | Yes | 375×667, 390×844, 844×390, 1280×720 production viewport checks. Physical devices untested. |
| Scroll/overflow | Yes | Only hybrid viewport is bounded. Horizontal hand and optional desktop detail scroll remain. No global body/root overflow lock, no automatic scroll-to-field. |
| Existing flows | Verify | Original title/resume/next-pitch/card/zone browser smoke; route/reward/facility/save suite and deterministic report. |
| Regression | Yes | 31 hybrid tests, complete 979-test suite, real first-two-PA behavior, public-only spectator decisions, distinct card-art URLs, recorded Pixi pitch and responsive DOM play. |
| Build/deploy | Yes | Two HTML entries, configured base path, 56.3/60MB dist. Publish codex/hybrid-battle-v3 isolated preview and PR; main remains the existing game. |

This supplements the before-implementation records in COMPOSITION-FIX.md, PLAY-LOOP-FIX.md and REVISION-4.md. Upstream main65d8394 was integrated before tests; later independent main work is not rebased into this isolated preview. Existing renderer defaults remain unchanged; geometry and contact callbacks are opt-in. Motion swing fallback is enabled only when the hybrid explicitly requests it. The revision crops empty sky through an outer viewing window without changing physical contact/ground coordinates. Contact feedback requires actual bat contact; reduced-motion disables the added camera and ring animation.

See QA.md for measured results and limits. Passing tests is not evidence of commercial success or sufficient gameplay variety.
