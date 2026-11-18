# Playable pitch / swing prototype (Draft)

Base: PR #123 dc67424a5bd4039784bb3f12accd351f2f8a55a1. Separate branch `review/pitch-swing-prototype-20261118`; route `/?showcase=pitch-swing`. No changes to official main or #123 branch, engine, production RNG, card state, HP, or save schema.

## What is playable

Start a pitch; drag horizontally on the pad and release to launch a swing. Launch +160ms is the bat's contact time. Keyboard size selection and Space / button are alternatives. Crypto chooses one of three profiles independently of the game RNG; its name appears only after the result. No preflight profile data attribute or label. Client-side source inspection is not prevented.

12px minimum; absolute horizontal displacement divided by pad width: <12% small, <28% medium, otherwise large. Parent confirmed user-approved ×1/×1.5/×3 as **prototype hypotheses**, not existing engine swipe multipliers. Contact scores100×factor and resets prototype strikes. Small contact is a provisional0-point cut foul; two-strike protection follows the ordinary foul-count principle. Miss/take adds a strike; after3 the next pitch starts a fresh counter. No live card42%/22% foul probability is repurposed as a timing rule. Score is memory-only; reset and navigation erase it.

Warmup reaches registered release at1317ms. True flight is600ms practice (default) or300ms challenge. The ball is never rewound for late input; sampled overlap at actual input+160ms controls result/score/FX. Pitcher playback is independent of batter freeze, regression-tested by an input at0 then checking the release drawing. Tiny gestures do nothing. Pointer cancel/lost capture, hidden tab, blur, resize/rotation discard the active pitch without score/count change; repeat input cannot score twice. UI keeps stage and input pad simultaneously visible in all eight tested sizes.

## Honest limits / fairness

- The 22-world-unit contact circle is **not an authored bat pixel collision mask**. Earliest/latest accepted300ms screenshots with FX on/off are in `boundaries/`. First available rendered frame follows the mathematical contact by up to one RAF. Ball radius passes continuously into outgoing flight. The PNG never masks a miss and renders below the ball.
- Integer-ms accepted contact offsets: fastball -27..+25ms; slider/curve -10..+9ms. These are experimental geometry, not balanced engine timing windows.
-300ms arrival and160ms swing lead require launch at140ms after release. Slider maximum lateral deviation is225ms after release, after that launch target. Reading the complete late break then reacting is therefore not supported by this model.600ms is explicitly practice, not secretly slowed300ms. No physical-device or human reaction/latency/playtest claim.
- All profiles share arrival time. There is no proven pitch-specific strategy, size risk tradeoff, aim/9-zone, outside, card, status, synergy, or live engine integration. Large contact currently has higher reward without added risk. Small×1 is retained as the approved hypothesis but small contact is cut-foul and earns0.
- Timing uses handler `performance.now()`; event scheduling delay contributes to the measured error. Pointer simulation and virtual-clock tests verify mechanics, not human feasibility.
- Reduced-motion suppresses PXF; essential ball/bat movement begins only after explicit Start. Effects off is available. Existing CC0 PNG and provenance/license unchanged. Graph source is not imported.
- #121 stays Draft / NOT_IMPROVED / NOT BAR_MET, G-0203/3 failed; #123 art limitations remain. No blinded8-axis art approval or masterpiece claim.

## Verification

- Final full Vitest:252files /1739tests PASS. Focused helper+scene14tests PASS. Expected legacy happy-dom warning stacks remain.
- Zone smoke10: byte-identical to original main baseline.
- Production build PASS; dist52.9/60MiB PASS; existing main chunk warning remains.
- Browser: actual pointer contact on all3profiles, small cut, late miss/noFX, no-input take, cancel, zero storage writes/deletes;8viewports568×320,667×375,844×390,932×430,1280×720,1440×900,390×844,412×915 with scene+pad in viewport and no horizontal overflow.
- Extra browser: native CDP coarse touch large swing awards300, duplicate Space once, tiny tap, canceled stale RAF, early swing/no pitcher release shift, blur/visibility/rotation,300ms, FX off, reduced-motion, session reset. No page errors.
- Previous comparison route: all8viewports, playback rates, PXF8frames, reduced/off, rotation PASS.
- Existing live game diagnostic continuation: real match→reward→map→reload/title resume→next node and6layouts PASS. Original `qa-playable-run.cjs` still fails expected11pitches/actual6, reproduced on baseline earlier. Original portrait noncombat fixture still hits the existing orientation-overlay interception; baseline reproduction retained in #123 QA. These original scripts are NOT claimed passing.
- Earlier in-progress browser failures (pre-release null wake/early validation) were fixed. A170ms wait for160ms+next RAF was flaky; final QA uses180ms, without changing app timing.

Reproduce with `NODE_PATH=/opt/codex/cua_node/lib/node_modules QA_BASE=http://127.0.0.1:5173/ node scripts/qa-pitch-swing.cjs` and `qa-pitch-swing-extra.cjs`; boundary script requires Vite dev imports. Chromium path `/usr/bin/chromium`. Static build tests use5175.

## Deployment

An isolated owner-private Sites project is being prepared. Official Pages workflow is deliberately not used because it rebuilds/redeploys the production root. Vercel403 was not bypassed and SSO request was paused per parent instruction. Deployment URL/status will be recorded separately after native confirmation and access check.

Independent review: gpt-6.1-sol/high separately examined implementation and FX-off boundary captures. Found pitcher-clock coupling and radius handoff issues; both fixed and regression-checked. Final review found no remaining technical blocker for a Draft; explicitly withheld human reaction, strategy/balance and art BAR claims.
