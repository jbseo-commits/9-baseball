# G030/G031 — Pitch/batting decision review

Read [DESIGN.md](DESIGN.md) for the critical main/PR123/124/125 comparison, hypotheses and proposed human experiments. [SUPPORT.md](SUPPORT.md) extends the exact same states to one legal support. Product source, rules, balance, storage and visuals are unchanged. No deployment.

- `scripts/pitch-information-ablation.mjs`: 30 natural decision snapshots, same-world 2×2 displayed-chance channel/objective analysis. `information-ablation.json`/`information-run.txt`, exit0.
- `scripts/pitch-support-ablation.mjs`: original states/solo rows/scores exact; 28,620 legal actions, full execution exit0 under120s. `support-ablation.json.gz`/`support-run.txt`. Cost preflight is only one fixed state and not the final sample.
- `swipe-probe/correction1`: conditional mechanical comparison of PR124 modules. Synthetic target; human motor cost not modeled. Preflight inaccuracies are preserved and explicitly corrected. Copied modules are analysis fixtures from the same repository, not installed or imported by the game. Historical evaluator output paths are environment-specific.

Independent reviewer recomputed120conditions for each information study, all28,620 expanded actions' legality/resourcecost,30state hashes and solo invariance, and the H2 geometry/outcomes. No publication blocker; one H2 collector correction, wording narrowed after review. No visual gate reset or new visual assessment.

Shared unchanged product baseline: `pnpm test`248files/1706PASS exit0, zone-report10exit0, productionbuildexit0, dist52.8/60MiBPASS. Scripts were executed directly with their separate consistency assertions. Browser UI was not changed or newly claimed tested by this analysis. Existing G0033/3HELD, humanfun/physicaldevice/access limitations remain. All archived text logs have trailing whitespace/empty EOF normalized; original command content/results unchanged.

This does not claim all three named visual pitch profiles exist as tactical engine categories, nor that interval-midpoint scores are exact EV, nor that people enjoy these choices. Actual observed differences and degenerate zero-score ties are both retained. The next automatic question is how the fixed public-only policies behave when native card consumption/draw actually advances; a policy rollout would still not be a human playtest.

The large support table is losslessly gzip-compressed to keep this review small; use `gzip -dc support-ablation.json.gz` to inspect the original JSON.
