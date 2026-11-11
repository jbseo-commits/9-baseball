# Offline contact-art gate

The validator rejects misplaced stance registration before computing contact distances. Earlier contact candidates could retain the correct canvas ratio while their feet drifted, making apparently good target overlap misleading. This tool never fits a pose, changes source pixels, moves a target, generates art, or enables game presentation.

```sh
python -B scripts/validate-contact-art.py \
  --sheet /path/to/three-contact-cells.png \
  --criteria /path/to/frozen-criteria.json \
  --barrels /path/to/reviewed-barrels.json \
  --out /tmp/contact-art-report
python -B -m unittest discover -s tests/tools -p test_validate_contact_art.py
```

Existing defaults use the approved original frame8 and the **unapproved** plane proposal in `docs/qa/contact-plane-contract-20261111/`. The sheet must contain exactly three equal square cells. The criteria must pin the reference PNG SHA256 and supply `footPatchesNative` and `registrationGate`. Despite the historical field names, patches and drift limits use the canonical724-cell coordinates; only one whole-cell ratio maps them to the actual output dimensions. The candidate is never independently aligned.

For both feet, alpha128 mask IoU must reach the frozen minimum. The raised rear heel may pivot, so its anchored boundaries are toe-right and sole-bottom. The planted front shoe also retains heel-left. All four bounding-box drifts remain diagnostic. This corrects the initial implementation of `toeSoleBoundaryMaxDriftNativePx`, which mistakenly gated the unanchored raised heel; it does not relax the fixed4px anchored limit or .75IoU limit. A translated foot still fails.

Any failed pose blocks contact acceptance for the whole batch. Transparent sources and explicit manually reviewed barrel ROIs are also required. Annotations use `barrelRoiIn724Cell:[left,top,right,bottom]`, one per row. Contact distance uses the occupied pixel-square union of the full annotated barrel, including thickness and transparent gaps, rather than its centerline or bounding box. Alpha16/240 are sensitivity checks; alpha128 is the nominal test at the unchanged proposed radius. Neither numerical overlap nor an ROI rectangle proves anatomical correctness.

The JSON pins the sheet, reference, criteria, proposed contract and annotation file with SHA256 and embeds the reviewed annotations. The report emits correctly composited dark/light images and an unchanged-art target overlay. RGB values at alpha1–2 must not be interpreted as opaque red/yellow fringe. Original source bytes are retained.

Exit0 means `GEOMETRY_REVIEW_READY`, never runtime approval. Exit2 means a gate failed or annotation review is still needed. `runtimeApproved` remains false in every result. Anatomy, identity, bat dimensions, scene integration, projection and actual motion require separate review. Repository output is restricted to `docs/qa`; use an external directory for working reports.

Validation: ten Python controls pass, including a failing-then-fixed annotation-provenance regression, transparent-hole rejection, toe/heel controls, alpha1 source-over and whole-batch fail-closed behavior. Six existing contact-plane controls also pass. Independent review reproduced the corrected source hashes and exact RGBA packing. The working candidate passed247 Vitest files/1696 tests; the course tests belong to a separate unconnected proposal. Smoke covered ten seeds per each of four public-information starter policies, not a complete run or human fun. The Pages-base production build passes the52.8/60MiB budget and all four entry JS/CSS hashes match verified main. This is tooling evidence, not a game-art or commercial-quality acceptance.
