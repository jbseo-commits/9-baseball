# Local-only actual actor QA vehicle (not a release)

Exact unchanged application base: #157 `e23d140c7f7f28f3e40b2049725982b95f9925e3`. No src/main/production route, balance, map algorithm, art or normal unlock changes. This entry is excluded from default builds and rejects every hostname except localhost/127.0.0.1/[::1]. Never put these harness files on the owner live/private Site or production host.

## Parent installation
1. Copy the exact #157 extracted dist **to a separate local folder** (keep the owner runtime untouched).
2. Read `delivery/overlay-manifest.json`. Verify/decode numbered001,002 b64 chunks or use `harness-overlay.zip`, verify ZIP SHA256, extract into that separate folder. It adds12 previously absent files; overwrite/delete lists are empty. The original index.html and all634 application bytes stay identical. Verify646 combined per-path hashes with `local-host-manifest.json`.
3. Keep/copy the nine existing private extras. Install actual candidates in the SAME folder: `slugger-motion-v2/slugger.webp`+`.json`, `contact-motion-v1/contact.webp`+`.json`, `emerald-ready-v1/ready.png`. They are not in this delivery. Existing optional loader contracts and fallback apply; missing/invalid copper art shows the old approved generic actor, not a fake copper replacement.
4. Serve locally, e.g. `python -m http.server 4251 --directory /path/to/separate-folder`.
5. Open `http://127.0.0.1:4251/field-harness.html`. Select **슬러거 vs 에메랄드** or **컨택 중심 타격 vs 에메랄드**, then **이어하기**. The bar always says **검수 경기 · 저장 안 됨**. Open hand → 기본 스윙 → centre cell → 스윙 to check centre contact; ordinary cards/take/next remain real controls. `검수 선택으로` drops that memory session. Refresh returns to chooser.

## Scope and isolation
Both fixtures use actual engine seed8886879, explicit Act1 boss reachability checkpoint, and real class decks. Build-time engine search selects a centre-hit first pitch; no pending field or outcome is overwritten. This is a clearly disclosed fixed QA match, NOT an earned campaign, fair blind playtest, guaranteed win, Contact unlock, or all-zone art proof. Subsequent results use the actual engine. Centre selection tests centre contact only; don't infer extreme bat alignment.

Each selection owns a fresh Map-backed adapter, including the durable read used by committed course presentation. Campaign save and achievements never use localStorage. Existing BGM/settings may still read/write their usual preference keys if changed; do not claim all browser storage is inaccessible. In tested gameplay, all sentinel storage remained unchanged.

Actual copper Slugger and Contact candidates are held by the parent. Executor tested only existing approved synthetic atlases at the same fixed endpoints plus existing Emerald drawing0. Private art is neither committed nor fetched. Parent must inspect actual installed art, especially low-ready→original windup transition and held Contact extreme-course geometry.

## Build again
From repo root: `node tools/private-field-harness/build.mjs`. Default output `/workspace/field-harness-dist`; choose a different disposable absolute directory with HARNESS_OUT if needed. The script refuses normal repo dist/root. It creates/removes ignored temporary root entry files in finally. Never import entry.jsx directly; its root-relative imports and fixture marker are resolved by this isolated build. Default `npm run build` does not import this harness and was checked to contain no harness HTML/chunks.

## Checks
Actual UI tests: Slugger loaded at667×375, Contact loaded at844×390, Slugger missing-art fallback; both real centre actions reduce actual Emerald HP. No CUA save injection initializes the match: visible choice buttons do. Test-only storage sentinels check normal/production/career storage unchanged. Reset and reload return to chooser; non-local hostname denies all controls. Separate extracted overlay repeats the same tests. Independent source review found no blockers. Original #157 runtime's full1872-test result remains applicable; this opt-in source/build vehicle does not modify that runtime.

No merge, normal-save mutation, live installation or deployment performed.
