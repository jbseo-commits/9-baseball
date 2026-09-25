# Remaining pitcher SD roster — impact analysis

Scope: create source pose sheets and 120-frame transparent atlases for all 11 pitchers beyond Red Rush. The existing game integration is left untouched, as requested.

| Axis | Impact | Response |
| --- | --- | --- |
| UI / layout | No impact | No app component or stylesheet changes; a separate local preview page is supplied for review. |
| Input / gestures | No impact | No game input handler changes. |
| Game logic / balance | No impact | Archetypes, HP, pitch probabilities, cards and progression are unchanged. |
| Save / load | No impact | No save schema or encounter assignment change. |
| Mobile viewport | No impact | No game viewport or actor size change; inspect the standalone preview at small sizes. |
| Scroll / overflow | No impact | No application overflow rules change. |
| User flow | No impact | The deployed game keeps its existing title-to-run flow. |
| Tests / regression | Impact | Validate every roster ID, transparent PNG atlas dimensions, frame metadata and source sheet count. Run existing tests. |
| Build / deploy | Impact | 11 PNG atlases are present as assets but not yet imported by Vite. Run production build to catch packaging problems. |

Quality gate: inspect face/throw direction, transparent cutouts, pose boundaries, anticipation/stride/release/follow-through, and game-size readability. The authored poses are the art source; the 120-frame atlases are a deterministic playback package.

## Direction correction (2026-09-25)

Two pitchers, Cobalt Impact and Neon Trick, turn toward screen-right during their windup before releasing left. Normalize only their affected pose silhouettes during atlas assembly, then rebuild their previews and 120-frame packages. This changes no UI, input, game balance, save/load, mobile viewport, scrolling, or existing user flow. The affected surface is the isolated art build output; keep frame dimensions, count, timing, release frame, and transparency unchanged. Regression check the correction list in manifests, visually inspect every affected pose at game size, run the complete test suite, smoke reports, and production build.

## Runtime roster integration (2026-09-25)

The new atlases are currently absent from the game and pushing assets alone cannot make varied pitchers appear. Map each combat node to an authored roster entry of the same tier, keep the initial Red Rush encounter, and select its matching atlas and portrait in combat/map/reward views. UI/layout: existing actor and portrait boxes are reused; inspect PC and narrow landscape. Input/gestures: no changes. Game logic/balance: opponent stats and archetypes remain as generated; only visible name and art ID change. Save/load: old nodes lacking art IDs keep the legacy sprite. Mobile viewport and scrolling: existing CSS footprint reused, verify narrow screens. User flow: map preview, battle and reward use the same opponent identity. Tests/regression: add roster mapping and atlas resolution tests, run full suite and smoke reports. Build/deploy: Vite includes eleven additional transparent atlas imports, so verify production build and bundle output.

## Pitcher portrait enlargement (2026-09-25)

| Axis | Impact | Response |
| --- | --- | --- |
| UI / layout | Impact | Add a scoped full-screen portrait dialog and visual zoom affordances in map, combat, and reward; keep other overlays unchanged. |
| Input / gestures | Impact | Portraits become buttons; support click/tap, Enter/Space, Escape and backdrop close. Keep route selection, cards and 9-zone actions separate. |
| Game logic / balance | No impact | Enlargement never calls engine actions or changes combat values. |
| Save / load | No impact | Dialog state is ephemeral React state, outside the save schema. |
| Mobile viewport | Impact | Limit dialog art to available dvh/safe area; preserve both portrait bottom sheet and short-landscape report. |
| Scroll / overflow | Impact | Scope scrolling to the dialog. Do not change html/body/root overflow or map scroll rules. |
| User flow | Impact | Allow art inspection from map preview, active combat and reward, with close returning focus to the opener. |
| Tests / regression | Impact | Add direct map/dialog interaction and focus/Escape tests; run full tests and smoke reports. |
| Build / deploy | Impact | Build and inspect desktop, narrow portrait and short landscape; verify deployed Pages after publishing. |

## Pitch release snap and flight review (2026-09-25)

