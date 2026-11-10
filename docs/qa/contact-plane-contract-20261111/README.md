# Contact-plane authoring diagnostic

Parent main216c3b8. This preserves the next offline evidence step of M22-B. It enables no roulette, pitch destination, pose, collider, actor movement, result, sound, UI or save change. The proposed plane is **unapproved**; this is not physical-contact or commercial-quality acceptance.

Open [index.html](index.html) or regenerate and serve:

```bash
python -B scripts/build-contact-plane-contract.py --out /tmp/9zone-contact-plane-contract
python -m http.server 5392 --directory /tmp/9zone-contact-plane-contract
python -B tests/tools/test_contact_plane_contract.py
```

The diagnostic reads the real authoring atlas cell8 at768×768 and uses the existing foot/anchor transform: scale1.5625, origin(-128.125,-133.75). Its decoded RGBA pixels match the original PNG atlas cell exactly. The extracted PNG is newly encoded; its file bytes are not an original source file. Original assets remain unchanged.

The source alpha is isolated with disclosed manual rectangles for the working bat and barrel. These avoid source-crop neighbor fragments and the main body; the working-bat hand/handle boundary remains uncertain. The barrel is fully retained vertically and at its tip; its left cutoff separates the tapered wood/handle. Boundary uncertainty is3 atlas pixels. The metric uses all occupied pixel squares, including their thickness and gaps, rather than a bat centerline or its bounding box.

The upper bound comes from the midpoint of manually estimated shoulder/waist height; the lower bound from the manually estimated lower lead knee. Their uncertainties are declared in [contract.json](contract.json). Xcenter834 and width210 are design proposals, not measured plate geometry. The ten targets comprise nine row-major cell centers and one explicit outside proposal at normalized(1.5,0.5). The outside side and radius8 are proposals; the engine does not record that outside side. The responsive input grid retains its normalized identity and is not treated as the world plane.

At these **nominal** coordinates, two of nine radius8 disks overlap frame8's barrel; the right upper point is29.5 world pixels from the mask, middle-row gaps95.6–104.1 and lower-row gaps202.9–208.2. Registered C has zero distance at all three alpha thresholds. The deployed AVIF differs from the authoring PNG: barrel mask symmetric differences at thresholds16/128/240 are0/2/4 pixels. Separately recomputed AVIF distances retain every nominal overlap classification. These observations do not propagate landmark uncertainty into overlap bands, prove continuous motion, or establish that seven new drawings are required.

The next authoring step must settle projection/reach at the proposed targets before drawing whole-body contact and adjacent transition candidates. Existing frames7/9 are transitions and are not spare impact poses. Preserve feet, two-hand grip, handedness, proportions, scale and camera; do not stretch an actor or revive HELD#90 to fit these points. No image generation was called in this round.

Actual tools: installed `sprite-gen unpack-atlas --grid 4x4` preserved all14 existing cells; its extracted contact cell matches this tool's RGBA pixels. Installed `2dimg2motion standardize` prepared an external360px reference with234px margins and no warnings. These are extraction/reference preparation, not newly drawn motion. Other tools from the eight-tool plan were not invoked or claimed.

Validation: six analytic controls cover pixel edges, transformed corner distance, transparent holes, a rounding-sensitive radius boundary, empty masks and protected output paths. Independent code review reproduced all60 PNG target/mask/threshold distances, all30 AVIF distances, C controls, JSON/HTML semantic equality and source pixel identity. Independent keyboard UX at568×320/844×390/1280×720 visited all ten targets, toggled the mask and opened JSON/PNG links; vertical scrolling remained available without horizontal overflow. Its first pass found only a favicon404, subsequently removed with a data favicon. This is document usability evidence, not a game art score.

Full product regression remains246 files/1685 tests, ten valid smoke seeds, production build and52.8/60MiB dist budget. Product sources/styles/assets and output entry hashes are unchanged by this diagnostic. External raw evidence is under `/workspace/9zone-next-20261111/`.
