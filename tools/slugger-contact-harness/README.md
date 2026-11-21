# Local-only Slugger contact checks (#159)

This is a reconstructed QA checkpoint, **not an earned campaign or copper-art approval**. Base: `5dcadbcc42f86e8d92b5ba3cc7cc615fd8e05d8e` (#159), not held #160. No runtime source, normal entry, camera, timing, cards or saves were changed. No private art is included.

## Parent reproduction

1. Copy the exact #159 normal dist into a separate local folder. Do not modify the owner Site folder.
2. Fetch `delivery/manifest.json` and both numbered `.b64` files at this immutable commit using GitHub connector `fetch_file` (UTF-8 content). Concatenate in numeric order, decode base64 to ZIP, verify SHA256 `6d516c8a8047e23dbfa4a04732d7528b5bdca454212ccc0dacf44b5ea79a9b5b` (762980 bytes).
3. Extract into the separate dist. This adds 13 files, overwrites **zero** existing paths; normal `index.html` stays byte-identical. Verify every `addedFiles` digest in the manifest.
4. Privately copy the owner's real files to `slugger-motion-v2/slugger.json` and `slugger-motion-v2/slugger.webp` under that local folder. Missing/invalid files deliberately use the approved generic fallback. Synthetic loader QA does not prove actual copper contact.
5. `python -m http.server 4260 --directory /absolute/path/to/copied-dist`
6. Open `http://127.0.0.1:4260/slugger-contact.html` at **667×375**, 1× speed. Choose one visible case → **이어하기** → expand hand → **기본 스윙** → specified grid cell → **스윙**. Use **검수 선택으로** to reconstruct a fresh case.

| Button | Seed | Aim | Actual first result | HP |
|---|---:|---:|---|---|
| 몸쪽 높음 정타 | 43446964 | upper-left 0 | zone0 hit |60→48|
| 가운데 정타 대조 |21723482|center4|zone4 hit|60→48|
| 헛스윙 대조 |21723482|lower-right8|zone4 whiff|60→59|

All use the actual first normal `a1-entry` Sky Phantom encounter and Slugger 9-card kit. No route edits, pending edits, course override or runtime result forcing. Offline seed selection is explicit. Center and whiff have identical pre-action state hashes; ordinary aim differs. The existing whiff effect deals 1 HP: do not use zero damage as the assertion. Other cards/turns are not guaranteed.

Inspect immediate ready, downswing, impact and follow with the actual private copper at 1×. Normal authored frames 0–10 including contact8 were observed in the browser. Fixed body/contact limitations must be assessed visually; this harness never moves the actual course to meet the bat.

## Isolation / validation

Only localhost/127.0.0.1/[::1] plus explicit build flag can mount this entry. Refresh returns to chooser. Normal campaign and career use a separate in-memory adapter and never write persistent campaign state. Shared audio preferences may still persist if changed; do not describe all localStorage as inaccessible. HP-only overhead and Enter/Escape detail control retained. No Emerald ready candidate, bridge, #160 ground tell or Contact asset is included.

`node tools/slugger-contact-harness/build.mjs` rebuilds this opt-in entry; `HARNESS_OUT` must be a separate output folder. Default production entry never imports it. Do not upload the harness to any owner/live host.

Browser evidence: three 667×375 cases with synthetic approved-art loader; upper case844×390 with missing-asset fallback; exact reconstructed overlay tested again; normal/career sentinel values unchanged; reset/reload and nonlocalhost gate. All actual UI outcomes agree with the original engine. No actual copper pixels were available here. Previous #159 full suite result is inherited, not claimed newly rerun; this tool changes no production code.

## Impact analysis

Before implementation: UI/input/viewport/overflow affect only the explicit QA entry and fixed label; keep ordinary Duel controls and test667×375. Engine/balance untouched; seed validation is offline only. Save risk isolated through per-case memory adapter. Normal route untouched, QA enters a reconstructed legitimate first node. Tests cover actual buttons/result/loader/save/host guard. Build adds an opt-in tool and additive artifact only. Recovery is deletion of13 added paths; never replace normal index. Independent reviewer reproduced all three fixture outcomes and confirmed no route mutation.
