# Cinematic vertical slice v1

IMPACT_ANALYSIS_REQUIRED

## Summary

Turns the existing battle FX stages into a coherent directed scene without changing gameplay. Adds a pure seven-phase cinematic director contract, a scoped scene-direction stylesheet, and regression tests. The live bridge uses the already-emitted `fx-stage-*` classes so there is no second runtime clock.

## Scope

- no engine/card/save/balance changes
- no main merge
- background depth and contact-apex treatment only
- Pixi remains owner of exact actor/contact/ball coordinates

## Validation

- source/impact review: complete
- focused contract tests: added, execution pending CI
- full suite/build: pending CI
- 412×743 / 844×390 / 1440×900 visual QA: pending preview
- independent reviewer: pending/native reviewer unavailable in current chat environment

Keep this PR draft until those gates are satisfied.
