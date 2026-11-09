# Rest choice — PR96 part2 (before implementation)

Global run repair-20261110 started07:45KST/deadline09:45KST; R2 revision1. User explicitly confirms1out recovery, or1card upgrade. Branch codex/repair-rest-choice-20261110 starts from current main08765b0 independently while shopPR97 runs CI. Root sole editor. Other balance/boss recovery/save schema unchanged. Parent shop implementation is not duplicated; merge newest main before final integration tests.

| Axis | Impact | Mitigation / acceptance |
| --- | --- | --- |
| UI/layout | Yes | Rest-only two choices; upgrade reveals eligible cards+cancel; readable bounded list/fixed footer, before/after gate. |
| Input/gesture | Yes | Selection/cancel never spends visit; disabled zero-outs/unupgradable choices; confirm once; scroll/keyboard/touch. |
| Logic/balance | Authorized | Recover exactly1 runOut, min0, OR upgrade one valid specific card ID; no double reward; stats.outs/deck count/nextId invariant; boss full recovery preserved. |
| Save/resume | Yes compatibility | Keep legacy rest utility history/+8 or event nextBattleBonus; consume by existing next-combat path; roundtrip after each actual choice. No schema version change. |
| Viewport | Yes |568×320,667×375,844×390,PC; restore rest intrinsic rows without changing other facilities. |
| Scroll/overflow | Yes | Rest list only; no global CSS; main shop changes merge independently. |
| Flow | Yes | Map previews and old boss-only-healing copy corrected; cancel/skip/confirm→map→next combat/resume. |
| Tests | Yes | Red before engine changes:0/1/2outs, invalid/duplicate/cardID/old action/legacy bonuses; actual App choice/cancel/persistence; full/smoke. |
| Build/deploy | Check | Build/budget, independent review, fresh art gate, CI/public actual rest checks and main merge under existing explicit authorization. |

No product changes at record creation. Baseline is engine option rest technique8 and generic +8 tile. This approved rules change replaces only newly awarded rest effects, never deletes already-earned bonuses.

R2 revision3 final:7new engine tests initially5red, now9engine+4App tests and full241files1644PASS. Independent review found/traced training/locker type-confusion; strict type+validID guards and2counterexamples fixed it. Old newly-awarded+8/readability tests follow the approved rule; legacy rest/event bonus roundtrip and actual once-only next-combat consumption remain covered. Independent real UX5sizes/10flows+legacy/native-keyboard/next-opponentouts PASS; initial568hero clip fixed by removing inherited62% title width. Visual candidate1NOT_IMPROVED(-.50) retained inQUALITYLOG; final panorama/frame candidate freshsealed+0.56/5axesIMPROVED/notBAR. Smoke10/build/budget52.8PASS. [Evidence](../../../docs/qa/repair-20261110/rest/README.md). Root sole editor; R1 maine8aa628 integrated before final full tests. Public status will be recorded in PR. Human learning/fun not measured.
