# Asset-led battle UI v1

Original functional art for 9ZONE HOMEBOUND, created 2026-10-23 (KST).

- `source/action-atlas.png`: image_gen original, square 2×2 tiles: swing, watch, aim, exact-read. No reference artist or external source image. Transparent outside each symbol.
- `source/stadium-panel.png`: image_gen original brass/teal nine-slice panel with a dark plate center.
- `action-atlas.webp`, `stadium-panel.webp`: whole images resized to 640×640 and WebP encoded quality88/method6 for delivery; no cropping or color changes. Originals stay outside runtime imports. Combined runtime raster size: 153,186 bytes.
- `course-signals.svg`: authored four-cell signal strip. One/two/three lit baseball glyphs mean the **already-public** rare/sometimes/often words. A hatch means no pitch. Short visible words accompany the marks; the compact legend explains frequency and the hatch.
- `cost.svg`, `energy.svg`: matching cost medallion and energy token; the cost center stays blank so numbers remain legible.
- `ball.svg`: ordinary actual-pitch marker without the exact-read star.
- `hp-fill.svg`: a restrained metal strip for the actual HP width.

Runtime: `src/duel/BattleArt.jsx` and `asset-led-battle.css`, scoped to `BallparkBattle` MAIN RUN. Deck illustrations, actors, animations, pitcher identities and stadium are reused from existing approved assets. Native text, focus, hit targets and engine state remain authoritative.

The atlas is indexed by CSS background-position in a 2×2 grid. The panel uses slice80 at640px. These metadata are explicit and reproducible; no layout relies on an approximate crop. Full generated prompts and tool provenance remain in this task's transcript.
