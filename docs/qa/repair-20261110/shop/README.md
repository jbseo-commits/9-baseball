# Shop readability — PR96 part1

Base08765b0. Engine-generated seed2 legal shop fixture: create→actual basic attacks/pitch advances→reward skip→shop;9pitches/8hits,3cards+2equipment. Setup intentionally reads pending to prepare the fixture; this is not a human/public-information gameplay policy. Save validation/roundtrip passed. No RNG, offer-pool or acquisition changes.

| Landscape size | Before card/equipment height | After card/equipment height |
| --- | --- | --- |
|568×320|14/22px|149.5/74px|
|667×375|14/22px|154.3/74px|
|844×390|14/22px|156.2/74px|
|1280×720|106/114px|199.1/74px|
|1440×900|196/119px|215.5/74px|

Only stop-shop CSS changes: content-sized tracks, contained equipment art/fallback, left scene/right scrolling list in landscape, accessible fixed footer. Other facilities retain their selectors. [Same-state blind sheet](comparison.png), [sealed scores](judgement.json), [measurements/browser regression](report.json).

Fresh blind judgement:1.56→2.88,+1.31,7/8axes improve,no declines:IMPROVED/notBAR_MET. The reference is the comparison script's commercial-craft fallback because no shop target exists. Scores do not establish commercial quality or player enjoyment.

Full239files/1631tests,smoke10,production build/dist52.8/60MiB PASS. `scripts/qa-shop-layout.mjs` checks5landscape sizes, offer name/effect bounds, one art/no duplicate fallback, fixed footer, selection/save invariance and actual last-item acquisition equal to the engine. Separate independent UX covers actual touch/Tab, first-card/last-equipment/skip, missing-art branch and other-facility geometry. Exact CI/publication is recorded in the implementation PR after completion. Physical phone/Safari not measured.
