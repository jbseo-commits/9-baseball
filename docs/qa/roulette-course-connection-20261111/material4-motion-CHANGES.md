# Material 4 actual-motion QA

**Verdict: CHANGES.** The recorded character-layer handoffs are populated, but the visible swing is a sequence of held drawings with pose discontinuities. In particular, the outside follow-through reverses its hand/bat height before rising again. Mechanical visibility and source-mask matching do not approve this join.

Scope: after / `coursePreview=1`, actual-host Chromium recordings at 844 × 390. This review used only the supplied `live-material4/report.json` and four supplied WebM recordings. No product or source files were inspected or changed. The sealed blind scores were not changed.

**Known separate failure:** root reports that the material 4 projected grid is misaligned at several tested viewport heights, with target drift of 41–112 CSS px. That is a known FAIL supplied by the independent DOM review, not a measurement made here. This report does not grant runtime or release approval.

## Evidence and method

All four videos were decoded with ffmpeg without dropping frames. ffprobe provides the presentation timestamps in each recording's `timestamps.csv`. The recordings are 25 fps / 40 ms per recorded frame, even though the host RAF observations are approximately 60 Hz.

| Recording | Decoded frames | Last frame PTS | Every-frame detailed window actually inspected |
| --- | ---: | ---: | --- |
| z9-r0.5-swing-0.01 | 228 | 9.08 s | 4.96–7.84 s, 73 frames; additionally 4.20–4.96 s pre-contact |
| z9-r2-swing-0.01 | 135 | 5.36 s | 2.64–3.76 s, 29 frames |
| z4-r0.5-swing-0.01 | 236 | 9.40 s | 5.28–8.16 s, 73 frames |
| z4-r2-swing-0.01 | 132 | 5.24 s | 2.56–3.68 s, 29 frames |

All-frame PNG sequences, timestamp CSVs, overviews, and consecutive-frame window sheets are in [motion-review](motion-review/). These are temporal sequences, not selected illustrative contact stills. Video PTS and report `wall` are separate clocks; the observations below retain their respective clock labels.

## Outside contact and follow-through: CHANGES

The body remains recognizable and connected: no extra limb, detached hand, or visibly broken bat grip was found in the inspected frames. The failure is temporal continuity rather than a proven impossible anatomical endpoint.

At 0.5×, the exact consecutive boundary frames show:

| Join | Video frames / PTS | Visible finding |
| --- | --- | --- |
| Original plant → course ready | 121→122 / 4.80→4.84 s | Raised loaded hands change to the upright course stance with hands across the chest. The preparatory body sequence resets its silhouette rather than continuing into the swing. |
| Course ready → outside contact 10 | 143→144 / 5.68→5.72 s | Hands and bat jump directly from the chest to extended waist-level contact. The visible course drawing supplies no intermediate downswing despite the hidden original pose state advancing. |
| Outside contact 10 → middle POST 5 | 147→148 / 5.84→5.88 s | Waist-level contact is replaced by raised, extended arms. The direction is plausible for follow-through, but the large angle change arrives as a replacement after a hold. |
| Middle POST 5 → high POST 2 | 152→153 / 6.04→6.08 s | Very similar raised silhouette and planted stance. No obvious new anatomical defect, but this adds little visible movement between the surrounding larger jumps. |
| High POST 2 → original 9 | 156→157 / 6.20→6.24 s | Hands/bat lower again. This reverses the preceding upward follow-through direction. |
| Original 9 → course 9 | 161→162 / 6.40→6.44 s | Hands jump upward over the head. Together with the preceding lowering, this creates a distinct down/up hitch. |
| Course 9 → original 10 | 165→166 / 6.56→6.60 s | Bat changes to the wrapped position behind the shoulders without a visible connecting arc. |
| Original 10 → recovery 11 | 171→172 / 6.80→6.84 s | Back-facing follow-through changes abruptly to a front/side-facing low-bat recovery. |
| Recovery 11 → return-low 12 | 175→176 / 6.96→7.00 s | Stance narrows and foot placement changes in one replacement rather than a visible step. |
| Return-low 12 → return-high 13 → ready | 179→180 and 183→184 / 7.12→7.16 and 7.28→7.32 s | Discrete height/stance changes complete the return. These do not repair the earlier recovery jump. |

