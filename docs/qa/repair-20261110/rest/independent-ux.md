# R2 rest — independent verification

Server http://127.0.0.1:5350/. Product/test files were not edited by this reviewer. Same engine-generated rest fixture as `../rest-before/fixture.json`, with diagnostic runOuts2 and cumulative stats.outs0; normal title Continue resumes it.

## Final verdict

PASS for the implemented mutually exclusive rest choices, persistence, actual next-battle state, and final short-landscape UI. An independently found clipped hero title was corrected by the root editor and explicitly rechecked.

## Actual behavior checks

- Recovery select then select again to cancel: full save unchanged; confirm disabled after cancel.
- Upgrade mode → choose a particular second duplicate `place` card → Back: full save unchanged and confirmation cleared.
- Recovery confirmation: actual full save deep-equals the engine option result; runOuts2→1, cumulative stats.outs0 unchanged, deck/nextId unchanged, no new nextBattleBonus.
- Upgrade confirmation: exact same engine/save comparison; only card IDc1 gets plus, other identical place cards unchanged, runOuts stays2 and deck/nextId unchanged.
- Both committed states survive actual reload/Continue. Actual reachable next battle is entered through map UI; battle.outs starts at1 for recovery and2 for upgrade, with full state deep-equal to enterV10Node.
- runOuts0 disables recovery, all-plus deck disables upgrade, and both unavailable disables both. Skip remains usable in all three cases and produces exact expected map save.
- A separately validated legacy bonus `{technique:8,source:'rest'}` survives new recovery unchanged, transfers to next battle activeBattleBonus once and clears nextBattleBonus. No global bonus deletion.

## Layout and input

Initial full verification used568×320,667×375,844×390,1280×720,1440×900. Both choices have meaningful height, all nine upgrade card names/descriptions fit their own item boxes, footer buttons remain inside viewport. Actual wheel reaches list end; actual CDP touch scrolls only the list; actual Tab reaches footer, without changing saved game. Report has no page errors or failed assertions.

The main helper initially establishes its keyboard starting point with Playwright focus(). A separate stronger check (`legacy-keyboard.cjs`) uses actual card click → Shift+Tab to Back → actual Tab across cards and go/skip, without scripted focus. This also passes.

### Independent issue and final correction

At568×320 the original candidate inherited max-width62% on the hero title, forcing its box to67px width and167.7px height; its top33.375px lay above the hero top66px and got clipped. `header-before-fix.json` preserves evidence. The root editor set the title width to100% with no max-width and shortened the copy.

Final UI retest at568×320,667×375,844×390 confirms title and copy fully inside hero, every choice child inside its tile, footer within viewport. At568 title now y134.47..169.56 inside hero66..217.06. Final screenshot was visually inspected. Actual native Tab→Enter confirms upgrade of cardc0 with exact engine save and runOuts2 preserved. No logic change occurred in that final UI correction.

## Artifacts

- `report.json`, `check.cjs`: five-size layout/input, actual commits/reload/next battle, disabled states/skip.
- `legacy-keyboard.json`, corresponding script: old bonus compatibility and native focus chain.
- `final-ui.json`, corresponding script: corrected small-screen hero/choice bounds and actual Tab/Enter commit.
- `*-final-choices.png`, `568x320-final-native-go.png`: current final visual evidence.
- Older `*-choices.png` and `header-before-fix.json` intentionally retain the superseded clipping evidence.

## Limits

Chromium with emulated touch/keyboard; no physical phone/Safari or manual full-run playthrough. Diagnostic runOuts and old-bonus variants are explicitly fixture tests. Main five-size suite predates the final hero-only CSS/copy correction; the final retest covers the three small sizes affected, plus parent QA covers its broader current candidate.
