# Pixel umpire v1: asset provenance

This bundle records the original-game pixel art update for **one batter and Red Rush**, plus one stadium background. It does **not** claim that every pitcher or the whole roster was remade.

- Batter: **18 accepted unique poses**. The active windup holds the accepted reset-ready pose twice, then plays knee lift and plant. Two generated windup candidates were rejected for reversed shoe depth. The atlas has 20 storage slots; slots 2/3 are unused.
- Red Rush: **12 accepted unique poses**, including an edited release frame with an empty throwing hand. Other roster characters keep their existing assets/runtime path.
- Runtime sprite storage: 256×256 per cell, **128×128 logical grid**, enlarged 2× with hard nearest pixels; **logical height 128** and one shared **40-color palette per actor**.
- Stadium: **256×384,64 colors, opaque RGB**. Plate, chalk and mound geometry belong to runtime presentation.

## Generation and processing

All original base and row images were generated through the built-in `image_gen` tool. The exact base, row and drive-retake prompts are in `generation/` and `prompts/`. The raw originals and unchanged base copies remain outside checkout; `source-inventory.json` provides basename, dimensions, byte size and SHA256 without publishing local user paths or large originals.

The row-generation guides originally requested192×256 cells and96×128 logical artwork. The generated rows contained finer detail than that target. The canonical sprite-gen component extractor warned about measured pitch1 and physical downscale caps; this is an explicit hard-pixel runtime derivative, not a claim that all raw pixels obeyed the requested native grid.

Canonical extraction storage was widened to 256×256 without regenerating raw rows, so row-registration slack could not clip extended bats. Existing source outlines were preserved while additional outline darkening was disabled. Reversible curation applies a 0.94 scale and per-frame vertical offsets to retain an 8px transparent border on every accepted frame. Original 192 generation prompts/guides and reports were archived before the storage change. The runtime atlas was composed and PNGs exported through the canonical curated path; every accepted atlas cell was byte-compared with its curated PNG.

The stadium uses separately documented deterministic dominant-color block sampling and a 64-color no-dither palette. It is **not** described as canonical sprite-row extraction.

## QA and limits

`reports/runtime-qa-report.json` records 30 accepted unique source cells, hard alpha 0/255, 40 colors per actor, a uniform 2×2 output grid, at least 8px of transparent border, opaque manual anchors and byte-identical canonical exports. The contact anchor is the wooden barrel sweetspot; grip and tip anchors describe its axis. These source points are approximate authored sprite contacts, not a complete anatomical rig.

The accepted contact boards are included under `qa/`. A separate pitcher `detail_bias=false` comparison is also included; it is an evaluation candidate and is not automatically the published runtime revision. Structural checks do not establish natural animation, final compositing quality or commercial art quality. Those require actual gameplay review.

Read-only whiff geometry audits under `audits/` describe a specific source-code snapshot, with source hashes and fixture assumptions. The initial snapshot found a small painted-wood overlap just before impact in one normal-swing miss; it must not be presented as a passing physical-clearance test. The engine/UI integration owner handles any subsequent correction and retest.

An outside-checkout candidate tightens the physical strike plane to along ±3 logical pixels, across ±1, and outside-band offset 5. Across ±100ms at 1ms intervals for all 10 zones, the diagnostic painted-wood mask found no miss overlaps; the smallest normal-swing gap was 2.236 native pixels (3.634 CSS pixels at the fixture scale). All 20 normal/bunt contact endpoints placed the ball center on painted wood. These are candidate calculations using the documented 390×844 fixture and Red Rush path; they do not claim that a live browser or every roster path has been retested.

## Contents

- `generation/`, `prompts/`: complete generation and retake instructions.
- `source-inventory.json`: original/selected/rejected source inventory and hashes.
- `canonical/`: public-safe requests, curation, manifests, extraction/inspection reports and palette locks.
- `reports/`: storage, background processing, selection and export QA decisions.
- `runtime-manifest.json`: actor frame layout and normalized source anchors.
- `qa/`: small derivative review boards; no large generated raw bitmaps.

All paths in this bundle are relative descriptors or source basenames. The bundle contains no local username, absolute working-directory path or machine-specific checkout path.
