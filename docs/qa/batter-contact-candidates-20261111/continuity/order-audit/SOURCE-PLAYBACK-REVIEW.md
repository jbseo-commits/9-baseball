# Source-only order playback check

Reviewed local diagnostic `http://127.0.0.1:5400/` at 1× and 0.5× in headless Chromium, 1440×1040 viewport. The viewer's own slider/clock advanced during playback; frames were captured from the source-only page. No game, ball, impact effects, gameplay, source pixels, or pose transforms were involved. Full-cell images are only fit by the viewer into equal 450px display cells. This is a visual diagnostic, not a motion or product acceptance.

Playback landmarks observed (timer sample, approximate):

- 1×: 661ms old4 plant; 828ms PRE-high; 911ms PRE-middle on rows 1/2; 1011ms PRE-low on row 2; 1261ms contact; 1411ms row-specific POST progression; 1544ms old10 wrap (the polling interval skipped a distinct sample at POST-high 1490ms).
- 0.5×: 655ms old4; 805ms PRE-high; 889ms PRE-middle; 964ms PRE-low; 1264ms contact; 1330ms first POST; 1414ms recovery variants; 1497ms row2 POST-high; 1547ms old10 wrap. At 0.5×, the 1490→1530ms row2 recovery-to-wrap interval was legible as a distinct very short beat, followed by a visibly large bat/arm change.

## Joins

**old4→PRE-high (800ms).** At both rates, the planted shoes remain visually stable. The change reads as a torso/shoulder coil and hands settling into the up-left lag, rather than a foot slide; the helmet stays on the same head and the hands remain together on the bat. There is a visible but coherent body-height/arm compression over the 150ms interval. I did not see a material discontinuity that itself justifies a new drawing. The old5/6 poses do not improve this specific join: they carry the head, grip and lead stance forward into swing, while the new PRE returns toward the fixed contact stance. Keep old5/6 out of this target-specific post-LOCK preparation unless a separate timing review justifies a forward swing before the target-specific coil.

**PRE-high→PRE-middle→PRE-low.** The ordered snapshots at .5× and 1× show a consistent descent of helmet, shoulders, hands and hips; the bat stays in the lagged upper-left phase and the shoes stay fixed. There is no obvious row-morph artifact or foot pop at the viewer scale. This supports the proposed target-specific preparation ordering after LOCK.

**POST-low→POST-middle→POST-high.** The recovery samples show the shoulders and head rise while the two-hand grip and up-right barrel continue the same extension. The whole body reads as recovery rather than a second swing. Feet remain visually stable. This supports the proposed reverse height order after contact.

**POST-high→old10 (1530ms in the current order).** This is the clearest unresolved join. The new POST has both arms extended forward/up-right and the barrel still pointing away from the shoulder; old10 has elbows folded behind the head and the barrel carried across the shoulder. The 40ms interval in row2 makes the angular/arm change read as a snap at both rates. One common new late-follow drawing would be needed only if the existing source is reread with the available original9 `early-follow` inserted and the old9→old10 join still reads as a snap. Old9 is the correct existing next source to try: it preserves the two-hand extended follow and up-right barrel direction and can give the wrap more travel time. The currently reviewed order omits it, so it has not yet established that a new drawing is necessary.

## Action

No new whole-body drawing is established as necessary by this playback. Keep old4→PRE-high and the PRE/POST height progressions as a reviewable source-order candidate. Before requesting art, revise the diagnostic order to use old9 between POST and old10, with a real interval for its extension and the following wrap, then review that join at the same rates. If old9→old10 remains abrupt at the accepted clock, request one shared late-follow pose: same identity and planted stance, both hands still gripping, torso rotation continuing, barrel partway between the extended up-right position and the across-shoulder finish. Do not replace it with a shifted/crossfaded existing sprite. This report does not approve timing, runtime, physical contact, or production motion.
