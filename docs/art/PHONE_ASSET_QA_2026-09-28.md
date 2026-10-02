# Phone asset queue · A01–A09, C01–C11 asset QA

This review covers **source images only**. A01 and A02 came from the previously reviewed user originals; A03 and A04–A09, and C01–C11 were created with the built-in image generator using the target mockups and existing game art as references. An earlier multi-trail A03 candidate was rejected; the committed A03 contains one ball and one coherent trail. A04 and A05 were revised after the first versions touched the canvas edges. Initial C01, C04, C07 and C11 variants were replaced because they repeated existing compositions or missed the requested scene/identity.

## Checks

| Asset set | File/dimensions | Check result | Remaining integration check |
| --- | --- | --- | --- |
| A01–A09 | Nine PNGs, long edge 1377–1774 px except 1024×1536 portrait actors; exact dimensions/bounds in [`manifest.json`](../../assets/production-art/phone-assets-v18/manifest.json) | Four cutouts A01/A03/A04/A07 and A09 have corner alpha zero; A05 has corner alpha zero; A02/A06/A08 are opaque. One baseball in A03. Character hands, feet and equipment inspected at source scale. | Precise compositor pivots, lighting and A09 timing in the actual game. A02 contains small decorative pseudo-glyphs on stadium LED ribbons; check them at final screen size if the signage will be visible. |
| C01–C11 | Eleven `1024×1536` opaque RGB PNGs at `assets/cards-v15/family-*.png` | All 11 family subjects differ and are distinguishable on the [100px contact sheet](working/phone-assets-v18-qa/family-contact-100px.png); no card text/frame was baked in. Female Red Rush in mental/intel keeps red hair, black/red top and long white pants. | Validate actual card-window `cover` crop and compare family art side by side with the full card UI. The family mapping lives in `claude/integrate-ag-v15`, so this branch alone does not use these files yet. |

Mobile composite sanity previews: [home run 844×390](working/phone-assets-v18-qa/homerun-844x390.png), [title 412×743](working/phone-assets-v18-qa/title-412x743.png), [ending 844×390](working/phone-assets-v18-qa/ending-844x390.png). These are rough layers without menu/logo/UI. The title preview shows that the hero's feet float at this draft placement; final title composition must lower/scale/crop the hero and independently reserve logo/menu safe areas. It is **not** a title-screen pass.

## Impact analysis before runtime integration

| Axis | Asset-only impact | Follow-up |
| --- | --- | --- |
| UI/layout | Needs verification | Scene layer sizes and card-window cover crop need game screenshots. |
| Input/gestures | None | No input code changed. |
| Game logic/balance | None | No gameplay code changed. |
| Save/load | None | No schema changed. |
| Mobile viewport | Needs verification | Final 412×743 and 844×390 screenshot comparison; title composition still needs placement work. |
| Scroll/overflow | None | No CSS changed. |
| User flow | None so far | Assets are unconnected on this branch. |
| Tests/regression | Needs verification at integration | Run visual/flow regression after code imports and animations. |
| Build/deploy | None so far | No imports or bundled paths changed here; when merging the V16 card branch, verify family filename lookup and production build. |

**Status:** Individual source image inspection passed. No claim of 10-screen mockup fidelity, completed animation, V16 runtime connection, or final R1–R8 quality score. Conditional B slots and C126–C235 per-card illustrations remain open; C101–C125 source-image checks are recorded below.

## C101 pinpoint follow-up

`assets/cards-v15/card-pinpoint.png` is a new 1024×1536 opaque RGB PNG for the `pinpoint` card. It shows the existing #9 batter making one compact, accurate bat-to-ball contact at a single illuminated strike-zone cell. The baseball, bat, hands and gaze are connected; there is no card text or frame. The decisive contact remains readable in the [100px preview](working/c101-pinpoint-100px.png). `src/duel/card-art.js` selects this file before the precision family fallback. The final card-window crop and full mobile screen have not been visually approved. C102–C235 remain open.

## C102 eyeLevel follow-up

`assets/cards-v15/card-eyeLevel.png` is a new 1024×1536 opaque RGB PNG for the `eyeLevel` card. A first close-up candidate was rejected because it repeated C101's composition. The selected version shows #9 from behind, waiting with an upright bat for one eye-height pitch, with two adjacent horizontal strike-zone cells. The pose, ball and paired cells remain readable in the [100px preview](working/c102-eye-level-100px.png). No text or card frame is baked in. `src/duel/card-art.js` selects this file before the precision family fallback. The final card-window crop and full mobile screen have not been visually approved. C103–C235 remain open.

