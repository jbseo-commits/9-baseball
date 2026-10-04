# CINEMATIC VERTICAL SLICE — 2026-10-04

## Goal

Raise one complete batting exchange to the quality bar of the supplied polished pixel-art reference before spreading more polish across the run.

The slice is one uninterrupted authored beat:

`decision → pitcher coil → release → ball flight → batter anticipation → contact → hit-stop → camera/VFX payoff → ball exit → recovery/result`

This is not a new gameplay feature. Engine probabilities, damage, HP, cards, save schema, and run structure stay unchanged.

## Why this is the next bottleneck

The current runtime already has strong parts: authored batter poses, a 120-frame pitcher atlas, Pixi actors, ball flight, hit-stop, slow motion, trails, impact FX, result overlays, and per-result presentation profiles. The remaining gap is direction: the parts do not yet read as one scene with one depth stack, one visual hierarchy, and one clock.

The quality target is therefore **scene coherence**, not adding another isolated effect.

## Slice contract

### 1. One director clock

`presentation.js` remains the SSOT for the result profile. `BallparkActors` consumes that timing. Do not create a second independent timing table in CSS or the battle component.

The authored beat has these semantic phases:

1. **hold** — player decision lands; stadium and UI stop competing for attention.
2. **coil** — pitcher owns the frame; batter stays readable but quiet.
3. **release** — ball becomes the moving focal point.
4. **anticipation** — batter weight/load reads before the fast swing poses.
5. **contact** — single visual apex. Hit-stop, impact light, actor pose, ball origin and camera impulse agree spatially.
6. **exit** — the ball/trail takes ownership away from contact.
7. **recovery** — actors settle before the result UI becomes dominant.

No phase may introduce a gameplay delay outside the existing presentation duration contract.

### 2. Portrait composition lock

At 412×743:

- Batter is the foreground hero on the left and reads as grounded, not pasted over the stadium.
- Pitcher is visibly standing on the mound/rubber in the middle distance.
- 9ZONE sits over the plate/action corridor rather than behaving like an unrelated panel.
- Pitcher HUD stays attached to the pitcher region without covering face/body.
- Cards/actions remain the decision layer, but during autoplay the eye is pulled into the field.
- Contact is the brightest/highest-contrast point of the exchange.

The same anchors must degrade safely at 844×390 and 1440×900.

### 3. Depth stack

The battle scene should read as a minimum five-layer composition even when existing assets are reused:

1. stadium/background architecture
2. atmospheric light/haze
3. pitcher/mound middle ground
4. plate/9ZONE/ball action plane
5. batter foreground
6. impact/trail/camera light as a transient top action layer
7. HUD only where information must remain legible

Do not solve depth by globally blurring or darkening the entire screen.

### 4. Contact rule

Every successful-contact presentation must share one contact coordinate and one contact beat. The following must originate from or visually converge on that point:

- bat/ball meeting pose
- impact slash/star/ring
- ball exit/trail
- hit-stop
- camera impulse

Result typography may follow the contact; it must not visually peak before contact.

### 5. Motion rule

The batter motion contract remains:

`ready → load → trigger → swing-start → swing-mid → contact → follow-through-early → follow-through-late → finish → settle`

Do not fake missing motion with CSS shake. Do not skip authored poses. Preserve reduced-motion handling.

## 9-axis impact analysis

| Axis | Judgment | Containment |
| --- | --- | --- |
| UI / layout | IMPACT | Restrict changes to `.bp-*` battle-scene selectors and existing actor/action layers. No global selectors. |
| Input / gestures | NO IMPACT | No pointer/touch handlers or decision semantics change. |
| Game logic / balance | NO IMPACT | No engine, probability, damage, HP, card, or route values change. |
| Save / load | NO IMPACT | No save schema/state persistence changes. |
| Mobile viewport | IMPACT | 412×743 is the primary lock; 844×390 and 1440×900 are mandatory regression views. |
| Scroll / overflow | CHECK | Scene transforms and transient FX must stay clipped to `.bp-scene`; no body/root overflow changes. |
| Existing flow | CHECK | Decision → autoplay → result → next must retain existing callbacks and durations. |
| Tests / regression | IMPACT | Add a contract test for director ownership/contact sequencing; run full suite + visual QA when executable. |
| Build / deploy | CHECK | No dependency changes. Production build and preview QA required before ready-for-review. |

## Allowed implementation surface for round 1

Keep the first implementation deliberately narrow:

- `src/duel/presentation.js` — director semantics/timing only when required.
- `src/duel/BallparkActors.jsx` — actor/ball/contact choreography.
- `src/duel/BallparkBattle.jsx` — semantic phase/classes only when required.
- `src/duel/ballpark.css` — `.bp-*` scene depth/composition/transient lighting only.
- one focused test under `tests/`.

Do **not** touch `engine.js`, `cards.js`, `run-map.js`, save schema, global selectors, or production art in this round.

## Acceptance gate

The slice is not complete merely because effects fire.

Required evidence before merge consideration:

- one full swing reads as a continuous directed action, not a chain of UI events;
- contact is the unmistakable apex;
- batter and pitcher remain grounded at all three required viewports;
- no actor jitter caused by layout measurement/transforms;
- no horizontal scroll or battle overflow regression;
- reduced-motion remains valid;
- full tests, production build, zone smoke and visual QA pass when execution environment is available;
- independent reviewer pass is required by `docs/chat-loop.md`; if no native reviewer is available, status remains BLOCKED rather than simulated.

## Round-1 implementation priority

1. Lock semantic director phases to the existing presentation timeline.
2. Make autoplay temporarily suppress competing decision-layer emphasis without removing information.
3. Tie contact light/camera/ball exit to the same action coordinate.
4. Strengthen foreground/midground/background separation using scoped scene layers.
5. Verify, then tune timing. Do not add new art until the existing composition proves that art is the remaining bottleneck.
