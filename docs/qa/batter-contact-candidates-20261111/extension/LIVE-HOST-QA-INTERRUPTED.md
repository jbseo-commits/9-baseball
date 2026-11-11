# Live host QA interrupted

The authorized local QA command was started at approximately 2026-11-11 01:35 UTC for the DEV-only `/9-baseball/?battleUi=vnext&courseReview=1` harness. Its case matrix was zones 1, 4, and 7 at 0.5× and 1×, using the basic action aimed at the matching zone. The run lasted about 17 seconds and wrote its screenshots, video, and RAF sample report under `live-review/`.

The root agent restored the product renderer and switched to a fresh public-course-contract branch during that run. Per the root instruction, the run is treated as mixed/restored baseline evidence and is excluded from candidate results. Do not count any `live-review/` capture or row from this run as a candidate pass. The host-motion finding is **HELD / INTERRUPTED**; no candidate motion approval was produced.

The prior static-source checks and the separate local source-sequence browser captures remain distinct evidence. This note does not revise them. No repository or source-art files were edited by this QA attempt.
