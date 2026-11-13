# Material 6 actual-motion verification

**Verdict: PASS for the targeted material 4 motion defects, with limits.** The reviewed material 6 recordings remove the unintended follow-through down/up detour and low-bat recovery excursion. The new outside POST 11 supplies a visible intermediate arm/bat angle, and 2× outside contact is exposed longer. This passes as a sequence of held authored key poses; it is **not** smooth interpolation, and the remaining inherited pose cuts are described below.

This is the same reviewer who judged material 4 CHANGES. The current verdict follows inspection of the actual material 6 evidence, not the reported blind score, DOM result, source-mask equality, or publication timing. No product edits or blind-score changes were made.

## Evidence actually inspected

Inputs: `live-material6/report.json` and the four supplied actual-host Chromium WebM recordings at 844 × 390. All video frames were extracted without dropping frames; ffprobe presentation timestamps are preserved in CSVs. The recordings are 25 fps, with a recorded-frame interval of 40 ms. Host RAF observations are more frequent and use a different clock.

| Recording | Extracted frames | Last PTS | Consecutive detailed window actually viewed |
| --- | ---: | ---: | --- |
| z9-r0.5-swing-0.01 | 233 | 9.28 s | 5.60–7.68 s: all 53 frames |
| z9-r2-swing-0.01 | 132 | 5.24 s | 2.96–3.96 s: all 26 frames |
| z4-r0.5-swing-0.01 | 229 | 9.12 s | 5.60–7.68 s: all 53 frames |
| z4-r2-swing-0.01 | 137 | 5.44 s | 2.96–3.96 s: all 26 frames |

These windows include pre-contact, contact, follow-through, recovery, and the settled ready pose. Every frame in each window was viewed in time order. Full decoded sequences, timestamps, consecutive-frame window sheets, and overviews are in [motion-review](motion-review/). Native-scale outside boundary crops are in [outside-consecutive-boundaries.png](motion-review/outside-consecutive-boundaries.png).

## Outside join: the material 4 reversal is removed

At 0.5×, material 6 shows the following consecutive endpoints:

| Transition | Video frame boundary / PTS | Assessment |
| --- | --- | --- |
| Contact 10 → new POST 11 | 154→155 / 6.12→6.16 s | Arms/bat rise from the low contact plane to a shallower upward angle. POST 11 fills part of the previous large angle gap. |
| POST 11 → middle POST 5 | 158→159 / 6.28→6.32 s | Continues raising the bat toward the shoulder-height finish. |
| Middle POST 5 → high POST 2 | 161→162 / 6.40→6.44 s | Continues in the same general direction. The two drawings remain similar, but no reversal was found. |
| High POST 2 → course 9 | 165→166 / 6.56→6.60 s | Hands continue upward into the overhead finish. The original 9 lowering seen in material 4 is absent. |
| Course 9 → original 10 | 169→170 / 6.72→6.76 s | Continues into the wrapped bat position behind the shoulders. |
| Original 10 → return-high 13 | 174→175 / 6.92→6.96 s | Begins the return toward the batting stance without dropping the bat to the old recovery-11 low position. |
| Return-high 13 → return-low 12 → ready 0 | 178→179 and 182→183 / 7.08→7.12 and 7.24→7.28 s | Settles through the ready-stance drawings. The earlier wrapped-bat → low-bat → raised-ready excursion is removed. |

The new 10→11→5 sequence gives a coherent rising direction. It remains a series of replacements after holds; POST 11 does not turn it into continuous animation. No extra arm, detached hand, broken grip, or empty body was found at the inspected joins. Feet remain broadly registered across the outside contact/POST chain; no continuous foot glide was established there.

The material 4-specific follow-through hitch was a downward hand/bat move followed by an upward move before the wrapped finish. That detour is no longer present. The middle-row recording likewise proceeds into the shared raised/wrapped finish without the removed original-9 detour.

## Contact and bridge visibility at 2×

| Observed host state interval | Material 4 | Material 6 |
| --- | ---: | ---: |
| Outside contact → next pose, 0.5× | 133.6 ms | 299.9 ms |
| Outside contact → next pose, 2× | 16.9 ms | 59.3 ms |
| Middle contact → next pose, 0.5× | 138.6 ms | 302.2 ms |
| Middle contact → next pose, 2× | 27.6 ms | 74.5 ms |

