# Articulated pitcher runtime derivative — 20 characters

This revision replaces the battle atlases with120-frame exports of the delivered24-part cutout rigs. Existing portrait and map figures remain unchanged. User explicitly requested game integration on2026-10-31 KST after receiving the source kit.

`manifest.json` records all20 adult characters, anatomical throwing hands, documented/proposed form status, source-rig/atlas/engine SHA256s, atlas anchor/render scale and projected frame76 ball socket. There is one left-hander (Onyx),19 right-handers. Submarine remains a test profile, not an invented roster assignment.

The game samples a baked2560×3072 alpha AVIF (10×12 cells256px,60fps,one-shot120frames) on its existing presentation clock. Parts/bones are not re-simulated by the game. Cells0–75 include the held ball; cells76–119 omit the projectile. The game renders the one released ball from the same projected hand socket at frame76. AVIF is an alpha-preserving encode, not an art redraw.

## Rebuild

Obtain the separately delivered `9ZONE-20-pitcher-rig-source-kit.zip` containing original source sheets,480parts,20rigJSONs, skeletal renderer and lossless atlases. Unzip it outside runtime assets. With Node and Sharp installed:

```sh
PITCHER_SHARP_MODULE=/path/to/sharp node scripts/build-pitcher-rig-runtime.cjs /path/to/source-kit
node scripts/register-pitcher-rigs.mjs
```

The source kit is intentionally not eagerly imported or embedded in the production bundle. Runtime contains20 compact AVIFs only; a character image is decoded when its battle mounts. Each full decoded atlas is approximately30MiB RGBA, so do not preload all20.

## Acceptance boundary

Technical rig checks passed before integration. This integration is a reviewable runtime candidate. Joint-cap seams, painted release-hand grip and natural weight transfer remain visual limitations. Numeric joint/release tests do not certify natural biomechanics, commercial art quality or fun. No assertion of120 independently hand-drawn frames or continuous mesh skinning is made.
