# Remaining gates after the November 10 implementation pass

This is an evidence/status note, not a claim that the whole PR103 plan shipped.
Source baseline844b0ca; QA-only main merge db473cf. Full M01~M22 plan remains [PR103](https://github.com/jbseo-commits/9-baseball/pull/103). The accepted-pitch save barrier/own committed-plan subset is [PR105](https://github.com/jbseo-commits/9-baseball/pull/105); player-facing copy is [PR106](https://github.com/jbseo-commits/9-baseball/pull/106). Check each PR's actual merge/deployment state before claiming main contains it.

## M22-B: course light and real delivery

The current actor package has14 authored batter drawings. The visible atlas contains down-swing/contact/early-follow-through, but `motion.json` registers one contact event, and `motion-timeline.js` chooses drawing8 during the normal non-reduced swing contact hold. `atbat-composition.js` projects that event to about(827.4,488.6) in the1672×941 world. `scene-effects.js` sends every pre-impact swing flight from its registered pitcher release to that same point. Its miss offsets depend on the landed result and begin afterward. The displayed3×3 zone is a sibling UI layer in `BattleView.jsx`, with no registered world pitch plane.

Both root and independent read-only audit verified this source structure; root viewed the actual14-drawing atlas. This establishes missing projection/contact evidence. It does **not** establish that all14 drawings are unusable or that nine entirely new drawings are necessarily required.

Proceed in this order:
1. Register a world pitch plane and its nine cell destinations plus the outside-ball destination under the existing single camera. Preserve the central zone and current input placement.
2. Measure the barrel segment and stance at existing drawings7/8/9, then make an offline animatic showing each projected destination against the real bat sweep. Validate all20 registered pitcher release sources. This is geometry/animation evidence, not a human fun score.
3. Reuse only naturally intersecting contact drawings. Author missing contact-height/reach drawings where the measured sweep does not cover a target. Keep planted feet, handedness, two hands on the bat and anatomical continuity. Do not substitute HELD#90 or stretch/translate limbs to fake contact.
4. Connect the accepted saved state to a public-only light sequence inside the existing windup. Display sampling uses an independent visual seed, never engine seed/pitchSeed/rolls. At READ0/1 hidden exact probabilities must not affect cadence, ticks, sound or paths. Outside9 participates; zero-probability candidates do not.
5. Keep scan state free of the accepted destination. The first target-dependent frame/audio/ARIA is the public LOCK boundary. After LOCK a player can infer coverage hit; formal grade, batted-ball type, actual bonus/draw/count/HP and exact/near effect remain contact-only. Every displayed dot, ball and bat event must agree, with one continuous ball.
6. Preserve the same clock for six speeds/reduced-motion/mute, accepted-plan order/cost, failed-save retry and reload. Presentation replay may use only its existing in-memory snapshot; reload restores the durable result without re-sampling or adding a save schema.

A save barrier or standalone flashing zone does not finish these gates. No new light/target cue has been enabled in production in this pass.

## Other plan items

|Items|Actual state / next evidence|
|---|---|
|M01 facility|Original runtime candidate and title-glyph revision passed functional flows but failed fresh blind quality gates. PR103 Draft/HELD. Local v2 preservation424424f was not pushed after its failed gate. Cumulative candidate revisions2; no reset.|
|M02 shop|Previously shipped#97. Current pass does not re-credit it as new work.|
|M03 QA|PR104 merged db473cf:119/119 explicit-renderer mouse checks,2portrait+5landscape; real devices/default touch/rotation remain separate.|
|M04 hand|#99 Draft/HELD,3 revisions exhausted. Do not cherry-pick or rename to reset.|
|M05~07 HUD/result/inspector|Require current same-state visual/input reproduction before change. Existing small-landscape batter occlusion is visible; do not reduce rule/counter visibility to solve it.|
|M08/M09 copy|Separate validated copy branch. Event effects and roster availability/order unchanged. Unlock/progression still requires a product decision.|
|M10 fallback card art|Requires actual card/readability capture; no unseen-art fix claim.|
|M11 settings|Mute and BGM selection already exist. Volume/language/reset/accessibility remain distinct work.|
|M12~14 art/crops|Scene/contact continuity and same-state visual gates remain. HELD#90/#100 do not become approved through this plan.|
|M15~17 balance/economy/meta|Need defined product choices and actual player behavior; bot/test counts do not decide fairness, retention or price.|
|M18 rights|Rights-holder/service terms and provenance evidence remain unverified. Do not invent approvals.|
|M19 CSS|Scoped issue fixes only; no global cascade rewrite.|
|M20 documentation|Current landscape decision replaces stale portrait-only release/autodev guidance. Historical blocker tables remain explicitly historical.|
|M21 humans|No real new-player/fun/purchase evidence collected in this execution. No external recruitment/messages sent.|

The user authorized continuation and publication/main integration of verified changes. This note adds no approval ceremony and makes no commercial-readiness claim.
