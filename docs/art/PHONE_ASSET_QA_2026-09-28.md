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

**Status:** Individual source image inspection passed. No claim of 10-screen mockup fidelity, completed animation, V16 runtime connection, or final R1–R8 quality score. Conditional B slots and C108–C235 per-card illustrations remain open; C101–C107 source-image checks are recorded below.

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
