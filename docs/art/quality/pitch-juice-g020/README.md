# G-020 pitch delivery and contact candidate — HELD 3/3

This review candidate responds to stiff deliveries and disconnected contact FX. It retimes the existing 12 authored drawings for every pitcher; it does **not** provide newly drawn anatomy or 120 unique frames. Six baked PixelFX sheets and an original Pixelbolt spinning baseball replace separate real-time effect simulation. Release, ball, contact hold, actor recovery and FX share the presentation clock. A compact existing identity/HP row leaves the batter visible during flight/contact hold.

## Aesthetic gate: improvement not proved

Three fresh image-only blind judgements failed the repository threshold of mean improvement ≥0.25, no axis drop >1, and at least 4/8 axes improved:

| Revision | Before | After | Gain | Improved axes | Verdict |
|---|---:|---:|---:|---:|---|
| R1 | 3.09 | 3.10 | +0.01 | 3/8 | NOT_IMPROVED |
| R2 | 3.02 | 3.14 | +0.11 | 5/8 | NOT_IMPROVED |
| R3 | 3.10 | 3.17 | +0.07 | 4/8 | NOT_IMPROVED |

Final R3 shows better composition and less character occlusion, but typography/information hierarchy still declined slightly. Effects and UI remain stylistically separate from the illustrated environment. Still images cannot establish animation feel or sound quality. No aesthetic acceptance or commercial readiness is claimed. Under QUALITY-BAR and ANTIGRAVITY-LOOP §11.3, the candidate stays **Draft, not Ready/main** after three revisions.

## Evidence

The five PNGs here are the original final blinded reference/A/B comparison sheets. Each row retains its randomized A/B order. `r1/r2/r3-judgement.json` contain sealed scores and observations; corresponding reveal logs report the decoded before/after result. `paired-capture-manifest.json` preserves exact actual action/state/phase-age evidence. All pairs use the same first true-hit action (token3, engine phase between, pitches2, pitcher HP32) from an actual normal game. The common1000ms pair deliberately samples equal playback time, where retiming makes the actor pose differ. Event-age residuals in the other accepted pairs are ≤18.4ms; late captures and an invalid virtual-time attempt were excluded, not relabelled.

## Functional checks

- Full final suite: 233 files / 1578 tests pass, exit0; production build pass; dist51.8/60MB; zone-report10 identical to baseline.
- Actual normal game:9 actions,7 pitches→pitcher KO→reward→map→reload/continue→event. Candidate and baseline engine outcomes match. Final667×375 normal/reduced flows pass without page errors. Earlier .25/.5/1/2x runs also pass.
- First-hit release pose occurs about0.700s earlier at.5x than baseline; long coil hold about.900s→.334s wall time. This is an observed timing change, not proof of better motion anatomy.
- Mid-flight reload restores the exact committed save and clears transient effects. A strict original probe marked its one-second unchanged-state expectation false because existing `advanceV10Batter` proceeds between→battle. The separate expected-auto-advance comparison passes; pitches remain1. The failed raw probe was retained externally, not overwritten.
- Actual training upgrade→map→reload/continue, portrait rotation guard with save unchanged, landscape return→next rest node→reload restore pass. Page errors/HTTP failures0; one unattributed console404 retained. An initial probe expecting Continue on an already resumed map timed out; its raw report remains external.
- Cancellation, reduced motion, hidden/late cue suppression, all20 release/landing/recovery mappings and early-result boundaries are covered. Headless browser timing is not real mobile performance. No actual audio-listening claim.

Raw traces, videos, native tool exports and excluded captures remain at `/workspace/9zone-juice-20261106/` in the development workspace. Asset provenance, recipes, metadata, licences and reproduction instructions are in `assets/production-art/pitch-juice-v1/README.md`.

## What blocks the next quality step

Timing edits cannot create the missing shoulder/elbow/hip transitions between existing drawings. The next artwork pass needs a separately reviewable pitcher motion candidate, following `docs/art/PITCHER_CHAT_FIRST_CACHE_WORKFLOW.md`; it must not be generated and silently installed as approved art.

- Preserve each character's face, outfit, adult identity, throwing hand, glove hand and actual delivery slot. Test an overhand, a sidearm and an underhand pitcher before scaling to20; mirrored overhand silhouettes do not establish another delivery style.
- Keep the registered pivot foot on the rubber through the drive. Show hip lead, stride-foot plant, torso lag, elbow advance, forearm whip, empty-hand release, chest over front leg, rear-leg recovery and return. Draw transitional anatomy rather than rotate/translate the whole cutout.
- Make at least12 distinct meaningful key/transition drawings with extra unique drawings through acceleration, release and deceleration where the current spacing jumps. A120-tick atlas may hold drawings, but its unique-drawing count must be stated. Validate hand identity, silhouette continuity and ball socket in each source frame before packing256×256 cells.
- Release the live ball on the exact drawing where the ball leaves the throwing hand; retain the empty hand afterward. Follow-through crosses the body according to the delivery slot and handedness, without detached forearms/glove or foot sliding. Review at.25/.5/1x in the real mounted scene, including the plate, not only a contact sheet.
- Batter needs equivalent authored load→hip turn→barrel contact→extension→follow-through→recovery continuity; current frame retiming does not supply it. Inspect barrel/ball overlap and bat silhouette in actual side-by-side video.
- First read the current presentation without stronger decoration. Only then judge a short release whoosh, foot plant and dry bat transient at native playback on headphones/phone speaker. The current automated cue tests establish timing/cancellation, not loudness, sound selection or audible impact quality.

The lowest visual axis remains UI material integration (R2). A separate UI art decision is needed for the contrast/texture of existing status and result surfaces; this candidate does not reopen the already-held G013 result-layout item. Adding larger flashes alone would not resolve those scores.
