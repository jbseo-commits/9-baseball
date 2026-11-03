# 20-pitcher rig runtime integration QA

Date:2026-10-31 KST. Branch:`codex/full-roster-rig-runtime`. Runtime integration was explicitly requested after delivery of the source-kit revision.

- Full Vitest:224 files,1509 tests passed. Earlier timing expectations were updated to the actual roster clock; sandbox child-process EPERM failures were rerun with permission to execute those read-only checks.
- Public-information zone smoke:10 seeds completed; diagnostic simulation, not human fun/balance proof.
- Production build:52.2MiB /60MiB; old120-frame pitcher atlas imports absent. The20 new alpha AVIFs total11,277,113bytes and have2560×3072 dimensions. Source hashes and anatomical hand/style provenance are in the runtime manifest.
- `playthrough.json`: native UI actions, actual seed3 starting deck, no HP/card grants.11pitches reducedHP60→0, reward→map→reload/title resume→nextnode. Natural defeat and reload,3-card commit, actual0.5× clock (about4508ms), six field sizes667×375 through1920×1080, errors[].
- `controller-parity.json`: default/vnext seeded saved states identical, preparation/take/auto-next/inspector pause/resume passed, rotation preserves selections. Session preview leaves production saves untouched.
- `noncombat.json`: map/reward/locker fixture transitions at844×390,390×844,320×568, no overflow regression/errors. These are explicit seeded fixtures, not a claim of a complete run through every facility.
- `viewports.json`: additional actual-game field placements including640×320. Existing below600px landscape policy still fails to fill568×320; no global layout/CSS was changed by this integration.

Independent reviewer compared all20 registrations against the source rig exports: exact atlas anchor, rendered scale, frame76 projected hand socket, hand/style/status match. Held ball is baked only through75; the host owns the projectile from76. Actual battle controller tests use the same presentation rate and release event.

Technical integration approval and art acceptance are distinct. Known visible joint seams, release grip and weight transfer remain in the manifest (`artAcceptance:false`). Runtime uses articulated-rig atlas exports, not live continuous mesh skinning. Existing main deployment is separate from this branch preview.
