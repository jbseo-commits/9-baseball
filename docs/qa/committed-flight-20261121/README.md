# Committed pitch flight review

Base: #143 d442c8b00bcf29e2d011033ecff30b7e20d987a7, exact extracted normal review on localhost4214. No deployment. Existing assets and art limitations retained.

Before implementation, recorded a cold title → normal variable run → Tide encounter, five actual inputs (take/card swing alternation), and inspected video contact sheets at15fps plus1× screenshots. Actual courses4 and2 rendered almost identical take approaches; zone2 whiff jumped from roughly(421,164) to(493,147)CSSpx at outcome, diameter12.5→8.5px. Zone2 take instead approached near(437,169). This confirms action-dependent incoming and result jump, not merely a perceived sprite problem. Video and exact pre-action saves retained for matched after playback. No hidden information selected these baseline actions. No new external footage watched; reference workflow/log read, no new artwork.

## Impact analysis before code
| Axis | Impact / mitigation |
|---|---|
| UI/layout | Ball and impact only. Keep actors/camera/HUD; contact-relative course offsets, not HUD cells or unapproved diagnostic plane. |
| Input | No handlers changed; consume durable playback getter only after release with inputs already locked. |
| Rules/balance | No engine/odds/timing changes; resolved revealed course closure only, never pending. |
| Save | No schema/keys changed; validate stale/durable/reload barriers. |
| Mobile | Inspect844×390,667×375,desktop; actual scales, no camera changes. |
| Scroll | No CSS/global changes. |
| Flow | Normal title/run; regression existing full route checkpoints. |
| Tests | Add privacy,10courses,21release anchors,action equality,impact continuity; actual playback comparison. |
| Build | New exact extracted relative-base normal build, per-path manifest/overlay against#143. No publishing. |

Review consulted existing read-only reviewer before implementation. Scoped source change planned: authorized resolved course after release; constant-depth projection to contact-relative volume; continuous pass; outgoing ball and contact effects share impact. Outside9 has no precise coordinates, so one stable off-zone point is illustrative category only. Fixed batter has only one contact pose; off-center collision alignment remains an explicit limitation.

## Implemented and checked

- `committed-flight.js` maps the host's durably saved `revealed.zone` accessor only at/after release. No `pending`, RNG, aimed-zone fallback or early course scan. Scene/intent DOM before release is identical for different hidden destination getters.
- All roster release registrations remain unchanged. Onyx's existing left-handed release drawing was opened and its authored hand coordinate checked; Tide and Fox release drawings also inspected. No new art or flipped actor.
- A straight perspective ray uses one action-independent endpoint. At impact, a second durable boolean accessor distinguishes contact from continuation: no earlier outcome read. This prevents delayed result rendering from causing either contact overshoot/rewind or a frozen take/whiff. Existing explicit Tide lab drop profile remains intact; it is not enabled in the normal campaign.
- The outgoing hit, local contact ring/light, pixel burst and exact-focus flash use the same arrival. Static scene anchors/camera and physical bat ribbon remain unchanged.
- Ten course categories,21 release registrations,300ms flight intervals and generic917→1217/Fox950→1250ms schedules are covered numerically. Real extracted-build matrix:21 browser throws plus2 extreme-course actual hits across844×390,667×375,1440×900, including all10 categories at844 and Onyx on all3 viewports. Same-state center take/hit/whiff resolve respectively called/hit/whiff with the same incoming geometry. Maximum measured screen-position residual against the shared path/radius is0.0213CSSpx (measurement agreement, not an art-quality score).
- Five before/after matched normal-save shots preserve entire revealed result and last-result payload exactly (center take; upper-right foul/take/whiff/take). Baseline was a fresh normal run chosen without an oracle; matched after replays reuse those untouched accepted pre-action saves. Additional10-zone coverage uses explicitly selected legal engine saves and is supplementary QA, not player-earned campaign progress.
- Four fresh title→pack→guide→map→card/swing→reload→take runs on final extracted ZIP:844,667,desktop,reduced. Exact resume/commit-reload saves preserved, rotation, public-intent visibility, personal/Tide save sentinels, no HTTP404 or page errors. Seeds2436436501,1128357051,724957721,3581761085. Reduced motion retains immediate results, no new flight/getter read.
- Full suite260 files/1768 tests passes. Targeted privacy/contact-overlay/Tide/phase-lag tests included. Standard production and isolated normal-review builds and zone smoke are separately checked; final review ZIP is never replaced by the later standard build.

## Visual evidence and limits

Actual browser recordings, not composites: [before whiff](media/before-whiff.mp4), [after whiff](media/after-whiff.mp4), [mobile GIF](media/after-whiff.gif), before/after center and upper-right take clips in `media/`. MP4s retain844×390; GIF is an explicitly downsampled422×195 sharing copy. Each media file is below1MB. Video scrubs and native screenshots are under `evidence/`.

Inspected baseline and corrected recordings as sequential15fps frames, plus native mobile/desktop captures. The high course now continues toward its higher crossing instead of the former lower middle approach and sudden whiff jump. Departure has readable depth growth instead of squared easing's nearly stationary first frames. The high pass grows and exits upward along the same ray; it is not an invented break/slider. Onyx begins on the correct screen-right throwing hand. Outside is deliberately one stable categorical position, not a measured side/height.

This does **not** solve the fixed batter atlas having only one contact pose: extreme courses can miss the illustrated barrel even when the engine correctly reports contact. The world crossing ring and foreground decision-grid marker agree categorically, but they are distinct planes; no claim that the ball lands on the HUD cell. Existing sprite anatomy/held-pose and stadium quality limits remain. Two additional normal-engine hits at zones0 and8 were captured: contact sparks follow their respective arrival, with no orphaned center flash. Their screenshots also expose the fixed-bat alignment limitation. No real Android device tested. Timing/render sampling can skip frames under CPU load; analytic continuity is tested independently of sampling. One initial supplementary matrix wait missed a short visible ball interval under concurrent recording/testing; trace-based wait and completed21-case rerun replace that failed harness attempt, not the source behavior.

## Portable build

`playable-build.zip` contains634 `dist/` files,54,579,542 bytes extracted. ZIP52,237,980 bytes; SHA256 `45926792c6d2690a2ecda9942186ea65e14045ed0ceb3d7caf20789727080ab0`. Vite base `./`. Serve `dist/` over HTTP; open `/` with **no query** for the normal variable campaign. Existing isolated review save prefix `9zone-normal-review-v1:` is retained. No deployment, service access change or main modification.

The full per-path SHA256 manifest is `evidence/dist-manifest.json`. Transfer-only overlay will be published separately against exact#143 d442c8b, derived only from the two official committed build ZIPs. No Library403 retry or bypass is used. Repository reference workflow and Codex review instructions were applied; no applicable local SKILL.md existed and no art-generation skill was used.

Supplementary progression regression:20 actual UI transitions from pre-existing legal engine-generated checkpoint saves passed (844/667): act2/3 map, event, shop, locker, rest, training, act1/2 boss rewards, finalboss victory/restart. These are checkpoint tests, not a fresh full browser victory.