## C103 verticalRead follow-up

`assets/cards-v15/card-verticalRead.png` is a new 1024×1536 opaque RGB PNG for the `verticalRead` card. It shows #9 lowering his stance toward one dropping baseball and two illuminated strike-zone cells stacked vertically. The bat, ball, body silhouette and vertical pair remain readable in the [100px preview](working/c103-vertical-read-100px.png). No text or card frame is baked in. `src/duel/card-art.js` selects this file before the precision family fallback. The final card-window crop and full mobile screen have not been visually approved. C104–C235 remain open.

## C104 readStrike follow-up

`assets/cards-v15/card-readStrike.png` is a new 1024×1536 opaque RGB PNG for the `readStrike` card. It shows #9 driving one read pitch off the bat, with a restrained cobalt trajectory from the mound and a warm contact burst. Both gloved hands hold the bat; the hitter, ball and contrasting read/impact lights remain legible in the [100px preview](working/c104-read-strike-100px.png). No text or card frame is baked in. `src/duel/card-art.js` selects this file before the precision family fallback. The final card-window crop and full mobile screen have not been visually approved. C105–C235 remain open.

## C105 surgeon follow-up

`assets/cards-v15/card-surgeon.png` is a new 1024×1536 opaque RGB PNG for the `surgeon` card. From over the catcher's shoulder, #9 meets one baseball at the bat's sweet spot and sends a thin gold line toward fair territory. The joined gloved hands, grounded feet and single contact point remain readable in the [100px preview](working/c105-surgeon-100px.png). No text or card frame is baked in. `src/duel/card-art.js` selects this file before the precision family fallback. The final card-window crop and full mobile screen have not been visually approved. C106–C235 remain open.

## C106 needle follow-up

`assets/cards-v15/card-needle.png` is a new 1024×1536 opaque RGB PNG for the `needle` card. #9 uses a restrained swing to send one baseball through a narrow luminous aperture, with a thin trajectory and no large power burst. The batter, ball and aperture remain distinct in the [100px preview](working/c106-needle-100px.png). No text or card frame is baked in. `src/duel/card-art.js` selects this file before the precision family fallback. The final card-window crop and full mobile screen have not been visually approved. C107–C235 remain open.

## C107 counterRead follow-up

`assets/cards-v15/card-counterRead.png` is a new 1024×1536 opaque RGB PNG for the `counterRead` card. #9 redirects one anticipated pitch toward the open opposite-field gap, with female Red Rush small and off balance on the mound. Her red ponytail, black/red top, long white pants and brown glove match the established identity. The batter, outgoing ball and secondary pitcher remain readable in the [100px preview](working/c107-counter-read-100px.png). No text or card frame is baked in. `src/duel/card-art.js` selects this file before the precision family fallback. The final card-window crop and full mobile screen have not been visually approved. C108–C235 remain open.

## C108–C110 precision follow-up

All three are new 1024×1536 opaque RGB PNGs. C108 [`card-onePatience.png`](../../assets/cards-v15/card-onePatience.png) shows a controlled follow-through, one baseball and the next empty target cell becoming visible; [100px preview](working/c108-one-patience-100px.png). C109 [`card-laserEye.png`](../../assets/cards-v15/card-laserEye.png) connects one fully visible baseball to the bat tip with a narrow diagonal sightline; the first version was rejected because the ball touched the image edge, and the [100px preview](working/c109-laser-eye-100px.png) uses the corrected composition. C110 [`card-coldRead.png`](../../assets/cards-v15/card-coldRead.png) shows #9 holding the bat still while reading one pitch at the crossing height/side guides; [100px preview](working/c110-cold-read-100px.png). No text or card frame is baked in. `src/duel/card-art.js` selects these named files before the precision family fallback. Final card-window crops and mobile screens have not been visually approved. C111–C235 remain open.

## C111–C113 precision follow-up

