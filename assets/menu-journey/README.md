# Journey effects · 2026-11-09 KST

Two transparent one-shot strips, no runtime library or new provider dependency.

- `collect.png`: pixelfx `pickups/collect-burst`, gold palette in `source/collect-options.json`, light .45. 42 cells × 112×108, exported frame durations 33ms (1386ms). The arrival receipt deliberately plays all frames in **650ms** and leaves 110ms to settle before unmount. This is playback speed, not extra generated drawings.
- `settle.png`: Pixelbolt `holy-spells` impact adapted into `source/route-diamond.fx.json`. Gold palette, compact crossed glint, clean expanding ring, falling motes; 14 cells × 64×64 × 40ms. Its source recipe is retained. No character rig/pose generated.
- Native pivots: collect [56,94], settle [32,40]. CSS uses complete cells and the exact strip count; no trimming, rescaling of source frames, limb warps or chroma cleanup.

## Reproduce

Run from the respective installed tool checkout; output into a fresh task folder:

```bash
node tools/render.mjs pickups/collect-burst --sheet --opts '{"palette":["#242039","#6f481c","#ae7936","#e9ad4e","#ffe29b","#fff0c8","#ffffff"],"light":0.45}' --out TASK/pixelfx
node tools/check.mjs pickups/collect-burst
node bin/pixelbolt.js compile REPO/assets/menu-journey/source/route-diamond.fx.json --out TASK/settle.json
node bin/pixelbolt.js validate TASK/settle.json
node bin/pixelbolt.js render TASK/settle.json --out TASK/pixelbolt --expect '{"width":64,"height":64,"frames":14,"transparent":true,"loop":false}'
```

Then from the game checkout:

```bash
node scripts/build-menu-journey-strips.mjs TASK/pixelfx/pickups/collect-burst/collect-burst.json TASK/pixelbolt/route-diamond.atlas.json
```

Contact sheets and actual playback were inspected. Sprite-gen `inspect-motion` ran on **each real exported cell** with original durations, not the full atlas repeated as if it were a frame. Its generic character-oriented report says `needs-review` for transparent tail/duplicate empty frames; these are intentional one-shot endings, not proof of character motion quality. Raw evidence: `/workspace/9zone-menu-juice-20261109/fx/` (local, not bundled).

## Eight requested tools: actual use and limits

| Tool | This task |
| --- | --- |
| [pixelfx](https://github.com/patch-gg/pixelfx) | Catalog search, three rendered candidates, custom palette export, source checks; collect adopted. Long diamond wipe and combat hit spark declined for menus. |
| [Pixelbolt](https://github.com/skulitom/Pixelbolt) | Preset render → custom source compile → validate/inspect/render with explicit frame/alpha/loop expectations; settle adopted. |
| [sprite-gen](https://github.com/aldegad/sprite-gen) | Local timing/silhouette inspection of both real frame sequences; no provider/API calls, no invented interpolation. |
| [2dimg2motion](https://github.com/WU-HAOTIAN34/2dimg2motion) | Installed adapter read; whole-pose identity/registration workflow considered. No actor motion needed for this menu task, so no generation. |
| [PixelOE](https://github.com/KohakuBlueleaf/PixelOE) | Installed adapter read; RGB-only static processing would destroy transparent FX and approved background detail, so not applied. |
| [Agent Sprite Forge](https://github.com/0x0funky/agent-sprite-forge) | Remote workflow inspected, not installed/run. Master art/layer consistency guidance retained; its FX workflow also recommends pixelfx. |
| [Codixel](https://github.com/mankidev/codixel) | Remote workflow inspected, not installed/run. Palette/reference QA considered; no extra rigging for menus. |
| [Sprite Sheet Diffusion](https://github.com/chenganhsieh/Sprite-Sheet-Diffusion) | Remote code inspected, not installed/run. CUDA/model pipeline unsuitable for UI effects; top-level license needs verification before any adoption. |

These are not eight executed generators. No paid API, model download or dependency install occurred. PatchPixel font was **not** copied. MIT notices for the two adopted effect sources are included beside this file.