See [outside-boundary-pairs.png](motion-review/outside-boundary-pairs.png) for native-scale actor crops of the consecutive endpoints, and the five [outside 0.5× window sheets](motion-review/z9-r0.5-swing-0.01-window-1.png) plus [pre-contact sequence](motion-review/outside-precontact-allframes.png) for their intervening holds.

I did **not** establish continuous foot gliding during the held 10/5/2 drawings. Their feet remain broadly registered. The visible foot problem is discontinuous relocation during recovery, alongside the hand/bat direction reversal. Calling the entire chain smooth would exceed the evidence.

The middle-row 0.5× recording repeats the same general defect: a held ready drawing at 6.08 s changes directly to contact at 6.12 s, raised follow-through at 6.24 s, then the shared lowering/raising/wrapping and recovery sequence. It therefore does not provide a smooth control case that would excuse the outside chain.

## 0.5× versus 2× readability: CHANGES

At 0.5×, contact and individual follow-through drawings can be identified, but the long course-ready hold followed by direct contact makes the swing look stalled, then replaced. The report records course drawing 3 for approximately 733 ms outside and 745 ms middle between its first observed sample and the first contact sample. Hidden original poses continue to advance during this visible hold.

At 2×, the result remains legible as a swing outcome, but the distinct course contact is a flash:

| Event | 0.5× host sample interval | 2× host sample interval | 2× video |
| --- | ---: | ---: | --- |
| Outside contact 10 → POST 5 | 133.6 ms | 16.9 ms | Contact appears in frame 81 at 3.20 s; POST 5 is already visible in frame 82 at 3.24 s. |
| Middle contact 4 → POST 5 | 138.6 ms | 27.6 ms | Contact appears in frame 78 at 3.08 s; raised POST 5 is visible in frame 79 at 3.12 s. |

These intervals are differences between successive state-change observations, not exact painted dwell measurements. Nevertheless, both the host observations and the recordings support the same limitation: 2× does not clearly communicate a distinct contact pose before it proceeds into the shared high finish. Compressing the sequence hides some holds while retaining the abrupt joins; it does not establish continuous movement.

The small explanation text cannot reasonably be read during the brief 2× swing itself. It remains visible during the result hold, where the outcome heading is much clearer. I make no claim about audio, haptics, tactile impact, or real-device touch feel.

## RAF, loading, and ball observations

The report contains the stated 23 cases: 18 row/rate hit combinations, two outside fouls, one outside whiff, and two take cases. All have empty recorded error lists, `exactResult=true`, `productionPreserved=true`, and `earlyResult=false`. Those are report assertions, not an independent source or gameplay audit.

Independent inspection of the sample arrays found:

- No sample with both character layers visible.
- No sample with both character layers hidden.
- No visible-course sample with a missing image or zero image width.
- Median RAF sample spacing approximately 16.6–16.7 ms; largest observed gap 37.6 ms across the matrix.
- First result samples occur 5.75–54.80 simulation ms after the recorded impact time, rather than before it.

There is **no observed cold blank or empty-character flash at the course/original joins** in the detailed video windows. Some initial navigation/loading frames are blank or show a partially populated scene before the stable ready state; this is separate from the swing handoff. Sampling and 25 fps capture cannot exclude a defect shorter than the respective observation intervals.

No second independently moving ball was identified in the four inspected contact/follow-through sequences. The outside foul recording does display a persistent solid white target point with the zone label while the outgoing ball/trail travels away; the stationary point can resemble another ball. This is a visual distinction issue, not proof of duplicate ball simulation. Crucially, **every report sample has `ball:null`**, so this report's instrumentation cannot certify ball count or trajectory. “No double-ball observed in these recordings” is the supported conclusion; a universal no-double-ball pass is not.

## Required disposition and limits

Keep material 4 held. The outside 10→5 direction is plausible but visibly abrupt; 5→2 does not create a useful moving bridge; 2→original 9→course 9 produces a definite lower/raise hitch, and recovery includes pose/foot replacement. Those body joins need a coherent visible arc and stance continuity. Source-mask equality alone is insufficient.

Recheck the same joins at both 0.5× and 2× after any body/timing change, including the actual painted duration of contact at 2×. The separate projected-grid failure also remains open for this material.

The qualitative motion verdict covers the four supplied videos. Other matrix cases have RAF/log coverage only. This is not source approval, comprehensive gameplay approval, audio/haptic assessment, or approval of a later candidate whose files or captures were not reviewed.
