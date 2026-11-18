# Card-first decision lab — bounded cycle

Authorization: latest user requests autonomous development until redirected; delegated scope is ONE bounded cycle, separate Draft PR / owner-private preview only. No main edits, merge, production deployment, new packages, core balance or save-schema changes. Start 2026-11-18 13:32 KST; deadline 15:32 KST. Single checkout and single writer. Base origin/main fb8e7b13f043e2c17376138abe6696f48c2d8022. Prior #123/#124 remain separate; their tests/art verdicts are not current candidate evidence. G-003 hypothesis (first-five-minute decision comprehension), one experiment, correction budget 2/3 (toolbar/roster; inherited save-read guard).

## Evidence and decision before implementation
#124's 300ms flight with 160ms swing preparation requires launch at 140ms; late slider break peaks around 225ms. Seeing the break cannot inform that launch. Same contact/arrival means profile recognition does not itself reward a different choice. Approved x3/x1.5/x1 values were experimental assumptions, never existing engine rules.

A: slow reactive flight: more reaction time, but changes game identity and needs new timing/balance validation. Reject this cycle.
B: card-first, unlimited pre-pitch decision using actual engine hand/coverage/energy, then normal outcome presentation: preserves strategy and public-information contract. SELECT.
C: post-result counterfactual comparison: could teach tradeoffs but risks treating one hidden draw as expected value and adds alternate-state lifecycle. Defer.

Reuse existing memory IntegrationPreview and production decision/result UI, with a genuine seeded first encounter and a small explicit decision/retry guide. No duplicate damage formula or extra result receipt where existing explanations already suffice. Fixed seed reset enables player-authored alternate decisions. This tests comprehension hypothesis, not human fun. Pitch profiles stay cosmetic; no new profile-to-damage mapping. PXF remains on #123/#124; this experiment adds no FX assets.

## 9-axis impact analysis (before code)
1. UI/layout: affected isolated lab guide/toolbar; reuse current battle UI, scoped CSS only.
2. Input: affected reset/decision route; existing card/zone/stack controls, guard duplicate commit, reset cancels clock.
3. Logic/balance: no engine mutation; actual create/enter/action/advance functions only. No synthetic swipe judge.
4. Save: no live Duel mount or save/bootstrap, memory state only; fix animation rate to avoid preference writes.
5. Mobile: affected lab toolbar; verify small landscape and portrait rotation overlay/state preservation.
6. Overflow: scoped lab guide only, no body/root overrides; check buttons visible at 568x320.
7. Existing flow: default IntegrationPreview and main entry unchanged; regress title/map/battle/reward/facilities/resume.
8. Tests: seeded reset identity, legal preparation/take/attack, no hidden state in guide, lock/restart and storage noninterference; full suite/smoke/browser.
9. Build: separate review branch (not Pages auto-preview prefixes), production build/dist budget; owner-private static preview if available.

## Roles / gates
Root integration and docs, worker implementation, reviewer independent read-only, fresh blind visual call before gameplay review. Existing reviewer recommends B, authoritative result only after normal reveal, no pending/roll/next-hand exposure. Existing G-020/#121 visual-failure history remains unchanged. Technical passing is distinct from art BAR and human understanding. Mandatory technical failures prevent remote publication. NOT_IMPROVED bars Ready/release; an explicitly requested Draft may preserve visual HELD.

## Outcome
Technical validation complete:249 files/1714 tests, build,52.8MiB/60, zone10 unchanged,119/119 current regression, lab actual12-pitch defeat/reset/no-save and5viewport boundaries pass. Blind3.00→2.94 NOT_IMPROVED/BARnotmet: visual HELD, human understanding/fun NEEDS_HUMAN. Code review no remaining blocker; independent UX pending. Full evidence docs/qa/card-decision-20261118. No remote publication yet.

## Scoped auto-advance guard impact (implementation addendum)
- UI/inputs: affected only in opt-in decision lab; keep the existing manual next-pitch/next-batter control available after the normal result presentation. Do not auto-advance while the user is reading. Existing preview default remains `autoAdvance=true`.
- Engine/balance: no state transition or judgement changes; only suppress presentation host auto-next callback for the lab.
- Save/load: none; lab stays in memory and does not mount `Duel`.
- Mobile/overflow: no layout or root selector changes; existing responsive Battle UI dock owns manual next.
- Regression: assert preview default retains auto advance and lab `autoAdvance=false` waits for the user's manual next action. Include build.

