# Optional Slugger review actor loader — plumbing only

Base #149 `2f9a6114c045a76f3cb28feeb3c440dd8050442d`. Separate review branch. No candidate art, main edit, merge, deployment or Library call.

## Owner installation contract

Keep the existing four `roster-v2/*.webp` portraits. This optional battle actor uses ONLY two same-site fixed paths relative to Vite BASE_URL:

- `slugger-motion-v2/slugger.json`
- `slugger-motion-v2/slugger.webp`

Enabled only by compiled `VITE_NORMAL_REVIEW=1`, actual normal-review host, normal version1 Slugger identity (old/new buildVersion), and live vnext battle. Other classes, production, training/demo modes make no requests. Existing Slugger-only new-game policy and all old-class resume behavior are unchanged.

Metadata requires sourceWidth/sourceHeight192,columns/rows4,14 frame objects in atlas-slot order, anchor{x:52.5,y:175}. Optional frame id must match its0–13 index. Optional event/frame contact must be finite within0–192; their coordinates are NOT used to move gameplay. Texture must decode as image/webp at768×768, at most8MiB. JSON limit32KiB. Existing six unique poses must already be arranged into the14 authored timeline slots; the loader does not synthesize inbetweens or certify pose quality.

World foot is code-owned ATBAT_COMPOSITION.batter.worldFoot (200,960); worldHeight1100; nominal rendering event(160.5,86). JSON worldFoot/worldHeight/file/URLs/names are discarded. Original composition contact, pitcher hand, camera and all clocks remain authoritative. No redirects are accepted. The same fetched WebP bytes are decoded and installed through a blob URL, avoiding a second mutable texture request. Atomic adoption occurs only in deciding, never halfway through flight/result. Abort/stale loads cannot replace the current actor; owned URLs are revoked on eligibility change/unmount or decode/dimension failure. A later renderer error falls fully back; its single owned URL remains bounded to that component lifetime.

Missing/invalid/unavailable files quietly use the existing approved shared batter. A later install is picked up on next battle mount/reload, not an automatic polling loop. Rendered actor descriptor is explicit `review-slugger-atlas`; URL changes no longer select the wrong static/authored geometry branch.

## What was actually tested

All browser tests used the extracted final ZIP. Fixture WebP is ONLY the existing approved shared atlas downsampled nearest to192px cells; it is not the new industrial Slugger and not a quality approval. Synthetic JSON deliberately carries an invalid external URL and huge world position: no external request or geometry change occurred. Fixture files are not in dist or this review's runtime assets.

- `browser.json`:14 cases across844×390/667×375. At844, exact #149 vs loaded geometry/layout/world camera/contact/release variables and actual same-pitch result match;667 is a separate viewport check. New/old Slugger load; other3classes do not request assets.404,badJSON,badanchor,missing/corrupt texture,redirect,renderer error return to approved actor. No page errors/external requests.
- `flows.json`:cold `/` title→defaultSlugger→guide→map→actual swing/result/next; reduced motion; delayed JSON completed during windup but actor changed only next deciding; production no request. Rotation retains actor contract. Only the `late` flow intentionally tests a midflight arrival; false flags in other rows mean not that case, not a failed assertion. One initial QA script expected a manual next button after an already auto-advanced fresh result; corrected harness navigation, no runtime change.
-8 targeted tests include schema/geometry/resource/abort/stale guards, forged external metadata, render-time fallback, and actual BattleScene sampling of unchanged14slots at24/30/60fps. These are controlled timestamp cadence tests, not physical24/30Hz device claims. Reduced motion retains frame0.
- Full270 test files /1826 tests passed,100-seed zones smoke, review+production build, dist52.1MiB/60MiB. Independent read-only review confirmed code/resource boundaries,270/1826 tests and ZIP CRC/hash; no loader blocker. No new full campaign victory claimed; #149's two normal terminal runs remain the progression baseline.

Videos named `synthetic-*`/`fresh-synthetic-*` are actual browser recordings with that local fixture, not new Slugger art footage. Under1MB each. Screenshots/video frames were directly inspected. Physical Android, actual owner candidate bytes, silhouette/pose contact fidelity remain unverified here.

## Deliverable and next gate

ZIP contains634 dist files; Vite base `./`, normal entry `/`. `build.json` gives SHA256 and sizes; `dist-manifest.json` is complete. Transfer overlay must be applied to exact #149 dist. Preserve owner's optional portrait files; install motion files separately only for owner art inspection.

No Tyrant or Onyx changes are included. Tyrant lower-wall work remains the subsequent independent pilot after the actual Slugger candidate art stage. Existing Vulcan REVIEW/HELD and all actor approval gates remain unchanged. Local AGENTS/HANDOFF/art workflow applied; no applicable local art skill package or new asset generator was used.
