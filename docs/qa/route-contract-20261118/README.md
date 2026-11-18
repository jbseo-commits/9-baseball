# G024 — Deck-capacity promise audit — validated locally

Baseline main `fb8e7b1`, independent branch `review/route-contract-audit-20261118`. Source changes limited to BallparkMap public-copy conditions; shared DECK_MAX18 is unchanged. No engine, save/schema, CSS/layout, art or input changes. G003 visual3/3 HELD remains untouched.

## Reproduction

At17 cards engine offers3 regular reward cards and accepts addition to18. At18 it offers0 and rejects addition; shop card options also become0. Existing map copy promised3/4 cards, signature cards or shop additions regardless. Fixtures are explicitly synthetic boundary states, not naturally played18-card runs. Actual engine transitions are exercised in tests.

`ui-baseline/report.json` records old exact strings and save/rotation stability. Its36/36 means capture worked, NOT reward truth or visibility. `ui-candidate/report.json` preserves108/116: eight old-exact-string comparisons intentionally fail after corrected full-deck copy. DOM innerText alone cannot establish visibility. Independent pixel/clip inspection found lower reward text hidden at568×320 and elite partly clipped at844×390; frozen-baseline comparison and actual touch drags subsequently resolved the concern. The area is overflow:auto: initially below-fold text is accessible, not an inaccessible clipping defect. Both versions have the same geometry. Actual CDP touch drags bring the full line inside the detail clip, hit the line itself, leave the 52px enter action unchanged, and preserve exact save/selection. This corrects the initial failure interpretation without deleting its measurements.

## Correction history

1. Initial conditional copy; test fixture/assertion repairs are not seven separate product defects.
2. Removed tautological victory text and restored exact final-boss completion at all capacities. Full249files1732tests, zone10, build52.8/60MiB and general119/119 passed. Initial affected-UI visibility concern was investigated separately, not overridden by these counts.
3. NOT applied. A duplicate header warning was considered but rejected as unnecessary after actual scroll access passed. Source correction count remains2/3; G003 remains3/3HELD.

No deployment. Independent reviewer approved separate Draft posting; no blocking finding. Human comprehension/fun, physical mobile hardware and all browser engines are unverified.

## Final evidence and limitations

- Production capacity-copy checks116/116, no page errors;17 preserves existing copy,18 removes unavailable card promises, final boss retains exact run completion. This resolves the eight stale before-copy assertions by evaluating the intended current contract, not suppressing a product failure.
- Actual touch accessibility:568×320 regular/elite before/after fully inside clip and line hit; save/selection/go unchanged. JSON is authoritative: candidate regular required2 drags in this sample (the reviewer final prose incorrectly said1); counts depend on gesture/inertia and are not a pass threshold.
- General seven-viewport screen regression119/119; query-free touch/rotation42/42; full run win→reward→map→reload/title resume→nextnode, loss,3-card/Escape,.5x,sixlayouts PASS using PR126 reviewed QA copy. Main original QA still expects obsolete11 pitches vs actual6; not changed here. The diagnostic retains PR126's explicit one-time browser-edge bootstrap because PR127 is independent/unmerged.
- One default-touch invocation initially used unsupported CLI flags and hit default4173 instead of5198, yielding0/1. Preserved as invocation error, then rerun with documented BASE_URL/QA_OUT:42/42. No product/test assertion was changed.
- Final249files1732tests; smoke10; production build and52.8/60MiB budget PASS. Existing build chunk warnings and expected test error-path logs retained.
- Frozen baseline server5197 overrides only BallparkMap with main source; candidate5198 is production build. Baseline served-source check: deckFull absent, old reward literal present. Product hash392a94c613bf7840997c753725e5735af01343f35dbebd1607961938bc780eed.
- No visual quality score or IMPROVED/BAR_MET claim: this corrects factual copy without changing art/layout. Initial below-fold information and scroll discoverability remain usability limitations; no human comprehension or fun study.
- Tests use synthetic17/18/19 capacity fixtures, not a naturally played max-deck run. All13relics/outs2 stress fixture is likewise synthetic. Physical devices, Safari/WebKit and remote deployment unverified.
