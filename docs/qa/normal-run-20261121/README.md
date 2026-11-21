# Normal run review — implementation log

Base: exact #142 d9d974a; latest main remains fb8e7b1. Retain reviewed all-roster public intent and existing art. No merge/deploy/main changes. Explicit user correction replaces the Tide-featured entry with the canonical variable run.

Before implementation, played cold title → hold start pack → three-page intro → map → Amber Sinker → real cutMaster at public frequent low zone → actual hit. No pending target/RNG access. Captures retained. Observed: executable 2-energy plan displays unqualified "에너지 1 부족" (actually inability to add another card), default first highlight sends to separate practice rather than new run, settings exposes legacy/experimental journeys. WelcomeGuide writes global localStorage although App reads injected storage: isolated reviews repeatedly show intro and pollute global preference. Existing result feedback is already preserved after auto-next; retain it rather than replace it with another effect.

Impact before edits: UI/title/settings and stack wording affected; canonical inputs and public information preserved. Rules/balance/art/timing unchanged. Save isolation and guide/settings namespace affected and need reload/rotation tests. Existing mobile rotation and scroll contracts retained. Canonical map/reward/facility/boss/terminal flow needs real UI play. Full tests/smoke/build and exact extracted artifact QA required. Review build default forces vnext canonical Duel title, no auto-start or debug/seed-specific entry. Build-only gate leaves normal production routing unchanged. Transfer artifacts are separate from runtime changes.

Iteration 1: canonical title/pack/map path restored for a separate persistent review namespace; production routing unaffected without build/query gate. Guide/coach/chase/error-reset now honor injected storage. Experimental/legacy entries omitted in customer review. A short first-decision cue explains the existing card→zone input without modal text. Stack shortage explicitly refers to adding a card. Recent settled result now leads with verdict and actual clamped HP loss before the long course explanation, which previously ellipsized the outcome on a phone. No engine changes.

Iteration 2 (actual 667×375 capture): the landed-result explanation wrapped above HP loss and pushed the damage below the short scroll rail during the result beat. Moved verdict/damage before explanation and kept the explanation to one ellipsized line on short landscape, retaining full accessible text/title. This is a real small-screen consequence-readability fix, not a timing or rules change. Independent reviewer caught an accidental out-of-scope Sprite variable during iteration 1; restored original condition and the affected 24 legacy tests passed before the full rerun. First full pass recorded failures; final pass must be separate.

Iteration 3 (supplementary actual final-boss checkpoint): the normal winning screen's 260px minimum art header hid two statistics and pushed restart below the phone viewport. Added end-screen-only short-landscape sizing: flexible art area, all three statistics and 44px restart/title buttons fit together. Preserves the original ending art and engine win condition. The source at engine.js 1289–1296 directly completes Act 3 on final boss HP0; unlike Acts 1/2 it does not show another reward. Browser checks distinguish these contracts.

Iteration 4 (real hit-tested loss→restart): the pack's close button was covered by the persistent game header (header z80, pack z60). This did not appear when opening from title because title hides that header. Raised only the pack modal above the header, retaining the orientation gate. Browser cancel/restart tests must use actual clicks, not programmatic DOM clicks. This finding validates keeping separate hit-testing QA.

## Final scope and playback

The review export is built with `VITE_NORMAL_REVIEW=1 VITE_BASE=./`. Serve extracted `dist/` and open `/` **without a query**. It opens the existing title, then start-pack choice, short guide and normal map. Seeds come from the normal crypto source; the review ignores featured/QA seed parameters. No encounter is forced. Existing all-21 public intent badges and art remain. Production builds without the review flag retain their original routing; `?normalRun=1` is an explicit development/review entry.

Progress is persistent localStorage under `9zone-normal-review-v1:`; it does not migrate or overwrite the Tide/vnext/personal runs. Intro/coach/chase state, shot preferences and error reset use the same supplied storage. Playback speed starts at 1× without overwriting the global preference. **BGM track selection remains the existing shared cosmetic preference**; do not describe every setting as isolated. No service worker was added.

## Honest play evidence

Public-policy browser runs select only public DOM card descriptions, frequency labels and the displayed forecast. They never inspect pending targets/RNG or read the save to decide. DOM click automation is used to compare plans, so these runs establish real UI/engine progression, not touch hit-testing. Dedicated `verify-release.py` uses actual Playwright hit-tested clicks at 844×390, 667×375 and desktop, plus reduced motion.