Intervals run from the first observed sample of a state to the first observed sample of its successor. They are not exact painted dwell measurements.

In the 2× outside video, contact is visible in frames 81 and 82 at 3.20 and 3.24 s; the new bridge appears at frame 83, 3.28 s, followed by the rising finish. This improves the previous material 4 single-frame outside contact flash. The bridge is brief but visibly contributes an intermediate direction rather than another reversal.

The material 6 outside 2× RAF state-change intervals are approximately 59.3 ms contact, 39.6 ms POST 11, 43.9 ms POST 5, 33.1 ms POST 2, and 33.5 ms course 9. **Do not describe every post as at least 56 ms of real wall-clock exposure at 2×.** These observations do not support that statement.

The middle 2× video captures contact in only frame 84 at 3.32 s before POST 5 at frame 85, 3.36 s, despite its longer 74.5 ms interval in the RAF observations. Capture/paint timing therefore prevents a universal “two recorded contact frames” claim. At 2×, the overall contact/finish direction is readable, but individual posts and small explanatory text are still too brief for leisurely inspection. The verdict concerns coherent action direction and improved exposure, not equal readability at both speeds.

## Inherited limits that remain

The long visible ready hold and direct ready-to-contact replacement remain. There is still no visibly continuous downswing through that cut. Recovery also replaces the back-facing wrapped finish with a front/side-facing ready-stance drawing, changing torso orientation and foot placement abruptly. Reordering removes the unintended low-bat excursion; it does not supply a continuous unwinding turn or animated footstep.

Those are visible limitations of the inherited held-key-pose presentation. They should remain in the quality record. I am not classifying them as a newly introduced material 6 direction reversal or requiring a fully interpolated/3D-style swing to pass these targeted fixes. A claim that all material 4 motion concerns have become smooth would be inaccurate.

## RAF, ball, and loading checks

The supplied report contains 23 actual-host cases across the six rates, three hit rows, outside foul/whiff, and take cases. All record empty error lists, exact expected results, preserved production state, and no early grading. Independently inspected sample arrays show:

- Zero samples with both character layers visible, and zero with both hidden.
- Zero visible-course samples with a missing image or zero image width.
- Largest observed RAF gap: 39.7 ms. Shorter defects cannot be ruled out by sampled logs.
- First result observations occur 4.5–72.4 simulation ms after recorded impact, not before it.
- The outside foul logs contain visible course keys 0, 3, 10, 11, 5, 2, 9 at both reviewed speeds.
- The outside whiff log contains 0, 3, 10, 11, 5, 9; key 2 was not observed in that case. Consequently the logs do not establish that every post is painted in every outcome.

The corrected public ball-point telemetry now supplies 2,133 non-null point samples, all finite. This removes the previous entirely-null instrumentation limitation. Each sample exposes one public point; that fact alone is not an exhaustive count of every drawable sprite. The four inspected video sequences show one moving ball/trail and no independently moving duplicate. The stationary target glyph remains distinct from the moving projectile by its fixed position, though both are light marks.

No cold blank, simultaneous full-body overlay, or extra-arm flash was observed during the reviewed joins. Initial navigation/loading is outside these contact/recovery windows.

## Scope of approval

**PASS: targeted actual-motion remediation in the four supplied recordings.** No remaining introduced direction reversal, bridge anatomy failure, cold join blank, or duplicate moving ball was found. Contact exposure improves, with the 2× capture/readability qualifications above.

This is not a reference-art quality pass, smooth-interpolation claim, universal frame-dwell guarantee, source/engine audit, or release approval. The other matrix cases have RAF/log coverage rather than this frame-by-frame qualitative video coverage. DOM alignment, overflow, and broader regression gates belong to the separate root review; the earlier material 4 failure record remains intact. No audio, haptic, or real-device tactile assessment is claimed.



Repository artifact note: the four lossless-input WebM recordings and timestamped all-window comparison sheets are preserved here. Full per-frame PNG extraction remains in the execution workspace and is reproducible from those recordings; it is not duplicated into the repository.
