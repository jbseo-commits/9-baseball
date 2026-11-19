# Actual atbat camera intake — asset transfer blocked

Independent bounded study on `study/approved-art-camera-20261119`, based on main `fb8e7b13f043e2c17376138abe6696f48c2d8022`. PR #134 remains separate and held. No live code changed. No art substitute authored.

Measured unchanged local game with `?battleUi=vnext&battleFixture=prepare&battlePresentation=clean`. `BattleView` selects atbat framing. Sources: `src/duel/battle-vnext/scene-geometry.js`, `atbat-composition.js`, `BattleScene.jsx`, `assets/production-art/mockup-rebuild/layout.json` and `motion.json`. Measurements and existing-game screenshots accompany this report.

World is 1672 × 941. Current atbat mound and pitcher foot are (834,536); home is (834,874). Pilot pitcher source is 640 × 640 with local foot (300,570), world box height 376.470588, local release (148.576573,384.122343), corresponding world release (744.927396,426.660202). This release is pilot-art-specific, not universal: live roster registrations override it. Ball-in-hand coordinates for the new static sprite must be registered separately. Contact (827.399320,488.556485) is batter contact, not home.

| Viewport | Scene rectangle | World CSS scale | World translation | Foot in scene | Home in scene |
|---|---|---|---|---|---|
|390×844|0,104,390,240|0.2550478215|-17.709883,-64.705632|195,72|195,158.206164|
|844×390|0,0,844,390|0.5047846890|1.009569,-62|422,208.564593|422,379.181818|
|1440×900|0,0,1440,900|0.9564293305|-77.662062,0|720,512.646121|720,835.919235|

Camera uses cover plus atbat focal positioning and overflow clipping, not letterboxing. Touch portrait shows a full-screen rotate-to-landscape notice; its underlying 390×240 stage is diagnostic, not supported portrait gameplay. Fractional CSS scales are real runtime behavior; nearest sampling does not turn these into a uniform integer physical-pixel grid.

## Separated asset delivery

Use original-resolution background and transparent straight-RGBA actors with explicit source foot/ball landmarks. A full-world background would be 1672×941. Supplied 400×225 background is a distinct source coordinate system and must not be described as actual game dimensions. Its approximate mound (200,164) and home (200,214) cannot both match game anchors through aspect-preserving full-world scaling: full-world mapping places them around (836,686) and (836,895), unlike actual (834,536)/(834,874). This composition mismatch requires an explicit integration decision; merely stretching to full world would conceal it. Actor native size 41×86 can be retained and registered independently; do not upscale its stored PNG to 640×640.

Library exact-name search resolved `red-fox-night-separated-pixel-assets.zip`, ID `libfile_fde3_f-49c6c7fb5a40819196c67f5fb8409466_1a73d3b8d82081918cb4a5b54ea52a06`, 77850 bytes. Current Library skill helpers fetched to `/workspace/camera-library-tools`; full unchanged structured search result supplied with explicit selection 000. Materialization failed once: `library download request failed: hosted apps tools/list request failed: network`. No local bytes or pixel inspection claimed. No repeated download or alternative transfer attempted. Await supported parent handoff.

Library skill used for resolution and attempted materialization. Previously audited local hidden skill directories contain no applicable pixel-art skill. Public pixel-art-fundamentals and mandrille pixelart documents are technique references, not installed skills. No external scripts executed.
