# G-023 map determinism investigation — one independent cycle

- Start/deadline: 2026-11-18 14:54/16:54 KST; maximum one scoped cycle120min.
- Parent authorizes exact cause reproduction and safe local repair in separate Draft; preserve existing saves/maps, no schema/balance decision without evidence. Main/merge/production deploy prohibited. G003 visual3/3 HELD and existing previews unchanged.
- Fetched main fb8e7b13f043e2c17376138abe6696f48c2d8022. Clean branch review/map-determinism-20261118 from main; PR126 QA changes not included. Prior local candidate071f057 and PR126 05898d6 preserved.
- Roles: root coordinator; existingworker(gpt-6-luna/high) reproduction under/tmp only until source handoff; reviewer(gpt-6.1-sol/high) independent cause/save review; explorer for actualinput verification. One product editor at a time. No worktrees.
- Evidence starting point: prior seed3 Node24.19.0 66edges vs Chromium151.0.7922.173 64edges. RNG comparator is a hypothesis requiring same source/options/input and trace confirmation, not yet a proven fix.
- Before contract: full rawmap equality across runtimes/repeatedexecution for same seed/options; new generation valid paths/requiredencounters; existing fullsaved maps remain unchanged through read/resume/reward/nextnode. Frozen baseline fixtures must be captured before editing.
- 9-axis impact: UI/layout no component/style edits (generatedcontent may change for new runs); gestures none; logic generation yes, newseedroutes may differ and must quantify; save compatibility high, forbid regeneration/schemachange; viewport no layoutchanges, actualflows verify; overflow noCSS; flows newrun and oldresume/nextnode; tests crossruntime+frozenoldsave required; build normal/fullregression/size. No balanceweights or rosterdata edits authorized.
- Release limitation: no single oldcrossruntime map contract exists. Any deterministic repair may change future fresh-seed maps; old fullmaps must remain authoritative. Replay-by-seed historical compatibility must be explicit, not falsely promised.

## Final evidence and scope

- Source cause confirmed: comparator scheduling alone differed; first RNG divergence nearest-sort index15 repeats same equidistant pair with inconsistent output in Node. Same source/options/rows, oldseed3 Node66/Chrome64. Only source fix: tie-group Fisher–Yates after pure distance/lane sort,14added/1removedline. Correction1 forG023; unrelated G003 stays3/3HELD.
- No save/version/schema/weights/roster/UI changes. Existing complete maps authoritative. New-seed historical regeneration not promised.
- Final432/432full-map parity (108seeds×4options),864validoutputs,432alternative-sort parity,6seeds×5repeat stability. BaselineChrome101/101unchanged; oldNode34fullmaps/33edge sets/6types-routes-opponents changed; IDs/positions unchanged. Source SHA60dc421615a5757b71ba99bffddff753d8a52980a362e3795dfa6f14e4ce30e0.
- Full249files/1710tests PASS; zone10 unchanged; map100valid/boss300; build52.8/60PASS; screenshot119/119. OldsaveactualUI64before/64after/errors0; freshUIseed3fullmapmatches; strictproduction fullstate noexception + actual win/reward/reload/title/next/loss/3card/.5x/6layouts PASS.
- Original main qa-playable-run obsolete11literal still exits1 actual6; untouched because PR126 fixes separately. Temporary reviewedQA diagnostic with edgeexception removed passes. Not relabeled originalPASS.
- Separate reviewer approvedDraft; independentUX evidence retained. No main/merge/previewupdate/productiondeploy. Physicalhardware, otherbrowserengines, humanfun/difficulty unverified.
- Compact permanent evidence docs/qa/map-determinism-20261118; large rawdataset/trace remain/tmp, hashes/decisiveevents archived. One scoped cycle complete; no extra feature expansion.