All three are new 1024×1536 opaque RGB PNGs. C111 [`card-focusBreath.png`](../../assets/cards-v15/card-focusBreath.png) is a still preparation moment: #9's breath narrows toward a tiny glint on the bat tip; [100px preview](working/c111-focus-breath-100px.png). C112 [`card-markZone.png`](../../assets/cards-v15/card-markZone.png) shows the back of #9 as the bat points at one gold dot in the center strike-zone cell; the first version's dot was in the wrong cell and was rejected, while the [100px preview](working/c112-mark-zone-100px.png) uses the corrected point. C113 [`card-perfectRead.png`](../../assets/cards-v15/card-perfectRead.png) shows one baseball at bat contact with compact cobalt prediction and gold impact rings; [100px preview](working/c113-perfect-read-100px.png). No text or card frame is baked in. `src/duel/card-art.js` selects these named files before the precision family fallback. Final card-window crops and mobile screens have not been visually approved. C114–C235 remain open.

## C114–C116 power follow-up

All three are new 1024×1536 opaque RGB PNGs. C114 [`card-fullSwing.png`](../../assets/cards-v15/card-fullSwing.png) shows a full-body rotational swing at one contact point, with an amber bat arc; [100px preview](working/c114-full-swing-100px.png). C115 [`card-moonshot.png`](../../assets/cards-v15/card-moonshot.png) shows one towering baseball passing a crescent moon against an indigo sky; [100px preview](working/c115-moonshot-100px.png). C116 [`card-gapHunter.png`](../../assets/cards-v15/card-gapHunter.png) shows one ball heading between two distant outfielders; [100px preview](working/c116-gap-hunter-100px.png). No text or card frame is baked in. `src/duel/card-art.js` selects these named files before the power family fallback. Final card-window crops and mobile screens have not been visually approved. C117–C235 remain open.

## C117–C119 power follow-up

All three are new 1024×1536 opaque RGB PNGs. C117 [`card-pullHook.png`](../../assets/cards-v15/card-pullHook.png) shows #9 pulling one inside pitch toward the left foul pole on a curved path; [100px preview](working/c117-pull-hook-100px.png). C118 [`card-oppoPower.png`](../../assets/cards-v15/card-oppoPower.png) shows one outside pitch driven toward the opposite right-field fence; [100px preview](working/c118-oppo-power-100px.png). C119 [`card-upperCut.png`](../../assets/cards-v15/card-upperCut.png) shows a low pitch lifted from near home plate by an upward swing; [100px preview](working/c119-upper-cut-100px.png). No text or card frame is baked in. `src/duel/card-art.js` selects these named files before the power family fallback. Final card-window crops and mobile screens have not been visually approved. C120–C235 remain open.

## C120 high-heat follow-up

[`card-highHeat.png`](../../assets/cards-v15/card-highHeat.png) is a new 1024×1536 opaque RGB PNG. #9 makes a level swing at one eye-level fastball, with the ball and bat safely inside the canvas. The high-pitch contact remains clear in the [100px preview](working/c120-high-heat-100px.png). No text or card frame is baked in. `src/duel/card-art.js` selects the named file before the power family fallback and sets its detail-sheet vertical focus to 0.29. The final card-window crop and mobile screen have not been visually approved. C121–C235 remain open.

## C121 cleanup follow-up

[`card-cleanup.png`](../../assets/cards-v15/card-cleanup.png) is a new 1024×1536 opaque RGB PNG. #9 waits in a strong cleanup-hitter stance while two small teammates occupy distant bases. The batter and baserunners remain readable in the [100px preview](working/c121-cleanup-100px.png). No text or card frame is baked in. `src/duel/card-art.js` selects the named file before the power family fallback and sets its detail-sheet vertical focus to 0.25. The final card-window crop and mobile screen have not been visually approved. C122–C235 remain open.

## C122 solo-shot follow-up

[`card-soloShot.png`](../../assets/cards-v15/card-soloShot.png) is a new 1024×1536 opaque RGB PNG. A single batter finishes his swing at home plate while one baseball climbs over the outfield fence; the bases and field behind him are empty. The solo hitter and golden flight path remain readable in the [100px preview](working/c122-solo-shot-100px.png). No text or card frame is baked in. `src/duel/card-art.js` selects the named file before the power family fallback and sets its detail-sheet vertical focus to 0.29. The final card-window crop and mobile screen have not been visually approved. C123–C235 remain open.

## C123 load-power follow-up