| Axis | Impact | Response |
| --- | --- | --- |
| UI / layout | Impact | Restrict a short hand-snap flash and trailing ball streak to the battle arena; keep HUD and card layout unchanged. |
| Input / gestures | No impact | Rendering only; no click, drag, keyboard, or touch handlers change. |
| Game logic / balance | No impact | Result, HP, pitch choice, strike/ball count and card consumption remain unchanged; only presentation timing changes. |
| Save / load | No impact | No persistent state or schema changes. |
| Mobile viewport | Impact | Check the release is legible on portrait, landscape, and short landscape without covering 9-zone controls. |
| Scroll / overflow | No impact | No root or map overflow rules change; effects remain clipped to the existing arena. |
| User flow | Impact | A pitch presentation lasts slightly longer so the authored ball-release pose can precede the arriving pitch and judgement; verify result/next-pitch flow. |
| Tests / regression | Impact | Fix release timing with direct regression tests, then run full tests and smoke reports. Verify frame 79, ball flight interval, reduced-motion fallback and browser visuals. |
| Build / deploy | Impact | Run production build and verify the deployed Main Run after publishing. |

Release acceptance: the ball stays attached through coil/stride, separates near authored frame 79, covers the screen-left lane in roughly 160 ms with a visible behind-the-ball trail and a brief wrist-snap accent, then reaches the hitting zone before the judgement/contact cue. The arm whip must read before the ball accelerates; no early duplicate ball or lingering ball at the hand. Compare normal speed and frame stepping at desktop, portrait phone, and short landscape. Do not accept a smooth long push across the entire windup as a release.

## Hand and gaze continuity pass (2026-09-25)

The pose-by-pose audit found eight pitchers whose `bridges:4` silhouette places the ball in front of the body, or overlaps it with another arm, before the leftward release at frame 79. Reuse each pitcher's intact `bridges:3` foot-plant silhouette for frames 68-78, preserving the original release and recovery art. The source sheets remain unchanged and the selected atlas poses become the shipping assets.

| Axis | Impact | Response |
| --- | --- | --- |
| UI / layout | Impact | Only battle sprite pixels change inside the existing 256px actor cell; review at game size and in the portrait viewer. |
| Input / gestures | No impact | No controls or handlers change. |
| Game logic / balance | No impact | No pitch outcome, timing contract, HP, count, or card value changes. |
| Save / load | No impact | No schema or actor identity changes. |
| Mobile viewport | Impact | Inspect the corrected pose in narrow portrait and short landscape. |
| Scroll / overflow | No impact | Sprite art does not change page sizing or scroll rules. |
| User flow | Impact | The visible windup-to-release sequence changes; confirm pitch-result flow still works. |
| Tests / regression | Impact | Assert per-pitcher replacement metadata and all 120 unique frames, then run full tests and smoke reports. |
| Build / deploy | Impact | Rebuild eight atlases/previews, run production build, push, and check deployed Pages. |

Acceptance: at frames 63, 68, 74, and 78 the ball stays with the same cocked throwing hand; at 79 the arm and ball separate toward screen-left. No third arm, duplicate ball, opposite-facing head, or early ball-forward silhouette may appear in shipped frames.

## Default Ballpark scene integration (2026-09-25)

Latest main now renders `BallparkBattle` by default. Its current ball appears at the pitcher container center before release and flies for 360ms starting 360ms before contact. The release fix must be wired to this default surface while preserving the new UI. UI/layout: effects stay inside `.bp-scene`, with no HUD or card box changes. Input/gestures and game balance: no changes. Save/load: no schema change; the shot remains presentation-only. Mobile viewport: calculate the hand position from the actual 256px sprite rect for portrait and short landscape. Scroll/overflow: effects are clipped by the scene. User flow: timing and result stay driven by the existing `impactAt`, with the ball beginning at frame 79. Tests/regression: add a direct Ballpark flight contract test, run all tests and smoke reports after rebase. Build/deploy: rebuild and verify the default battle on GitHub Pages.
