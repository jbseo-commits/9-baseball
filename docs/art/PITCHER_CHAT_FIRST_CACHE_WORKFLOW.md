# Chat-first pitcher asset pipeline and verified motion reference cache

## Purpose and precedence
This document refines the pitcher trigger in AGENTS.md and the existing umpire/catcher method. Preserve the original visual and motion quality requirements. The pipeline is **chat creation → visual inspection → explicit user approval → branch integration → playback QA → PR**. A request to produce pitcher art authorizes chat-side candidate generation, not production integration. For new pitcher requests, use this procedure instead of automatically conducting a new video hunt and full atlas build.

## Modes and approval gates
1. **Chat concept (default):** Produce original adult character master art and present it for review. No repository mutation and no costly atlas build. Carry identity, throwing hand, glove hand, camera orientation and design constraints forward.
2. **Chat motion:** After master approval, generate six meaningful pitching keyposes and six hand-drawn bridge poses, ideally as separately verifiable images, with silhouette and anatomy continuity. Present real preview evidence. A composite sheet is not necessarily directly sliceable; check transparency, grid boundaries and character consistency before stating readiness. If no image-generation tool is available, report the blocker rather than pretending it ran.
3. **Asset-approved integration:** Only after explicit approval of the **specific master and motion revision**, import approved bytes on a feature branch, add source, pose PNGs, build script, metadata, reference provenance and preview. Existing production assets and runtime mappings remain unchanged unless separately approved.
4. **Playable acceptance:** Validate 256×256 cells, 10×12 = 120 frame atlas and 60fps timeline without assuming 120 independent drawings or equating engine FPS with drawing count. Inspect frame-by-frame limb transitions; held/transformed keyposes alone do not pass. Check at actual mobile/desktop scales. Provide PR and preview instructions. Do not merge main.

Approval is scoped by character slug, revision and action: **master art approval does not imply motion approval, and motion approval does not imply production runtime or main approval**. "좋아/진행해" in a planning conversation does not approve an unseen image. A user can explicitly request a full autonomous pipeline, but still needs to approve visual candidates before final asset integration.

## Reference selection: cache first, new research only when needed
A **verified motion reference library** is a set of reusable *analysis records*, not reused video screenshots or copied likenesses. Store curated camera/pose observation notes in `docs/art/pitcher-motion-library/` after verification. Each entry includes source URL, canonical clip ID/aliases, catcher/umpire view, observed real timestamps, pose stage, body/foot/ball continuity notes, validation state, provenance and license/usage restrictions. Do not copy third-party source frames to the repository.

At every request:
- Read existing reference log/library first. Select records with genuinely verified playback and applicable camera/motion type. Reusing a validated *analysis* is allowed; it is not evidence that a new video was watched.
- A mere URL, a previously known citation, and `reference_unverified` are **not** verified cache items. Do not silently upgrade these to observed data.
- New video search is optional when cached evidence is sufficient. Trigger it only for a novel pitching mechanic/camera angle, missing or unverified data, or explicit request for new reference footage. Search up to 3 candidate clips per required viewpoint and try playback; if blocked, stop and report, retaining `reference_unverified`. No infinite replacements.
- Newly verified material can augment the library with actual citations and timestamps; keep usage history and canonical dedup keys. The prior no-reuse rule applies to **newly adopted source footage as a fresh reference**, not to the pre-existing verified analytical notes.
- Never claim an AI-generated pose has been validated against video unless observation actually happened.

## Performance, generation, QA
Avoid repository-wide exploration and full builds in concept phase. Never generate 120 production frames before user approves motion keyposes. After motion approval produce pose/source assets, then build atlas once, and rerun only affected stages when QA reveals a defect. Keep the existing 25+ adult woman character direction, distinctive original silhouettes and premium pixel-art target. Right-handed pitcher: right ball-hand, left glove-hand throughout. Pitcher faces camera from behind plate and remains grounded on mound. No static wobble or cheap translation/rotation substituting for limb motion. At release the ball leaves exactly one consistent hand; preserve timing alignment with runtime release.

Record stage durations (reference lookup/search, generation, pose cleanup, atlas build, playback QA), attempted searches, blocked playback, cache hits and actual verified status. These are diagnostic measurements, not fabricated speed or quality claims.

## Handoff manifest
For each proposed character, keep a lightweight manifest with:
- slug, adult_age, throwing_hand, concept_revision, motion_revision
- status: `concept_candidate | concept_approved | motion_candidate | motion_approved | integrated_candidate | qa_passed`
- approval evidence and scope (chat link or user quote/date if available)
- `reference_mode: verified_cache | new_verified | reference_unverified | not_needed_for_concept`
- video reference records actually used, stage timings, art paths and source provenance
- known errors, production runtime approval (separate), QA status

A concept-only chat may generate art without opening a GitHub PR. The first GitHub write is an explicitly approved integration on a new branch. Never commit unapproved art as production-ready; preserve originals and avoid main changes.
