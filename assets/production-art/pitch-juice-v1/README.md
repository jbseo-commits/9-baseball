# Pitch/contact PixelFX atlases v1

Generated with the installed `.agents/skills/pixelfx` adapter from https://github.com/patch-gg/pixelfx at a84159688af3ca37a4be05a0d422b94451b2e24e. MIT license included; original effect code credits Hugo Duprez/Sprite Fusion. No PatchPixel font or stock actor is included in these transparent effect-only sheets.

Six original Aseprite metadata files retain frames, duration, fps, loop and pivot; image basename is normalized to the exported filename. `manifest.json` retains source ID, exact PNG SHA256, custom render options and contact pivot (origin minus authored effect height).

Reproduce with `asset-tool pixelfx render <manifest source id> --sheet --no-actor --opts '<renderOptions JSON, or {} for defaults>' --out <external-output-directory>`. Select effect-only PNG and JSON, rename image basename consistently, retain original source output for review. `asset-tool pixelfx check` passed for all six source effects. Native-size contact sheets were inspected; these mechanical checks do not establish game-feel quality.

Live presentation samples native 30fps frames from the same virtual age as the actors and ball. It does not run an additional particle simulation, RAF or real-time timeout. The landing puff is anchored to the registered planted foot; impacts use the registered barrel contact and shared camera offset. One-shots disappear on cancellation/end; reduced-motion skips this layer. Existing 12 authored pitcher drawings are retimed; no new character artwork or 120 newly drawn frames are claimed.

`wake` is a cool projectile-stream export aligned behind the incoming baseball; the actual approved ball remains the foreground core. It never reads the pending pitch course or result. Its native loop is sampled only during the incoming flight and disappears exactly at contact/cancel.

## Pixelbolt baseball

The 24×24 transparent, 8-frame/20fps spinning baseball was authored with https://github.com/skulitom/Pixelbolt at8814970d7774e94432762c683b756ad3db86e896, using its pixel-art skill. The editable `ball.pixel.json`, native `ball.atlas.json`, PNG and separate MIT license are retained. Reproduce: `node bin/pixelbolt.js validate ball.pixel.json`, `inspect ... --native --diagnostics`, and `render ball.pixel.json --out <external-output> --expect '{"width":24,"height":24,"frames":8,"transparent":true,"loop":true}'`. Validation/export pass with7colours, stable[2,2,20,20] bounds and no duplicate-neighbour notes in the selectedrevision. Initial draft with three adjacent blank-seam drawings was rejected and corrected in external review outputs. The source is original small-prop pixel art; no character rigging or new pitcher drawing is implied. Ball rotation uses the flight's virtual age and holds during physical contact freeze.