[`card-loadPower.png`](../../assets/cards-v15/card-loadPower.png) is a new 1024×1536 opaque RGB PNG. #9 coils before the pitch, weight on a planted rear cleat, with a compact golden dust trail rising from the dirt. The preparation pose remains clear in the [100px preview](working/c123-load-power-100px.png). No baseball, text, or card frame is baked in. `src/duel/card-art.js` selects the named file before the power family fallback and sets its detail-sheet vertical focus to 0.29. The final card-window crop and mobile screen have not been visually approved. C124–C235 remain open.

## C124 slugger-instinct follow-up

[`card-sluggerInstinct.png`](../../assets/cards-v15/card-sluggerInstinct.png) is a new 1024×1536 opaque RGB PNG. #9 stands tall at the plate with a vertical bat, focused on the outfield before the pitch; amber sparks gather around his hands. The figure and bat remain clear in the [100px preview](working/c124-slugger-instinct-100px.png). No baseball, text, or card frame is baked in. `src/duel/card-art.js` selects the named file before the power family fallback and sets its detail-sheet vertical focus to 0.27. The final card-window crop and mobile screen have not been visually approved. C125–C235 remain open.

## C125 called-shot follow-up

[`card-calledShot.png`](../../assets/cards-v15/card-calledShot.png) is a new 1024×1536 opaque RGB PNG. From behind home plate, #9 extends the bat toward one point on the outfield fence; a slim gold line makes the target visible without a baseball or swing. The pointing pose reads in the [100px preview](working/c125-called-shot-100px.png). No text or card frame is baked in. `src/duel/card-art.js` selects the named file before the power family fallback and sets its detail-sheet vertical focus to 0.29. The final card-window crop and mobile screen have not been visually approved. C126–C235 remain open.

## C126 thunder follow-up

[`card-thunder.png`](../../assets/cards-v15/card-thunder.png) is a new 1024×1536 opaque RGB PNG made with the built-in image generator using `family-power.png` and `card-calledShot.png` as visual references. The #9 batter misses one ball while the bat's golden shockwave crosses the strike-zone lights. The joined hands, bat, ball, and silhouette remain readable in the [100px preview](working/c126-thunder-100px.png). No text or card frame is baked in. `src/duel/card-art.js` selects this file before the power family fallback and sets its detail-sheet focus to 0.31. Final card-window crop and mobile screen remain unapproved. C127–C235 remain open.

The female Red Rush knockout cut-in now plays stagger → mid-collapse → kneel with small camera movement and landing dust over 1.2 seconds; reduced-motion mode shows the kneeling pose without animation. This is a scoped timing pass, not final 10-screen animation approval.

## C127 advance-hit follow-up

[`card-advanceHit.png`](../../assets/cards-v15/card-advanceHit.png) is a new 1024×1536 opaque RGB PNG made with the built-in image generator using `family-relay.png` and `card-calledShot.png` as visual references. #9 drives one low ball to the right while one teammate rounds the bases on a cyan route. Batter, ball, and runner are distinguishable in the [100px preview](working/c127-advance-hit-100px.png), though the runner is small. No card frame or UI text is baked in. `src/duel/card-art.js` selects this file before the relay family fallback and sets its detail-sheet focus to 0.32. Final card-window crop and mobile screen remain unapproved. C128–C235 remain open.

## C128–C129 relay follow-up

Both are new 1024×1536 opaque RGB PNGs made with the built-in image generator. C128 [`card-hitAndRun.png`](../../assets/cards-v15/card-hitAndRun.png) shows #9 swinging as a teammate has already left the base, with a vertical three-cell light behind the pitch; [100px preview](working/c128-hit-and-run-100px.png). C129 [`card-squeeze.png`](../../assets/cards-v15/card-squeeze.png) shows a low bunt contact and one runner breaking from third toward home; [100px preview](working/c129-squeeze-100px.png). Both use `family-relay.png` as a style reference; C128 also uses C127, and C129 also uses `card-bunt.png`. No card frame or UI text is baked in. `src/duel/card-art.js` selects the named files and sets detail-sheet vertical focus to 0.31 and 0.34. Final card-window crops and mobile screens remain unapproved. C130–C235 remain open.

The ending's existing A07 batter and A08 stadium plate now have subtle independent motion: a 12-second sky drift and 5-second breathing movement. Reduced-motion mode leaves both still. This is a scoped timing pass, not final 10-screen animation approval.

## C130 table-setter follow-up

