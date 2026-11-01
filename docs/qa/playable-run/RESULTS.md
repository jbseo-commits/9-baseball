# Playable actual run — 2026-10-30 KST

`?battleUi=vnext&battlePlay=1` starts/resumes a real Duel run with the new battle screen and speed controls. It starts a normal deck at the first reachable opponent, without a fixed battle fixture, HP grant, extra energy or scripted result. The same controller handles card spending, outcomes, victory/defeat, reward, map, facilities and later opponents. `seed=3` provides a repeatable ordinary starter; omit it for a new seed.

`?battleUi=vnext` also connects the new screen to the regular main save. The separate `battlePlay=1` entry keeps game state in its own session namespace. Reload and title Continue resume that session; closing the tab can discard it. Production V10/V9/legacy game saves are not read, written or deleted by the playable preview. Existing music/coach UI preferences may be shared. The preview error boundary offers reload without a production save-delete action.

## Actual game and actors

- The foreground batter, central zone, folding hand, card-to-block placement and 0.25–2× control now run under the actual App owner. Existing support assembly executes once; App does not insert a second stack animation. The new screen uses its host-clock home-run effect instead of a separate fixed-speed movie.
- Real opponents use their own existing registered atlas, rather than replacing every pitcher with the green sample. [Source/registration table](../../../src/duel/battle-vnext/roster-registration.json):20 existing atlas IDs. SD/Red Rush release79; PixelLab/study/runtime release76. Source PixelLab stance/release metadata is preserved. Other hand registrations are approximate drawing registrations, explicitly labeled; this is not a new anatomical motion-validation claim or20 new character assets.
- Foot registration stays fixed from stance, while the atlas retains its motion. Ball origin, camera and actor use the same transformation; pre-impact flight waits for that atlas's release event.
- Missing atlas, defense lab and auto lesson keep their existing renderer and1× timeline. The sample actor approval list stays unchanged.

## Real browser playthrough

[Phone](live-844.jpg) · [Desktop](live-1920.jpg) · [Three-card plan](actual-three.jpg) · [Slow actual pitch](slow-real-pitch.jpg) · [Victory reward](reward.jpg) · [Map](map.jpg) · [Natural defeat](defeat.jpg).

[Production report](playthrough.json) records every actual action and resulting HP/energy. QA chooses using public card previews only, then clicks the normal UI. No battle state or outcomes are injected. The match loop uses the existing reduced-motion preference and advances browser time to test long progression efficiently; the separate0.5× case runs with normal motion and real wall time. Actor images and fonts are decoded before all layout captures.

- Normal seed3: actual11 pitches, HP60→0, then reward→map→reload→title Continue→next reachable node. Cards/energy/state match the independent engine execution of each real browser state.
- Normal take→next produces energy3 and three distinct place cards. Actual App executes their0/4/8 plan once, consuming3energy and incrementing pitches once. Native Escape after touch preserves all3cards, including body keyboard focus.
- Take-only normal game reaches3 outs and the defeat screen, then reloads that exact result.
- Actual0.5× pitch lasts beyond the normal1× duration. Real roster frame, host lock, next pitch and saved state remain connected.
- Six real-game landscape sizes:667×375,740×360,844×390,1024×768,1440×900,1920×1080; both actors visible after decode and the actual battle fills the viewport.
- Production game-key get/set/remove instrumentation records zero accesses in the playable preview.

## Regression evidence

- **221 Vitest files /1,484 tests passed**. New tests cover normal starter, saved session resume, actual App/roster/speed/next, real main-save vnext route, atlas release/ball origin, denied storage getter, readable-but-unwritable backing with newest-memory precedence and deletion tombstone, missing-actor/defense fallback1×, and Escape folding without clearing the real main/support/aim plan.
- [Default/actual-vnext comparison](smoke.json): prepare/take/next, same seeded saved states, Inspector pause, save/resume and rotation. [Nine map/reward/locker cases](noncombat.json): scroll/overflow and next transitions passed.
- Engine smoke: [zone10](zones.json), [v9 30](v9.json), [growth2](growth.json), [deck1](deck.json).
- Actual nested Pages-base production build passed.59.8MiB/60MiB; CSS350 font/image paths resolved. No new raster assets; engine and save schema unchanged. `git diff --check` passed.
- Independent read-only review found renderer eligibility, storage-denial/fallback and Escape propagation risks; all were fixed and covered before final verification.

The map generator can produce different edge ordering across Node/Chromium versions. The browser test validates a normal initial battle and valid full save, then compares every action against its actual browser-created state, rather than replacing its map. This work does not change map generation.

Branch preview only; main is not merged. Tests establish working behavior and regression coverage, not commercial quality or fun.
