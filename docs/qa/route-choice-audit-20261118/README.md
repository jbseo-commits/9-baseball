# G027 — Route-category comparison, analysis only

Main fb8e7b13f043e2c17376138abe6696f48c2d8022, Node v24.19.0. Product source/assets/rules/save unchanged. Historical requests for persistent risk/reward choices motivated this audit; they are not evidence of a present visual or fun defect. Independent reviewer approved this documentation-only Draft. G003 visual3/3HELD remains unchanged.

## Fixed method

Seeds0–9. Utility category `[rest,training,locker,shop,event]`; combat category `[battle,elite,boss]`. Only the complete categories swap priority. Inside each category order is identical, then node ID breaks ties. Choose actual reachable nodes only. Combat uses the existing exact-preview technical policy: setup preference followed by hit*10 + expectedBases*2; it is NOT a limited-information human policy. Utility/reward/event chooses the first eligible option. No HP/RNG/reachability overrides or forced wins.

Every state transition validates both V10 state and map. No-op, invalid state and5000-step cap would fail the audit. Each run is repeated; complete trace and serialized-final-state SHA256 must match. Node act comes from the actual map node, with rawStage separate. ActionEnergyCost is preview-declared cost; energyBefore/After are NET values affected by refill/bonuses and must not be called total consumption. A node not chosen at this fork is not necessarily permanently forfeited: routes can merge later.

## Final observed result

20 initial runs +20 repetitions:20/20 trace and final-state matches,20/20 valid natural terminal losses, no step-cap/no-op/invalid-state result. All10 seed pairs reached a real choice and selected different nodes after the common entry. Utility-first reached Act2 in seeds1,2,3,6,7; combat-first ended in Act1 for this sample. None reached Act3 or won. These are descriptions of this fixed sample, NOT strategy superiority, balance, win-rate or fun conclusions.

| Sample | First fork and measured interval | Why retain it |
| --- | --- | --- |
| seed3 | Training:2 transitions,0 combat actions, deck10 retained and one card upgraded. Battle:14 transitions including7 combat-policy actions, accumulated declared action energy costs12, reward increases deck10→11. Both return to map. | A concrete upgrade-vs-addition comparison for subsequent UI interpretation checks. Cumulative energy is replenished during combat;12 is not a one-time entry price. |
| seed5 | Locker returns to map after deck10→9; alternate battle ends in natural loss before map return (4 combat actions, declared action costs6). | Failure-before-reward case, not an assumed free card reward. |
| seed8 | Event upgrades one card; battle adds a card. Both later lose at a1-r2l0 with different states and pitch counts15/25. | Routes can reconverge; same final node does not imply identical experience/state. |

`summary.json` separates fork alternatives, chosen nodes, return/no-return, costs and resource deltas. `results.json` retains all traces and hashes. Policy/engine/map hashes and execution baseline are embedded; SHA256.json fixes the exact audit scripts and evidence.

## Review history / limits

- Draft1 used event as a middle bucket and was not a clean two-category reversal; initial/preflight-cost outputs are preserved, rejected for final inference.
- Draft2 fixed category order but inherited stage+1 as an incorrect boss act label; preflight-order outputs are preserved, not final act evidence.
- Draft3 uses actual node.act, separate rawStage, declared cost/net resources and both validators. Method revision3/3 fixed; no further candidate revision. This is not a visual candidate or reset of G003.
- Same initial seed does not preserve identical future RNG draws, decks or opponents after paths diverge. Small fixed seeds and arbitrary reward/card choices confound any balance conclusion. No confidence interval, human preference or causal win-rate claim is appropriate.
- PR127's cross-runtime map fix is unmerged. These are Node main maps, not proof of identical Chromium paths. No new browser playthrough, screen readability assessment, physical-device test or human study occurred in this cycle. Earlier G024 mobile scroll evidence and failures remain on PR128.
- No product code change, new unit suite, build or deployment in this analysis-only cycle. Actual audit processes exited0. CI may run independently for the Draft. Exact executed scripts use this managed workspace root `/workspace/9-baseball` and temporary runner import location. To repeat here, copy audit-engine.executed.mjs to /tmp/route-choice-audit-preflight.mjs and run.mjs to /tmp/route-choice-audit-20261118/run.mjs, then run from the repo root. Results overwrite only that temporary audit directory. They are preserved execution artifacts, not installed product tooling.

## Next useful experiment

Use a browser-generated, frozen, valid shared-prefix save for the seed3-style training/battle fork, then exercise both choices with the same visible information and compare predicted vs actual upgrade/card result. Confirm route/layout in that browser first because the Node map mismatch remains unmerged. Separate agent input/state verification from a future person's ability to explain the choice; do not recruit/message people without instruction. No new UI/art candidate is proposed here.

## Batch boundary

AGENTS.md says: “기본 최대 6회차/120분이며 같은 체크아웃은 총괄을 포함해 한 명씩 편집한다.”
loop/GAME-AUTODEV.md §1 states: “최대 6회차 또는 시작 후 120분 중 먼저 도달하는 시점. 실패·보류 회차도 포함”.
This batch began2026-11-18 14:39KST and has deadline16:39KST. G022–G027 consume6/6 cycles. Do not start another batch or reset the allowance automatically. All six independent branches leave main/merge/production deployment untouched. G003's separate3/3visualHELD remains. Check the run checkpoint for final completion time and remote artifacts.
