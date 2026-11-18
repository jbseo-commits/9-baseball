# G029 — Native slow-presentation QA measures from input

QA-only followup to Draft PR126, baseline05898d6 (product mainfb8e7b1). No gameplay, animation, input handler, save, layout, asset or production deployment changes.

## Evidence and diagnosis limits

The former manual gate called `first windup MutationObserver → clear` the .5x host clock and required4000..5500ms. Read-only native observations gave normal4060.2/4079.3ms, CPU4x3974.9/4015.6ms, CPU8x3953.1ms. The latter observations would fail that lower bound despite one natural TAKE completion, phasepitch, no pageerrors. CPU emulation is not a device performance claim. The earlier G026 full QA failure has no recorded elapsed value, so its exact cause remains unknown.

A separate read-only runtime inspection sampled only playback timing fields from React fiber: timeline2042ms, rate.5, expected4084ms. Capture pointerup preceded host startedAt, which preceded first windup DOM in all three samples. Host→DOM gap was22.9–39.4ms normal and103.1ms at4x. Host→clear4096.0–4096.5ms normal,4261.6ms at4x. This confirms DOM observation starts after the actual clock. The latest4x sample did not repeat under4000ms: we do not claim every historical failure is fully explained. Fiber inspection is diagnostic only and is not in the permanent gate.

The original preflight script/comment calls the bp-swing testid a swing; this was actually default **TAKE**, verified by button label, no selected card and reveal.action. Its `mutationDeliveryAfterStartMs` compares callback to first RAF sample, not the host start. The CPU8 JSON inherits generic4x metadata; individual cpuThrottleRate=8 is authoritative. Raw evidence is preserved with these corrections rather than silently rewritten.

## Changed contract

The manual QA now records capture-phase touch pointerup before the actual handler and measures through final clear. It checks the same seed3/regular-02-teal-mirage/default TAKE/normal-motion/.5x scenario, **>=4084ms and <5500ms**, native pointer pair, middle2200ms lock, final unlock and exactly one pitch. This is a stronger causal minimum than the old4000ms DOM-relative bound, not a relaxed threshold. `half-speed.json` is saved before the timing assertion.

The input-to-clear interval includes handler/render latency; it alone does not prove exact playback rate. Existing `tests/playable-run.test.jsx` derives the actual App's rosterTimeline from source and tests locked at duration/.5−1, unlocked at +1. Existing presentation-clock rate tests remain. The manual fixture's4084ms baseline must be reviewed with source/runtime evidence if its intentional timeline changes; no duplicate adapter calculation was added.

`realHalfSpeedMs` stays as the old observed-stage diagnostic for report compatibility. New explicit `halfSpeed.inputToClearMs` is the gate measurement. Optional `QA_CPU_RATE` changes only the native QA page's Chromium emulated CPU rate. No fiber/internal React dependency in the gate.

## Validation

- Normal entire manual playthrough:exit0; input→clear4102.2ms; observed-stage4077.6ms.
- CPU4x same entire script:exit0; input→clear4166.1ms; observed-stage4056.7ms.
- Both actual first match8actions/6pitches/HP0→reward→map→reload/title resume→nextnode; natural defeat/reload, actual three-card commit and six layouts passed. Native timing sample actionTAKE, one pitch, phasepitch. Pageerrors0.
- Full248files/1706tests PASS, exit0 (includes exact actual-App timing contract); smoke10 exit0; production build exit0; dist52.8MiB/60MiB PASS. Baseline happy-dom iframe warnings remain non-failing; not suppressed.
- Independent reviewer accepted design and actual diff; correction1/3. Product source/assets diff0. No new visual judgment, physical mobile validation or human fun claim.
- Prior G003 visual3/3HELD, G027 analysis3/3, G028 QA3/3 limits remain unchanged. Existing preview untouched.

Commands used (managed environment paths; no packages added):

```sh
QA_BASE=http://127.0.0.1:5198/ QA_OUT=/tmp/g029-native-normal NODE_PATH=/opt/codex/cua_node/lib/node_modules node scripts/qa-playable-run.cjs
QA_CPU_RATE=4 QA_BASE=http://127.0.0.1:5198/ QA_OUT=/tmp/g029-native-cpu4 NODE_PATH=/opt/codex/cua_node/lib/node_modules node scripts/qa-playable-run.cjs
pnpm test
node scripts/zone-report.js 10
pnpm build
pnpm check:dist
```

Preflight/runtime scripts are historical environment-specific artifacts. Archived text output has trailing whitespace/empty EOF lines normalized; test content/results unchanged.
