# Native Red Fox single-frame study — intake audit

**Current status (supersedes historical intake below):** one original320×180 static Red Fox/night-stadium candidate is now authored based on the parent's direct visual audit of Library concept `libfile_3ea5017dd9e8819185c1d78ca54d2ab4`. Executor source-file transfer remains blocked; executor directly inspected generated output only. Actual palette30; phone390×844 and landscape844×390 render1×320×180 with60px actor, desktop1440×900 renders4×1280×720. This is not verified equal to responsive production runtime scale. Technical gates PASS; visual quality HELD. See README.md/verification.json. No legacy HELD budget was reset. One initial frame plus one targeted ball/hair readability correction, with initial image retained as attempt-01.png; no further visual batch.

2026-11-19. This is a separately requested static scene, not a restart of autonomous development, G003, or any 3/3 HELD visual batch. No attempt budget has been reset. One editor; read-only plan reviewer. No art candidate has been drawn yet.

## Repository and scope

- Official origin: `https://github.com/jbseo-commits/9-baseball.git`.
- Latest fetched main/base: `fb8e7b13f043e2c17376138abe6696f48c2d8022`.
- Local branch: `study/native-fox-frame-20261119`. No push, merge, deployment or live battle change.
- Open PRs checked through connector: #123 trajectory, #124 swipe prototype, #125 card decision lab (visual held), #132 browser route audit, #133 decision hypotheses; older visual PRs #48/#49/#62/#67/#90/#100 also remain separate. This request does not supersede their status.
- `deploy-pages.yml` deploys main/ag/**/codex/**/claude/**. Study branch deliberately avoids these patterns. No workflow dispatch.

## Preimplementation impact analysis

| Axis | Impact | Planned isolation / check |
| --- | --- | --- |
| UI/layout | Study only | Self-contained document, no production imports |
| Input/gestures | None | Static scene, no play controls |
| Logic/balance | None | No engine or numeric changes |
| Save/load | None | No storage or game initialization |
| Mobile viewport | Study only | Native 1×, integer display scale; inspect phone portrait/landscape and desktop |
| Overflow | Study only | No CSS shared with game; verify no fractional shrink |
| Existing flows | None | No src/public/runtime modifications |
| Tests/regression | Required | Full baseline, smoke/build/budget, eventual provenance and pixel/display assertions |
| Build/deploy | No deployment | Artifact outside runtime; no deploy-trigger branch or workflow |

## Approval and camera

Parent supplied exact approval source: https://chatgpt.com/c/6acc950b-24e8-83e8-a266-d83f5761c6e4?messageId=bbb21bb6-d07a-4d87-ae7a-06bad3a57e36 . User quote: “붉은 여우 원화의 캐릭터 디자인은 승인한다. 단, 투구 모션 구도는 수정이 필요하다.” This establishes design approval, not motion or this study's visual approval. Parent verified red ponytail, white/red uniform/cap and number 9 as text. The original pixels have NOT yet been recovered or inspected.

Read AGENTS.md, docs/codex-loop.md, docs/art/PITCHER_CHAT_FIRST_CACHE_WORKFLOW.md, docs/design/mockup-v1/CONTRACTS.md and sprite-gen pipeline documentation. Actual existing camera reference image `assets/production-art/mockup-rebuild/source/reference.png` was opened: catcher-facing mound, large foreground batter, distant pitcher. This is a smooth illustrated sunset image, not a native-pixel style benchmark and not Red Fox.

Existing camera contract: 1672×941 world; home (815,824), mound (832,580); pitcher world height310 and batter670. Any native reconstruction must preserve measured ratios or explicitly disclose its separate camera. Actor-only responsive enlargement cannot be called runtime match.

PR #32 and its head tree `15fdeed0d319b6bc2ee90017748aa838ec570d9b` were inspected. It changes four Markdown files only, with no Red Fox source or skill files. `docs/asset-pipeline/IMAGE-ASSET-WORKFLOW.md` is absent in main and that head tree.

## Actual skills / tools audit

- `.agents/skills` absent in checkout and current main tree. `/workspace/.agents` empty in visible environment. `.agent`, `.claude`, `.codex` in repo have agent/rule configurations, no SKILL.md.
- `/home/agent/.codex/skills` contains only document/pdf/presentation/spreadsheet builtins; remote-skills has no relevant SKILL.md. No claim that user-installed skills do not exist elsewhere.
- `sprite-gen`, `aseprite`, `2dimg2motion`: not on PATH. Existing `scripts/sprite-gen/stage-batter-v3-anchors.py` copies preexisting batter art; it does not draw original pixel assets. Read, not run. No unrelated scripts installed/run.
- Actual cloud skills used: `openai-library:library` for reference search/materialization; `personal-context:personal-context` for prior approval retrieval. Personal Context returned unavailable. Neither is a pixel drawing skill.
- Saint11 cluster painting article read: https://saint11.art/pixel_art_articles/article2/ . Planned use is large shared flat color clusters, minimal orphan pixels, coherent edge steps; not yet applied in an asset. No third-party assets copied.

## Blocking source access

Library search located several DIFFERENT Red Fox sheets. Examples: `libfile_ea27cbea56c48191bef99430b6510bcf` (RED FOX 야구 캐릭터 파츠 시트.png) and `libfile_a743278c6e8081918eac04b55529ccdd` (붉은 여우 투수 픽셀 아트 시트.png). Search metadata does not establish that either is the approved master.

The current Library helper was downloaded from the skill and invoked once to materialize those two references. It failed before transfer: `hosted apps tools/list request failed: network`. No original pixels were obtained, no confirmed Library upload ID exists. This was a transport failure, not an approval denial. The missing source identity/path question remains pending.

Hard gate still unsatisfied: inspect exact approved original pixels before authoring. Do not invent approved identity from search descriptions or label another sheet approved. Accordingly there is no scene, native 1× capture, phone/desktop study capture, portable scene or Draft PR yet. Technical pixel compliance and visual quality are both untested, not PASS.

## Baseline validation (no new scene)

- Full `pnpm test`: exit0, 248 files / 1706 tests PASS, 83.93 seconds. Existing happy-dom disabled-iframe messages occur in stderr; preserved in baseline-tests.log.
- `node scripts/zone-report.js 10`: rerun separately to establish exact exit0; baseline-smoke.json preserved.
- `pnpm run build`: built in3.48 seconds; chunk size/plugin timing warnings preserved in baseline-build.log.
- `node scripts/check-dist-budget.mjs`: exit0; 52.8MiB /60MiB.
- These validate the unmodified baseline, not the requested art or phone view. No manual gameplay regression or device check claimed.

## Consumer-local retry and public skill reading

Parent clarified that the approved text plus directly inspected contemporary auxiliary references may support the study without claiming exact master-file identity. On that materially new source selection, searched exact titles for `붉은 여우 투수 모션 레퍼런스 시트.png` (`libfile_41a17b5720b081918d59f747f51c41a0`) and `붉은 여우 투구 모션 프리뷰.png` (`libfile_64e2abbdc9048191860062135e637db7`). Passed complete unchanged structured result to the current bundled library_download.py with selection ALL and consumer-local destination `fox-reference-retry` from `/workspace`.

The ONE allowed retry exited1 with the same exact error: `library download request failed: hosted apps tools/list request failed: network`. `/workspace/fox-reference-retry/` exists but contains NO files. These are expected filenames only, not available local images. No direct prepare/read/storage URL fallback was attempted. Retry allowance exhausted; awaiting another supported means of seeing reference pixels.

Read full raw SKILL.md texts from public `ProkStudio/skills` (`skills/game/2d/pixel-art-fundamentals/SKILL.md`) and `mandrille/pixelart` (`SKILL.md`). These are public technique references, NOT installed/local skills. Used their guidance in the independent preparation below, not in an artwork yet. No script/package from either repository executed or installed. Mandrille's local Windows installation path is author-specific and was not assumed to exist. Its animation recommendations do not apply to this static request.

Prepared native camera proposal:320×180 raster, mapped from1672×941 at approximately0.1914; mound(159,111), home(156,158), pitcher height59–60px. This preserves reference proportions, not the production renderer's responsive cover/crop. Integer-only1×phone portrait,2×when landscape space permits,4×desktop; letterbox instead of fractional downsampling. Actual-size readability remains unverified. Palette budget proposal24 opaque colors, 3–4 planes per material, common cool shadow ramp, warm skin/hair and restrained stadium highlights; exact palette awaits reference pixels. Deterministic authored text grid/flat polygons with no imported raster or resize path. Proposed audit: source dimensions/hash, exact palette membership, no partial alpha, native PNG versus DPR1 canvas byte equality, integer computed CSS scale. Those are technical gates only; final silhouette/face/glove/ball/grounding/readability must still be visually judged at1×.

Read-only closing reviewer confirmed the audit is honest, baseline logs match reported totals, and tracked files/art/push/deploy remain untouched. Logs are gitignored local evidence; no repo artifact links claimed.
