# G-023 — New-map determinism, saved-map compatibility

Baseline `fb8e7b13f043e2c17376138abe6696f48c2d8022`; independent branch `review/map-determinism-20261118`. Only production change:14 added lines/1 replaced line in `src/duel/run-map.js`. No storage, save schema, combat formulas, weights, roster data, UI or art edits. PR126's QA repair and G003's exhausted visual3/3 HELD candidate remain separate and untouched.

## Cause established before editing

Same numeric seed3, same source SHA256 and options, Node24.19.0 and Chromium151.0.7922.173 produced66/64edges. Each runtime was repeat-stable. Across101fixedseeds0–100,34full maps differed cross-runtime.

The first comparator scheduling difference was event3, but that compared unequal distances and consumed no RNG. The causal RNG divergence was nearest-sort index15: Node compared the same equidistant lane pair twice and got +1 from0.6071249230299145 then−1 from0.39942639297805727; Chromium compared once and got+1. Comparator invocation order is implementation-dependent; consuming fresh RNG there changes both ordering and later branch draws. Same input rows and source were confirmed; the raw trace is preserved locally and decisive events/source hashes are in `cause-summary.json`.

A temporary alternative insertion sort changed all101old maps (`before-sort-failure.json`). Pure ordering counterfactuals removed the cross-runtime difference. Failed trace setup attempts (query matching and temporary server mode) are explicitly retained in the cause summary and were not treated as evidence of product behavior.

## Local repair

Sort candidates by distance then unique lane, with no side effects in the comparator. Split equal-distance groups and reuse existing Fisher–Yates shuffle within those groups only. Strictly nearer candidates remain first. Unique-distance calls consume0draws; tied groups consume exactly size−1. Inputs are not mutated. No branch probabilities, required node types, encounter weights or balance values were tuned.

## Compatibility and generation revision

V10 schema/version stays unchanged. Existing saves contain their complete nodes/edges, including future unvisited nodes. `readV10State`, hand normalization, `selectRunNode` and `completeRunNode` do not call `createRunMap`; only a fresh `createV10Duel` generates a map. Existing map data is never regenerated, migrated or rewritten by this fix.

This is a new generation-algorithm revision, identified by this source/commit, not a new storage format. Re-entering a historical seed on a new build is not guaranteed to recreate an old build's fresh run. Stored full-map continuation and seed-only regeneration are different contracts.

Fixed sample0–100 (not a population/difficulty study):

| Comparison to old generator | Full maps changed | Edge sets changed | IDs/positions changed | Types/routes/opponents changed |
| --- | ---: | ---: | ---: | ---: |
| Prior Node |34/101|33/101|0/101|6/101|
| Prior Chromium |0/101|0/101|0/101|0/101|

Node changes affect seeds15,46,72,73,77,84 for Act1 types/routes/opponent assignments. Linking precedes Act1 clash cleanup/required placement, explaining that wider effect. Edge-set comparison ignores ordering while full-map comparison includes it. Do not generalize the Chromium sample to every seed, browser version or historical build. These changes may alter routes and challenge for a fresh seed even though explicit balance weights are unchanged.

## Verification

- Final Node↔Chromium raw-map equality432/432:108seeds including uint32 boundaries/coercions ×4tutorial/encounters options. All864outputs pass map validation/path checks. Six representative seeds repeated5times per runtime remain stable.
- Alternative-sort metamorphic432/432;13944 actual intercepted row/lane sorts per runtime. QA exits nonzero for parity, validity, repeat or metamorphic failure.
- Four focused regressions: distance/tie/RNG contract and frozen pre-fix Node/Chromium save read/first action/reward/next-node **full state** equality. The getItem-only reader fixture rejects accidental write calls. Frozen compact fixtures carry the original source hash and original66/64edge maps.
- Independent actual production UI: same old saves at568×320 and844×390, title resume/reload/rotation notice/reward skip/next node;64/64 before and64/64 after, errors0, every stored node/edge preserved. Fresh seed3 through actual UI also exactly matches Node:43nodes/64edges.
- Strict production playthrough: initial full engine state including map must match (no PR126 edge exception); win→reward→map→reload/title resume→next node, natural loss/reload,3card commit/Escape,.5x clock and6layouts PASS. Exact-hit/EV QA policy is technical regression, not limited-information human strategy.
- Full249files/1710tests PASS exit0; general screenshot119/119; zone10 byte-identical before/after; build PASS;52.8/60MiB. Existing warnings preserved in local logs.
- Map smoke100: valid100, boss paths300 before/after. `committedActs73/expected300` is an existing disjoint-entry-branches metric; merges are allowed by current contracts. It is preserved as an observation, not relabeled an all-pass criterion.

The original main `qa-playable-run.cjs` retains its obsolete11-pitch assertion; PR126 repairs that separately. This cycle used a temporary copy of that reviewed repair with its topology exception removed. No overlapping QA repair was committed here. Original failure is retained when rerun; the corrected diagnostic result is identified separately.

## Reproduction and limits

Run `NODE_PATH=<Playwright installation> node scripts/qa-map-determinism.mjs` with Chromium at `/usr/bin/chromium`; the script starts/stops its own temporary Vite server. Optional `MAP_BASELINE` accepts the captured original Node/Chromium raw-map dataset to recompute the historical deltas. That24MBdataset and15MBrawtrace remain in `/tmp/map-determinism-20261118`; compact permanent evidence is in this folder. Baseline source and tool versions/hashes identify the recorded reproduction.

Legacy save empirical coverage is current pre-fix default seed3 in two runtimes and five stages, not every historical save/options combination. Existing validation/normalization rules remain unchanged. UI checks use Chromium touch emulation, not physical hardware. Firefox/WebKit and human comprehension/fun/difficulty are unverified. No visual quality promotion, main push, merge, new preview update or production deployment. Local production verification is not a deployed-release claim.

Strict diagnostic reproducibility: `strict-playthrough.executed.cjs` is the exact executed temporary artifact, with provenance and SHA256 in `strict-playthrough-provenance.json`. Run with the recorded environment against a local production server. Its two absolute file imports point to this execution checkout; in another checkout, relocate only those import URLs. It inherits a now-inapplicable topology-bootstrap comment from PR126; the executable uses `oracle=normal`, with no browser-edge substitution. The original QA file is not changed by this artifact.
