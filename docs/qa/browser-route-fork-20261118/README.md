# G028 — Browser-generated route fork audit

Baseline: `fb8e7b13f043e2c17376138abe6696f48c2d8022` (main). This PR changes QA and evidence only, not gameplay, layout, assets, rules, RNG, saves or deployment. PR127's runtime-independent map generation remains unmerged, so this audit starts with the full accepted **Chromium-generated** state rather than assuming Node's same seed produces the same map.

## Observed result

At seed3 the actual first battle naturally wins after6 pitches/8 actions. The first reward is **skipped**, producing deck9 and reachable battle/event/training. This differs from G027/PR131's first-eligible reward-add policy; these are not identical cross-cycle states. Both fork sessions restore the same accepted state without changing HP, RNG or reachability.

- Training `a1-r1l3`: select offered `c0`/정타 노림, confirm upgrade, return to map; deck9 remains9, selected card plus=true.
- Battle `a1-r1l1`: same exact-preview QA combat policy, natural victory at cumulative13 pitches, select offered counterPrep, confirm reward; deck9→10.
- UI transitions and full saved state match independently imported engine actions/advances. This confirms a concrete difference in available route outcomes, not a superior route, human strategy, enjoyment or balance.
- Final run exit0, no pageerrors across bootstrap/probe/both forks; no reads/writes/removes to the six enumerated raw production keys. Preview-prefixed session traffic is separately reported. This is not an exhaustive claim about every possible browser storage API/key.
- Accepted canonical/session SHA256: `6a719b580b0e185ec409857dd477759e5c1de33b52a75864420601486f429306`; pretty-file SHA256: `f2e7ca37fb14e913afd78db85f418e8f35ff5c7d4659d9f25ea93b1934e1c3c0` (original/corrected/final identical).

## Reproduce

Build and serve this checkout, then run from a machine with Playwright/Chromium installed:

```sh
QA_BASE=http://127.0.0.1:5198/ QA_OUT=/tmp/browser-route-fork \
NODE_PATH=/opt/codex/cua_node/lib/node_modules CHROMIUM_PATH=/usr/bin/chromium \
node scripts/qa-browser-route-fork.cjs
```

Paths above describe the actual managed environment, not an added dependency. `QA_REPO_ROOT` optionally overrides the script-relative repository root. Browser inputs use touch emulation, reduced motion and a virtual clock for battle progression; this is not timing/physical-device validation. Policy uses exact engine preview, not human limited-information knowledge. The memory sessions are isolated from ordinary game saves.

Initial natural loss preserves its state and exits2 because fork checks are unavailable. Nonterminal action cap/no-op fails nonzero. A natural fork loss is recorded as such, with card-addition untested. No forced wins or retries until victory. All pageerrors/observed production accesses fail. A dedicated non-production probe in a separate context proves get/set/remove interception works. This browser gate is manual, not silently wired into CI.

## Verification and correction history

- `pnpm test`:248 files/1706 tests PASS, exit0.
- `node scripts/zone-report.js 10`:exit0; first-pitcher public-policy smoke only, not a complete-run/fun measure.
- `pnpm build`, `pnpm check:dist`:exit0;52.8 MiB/60 MiB.
- Final checked-in QA script:exit0, report/screenshots under `final/`.
- Independent reviewer approved final termination/error/storage handling after actual diff review.
- QA correction3/3 frozen. Original collector omitted fork pageerrors from aggregate and wrapped shared Storage.prototype twice; correction2 aggregated errors, classified receiver once, distinguished incomplete terminal outcome and made paths portable. Correction3 made incomplete/no-op nonzero and early natural loss unavailable, with report preservation. Preflight reports retain those limitations and are not final evidence.
- Remaining report-label limitation: no-op can also carry `capped=true`/a “60-action cap” interpretation; `noOp` identifies the actual reason. Neither occurred in the final run. No further correction budget is allocated here.

No preview deployment is necessary for QA-only changes; existing owner preview and visual G0033/3HELD stay unchanged. No merge or main push. Human comprehension/fun and physical mobile checks remain unperformed. Facility compression remains a known separate PR103 issue; do not call this audit a visual improvement.

## Independent UX inspection

`ux/` preserves the original observational collector and its explicit correction/findings. Unlike the memory-only fork harness, this reviewer used the ordinary `?battleUi=vnext` Continue flow with the frozen fixture placed into localStorage in **fresh isolated browser contexts**. It did not access the user's browser/profile. Normal resume/upgrade saves are expected; preview and rotation were compared against the actual post-Continue bytes, not the pretty fixture. The collector is a historical environment-specific artifact, not the reusable gate.

At568×320 and844×390, native CDP touch drag changed route scrollLeft by251/81px. Training→Event→Training previews did not commit state; touchcancel did not select/enter. Selected node/text survived portrait/back resize; corrected exact-byte save preservation was directly rechecked at568×320. The first report incorrectly compares pretty JSON to compact resumed bytes, and uses nonexistent boundingBox.right/bottom: those false flags are invalid, not product failures. Map Go is52px high and within both viewports using x+width/y+height.

Actual training entry/upgrade matched engine. The offers are only14px high at both sizes and visibly hide text: **known facility compression, PR103 Draft/HELD**, not solved here. Single Go returns to map; double tap80ms apart at the same coordinates selects a Rest preview with the second tap but never enters it. No pageerrors. Browser touch/resize emulation is not a physical mobile test; no human comprehension/fun measurement.

Archived baseline text logs have trailing whitespace/empty EOF lines normalized; command content and results are unchanged.