[`card-tableSetter.png`](../../assets/cards-v15/card-tableSetter.png) is a new 1024×1536 opaque RGB PNG made with the built-in image generator using `card-calledShot.png` and `family-relay.png` as visual references. #9 drops the bat safely and accelerates toward first while one low ball reaches open outfield; the bases are empty. The sprint silhouette, first-base path, and ball direction read in the [100px preview](working/c130-table-setter-100px.png). No card frame or UI text is baked in. `src/duel/card-art.js` selects this file before the relay fallback and sets its detail-sheet focus to 0.30. Final card-window crop and mobile screen remain unapproved. C131–C235 remain open.

## C131–C132 relay follow-up

Both are new 1024×1536 opaque RGB PNGs made with the built-in image generator and the relay family artwork as a style reference. C131 [`card-rbiMachine.png`](../../assets/cards-v15/card-rbiMachine.png) shows #9 striking one ball while two teammates wait on occupied bases; [100px preview](working/c131-rbi-machine-100px.png). C132 [`card-steppingStone.png`](../../assets/cards-v15/card-steppingStone.png) shows one runner linking two bases along a cyan path while #9 completes the hit in the background; [100px preview](working/c132-stepping-stone-100px.png). Both keep the card frame and UI text out of the artwork. `src/duel/card-art.js` selects the dedicated files and sets detail-sheet focus to 0.32 and 0.34. Final card-window crops and mobile screens remain unapproved. C133–C235 remain open.

## C133 bases-loaded follow-up

[`card-basesLoaded.png`](../../assets/cards-v15/card-basesLoaded.png) is a new 1024×1536 opaque RGB PNG made with the built-in image generator using `family-relay.png` and `card-rbiMachine.png` as visual references. #9 swings in the foreground while one teammate occupies each of first, second, and third base. The diamond and three occupied bags are identifiable in the [100px preview](working/c133-bases-loaded-100px.png), though individual runner details are small. No card frame or UI text is baked in. `src/duel/card-art.js` selects the dedicated file and sets detail-sheet focus to 0.43. Final card-window crop and mobile screen remain unapproved. C134–C235 remain open.

## C134 lead-off follow-up

[`card-leadOff.png`](../../assets/cards-v15/card-leadOff.png) is a new 1024×1536 opaque RGB PNG made with the built-in image generator using `card-tableSetter.png` and `card-hitAndRun.png` as visual references. #9 attacks one early pitch through two vertically stacked glowing cells while the bases are empty. Batter, single ball, and two-cell column read in the [100px preview](working/c134-lead-off-100px.png). No card frame or UI text is baked in. `src/duel/card-art.js` selects the dedicated file and sets detail-sheet focus to 0.31. Final card-window crop and mobile screen remain unapproved. C135–C235 remain open.

## C135–C136 relay follow-up

Both are new 1024×1536 opaque RGB PNGs made with the built-in image generator. C135 [`card-stealSign.png`](../../assets/cards-v15/card-stealSign.png) shows one runner breaking from first as a distant pitcher lifts a leg, with #9 waiting at home plate and no ball in flight; [100px preview](working/c135-steal-sign-100px.png). C136 [`card-thirdCoach.png`](../../assets/cards-v15/card-thirdCoach.png) preserves the coach's navy cap, salt-and-pepper beard and gold-trim jacket from A05 while he directs one runner around third; [100px preview](working/c136-third-coach-100px.png). The coach's animated gesture is illustrated as a single card pose, not a new motion sequence. Both keep card frames and UI text out of the artwork. `src/duel/card-art.js` selects the dedicated files and sets detail-sheet focus to 0.41 and 0.29. Final card-window crops and mobile screens remain unapproved. C137–C235 remain open.

## C137 chain-sign follow-up

[`card-chainSign.png`](../../assets/cards-v15/card-chainSign.png) is a new 1024×1536 opaque RGB PNG made with the built-in image generator using `family-relay.png` and `card-calledShot.png` as visual references. #9 signals to the next batter across a cyan relay streak. Two earlier versions were rejected for cropped shoes and bat; the selected version keeps both full figures and the complete bat in frame. The handoff reads in the [100px preview](working/c137-chain-sign-100px.png). No card frame or UI text is baked in. `src/duel/card-art.js` selects the dedicated file and sets detail-sheet focus to 0.38. Final card-window crop and mobile screen remain unapproved. C138–C235 remain open.
