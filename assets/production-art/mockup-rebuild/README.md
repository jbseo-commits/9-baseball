# Reference composition rebuild — 2026-10-29

This package rebuilds the stored sunset mockup as separate game assets. It is not a flattened screenshot used as a playable screen. Text, energy, HP, counts, costs, coverage, selection and actions remain live DOM/controller data.

`source/reference.png` is the closest locally retained approved mockup family (imagegen run ba72675e). It is **not the exact most recent chat upload**; no byte-identical or pixel-perfect claim is made. `manifest.json` records each source's imagegen run and SHA-256, processing and runtime derivatives. New source art was generated with image_gen on 2026-10-29; originals are retained unchanged.

## Contents

- One clean sunset stadium with measured 1672×941 scene landmarks: mound rubber (834,536), home (834,874).
- Batter: **14 independently drawn poses** (ready, preparation, swing, contact, follow-through and return), individual transparent PNGs, atlas and high-resolution registered ready image. It is a right-handed adult male in cream/navy/gold. These are 14 drawings, not 120 distinct animation frames.
- Pitcher: **5 used poses** from a six-drawing sheet: set, release, follow-through, fatigue, coil. A clearly adult female sample actor in green/navy/cream. Right throwing hand, left glove; corrected release aims toward the foreground. This redraws the mockup's diagnostic sample; it does not approve or replace production roster character art. Existing approved-art IDs remain unchanged.
- **9 wide card illustrations**, consistent palette and scene lighting, exported individually. No names, costs, effects or coverage are baked in. Exact effect kind first, otherwise explicit card-family mapping selects illustrations; real coverage glyphs always come from the model.
- **6 painted UI skins**: scoreboard, normal card, selected card, opponent panel, swing and watch. Nine-slice borders and backgrounds sit behind actual controls.

## Rebuild / registration

Run `python3 scripts/build-mockup-rebuild.py` from the repository root. Dependencies: Pillow (AVIF support), NumPy and SciPy. Once source files exist in this package, `/workspace/generated_images` is not required. Source and individual pose PNGs remain available for review. Runtime field/actors use AVIF and card/skin derivatives use WebP; unused candidate atlas WebPs are preserved but not imported.

Connected alpha components isolate drawings whose bat crosses a sheet cell. Registration uses a stable foot anchor and anatomical helmet/body height rather than bat-tip height. Only runtime derivatives make the near-opaque interior fully opaque; antialiased edges remain. No limb rotation, warping or synthetic inbetweens are represented as authored motion. The builder fails if a transformed source silhouette is clipped by its atlas cell.

`layout.json` and `motion.json` register the camera, actors, release and actual bat contact point. Field, ball, shadows, VFX and zone share one camera. The large foreground batter intentionally extends beyond the viewport near-leg edge, as in the reference. Complete source silhouettes are preserved in the atlas. The complete pitcher and contact point stay visible across tested landscape sizes. This replaces the old rule that shrank every batter pose to fit entirely inside the screen.

## Integration / limits

The opt-in `battleUi=vnext` sample fixture uses these assets. `reference-boss` is an isolated actual-engine boss state with diagnostic HP78, actual maximum112 and five actual hand cards; it does not copy the mockup's invented costs or card count. `battlePresentation=clean` hides fixture QA tools only. Production roster fallback, save schema and balance are unchanged.

The new package's active derivatives are about1.3MB. Four previously eager-loaded, currently unused family masters (grind/power/precision/relay,345,188B) are omitted from the global asset glob; the files remain. A regression checks every current card still resolves the exact original art filename. New families requiring these files must remove their exclusion. No asset-quality or60MiB budget exception was used.

See `docs/design/atbat-hand/ASSET-REBUILD.md` and `docs/qa/mockup-rebuild/RESULTS.md` for scope and verification. Tests establish regressions, not commercial art quality or finished roster coverage.
