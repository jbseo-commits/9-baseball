# Two- and three-card placement — 2026-10-30 KST

Multiple actual cards can now remain on the board, each with its own aim, order and coverage. [Impact analysis](../../design/atbat-hand/MULTI-PLACEMENT.md).

## Behavior

- First drag places the main. Later attack-card drags explicitly add supports, or move an already placed support, through one host-owned intent validated by the actual engine preview/stackSupportProblem. An invalid extra never silently replaces the main. Ordinary card-comparison taps keep their previous behavior.
- `+ 카드 추가` opens the hand in the existing support-selection mode; subsequent card→zone taps add a support. This does not call mode-toggle and pickSwing in the same event.
- Gold①, mint② and blue③ remain at their authored zones. The tray shows actual order, covered-cell union and existing CONNECT links; it allows individual support removal. Removing the middle card renumbers the remaining cards/links. Moving the main never changes support aims.
- Persistent geometry derives from the current `zones.pieces`. Temporary receipts are independently bounded by card ID/sequence. Removing/replacing a piece also removes its parent receipt state, preventing an old animation/source/scheduled sound from remounting on immediate re-drop.
- Overlap is visibly distinct from CONNECT. CONNECT is the existing engine's ordered aim-distance rule. Supports supplement coverage; they do not repeat the main card's effect or promise extra damage for overlap.
- Multi-card final assembly runs during the existing720ms commit beat, without adding a new confirmation or engine delay. Solo remains immediate. Watch clears the plan without spending its attack cards.

The actual touch browser exposed missing compatibility clicks directly after a drag. New tray buttons and this view's clear/action controls respond once to a valid touch release. Late compatibility clicks remain blocked even when preparation ends and the same button changes role. Fresh touch/keyboard/mouse remain usable. Inspector scroll is restored after its DOM/layout returns, preventing clamping against the temporarily taller hand.

## Actual captures

[Two cards](2-cards-844.jpg) · [Three cards](3-cards-844.jpg) · [Desktop](3-cards-1920.jpg) · [Overlap](overlap-844.jpg) · [Assembly](assembly-844.jpg) · [Real result](result-844.jpg) · [Native touch recording](three-card-touch-844.webm).

`stack-two-ready` uses the normal seed3 starter hand at base energy2. `stack-three-ready` uses the same actual starter after take→next, which legitimately produces energy3 and three distinct 1-cost place cards. No energy/card-cost/HP grants or balance changes. The recorded third-card run consumes the three real IDs exactly once: pitch1→2, energy3→0, discard3, actual HP60→59 for this seeded result. It is one resolved pitch, not three attacks.

## Verification

- Full Vitest: **218 files /1,454 tests passed**.18 new regressions cover actual base-energy2 and take-bonus3, distinct IDs, concurrent receipts, support re-aim/rename/removal, overlap versus ordered links, cost rejection, tap add, commit720, real consumption/HP, watch, main replacement, mute/menu, immediate re-drop without stale source/audio, touchrelease/lateclick/fresh input and Inspector layout clamp.
- [Six-size multi-card browser evidence](multi-browser.json):667×375,740×360,844×390,1024×768,1440×900,1920×1080. Real CDP touch drags, all three own aims, no pitch/spend on placement, re-aim, middle removal/renumbering, unaffordable extra rejection, overlap, tap-add, existing commit, actual hand/energy/HP and isolated save passed. Actual base-energy2 two-card, reduced motion and rotation also passed.
- [Existing one-card six-size regression](solo-browser.json):fold/fan/fixed field/actual touch drag/own support aim/HP60→48/first header tap/vertical swipe/Inspector scroll/save isolation/reduced motion/rotation passed.
- [Default and vnext fallback flow](smoke.json):prepare/take/next/Inspector pause/save-resume and equal seeded saved states. [Map/reward/locker nine cases](noncombat.json), scrolling/next transitions passed.
- Engine smoke:[zone10](zones.json),[v9 30](v9.json),[growth2](growth.json),[deck1](deck.json) passed.
- Actual nested Pages production build passed.59.8MiB/60MiB and CSS350resource paths resolved. No new raster assets. `git diff --check` passed.
- Read-only independent review found and verified the removed-receipt cleanup; final touch activation/late-click and post-layout Inspector restoration were reviewed with no remaining code blocker.

The final small-landscape caption inset also keeps the folded hand handle from covering the stack count/links. Scene composition, production roster approval, engine balance and save schema remain unchanged. This is the existing opt-in sample-actor preview branch.
