# Keep the landed result while the rotation notice covers it

Baseline3d651d0 live phone runs advanced a folded-hand pitch result to battle while the real CSS `body::before` rotate notice covered it (2444ms at390×844,2213ms at360×800). A paused-clock replay of the same UI-produced result reproduced it. Parent9491cd0 already contains the independent hand-inspection fix; it still reproduces this distinct rotation trigger. This is a G001 result-notice fix, not an M06/M07 retry reset.

The existing orientation utility now exposes the notice's portrait+coarse media state and a lifecycle-bounded subscription. The battle controller uses React's external-store hook to pause its existing1100/500ms timer while the notice applies. Each automatic callback also rechecks the live query, preventing a deadline race before a media notification. Legacy explicit routing/fine pointers are excluded; unsupported-art fallback requested as vnext is included because the same CSS notice covers it. No new timer, CSS, fullscreen request, presentation-clock pause, result replay, engine rule or save schema.

Impact and acceptance were recorded before code in [the run ledger](../../../loop/autodev/runs/next-20261111-kst0603.md). The only global observation is a mounted-battle resize/media subscription with cleanup, including older addListener APIs. Manual next is unchanged. This does not claim to block every keyboard action under a CSS pseudo-element, replay unseen effects, or prove physical-device sensor behavior.

## Verified candidate

- Unit baseline8 failures/5 controls; final targeted38/38. Final full246files1685tests PASS; smoke10 valid; production build52.8/60MiB PASS.
- Actual browser28/28,0pageerrors: three coarse phone sizes rotate10ms before deadline; exact bytes held behind the real notice; landscape1099ms unchanged then1100ms exact engine next. Includes next-batter, hand composition, reload while title is covered and fine-pointer control. Reload while portrait verifies durable save under the title notice and later Continue, not a mounted result component at initial portrait; that initial mounted case is covered by unit tests.
- Independent live-clock390×844 held exact result2400ms, then landscape1021ms unchanged/1178ms exact engine next.430×932 hand-open composition stayed paused after return until folded. Session-guarded reload held exact bytes/folded state and resumed by1166ms. Zero pageerrors.
- Parent9491 automated baseline11/15: four notice-preservation failures; later expectations are skipped after the result already advanced. Candidate28/28 includes those downstream checks.
- Independent exact-save observations are compacted as SHA256+UTF8bytecounts in independent-ux-summary.json; raw external report is preserved.
- Independent source/contract review PASS; requested next-batter coverage added. Published preview/main verification is recorded in the execution ledger when complete.

Use existing browser tools:
```sh
BASE_URL=http://127.0.0.1:4173/ PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs CHROMIUM_PATH=/usr/bin/chromium node scripts/qa-portrait-result-pause.mjs
```
The normal coarse cases use default routing; only the fine-pointer control forces vnext to keep renderer selection from masking the assertion. QA_REPORT_ONLY=1 records unchanged baseline failures. A legal deterministic between-result fixture uses hidden pending only during QA construction, not as a player policy. Keep VITE_BASE identical for build/preview.
