# Play identity and art correction — before implementation, 2026-10-11

User requested a correction after rejecting the released hybrid's repeated card art, weak art cohesion and similar deck play. This is a scoped playable revision, not a claim of masterpiece/commercial quality. Root is sole writer; engine, art and independent plan reviewers are read-only.

| Axis | Impact | Response before editing |
| --- | --- | --- |
| UI/layout | Yes | Distinct existing card illustrations, shared frame/crop, visible public tactical state and contact feedback. Preserve card/action viewport grid. |
| Input/gestures | Yes | Preserve horizontal hand, MAIN/SUPPORT, modal and locks. Deck choice resets match explicitly; no new required navigation. |
| Rules/balance | Yes | Change hybrid's nine-card compositions and curated opening pairs using existing engine cards/effects. No shared rule/damage/probability changes, free runner or fabricated victory. Check two-PA resource tradeoffs. |
| Save/load | No schema change | Hybrid remains in memory. Original storage untouched. |
| Mobile | Yes | 375×667, 390×844, 844×390, 1280×720, including support/result and long status. |
| Scroll | Verify | Bound hybrid only; hand horizontal. Tactical strip must not add document overflow or obscure actions. |
| Existing flows | Verify | Original title/map scroll/battle/resume; reward/facility/route covered by suite and smoke. |
| Regression | Yes | Opening instance conservation/seed variation, distinct real decisions and second-PA relay, public policy no hidden reads, contact lifecycle and autoplay/modal. Full suite and deterministic smoke. |
| Build/deploy | Yes | Reuse runtime-optimized existing art; keep 60MB budget, both entries/base path. Update PR26 and isolated preview only. Public actual-play verification after deployment. |

Independent plan review: keep ordinary 0B/0S/0O and empty bases, reduce common cards, verify actual first two plate appearances, and use public tactical guidance without inventing rewards. Preserve the whole-world camera/contact anchor and reduced-motion/DOM fallback. Passing checks verifies behavior, not entertainment quality.

## Implementation and verification

- Reused nine distinct existing card illustrations per deck with common frames/crop. Removed the repeated five-panel atlas from hybrid imports.
- Three nine-card packs now share one card per pair, with no card shared by all three. Two pack-specific opening tools are conserved within the shuffled deck; the remaining three cards vary by seed. Real empty bases and ordinary counts are retained.
- Public tactical text reflects actual preparation, energy, runners and count risk. Spectator policy reads public bounds only. Contact camera/rings use the existing measured barrel position and actual hit/foul/out result; take/miss do not receive contact feedback. Original audio cues replace generic beeps.
- Outer view trims 80px of empty sky while all actors, plate, both boxes and contact targets remain inside. Canonical geometry is unchanged. Reduced-motion and DOM fallback remain supported.
- Independent source review found one P2: a generic support note contradicted relayBat's support +3 HP. The UI now names selected support-specific effects and the model regression verifies its actual +3 HP. Reviewer reran all 31 hybrid tests successfully; no remaining source P1/P2.
- Final source: 167 files / 979 tests pass; 20-seed original-flow smoke completes (16 rewards, 1 win); production build and 56.3/60MB dist budget pass. Existing chunk warning remains.
- Built UI: four viewport dimensions match document dimensions, scrollY=0, primary/support centers hit-test correctly. Support main zone7/support zone6 survived all four sizes. Native portrait course selection and actual two-card consumption were checked.
- Actual DOM grind seed2: wearDown → foulTip zone7 yielded foul, HP60→53, 1 strike, same batter. Next pitch restored energy3/3. longAtBat+defend then yielded a real single, HP53→43 and two-card consumption.
- Actual Pixi relay seed2: tableSetter zone5 yielded single, HP60→45 and 1st-base runner. Next batter's flow prep consumed energy without pitching; hitAndRun zone6 yielded HP45→29 and scored the existing runner (+1 run).
- Actual Pixi precision seed90210: scout → focusBreath → pinpoint zone7, energy3→0, real 63-HP homer. This is one seeded outcome, not a win-rate or balance claim. A 36-frame consecutive recording and four real contact screenshots verify the camera/actors.

Evidence: identity-viewport-evidence.json, identity-evidence.json (same five seeds, first two PAs), identity-motion-evidence.json, identity-*.png and identity-pitch.gif. The heuristic's five grind records did not produce foul keyword damage; the separately tested manual foul does. Physical devices, OS reduced-motion, listening/audio quality, long-run balance and player fun remain unverified. Public deployment verification is recorded in PR26 after upload.
