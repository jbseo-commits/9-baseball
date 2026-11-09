# R3 hand flow — independent final verification (revision3)

Final candidate served at dev http://127.0.0.1:5350/. The root editor owns product/test changes; this reviewer edited only external QA helpers/evidence. All three requested helpers were rerun against the fixed revision3. A separate counter-publication check also passed.

## Final verdict

PASS for the scoped hand-flow feature. No unresolved blocking issue was found in the final executed cases. Two independently found presentation defects were corrected and rechecked: StrictMode initial deal was consumed before playback, and the closed-to-open deciding transient consumed pending shuffle/draw receipts. Historical failure files remain explicitly named before-fix.

## Normal new-game checks

Actual title → new seed3 → power pack → first map battle at568×320,667×375,844×390, without save injection:

- Hand automatically opens; all nine zone centers hit their own actual cell rather than hand-pane/handle overlays.
- First deal masks5 cards, plays draw flights and unmasks all cards. Exactly five HandFlow cardGet calls are observed at each size.
- The cue instrumentation changes only the browser's audio.js response to log actual cue calls. It does not alter product files. This verifies call timing, not audible mix/quality.

`initial.json` contains final evidence; `initial.cjs` is the procedure. Current PNGs show the settled real UI.

## Real multi-card input and pitch boundary

A separately labeled memory-playable seed3 supplies enough cost1 attacks for actual CDP touch gestures. The normal power pack's first hand does not, so these cases are deliberately distinguished from normal new-game coverage.

Both2-card and3-card cases pass:

- Actual card→zone drags at0/4/8; hand remains open after each placement, and every zone center remains reachable.
- Escape/manual reopening preserves placed cards and full engine state.
- Execute automatically folds the hand. Current flight samples show folded state immediately, with no hidden draw slots.
- Known spent-card discard flights may appear during flight; shuffle/draw events only appear in deciding.
- Actual execution and actual next-pitch/batter advancement each deep-equal the engine's full resulting state. Hand automatically reopens at the next decision.

`stack.json` is the final PASS report. `stack-before-final.json` preserves the superseded exploratory assertion result.

## Exact preparation order and same-ID redraw

An explicitly diagnostic validated fixture is based on a normal power run, with one watch cardc7 in hand, empty draw pile and remaining IDs in discard. RNG is chosen for same-ID redraw. It is not ordinary manual player progression.

Final actual UI order matches captureHandTransition exactly:

1. discard c7 during committing;
2. shuffle9 during deciding;
3. draw c2 during deciding;
4. draw c7 again during deciding.

The actual stored state deep-equals the engine. HandFlow cue calls are cardSpend(committing), cardSpend(deciding shuffle), cardGet,cardGet. No result-dependent draw/shuffle cue is scheduled in flight.

Escape/reopen and reload do not replay finished receipts. Reduced motion produces no flights, hidden slots or HandFlow sounds while preserving state. Rotating during the active first flight cancels stale visuals; returning landscape does not replay them. These three variants pass in final `flow.json` and detailed `flow-normal-raw.json`.

## Counter-publication check

`counts.cjs` separately executes two actual Take→Next cycles in memory playable. Across every sampled flight, hand count, handle count and draw/discard text remain equal to the preceding public decision values; hand is folded and hidden slots0. Changes are observed only in deciding. `counts.json` passes.

## Historical diagnostics

- The first exploratory StrictMode run had no initial deal; final normal runs now show all5 cards and cues.
- `flow-normal-before-pending-fix.json` shows only discard and the deciding closed→open transient that lost pending events. `flow-before-pending-fix.json` records its intentional failure. Final files without before-fix suffix pass.
- Before phase folding moved to layout timing, the observer saw about23ms of open hand on a preliminary Take flight. Final stack cases no longer show that transient.

## Limits

Chromium emulated touch/keyboard, dev candidate, not physical phone/Safari or rebuilt production. The basic timing/state/visibility boundaries were verified, but no claim of complete art-motion polish, sound listening, performance budget, every card footprint or full-run balancing is made. Rotation was tested during hand-flow playback, not mid-pointer card drag. Parent has separate broader product tests/review.
