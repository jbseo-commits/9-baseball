# G025 — Normal-speed preview audio cancellation

Independent main fb8e7b1 branch review/preview-audio-cancel-20261118. Scope: IntegrationPreview only; live App already passes AbortSignal and is unchanged. G003/PR125 visual3/3HELD and its preview are unchanged.

## Reproduction and correction

The preview owns an AbortController for mute, visibility hide, reset/remount and unmount. Its emitter passed this signal only when playback speed differed from1. Normal1x and reduced-motion thus left existing WebAudio sources scheduled after cancellation. Native Chromium instrumentation observed0 immediate stop calls for existing15/19 sources; at audio clock0.432s, a source scheduled0.600–1.240s remained. This proves a finite queued audio tail, not an infinite leak or subjective audio quality failure.

The one-line correction always passes {rate:speed,signal}. Shared audio implementation, timelines, game RNG/verdict, save, markup/CSS/art and main live playback are unchanged. Selected reduced-motion still has effective rate1. Future integration with PR125's same-file changes must preserve this all-rate ownership.

## Verification

The worker recorded3 expected red tests before the fix (1x, reduced motion and hidden cancellation missing signals); all12 focused tests pass afterwards. Tests include mute/reset/unmount, fresh post-reset cue, stale cue suppression and embedded playback genuinely committed with sound enabled/visible. Red output was not archived:3 failed/9 passed is a retrospective worker report, not an attached raw log. Final green output is archived. Independent reviewer approved Draft posting after native lifecycle inspection and full regression.

No new deployment. No claim about physical devices, listening quality, human enjoyment or visual BAR_MET. Hidden-document synthesis must be distinguished from real OS backgrounding. Existing echo cleanup timers need not vanish; the contract is cancellation/disconnection of owned active or scheduled source nodes.

- Full248files1709tests PASS; general119/119; default-touch/rotation42/42; smoke10; build/checkdist52.8/60MiB. Real run diagnostic win→reward→map→reload/title resume→nextnode,loss,3card/Escape,.5x,sixlayouts PASS.
- Diagnostic is the reviewed PR126 copy with import paths adjusted, not a change to main QA. Original obsolete11-pitch check vs actual6 remains separately recorded in PR126. Initial browser-edge bootstrap remains necessary here because PR127 is independent/unmerged. Exact-preview policy is a technical oracle, not limited-information human play.
- Native Chromium mute at1x/.25× × normal/reduced: cancellation stop/disconnect and no later starts. Actual keyed reset unmount/remount uses source epochs: old-generation starts0 in all4; old abort/disconnect counts9/14,12/17,16/25,16/25; fresh-generation starts12 normal/16 reduced. Already naturally ended sources need not be stopped again. Reset intentionally starts a new cue with sound still enabled.
- Embedded comparison starts0; page errors0. Standalone unmount is unit-tested, keyed component unmount/remount native-tested. Hidden lifecycle was synthetic (both hidden and visibilityState + event). CDP command unsupported; freeze/headless tab switch stayed visible. Physical OS backgrounding and listening quality NOT verified.
- Existing storage boundary defect discovered: common v10-relic-ui reads9zone-v10-run on preview routes; BGM preference read is separate. Observed set/remove0. NO zero-access PASS. This module is byte-identical to main (SHA256241acda2d50b4f9858ab66c1c0ff85bb73f535b6a46760656044078eabc3ed5e); audio change does not alter storage behavior. G026 separately tracks the pre-existing read/decorating boundary. Dev5199 and production5198 both ran current candidate after HMR; they are NOT old/new runtime baselines. Old audio evidence is before-native-audio.json.
- Corrections1/3. G0033/3HELD unchanged. No visual score or deployment. Main untouched.
