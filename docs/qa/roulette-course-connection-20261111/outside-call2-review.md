# Outside-contact authoring call 2: source review

**Static source decision: PASS.** Call 2 corrects call 1's oversized bat while preserving the fixed outside contact and both feet. The T9 disk overlaps the measured black barrel at all three alpha thresholds; both frozen planted-foot gates pass. This is call 2 of the authorized three. It remains a 2D source-art result, not runtime or production approval.

## Preserved source and cleanup

The generator's source was copied without changes to `outside-call2-contact.png` (1254×1254; SHA-256 `1aa1053ad624934dacca1f61bc9355bea8e9e78e666adb515cf640962fe4655e`). Uniform LANCZOS normalization created a separate 1024×1024 copy. Its lower rows contained 320 alpha-1 pixels. All 144 complete alpha>0 8-connected components crossing row 768 were detached from the largest subject component, no larger than 30 pixels, no wider/taller than 10×10, and had maximum alpha 1. Whole-component cleanup removed exactly 328 pixels, including any component pixels above the boundary. The largest-subject RGBA bytes and all pixels outside the authorized component union remain identical. The cleaned 1024×768 cell has zero alpha below row 768. Raw input and normalized files remain preserved.

The full cleanup proof, source hashes, complete component list, and measurements are in [outside-call2-source-validation.json](outside-call2-source-validation.json). The preserved authoring request is [outside-call2-contact-request.json](outside-call2-contact-request.json).

## Fixed T9 and barrel check

The unchanged mapping is T9 `(1044, 610.78125)`, origin `(-128.125, -133.75)`, and `1.5625` world px per source px. T9 maps to `(750.16, 476.5)` in the 1024-normalized cell; radius 8 is 5.12 source px. I manually isolated the black barrel plus warm rim in `[640,447,775,495]`, excluding the wood and hands. T9's distance to the barrel mask is **0.0 world px** at alpha 16, 128, and 240. The radius-8 disk overlaps at every threshold.

The candidate's dark barrel core measures about **119.0×32.2 px** (PCA length and perpendicular thickness) against **125.5×34.8 px** on the requested approved `middle-contact-light.png` control, within the ±10% size band. Against the original approved frame-8 contact atlas, the candidate is about **+6.6% length and +0.7% thickness**, also within the frozen tolerance. Full two-glove grip midpoint to tip is approximately 195 px versus 205 px on the control, within the requested 190–205 px interval. These source-image comparisons do not define a 3D bat collider.

## Frozen foot check

The original approved 768×768 contact cell is right-padded with no resize. The frozen 724-cell foot patches are mapped once by `768/724`; no pose fitting is applied. At alpha ≥128:

| Foot | IoU | Anchored edge drift | Gate |
|---|---:|---|---|
| Rear | 0.940818 | toe 0 px, sole 1 px | Pass |
| Front | 0.957276 | heel 0 px, toe 0 px, sole 0 px | Pass |

The IoU floor is 0.75 and the mapped anchored-edge maximum is `4×768/724` px. Sensitivity at alpha 16 and 240 is also recorded in the JSON.

## Visual review

The right-handed batter retains the navy helmet, cream/navy/gold uniform and painted sprite style. Both hands remain together on one handle and connect to the forearms; no detached anatomy is visible at source scale. Proper light and dark source-over composites show the same narrow warm outline, without a broad halo.

- [T9 and manual barrel ROI](outside-call2-registration-guide.png)
- [Full source over light and dark](outside-call2-light-dark.png)
- [Barrel ROI close-up with coordinates](outside-call2-bat-zoom-coordinate-guide.png)
- [Cleaned strict 1024×768 cell](outside-call2-contact-1024x768.png)

## Scope limits

The result preserves fixed target/ball/actor geometry and passes these static source gates. It does not approve continuous movement, a physical 3D contact plane, runtime integration, deployment, or commercial quality.
