# Independent UX regression check — R1

Checked fresh Chromium against http://127.0.0.1:5340/ on 2026-11-09. Product/test files were not edited. qa.cjs uses real CDP touch events, not dispatchEvent or direct application action calls.

## Performed and passed

- 844×390: drag 2 actual cost-1 attack cards to zones 0/4; execute. Full saved result deep-equals engine resolution, energy ends at 0. Root/page scroll stays 0/0 throughout.
- 844×390: take once to gain the third energy, then drag 3 actual cards to 0/4/8; execute. Full saved result deep-equals engine resolution; coverage union 0/4/8, energy 0, root/page stays 0/0.
- 844×390 → 390×844 → 844×390: rotate while an actual card/zone plan is present. Battle save and placed card survive exactly; return root/page scroll 0/0. Portrait was tested for progression preservation, not redesigned.
- 667×320: actual title → power pack → map. Horizontal route wheel scroll 0→233 while save remains unchanged; CTA remains fully visible at x462,y234,w191,h52.
- 667×320: inspector close restores focus to its HUD opener (`bv-hud-menu`); root remains 0/0.
- No recorded page errors or HTTP errors in main QA run.

## Actual failure found (pre-existing, not the six-line root overflow change)

Menu inspector does not establish a flex column, so its body grows to content height rather than scrolling internally. At 667×320, panel height258, body clientHeight=scrollHeight=390, body bottom533. At 844×390, body bottom461. Content below the viewport is clipped and cannot be reached by inner wheel scrolling. At 1440×900 the content fits.

`inspector-baseline.cjs` compared current `overflow:clip` and page-only injected prior `overflow:hidden` at all three sizes: same dimensions and failed inner scrolling. Thus this is not a new regression attributable to R1. Focus restoration succeeds despite this existing layout defect.

## Artifacts

- `report.json`: actual main run; intentionally retains the inspector assertion failure.
- `inspector-diagnostic.json`: scroll ancestor geometry and successful returned focus.
- `inspector-baseline.json`: current/previous-overflow comparison at 667/844/1440 widths.
- `drag-*-hover.png`, `drag-*-placed.png`: actual touch interaction screenshots.
- `rotation-*.png`, `map-scrolled.png`, `inspector-diagnostic*.png`.

## Not performed

Physical phone/Safari, touch drag while continuously rotating, drag outside/cancel recovery, unsupported cards and exhausted-energy rejection, every card footprint, full run to completion. This is CSS regression coverage, not a claim that every card effect/animation was visually approved.
