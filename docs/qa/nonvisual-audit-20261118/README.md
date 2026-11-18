# G-022: Restore the blocked real-play regression gate

Baseline main `fb8e7b13f043e2c17376138abe6696f48c2d8022`; branch `review/nonvisual-boundary-audit-20261118`. QA-only change, no runtime, UI, art, engine, rule, storage-schema or balance changes. G-003 correction3/3 and PR125 remain HELD; this is an independent reproducible harness failure, not another visual attempt.

## Before / intended contract

The original QA on this baseline exits1 after8actions/6pitches/reward/HP0 because it demands11pitches. It never reaches reward claim, map reload/title resume, next node, defeat, three-card commit, slow clock and six layouts. `before.txt` retains this failure. Independent engine-only reproduction agreed; no open PR duplicates this repair.

Keep seed3, existing deterministic exact-hit/EV selector, maximum60actions, terminal reward andHP0. Every actual action/advance must match the engine. Pitch counts are observations, not a rule to change to6. This is technical regression evidence, NOT limited-information human strategy or fun/understanding validation.

## Narrow change

The QA maintains an oracle across actions instead of deriving each next expectation from the newly read UI state. The initial engine state is checked in full with one explicit exception: browser-generated map edges are copied once. No other browser state is used to reinitialize the oracle. Terminal pitch count and report derive from it; the take fallback skips card selection. No assertion of victory, durability, recovery or layout was removed.

A first stronger initial full-equality attempt exposed a separate difference: Node24.19.0 produces66edges and Chromium151.0.7922.173 produces64 for seed3. `run-map.js` consumes RNG inside an inconsistent sort comparator. Save/read does not normalize this. The edge exception is explicit and narrow; node contents, seed, progress, deck, RNG and all other fields must match. This harness does not prove cross-runtime map-generation determinism. That issue is preserved for separate investigation; changing generation could affect seeded routes and existing saves and is outside this cycle.

## Verification

- Full suite248files/1706tests PASS, exit0. Existing happy-dom stylesheet warnings retained in local full log.
- Smoke `node scripts/zone-report.js 10` PASS, four builds/10seeds. No engine source changed.
- Production build PASS;52.8/60MiB PASS, existing chunk warnings.
- Independent default-touch42/42, errors0: plan/rotation/durable state/result/reload at568×320,667×375,844×390. Browser emulation, not physical devices.
- General existing screenshot regression119/119: two legacy portrait + five current landscape configurations. Fixture-based; not human gameplay.
- Final production playthrough PASS exit0:8actions/6pitches/reward/HP0; reward→map→reload/title resume→next node, natural defeat+reload, real3cardcommit/Escape, .5x clock and6layouts completed. `playthrough.json` contains observations.
- Deliberate divergence probe EXPECTED FAIL exit1 at `pre-action oracle parity 0`: temporary oracle pitch counter+1 caught before the first action. It is never product code.

No new preview deployment is necessary: built runtime is unchanged. Local production-build execution is verified separately from public deployment. Existing PR125 private preview is unchanged. No main push/merge/production deployment. Human comprehension, fun, physical touch hardware and cross-runtime map determinism remain unverified or unresolved.

Evidence logs/screenshots not copied here remain under `/tmp/nonvisual-audit-20261118` in the execution workspace; this is not a permanent external artifact URL.
