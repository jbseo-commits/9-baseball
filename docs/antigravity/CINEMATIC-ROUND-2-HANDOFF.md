# Cinematic Loop — Round 2 Handoff

## Implement next

Wire the new pure director into the existing runtime without changing gameplay.

1. Import `cinematicPhaseAt`/`cinematicPhaseToken` into the battle presentation path.
2. Derive the phase from the **existing** pitch clock and authored batter timeline marks; do not start another timer.
3. Expose the phase as `data-cinema-phase` on `.bp-pixi` for QA and as exactly one `.cinema-*` class on `.bp-battle`.
4. Import `cinematic-director.css` from the existing duel CSS entry point (or fold it into `ballpark.css` if the project convention requires a single stylesheet).
5. Confirm the phase resets to recovery/neutral after autoplay so hand interaction styling fully returns.

## Guardrails

- No engine/card/save/run-map edits.
- No new setTimeout/requestAnimationFrame clock.
- No CSS transform may be used to fake batter/pitcher animation.
- Do not change actor layout anchors until the phase integration is visually verified.
- Do not merge main.

## Verification

Focused: `cinematic-director.test.js`, `cinematic-director-css.test.js`.
Then full Vitest, production build, zone smoke, and the repo visual QA at 412×743 / 844×390 / 1440×900.
