# Hand flow — PR96 part3 (before implementation)

Global repair-20261110 start07:45/deadline09:45KST; R3revision1. User approved automatic hand and real discard/shuffle/draw. Branch codex/repair-hand-flow-20261110 stacks on rest f6d11c6 while PR98 CI runs; it cannot publish to main before PR98. Merge actual latest main before final tests. Root sole editor. Rule/save/RNG changes forbidden; no packages/providers. Existing PR90HELD retained.

Independent before-plan audits identify:draw occurs at opening/prep/attack/next-pitch/next-batter; same-ID discard→shuffle→draw cannot be inferred from hand differences; initial pack-role/defense swaps alter final opening hand after actual pops. Use a synchronous WeakMap sidecar capture around the existing single engine transition, clone propagation, finally cleanup, and a final initial-deal event. No trace in state/save or generic-shuffle instrumentation.

| Axis | Impact | Acceptance / mitigation |
| --- | --- | --- |
| UI/layout | Yes | Same right-hand/card/zone layout, auto-open on selection phase, stay open during placement; decorative card flights and actual pile anchors. |
| Input/gesture | Yes | Manual fold/Escape respected in current phase; no additional engine/input lock; overlay pointer-events:none; drag/rotate cancels stale geometry. |
| Logic/balance | High-risk shared engine instrumentation | Traced/untraced full state, seed, pitchSeed and save JSON identical; no rerolls/double transitions; invalid/throw/nested capture cleanup. |
| Save/resume | No schema | Queue only React state/ref, clear on resume/navigation; no reconstructing old events from saves. |
| Viewport | Yes |568×320/667×375/844×390/PC; stable focus-root clipping and safe positions, motion speed/reduced motion. |
| Scroll/overflow | Yes | Preserve nested hand/dialog/map scrolling; no global CSS/events. |
| Flow | Yes | Initial entry/prep/take/next-pitch/next-batter/KO/reward/resume. No ghost discards for take/basic. |
| Tests | Yes | Event order/sameID/opening final-deal, engine equivalence, preimpact DOM/ARIA/piles/audio invariant, native multi-card inputs, full suite/smoke. |
| Build/deploy | Check | Production size/build, independent code/UX and fresh motion/static evidence; CI, exact main bundle/public flow. |

Receipts may contain result-dependent draw events internally, but no cards/count/pile movement/start/sound may reveal them before landed. Playback for result receipts is deferred until the next selectable hand opens; subsequent receipts remain ordered. Never treat event generation as public display permission.

## Checkpoint08:47 KST

R3revision3. Actual latest main1317119 fast-forwarded before final checks. Full243files1653testsPASS, smoke10/build/dist52.8MiBPASS; independentUX PASS, codefinalreviewpending. Fresh sealed visual gain+.0625,2/8 axes → NOT_IMPROVED, notBAR. HELD; preserve Draft, do not merge. Three product revisions exhausted. Continue independentR4/R5 from main, not this branch. Evidence docs/qa/repair-20261110/hand.