- Seed **675274355**: cold title → hold pack → two wins → loss to Violet Sting; 22 pitches, 10 hits, 2 completed nodes. Development HMR returned to title mid-run; the exact saved bytes were resumed in the extracted candidate. This interruption is preserved in `public-1.json`, not concealed.
- Seed **484274127**, 667×375: normal variable start → Tide by chance → loss with 1 HP remaining, 15 pitches. No featured Tide preset. Loss save used for real cancel/restart/resume/rotation checks.
- Seed **2648008145**, 844×390: cold title → real map choices/events/shop/rest → Act 1 boss defeated and reward claimed → Act 2 → loss to Sky Phantom 2, **42 pitches, 19 hits, 10 completed nodes**. See `public-final.json`. No target oracle or forced result.

There is **no cold-title browser victory** in these attempts. Broad public hints, card/energy decisions and carrying outs remain demanding; these limited policies do not prove a balance defect or commercial readiness. No odds/damage/rules were adjusted to manufacture a win.

Supplementary coverage is explicitly separate: `checkpoint-fixtures.mjs` legally advances engine seed137 with a target-aware QA strategy to produce saves. `verify-checkpoints.py` loads those saves ONLY in the test context, then uses real browser clicks for map Act2/3 entry, events, shop, locker, rest upgrade, training, Act1/2 boss reward transitions and the final boss's last decision → actual win → restart. Both phone sizes pass. No fixture is imported into runtime. The winning screenshot is **checkpoint coverage, not an earned full-run win**. Act3 currently completes directly on final boss HP0 in engine.js; there is no additional Act3 reward screen in this source.

## Release bar and remaining limitations

This pass fixes observed entry/save, support-message, short-result, winning-layout and restart-modal defects. It does **not** establish commercial/masterpiece approval. Existing mixed pitcher art density, limited Fox motion and held stadium/art candidates remain as before. No new pitcher master or stadium candidate was integrated. Android physical hardware and human play satisfaction are unverified. Longer player-led runs through all acts, difficulty/onboarding evaluation and approved art completion remain release work. No merge, official main changes, public/private deployment or Sites access occurred.

Independent read-only review caught the temporary Sprite reference regression and reviewed the final layout scopes. Full-test failures from that intermediate revision were corrected; final exact checks are recorded separately. Applicable local skill directories were checked; no matching installed SKILL.md was found. No asset-generation skill or Library transfer is claimed for this pass.

## Exact export verification

Final ZIP: **52,233,678 bytes**, SHA256 **b3efa57d52a799b2c1f9a6e6746d67eff3fd7f792d70e084ceacb3c229bb3339**. Extracted: **54,578,211 bytes / 634 files**, each byte-compared to dist. Relative base `./`. The default entry is `/`; no Tide or debug query is needed.

- Exact final source: **258 test files / 1,741 tests passed**, zone smoke10 passed, production review build passed, shipped size **52.0 MiB / 60 MiB**. Existing Happy DOM iframe warnings remain. Earlier intermediate Sprite regression produced 34 failed files/125 failed tests; fixed and final full suite rerun, not ignored.
- Exact extracted build: actual hit-tested title/pack/intro/map/card/zone/swing/take, fixed-result reload continuity, normal/reduced motion, 844×390 / 667×375 / 1440×900, rotation and isolated saves all passed with no page errors or runtime HTTP errors. `release-verification.json` records random seeds and videos.
- Terminal loss reload, pack cancel preserving the old run, new variable-seed restart and one-time intro passed at both phone sizes (`loss-resume-verification.json`).
- Supplementary checkpoint transitions at both phone sizes cover all facility kinds and act boundaries. Win stats and restart/title rectangles remain in viewport. An initial QA script assumed locker removal was available with only nine cards; corrected it to use the real skip action when no options exist. This was a script assumption, not an engine alteration.
- `normal-mobile.gif`: 15-second actual final extracted-build mobile recording, no composite, no hidden-state policy. `small-result.png` and `checkpoint-667-final-boss-after.png` are final captures; `before-win-clipped.png` preserves the prior terminal defect.

PR Verify is configured only for PRs targeting main; this stacked review's full equivalent gates ran locally. Available Impact CI is reported with the final PR. Owner-private publishing remains the parent's separate step; no deployment was performed here.
