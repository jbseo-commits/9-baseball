# Outside-contact call 3: POST bridge source review

**Static source decision: PASS as an early rising follow-through bridge.** The new pose keeps the fixed feet and source registration, preserves the physical bat size, and falls between call 2 contact frame 10 and the existing middle POST frame 5 in both grip direction and bat angle. This consumes the third authorized art call. No T9 overlap is required for a POST pose.

## Preserved source and alpha cleanup

The generated source was copied unchanged to `outside-call3-post.png` (1254×1254 RGBA; SHA-256 `1fe9cf3333bad03281df15b11c0745e39808112a6f7472dfeb9129815416dd85`). A separate uniform LANCZOS resize created a normalized 1024×1024 image. It contained 606 alpha pixels below row 768. All 250 complete alpha>0 8-connected components touching those rows were detached from the largest subject component, had alpha max 1, size ≤30 pixels and bbox ≤10×10. The authorized noise-only derivative removes those complete components, including any pixels above row 768: **628 pixels total**. Every changed pixel is in that component union; the largest-subject RGBA hash is unchanged. The cleaned 1024×768 cell has zero alpha below row 768. Raw source and raw normalized PNG are preserved.

The full component list, pixel-change proof, source hashes and exact measurements are in [outside-call3-source-validation.json](outside-call3-source-validation.json). The exact request is preserved in [outside-call3-post-request.json](outside-call3-post-request.json).

## Frozen foot registration

The approved 768×768 reference is right-padded without resizing. The canonical 724-cell foot patches are mapped once by `768/724`; no pose fitting is used. At alpha ≥128:

| Foot | IoU | Anchored edge drift | Gate |
|---|---:|---|---|
| Rear | 0.934291 | toe 0 px, sole 1 px | Pass |
| Front | 0.928878 | heel 1 px, toe 2 px, sole 0 px | Pass |

Both exceed IoU 0.75 and remain below the mapped anchored-edge limit `4×768/724` px. Sensitivity at alpha 16 and 240 is recorded in the JSON.

## Bat and phase ordering

The manually isolated dark barrel core in `[620,285,742,362]` measures **115.2×33.1 px** (PCA length and perpendicular thickness) at alpha ≥128 and RGB max <90. The same method gives call 2 contact frame 10 **119.0×32.2 px** and existing middle POST frame 5 **115.4×31.4 px**. Call 3 remains within 10% of both. Its barrel axis is about **−16.2°** (up-right); call 2 is +6.3° and existing middle POST is −25.8°, so the new drawing continues the bat rise without duplicating either endpoint.

White-pixel hand centroids, measured in fixed local visual-review boxes, move call 2 contact `(545,442)` → call 3 POST `(507,369)` → existing middle POST `(453,348)`. The new grip remains distinct from both poses and advances monotonically up-left. It retains the same right-handed batter, uniform, helmet, two connected hands on one bat, and planted shoes. Proper light/dark source-over composites show the same narrow warm edge.

The measured grip is higher than the request’s approximate `(535,420)` cue, and the visible tip is higher than its approximate `(723,352)` cue. The resulting pose still lies between contact and middle POST in hand position and angle and reads as a rising early follow-through, not the higher endpoint. This is a source-guide deviation, not a moved target or actor fit.

- [Call 2 contact → new POST 11 → existing POST 5 at fixed registration](phase-contact-post-compare-dark.png)
- [Same comparison on light](phase-contact-post-compare-light.png)
- [Grip and bat angle coordinate close-up](grip-and-angle-coordinate-compare.png)
- [Light/dark source-over composites](outside-call3-light-dark.png)
- [Cleaned normalized 1024×768 POST source](outside-call3-contact-1024x768.png)

## Atlas revision

The independent external revision adds this source as frame 11. Frames 0–10 are pixel-exact to the previously packed atlas, frame 11 is pixel-exact to the cleaned source, and frames 12–15 are transparent. Contact frames 1/4/7/10 remain unchanged. See [final-atlas-validation-call3.json](../final-atlas/final-atlas-validation-call3.json) and [contact-frame-registry-call3.json](../final-atlas/contact-frame-registry-call3.json) for hashes and ROI provenance.

This is static source-art evidence only. It does not approve runtime motion, a physical 3D plane, deployment, or commercial quality.