## Final implementation detail
The exact delivered lab timeline uses the real roster release plus300ms flight (not300ms from commit); hidden-result prefix parity is tested through the final helper. Default production controller remains unchanged apart from a default-true autoAdvance prop. Main-based build excludes unmerged #123/#124 assets; those branches and licenses remain untouched. No third-party asset import.

Checkpoint: implementation/evidence commit `0c842b496c789fdf4b0aa1b6bbc590015390e410`. Production119/119 general regression,42/42 defaulttouch and existing realplaythrough completed. Independent reviewer final: no technical code blocker; Draft+visualHELD only. Same-seed lab12pitches→naturaldefeatHP19 and reset passed with public-only fixed policy. No writes/pageerrors. Separate owner-private Sites project `appgprj_6afd2f651dfc81919f53012bc805fdd1`, owner-only access confirmed. Static source commit `519c8d32903dc40a20ae369c084cfe1549882fca`; deployment pending independentUX. Official main and priorbranches unchanged.

## Storage-read correction 2/3 — before code
Final native Storage.getItem instrumentation revealed inherited `v10-relic-ui.js` MutationObserver calling `state()` on the lab route and reading `9zone-v10-run` (no writes, no lab state consumption). Publication paused. Extend its existing `battlePlay=1` isolation guard to exactly `showcase=card-decision`, no generic storage shim. 9-axis: UI existing lab decoration absent/no production change; input none; engine/balance none; save READ isolation affected and must spy before/after; mobile/overflow none; ordinary live relic decoration must retain existing behavior; tests observer/storage isolation + ordinary path; build rebuild and size recheck. Full suite and affected browser checks rerun after this correction. Existing BGM preference read is presentation preference, not game save; it need not be disabled.

Correction2 final gates:250files1717tests exit0; build52.8MiB/60; final native lab12pitch/reset and5viewport read/write-spy checks pass; defaulttouch42/42pass. Independent UX complete: same-choice ground-ballHP60→44 repeats afterreset, portraitnotice/statekept;568density stillpoor. Independent code approved readguard. VisualHELD and NEEDS_HUMAN remain. Supersede initial0c842 artifact before first deployment; old artifact was source-pushed only, never deployed.

## Final checkpoint — one cycle completed
Draft PR125 https://github.com/jbseo-commits/9-baseball/pull/125; branch review/card-decision-lab-20261118. Runtime commit a4b36ad2f6ae90172f4c1793166d1806f2a0f293. Site finalsource41c22eebe732dd3ca6c634b5ba588dcd33bf3b3a replaced unpublishedinitialsource; deployment appgdep_6afd322775248191a5277847056d5aa1 succeeded withowner-onlyaudience at https://ninezone-card-decision-lab-20261118.credin1.chatgpt.site/?showcase=card-decision . Managed Chromium ERR_TUNNEL_CONNECTION_FAILED: remote gameplayNOTVERIFIED, identicalstaticartifactlocalplaypassed. No authbypass, no productionrootdeploy. Mainfb8e7b1 / #123dc67424 / #12492a5839 confirmedunchanged.

Cycle1/1, corrections2/3. Technicalpass separated fromvisualHELD(3.00→2.94NOT_IMPROVED) andhumanNEEDS_HUMAN. Next highestvalueexperiment: replace permanentlab instructionbar with contextualhand/decision guidance and ask actual players to make two choices and explain the results; do not invent reactive/cardrules or optimizeartscoreto claimfun. This checkpoint ends the single delegated cycle; no background daemon/reservation/automaticmain integration.

## Authorized continuation — contextual hand guidance, final correction 3/3
2026-11-18 14:14 KST, parent authorizes one more bounded cycle on the SAME candidate/PR125 and SAME owner-private Site. Deadline16:14KST. Cumulative2/3 corrections consumed; this is the sole remaining3/3 attempt, not a renamed issue or reset art gate. Baseline a1aaca96aaa371fdaad4dda60504161ff7cddbd4; remote/mainfb8e7b1 unchanged. Scope only permanent banner crowding; no rules/multipliers/card data/storage changes. If candidate fails gates, preserve failure/HELD and stop further product correction.

