# Pitcher information on demand

Review hotfix from exact #152 `b38f5214522b09d7628b7a604496b3c751caa06d`. No Contact card, art import, main merge or deployment. Contact work is paused separately at local `611ad5a` and is not part of this build.

The registered pitcher now has only a bare72×7 CSS-pixel HP gauge overhead. The former upper-left name/rules/HP panel, repeated public tell and overhead intent/personality badge are absent by default. The zone's existing public probability/range faces, count, runners, hand and actions remain. No pending zone, roll or outcome is read by the new interaction.

Hold the actual pitcher body target450ms with mouse/touch/pen for the existing public pitcher inspector. A short click does nothing. Moving more than8px, early release, pointercancel/capture loss, scroll, blur, resize, phase change and unmount cancel. Compatibility clicks are consumed. Tab to the pitcher and press Enter/Space, or activate it with assistive technology, for equivalent access. Escape, outside click and 경기로 close the modal; Tab stays inside. Initial opener remains the focus target even after switching inspector content. Frozen HUD HP stays unchanged before contact and updates at the existing impact beat. Non-roster test views retain their existing HUD fallback.

## Evidence and limits

`browser.json` records actual extracted-build UI interaction at667×375,844×390,1440×900, plus667 reduced motion, for a normal pitcher and Emerald Tyrant. These are explicitly restored normal-route QA checkpoints, not a claimed fresh full-run victory. The844 cases use Chromium CDP touchStart/move/end/cancel, not synthetic mouse clicks. No physical Android was available. Results are compared exactly against the previously verified real engine outputs. HP normal60→42 and boss112→92; no damage before impact. Target bounds stop above the nine-zone controls.

The small MP4s are uncut game browser captures (load/resume, short press, hold/details, dismiss/cancel/keyboard, actual swing/result). The images and public UI were directly inspected at native mobile size. No new artwork or sprite geometry was created. Optional private roster portraits, Slugger atlas and Slugger card art remain external and must be preserved when applying the overlay.

During verification, reduced-motion focus restoration exposed inherited hidden visibility after inert removal. The controller now restores after visibility is available, with bounded cancellable frame retries. A second regression—changing inspector content overwriting the original opener—was fixed by recording only the first opener. These failures are preserved here rather than described as initially passing.

`flows.json` covers cold title→Slugger selection→guide→map→battle, saved Slugger optional synthetic atlas loading, late loading, reduced motion and rotation. `title.json` confirms ordinary review stays Slugger-only and production retains its prior selection policy. `focus.json` covers reduced Tab containment, tab switch/Escape and rotation/reload resume. Private actual art is not present on this executor; synthetic assets test only loading contracts.

## Run / transfer

Extract `playable-build.zip`; serve the `dist/` directory over localhost HTTP. Vite base`./`; open `/` without a query. The build uses the same normal-review save namespace as#152. The separate transfer ref contains the full634-file SHA256 manifest and numbered UTF-8 base64 delta from the exact#152 ZIP. Verify every listed runtime file. Preserve unlisted private `roster-v2/`, `slugger-motion-v2/`, `slugger-cards-v1/` files; do not replace them with this checkout's synthetic QA fixtures.

`build.json` records final ZIP checksum and byte counts. Tests and CI are recorded in the PR/final delivery; no deployed-site verification is claimed.
