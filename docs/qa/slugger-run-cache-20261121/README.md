# Run-owned optional Slugger actor — synthetic validation only

Base #1595dcadbcc; held #160 is not included. Actual copper art stays private with the parent. No actor geometry, scene, rule, input, class lock, save or clock changes.

Previously BallparkBattle owned a fetch/decode and disposed it on every encounter unmount. Duel now owns the optional resource across title/map/reward/battles. Eligibility uses the current title save (not stale initial state), current run, or the review Slugger picker. Continue remains immediately responsive. Managed null suppresses encounter-local duplicate fetch. A ready candidate is adopted on the first deciding render; late candidates wait until deciding without playback. Standalone callers retain their previous loader contract. Ownership ends on eligibility loss or Duel unmount; abort races reclaim late blobs. Five-second timeout includes Image.decode via the existing abort-safe texture helper. No global cache or persistent URL.

## Exact extracted build

See build.json and full dist-manifest.json. ZIP52243468 bytes / SHA25644fc993fc93f9c875713c3e0763f154892212fafdf9f11234e381f0bf2a517bf;634 files; base `./`; normal `/`, no query. No QA entry or private art included. All browser tests used this ZIP's extracted dist.

## Checks

- Full local suite:280files /1876tests PASS. Smoke `node scripts/zone-report.js 10` PASS. Normal production build and52.1MiB/60MiB budget PASS.
- Actual browser cold fresh667×375: request begins in Slugger selection. Guide/map/first battle via real controls; all sampled initial actor frames use the validated synthetic review actor.
- Resume844×390: request completes on title before Continue, first sampled actor is review type. This test waits600ms on title; it does NOT promise zero fallback under arbitrary network latency or immediate Continue.
- Controlled unresolved JSON: normal input remains available; fulfill during real swing or real loadPower preparation. No candidate swap during playback; candidate appears on next safe decision.
- >5s timeout and malformed metadata remain fallback; Contact save sends no Slugger requests. Production Slugger save sends no optional requests.
- Fresh random seed1668568682, reduced-motion667×375, public grid/card policy only:6actual pitches, first encounter victory, reward→map→locker→map→shop→map→second encounter. Same blob URL, exactly one JSON + one texture request. This is not a complete campaign claim.
- Independent reviewer: no source blockers; additional13 relevant tests PASS. Existing decode-abort test covers stalled Image.decode and exactly-once URL disposal.

Initial browser script used an invalid `.t-prep` selector; corrected to actual `loadPower` card. A fixture-write/reload race in the script initially counted a canceled first mount request; corrected by waiting for initial title before writing the test save. Neither required product changes. Evidence records the final successful run.

## Parent actual copper check (local only)

Copy extracted dist to an isolated local directory and retain all existing private optional files. Put actual copper at `slugger-motion-v2/slugger.json` + `.webp`. Serve localhost. Cold fresh `/`: open new game/Slugger selector; confirm fixed JSON+WebP begin before launch, then guide/map/battle. Existing Slugger save: reload to title and inspect requests before Continue. Track image natural size768×768 and actor kind `review-slugger-atlas`; generic fallback is3072×3072. Enter a second encounter without reload: same blob URL and no further candidate request. Network throttling may still produce intentional fallback if Continue outruns decoding; never block UI to hide that.

For actual upper-inside/center/whiff art inspection, the prior LOCAL-ONLY harness9babd1e remains a separate #159 baseline tool, not part of this normal build. Do not install that harness on the owner Site. These synthetic recordings prove resource lifecycle, not copper silhouette or contact quality.
