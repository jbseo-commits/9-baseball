# Material placement and contact effects — 2026-10-29

The previous receipt replaced a card with a fixed-size nameplate and independently flying squares. This pass carries the same card artwork/name/cost into the actual coverage footprint, preserves tile adjacency during one parent motion, then seats the cells only after arrival. [Pre-implementation9-axis impact](../../design/atbat-hand/INSERT-POLISH.md).

The interaction still is: unfold → select/drag card → place on the existing zone → swing or watch. Placement does not spend the card/energy or advance a pitch. The player can confirm immediately; the remaining decorative receipt and future audio are cancelled. Engine timing and save schema are unchanged.

## Actual production-build frames

These use the real DOM and actual engine `watch-read0` fixture, with image decode and font readiness. Only the QA clock/animations are pinned for these repeatable stills.

| Beat | Desktop1672×941 | Phone844×390 |
| --- | --- | --- |
| Actual card0ms | [image](material-1672-0.jpg) | [image](material-844-0.jpg) |
| Overlapping card→material140ms | [image](material-1672-140.jpg) | [image](material-844-140.jpg) |
| Connected footprint in transit300ms | [image](material-1672-300.jpg) | [image](material-844-300.jpg) |
| Local compression/lock490ms | [image](material-1672-490.jpg) | [image](material-844-490.jpg) |
| Seated/settling640ms | [image](material-1672-640.jpg) | [image](material-844-640.jpg) |

[Live unpaused interaction video](live-placement-and-hit.webm) · [Actual routed game audio](placement-and-hit.webm) · [Browser/audio evidence](material-browser.json). The video and audio are separate recordings of the same native-button run. They are not a manually timed promotional animation. The actual pitch resolves to HP60→48.

[Confirmed exact-contact frame](cinema-exact-844.jpg) and [near-miss frame](cinema-near-844.jpg) use their actual engine fixtures and host clock at impact+32ms. The bat ribbon is outcome-independent before impact. Exact contact receives a narrow cut, hot core and shock ellipse; near misses receive an air trail without success flash or positive camera beat. The effects pass shares the actor projection/jitter but draws above result grading, preventing contact light from being darkened twice. HUD/zone controls stay fixed.

## Controls / cancellation

The existing `sound` preference is explicitly passed through BallparkBattle. The small HUD speaker toggle is available even with clean fixture tools hidden; embedded comparison still receives no sound toggle and sound=false. No automatic audio preference change.

The receipt uses a1040ms visual lifetime and460ms arrival/lock beat shared with cancellable Web Audio. Its one fixed material/lock mix does not get louder when more cells are covered. Every scheduled oscillator/noise source belongs to a disposable bus. Mute, reselect, clear, fast pitch, menu, resize, rotation, hidden tab and unmount cancel pending sound. Late unmute does not replay an old impact. Reduced motion keeps a static outline and one short lock sound; no flight or haptic.

Tap placement re-measures the current card after scrolling. Drag uses release coordinates. Folded re-aim begins at the visible zone, avoiding an off-screen source. The whole footprint uses the actual published coverage, including clipped shapes and support aims; no extra cells are invented.

## Verification

- Final full Vitest:217files /1,436tests passed. New regressions cover geometry1/3/5/9, clipped/disconnected row edges, shared carrier, actual live source after scroll, menu-close no replay, immediate pitch, source cancellation/mute/reduced motion, sound scheduling/cancellation and exact/near separation. Light pass projection/jitter matches actors across resize.
- [Actual6-size touch checks](browser.json):667×375,740×360,844×390,1024×768,1440×900,1920×1080. Fixed camera/zone, fold/fan, CDP touch drag, actual coverage2/5/8, HP60→48, support own aim, vertical swipe, scroll return, save isolation, reduced motion and rotation passed.
- `qa-placement-material.cjs` checks source card does not balloon at0/140ms, actual connected footprint and native audio-button routing. Actual decoded PCM peak0.1361 (below clipping), RMS0.00683. This verifies output and clipping, not commercial sound quality or a human listening review. This environment cannot accept audio as model input.
- [Original default/vnext flow regression](smoke.json):preparation, take, next, inspector pause, save/resume, equal seeded saved states. [Map/reward/locker9cases](noncombat.json), scrolling and next transitions passed.
- Smoke:[zone10](zones.json),[v9 30](v9.json),[growth2](growth.json),[deck1](deck.json).
- Actual Pages-base production build passed.59.8MiB/60MiB, CSS350resources(329font/21image) resolved. `git diff --check` passed. No new large raster payload.
- Independent read-only reviewer inspected material140/300/490ms frames, source timing/cancellation and full tests. No blocker found.

Scope is the opt-in sample-actor battle preview. Existing production roster approval and default fallback remain unchanged. This improves the effect composition and control feedback; test counts and intensity do not prove a commercial masterpiece.
