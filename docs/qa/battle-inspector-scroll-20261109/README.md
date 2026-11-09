# Reachable landscape inspector content

Base main `b466c82` (PR94 field anchoring); independent branch `codex/battle-inspector-scroll-20261109`.

The inspector flex layout existed only under the legacy `.bp-battle.bp-readable` selector. In vnext, the body expanded to its content height and escaped the bounded panel instead of scrolling. A normal fresh run at667×320,844×300/390 and1440×900 reproduced11 body-bounds failures across the six tabs. At667×320 the menu body ended at533px in a320px viewport. Earlier hidden/current clip both failed, establishing this as pre-existing.

The patch restores the panel/head/tabs/body/status column only in landscape atbat inspectors at width600px and above. Only the body scrolls; head/tabs/return remain fixed. The body's key follows the selected tab so a new tab starts at its first line. This one-line shared component change also gives the legacy inspector the same reading-position reset; it does not remount the tab buttons or mutate the saved plan.

## Reproduce

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
CHROMIUM_PATH=/usr/bin/chromium BASE_URL=http://127.0.0.1:5341/ \
QA_OUT=/tmp/inspector node scripts/qa-battle-inspector-scroll.mjs
```

Fresh normal seed3 power-pack run, real card/zone plan, six tabs. No injected game state. The baseline bounded-body check fails. After the flex correction, a separate first-line assertion reproduced two scroll-offset carryover failures before adding the body key.

## Verified

- [Final production report](production-report.json):667×320/375,844×300/390,1440×900; six-tab first-line/bounds/wheel-to-end, menu real touch/keyboard-to-last-control, exact saved-plan and opener-focus preservation. No page errors.
- [Independent actual UX](independent-ux.md):three sizes, menu wheel/CDP touch/Tab, Read Tab→Home/PageDown/End where overflowing, close/focus/save preservation, then one real Swing. Larger Read content that already fits is not required to scroll.
- Full suite after the shared JSX edit:239 files/1631 tests PASS; smoke10/build/dist52.8/60MiB PASS. Existing build chunk advisory remains.
- Existing field-focus browser regression rerun at844×390:PASS. Earlier PR94's five-size evidence remains separate; this is not a new five-size field regression claim.
- [Final normal-match flow](normal-flow.json):production0.5× actual7-pitchKO→reward→map→exact-save reload/continue→event, each UI action state equal to engine resolution; no gameplay page/request failures. Existing favicon404 console advisory was recorded separately. Public deployment is recorded in the PR after completion.

## Sealed visual review

[Opening sheet](comparison.png) and [keyboard-bottom sheet](comparison-keyboard.png), reference|A|B, same667×320 state/actions. A fresh judge scored all8axes before reveal. [Sealed scores](judgement.json):2.25→2.63(+.38),4/8 improve, no decline: **IMPROVED, not BAR_MET**. Mapping:opening A=after/B=before;keyboard A=before/B=after.

The temporary information panel is still visually plain compared with the battle mockup. These scores do not establish release quality, animation feel or human learning/fun. Chromium emulated touch was tested; physical Safari/phone performance is unverified.