Before-code9axis: UI affected lab guidance/reset relocation insideexistinghand/menu, no permanentheader height. Inputs affected existinghandopen/reset accessibility, especiallyflight/terminal; retain44px control andcancelclock. Logic/balance none, authoritative publicVM only. Storage none (preserve prior exactguard). Mobile affected568/844smalllandscape; portraitnotice/state. Overflow affected handdetails only, no root/global CSS override. Existingflows protected by opt-in prop/defaultnull; runwholeflow regression. Tests contextdecision-only hints, hiddenresult parity, reset/rotation/saveaccess; fullsuite/smoke/build/dist. Deployment only existingDraft125/ownerprivateSite, nevermain.

Controlled comparison: fixedseed20261118, realfirstopponent, handopened/no cardselected, sameclock/viewport/font/assets.568x320 and844x390. A previousbanner; B candidate with QA-only hidden contextualhint; C fullcandidate. B is diagnosticablation notsecondproductcandidate. Record A/B removal+resetrelocation (notpureinstructionsemantic effect), B/C contextualhint incremental effect, A/C finalquality.6blind sheets, same8axes, freshagent withno code/key/context. Existing3.00→2.94 record stays; differenthandstate scores notdirectlysubstituted. Otherstates(selected/result/flight) viaactualUX/tests. Browsercoarsetouch/resize !=physicaldevice testing.
Preplan reviewer: reset cannot live solely inside folded hand/menu because those lock in flight. Use optional lab-only44px reset in existing HUD tool area independent of action lock; ordinary prop absent. Hand hint only open/unselected/deciding/noinspector, never hiddenresult. A/B explicitly tests removal+resetrelocation package; B/C isolates hint. Do not claim pure strip-removal causality from A/B. Allsix sheets mandatory, noafterblind aestheticiterations.

## Correction3 result — limit exhausted, product HELD
Final candidate changed only lab instruction placement/optionalHUDreset + focusedtests. Beforeblind source frozen. Mandatory568x320 resetrect(203.71875,-2,44,44)FAIL: only42px verticallyvisible. No fourthproductrevision. Full250files1719tests/build52.8MiB/zoneunchanged/defaulttouch42/general119 andactual12pitch/resetflow pass, but do NOT overrideviewportfailure. Independentreview CHANGES/HELD. Diagnosticcontinuation retainsgeometryFAILexit1 andchecksotherinputs/saveaccess.

Strictablation refinement: Aoriginal preserved; A′oldbanner withresetnormalizedtocandidateHUD andreservedhiddenoldreset; Bcandidatehintoff byQAonlyCSS; Cfull. Normalization insertion-order initiallywrong, QA-only correction beforeblind provesrelativeboundsidentical.6sheets2sizes: A′/B3.28→3.47(+.19,3axes,NOT_IMPROVED); B/C3.50→3.28(−.22,NOT_IMPROVED); A/C3.06→3.31(+.25,4axes,IMPROVED). ALL NOT BAR_MET. Priorfolded3.00→2.94 historyunchanged; state/judgedifferencesnotcomparablescores. Hint addsclutter inthisjudgment; no humanunderstanding/funproof.

Candidate src+tests diffSHA2566d3d8ed8ee443eeccd13bf4d34ba4feb1d99e2b309c5881da61d2ec119c9f487, localonly. Evidence docs/qa/card-decision-20261118/correction-3. SamePR125 docs-onlycheckpoint authorized; do notpushfailedruntimeorupdateSite. KeepSite runtimea4b36ad/deploymentappgdep_6afd322775248191a5277847056d5aa1. Cumulative3/3 exhausted; stopthisissue. Historicalmobilefeedback interpretiveonly, notnewrules/portraitscope orpermissionforanothercorrection.

Final independent UX: at568×320 unselected-hand hint pushes energy x598–653 and basic swing x656–724 outside viewport; selection hides hint and restores them. Second blocking failure, no fourth edit. Portrait coarse-pointer fixed rotation notice reconfirmed; underlying portrait overflow is not a newly adopted portrait-play requirement. Browser emulation only. Docs-only publication; failed runtime remains local.
