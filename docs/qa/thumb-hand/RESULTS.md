# Thumb-readable hand — 2026-10-30 KST

Landscape reference cards now put live cost, title, effect and coverage on the left, with the artwork and visible grip on the right. The selected card has a small left pull and a protected stacking order. Energy, camera and central9zone stay fixed. The fold control sits outside the reading column, above the zone. Duplicate role text is removed from this card face; accessible labels and the board/tray retain roles and order.

The entire card remains selectable. The artwork centre accepts native tap/drag; the visible detail icon and existing long press/context menu/keyboard detail remain available. Its old invisible expanded hit area no longer intercepts the right-hand grip. No confirmation step is added.

[Actual phone](selected-844.jpg) · [Thumb-mask assumption](thumb-844.jpg) · [Desktop](selected-1920.jpg) · [Offset drag face and actual target](drag-667.jpg) · [Portrait left-art receipt](portrait-left.jpg).

## Drag contract

The face prefers the pointer's upper left, stays inside the viewport and avoids both the assumed pointer contact area and central zone. The pointer itself remains the drop coordinate. The receipt starts at the actual visible face rectangle and respects right-art orientation. Portrait tap receipts retain left-art layout.

A read-only preview uses the same existing `cardDropIntent`/`previewV10Stack` legality and costs as the eventual drop. A main move previews its primary coverage; a support move previews only that card's support coverage. An invalid extra has no valid coverage and a separate dashed target. Hover never changes the actual selection, aim, hand, energy, roll or save.

Cancel, Escape, hand fold, actual hand capture loss, scroll, resize, menu and phase changes clear transient face/coverage. The normal native implicit capture transfer from artwork to hand is preserved; its bubbled child capture-loss event does not abort the gesture.

## Verification

- Full Vitest: **222 files /1,496 tests passed**.12 new regressions cover geometry, exact main/support preview and unaffordable rejection without mutation, visible information, offset receipt source, cancellation and portrait Escape, and native child-to-hand capture transfer.
- [Actual production touch report](thumb-browser.json):667×375,740×360,844×390,1024×768,1440×900,1920×1080. Assumed32 CSSpx thumb radius at the artwork centre clears cost/title/effect/range and fold control. Selected text hit tests are not covered by neighbouring cards. Ghost clears central zone and24px pointer-radius box. Native support drag previews onlyzone8, cancellation makes no change, and release source matches the measured face centre. Real placement still does not spend or pitch.
- This is instrumented geometry and a simulated thumb mask, not a claim of physical user testing or every grip size. Actor images and fonts are decoded before captures. Text clipping checks use actual overflow; visible font ascender/descender extents are not counted as hidden text.
- [Existing six-size one-card regression](solo-browser.json):fold/fan/fixed field and zone, native drag, HP60→48, own support aim, vertical swipe, Inspector scroll, save isolation, reduced motion and vnext rotation passed.
- [Actual main-controller playthrough](playthrough.json):normal seed3 first match11pitches HP60→0→reward/map→reload/title resume→next node; natural take-only defeat/reload; actual3card commit and Escape plan preservation; real0.5× pitch and6real layouts passed. Production game-save reads/writes/deletes remain zero in the playable preview.
- [Default/vnext flow comparison](smoke.json):prepare/take/next, Inspector pause, equal saved states and resume passed. Rotation selection is explicitly exercised for vnext; the report's default-mode rotation flag is false because that branch of the script is not rotated, not a reported failure. [Nine map/reward/locker cases](noncombat.json):scroll/next/overflow passed.
- Engine smoke:[zone10](zones.json),[v9 30](v9.json),[growth2](growth.json),[deck1](deck.json). Actual Pages-base production build59.8MiB/60MiB and CSS350resource paths passed. No new raster assets, engine balance or save schema changes. `git diff --check` passed.
- Independent read-only review verified the source orientation/coordinates, preview legality and cancellation corrections and inspected the actual phone/desktop/portrait captures. No remaining code blocker.

[Prior nine-axis impact analysis](../../design/atbat-hand/THUMB-READABILITY.md). Existing branch preview only; main is not merged. Passing tests do not establish commercial quality or fun.
