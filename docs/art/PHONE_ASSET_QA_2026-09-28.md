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

**Status:** Individual source image inspection passed. No claim of 10-screen mockup fidelity, completed animation, V16 runtime connection, or final R1–R8 quality score. Conditional B slots and C101–C235 per-card illustrations remain open.
