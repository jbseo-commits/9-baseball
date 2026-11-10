# Result hand reading pauses automatic progression

Baseline main3d651d0: on a real568×320 normal run, opening the optional hand115ms after result-ready still let the result advance after1583ms. Saved phase changed pitch→battle and the draw reward changed the hand while it remained open. The existing inspector control held the same result, and ordinary folded-hand progression worked. Root controller regression reproduced6 failures (3 controls passed); actual browser baseline12/20 (8 open-hand failures). Initial fallback test's assumed fresh1100ms timer on renderer return was corrected to the existing500ms retry contract before product code changed.

The controller now owns the production drawer state and pauses its existing timeout/retry while the result hand is open. Folding or Escape starts the same1100ms beat; explicit next still works. Standalone views retain local drawer state, legacy/lesson behavior is unchanged. No new timer, engine rule, save schema, result re-sampling, CSS, asset or layout change.

Impact was recorded before implementation in [the execution ledger](../../../loop/autodev/runs/next-20261111-kst0603.md): UI geometry unaffected; input/timer/renderer lifecycles affected; rules/storage unchanged; mobile/desktop, scroll inspection, next/reload, unit/browser/fullsuite/build/deploy guards covered. The old spatial M06 candidate27d7dd8 remains HELD. This is cumulative M06 candidate2 for a new measured temporal defect; no retry reset or failed graphic candidate integration.

## Verification

- Targeted32/32; full245files1671tests PASS; zone-report10 valid; production build52.8/60MiB PASS.
- Timed actual touch/mouse browser60/60,0pageerrors: pitch/between ×568×320,667×375,844×390,1280×720; near-deadline opening, nested inspector, Escape, fresh1100ms resume, no old retry, explicit next, reload.
- Existing default touch/two distinct cards/rotation/save guard42/42 PASS.
- Same-state screenshots retain dimensions and geometry. Raw comparisons differ by22/29/16pixels at568/667/844; **not byte-identical**. Source has no geometry/CSS/asset change and screenshots were inspected. This is a regression comparison, not an art improvement score or commercial-quality claim.
- Separate source/contract review PASS. Independent live UX and exact published preview/main confirmation recorded in the execution ledger when complete.

The test uses a legal between-result fixture selected from deterministic engine seeds. Hidden pending is used only during fixture construction, never to select player actions or alter production information boundaries. Chromium touch emulation is not physical-device evidence. This fix does not claim to pause portrait orientation notices or repair previously held result-text clipping.

Run with existing browser tooling:
```sh
BASE_URL=http://127.0.0.1:4173/ PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs CHROMIUM_PATH=/usr/bin/chromium node scripts/qa-result-hand-pause.mjs
```
Match VITE_BASE between the build and preview server. QA_REPORT_ONLY=1 records baseline failures without changing assertions. Explicit paused browser clocks advance measured intervals, avoiding real-time auto-next timing contamination.

Independent live-clock UX:568×320 actual two-card play held result/save1882ms with hand open; nested inspector closure retained the pause; Escape folded and advancement resumed1310ms later.667×375 manual next worked with the drawer open.844×390 reload retained exact pitch save/phase and resumed folded, held850ms and advanced1214ms after Continue. An initial reload helper incorrectly reseeded the map every load; that observation was discarded and the corrected one-time-session-seed run verified the exact bytes. Desktop independent helper used tap in a mouse context and was not counted; root's timed1280 mouse case is the desktop evidence.
