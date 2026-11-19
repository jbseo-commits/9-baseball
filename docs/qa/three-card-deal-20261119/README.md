# Three-card deal — bounded standalone study

Stacked on PR135 at61f21c42453e58b51eb3e0bac079b090ca6753e3. Prior artwork/camera HELD remains unchanged. Only opening three fixed demo cards; no engine, RNG, effects or gameplay integration.

Preimplementation impact analysis: UI/layout affects only new standalone docs page; entry and fan constrained to right30% on landscape, separate below-field tray in portrait. Input uses native replay button and keyboard activation. Game logic/balance/storage have no dependencies. Mobile/rotation resets current animation and exactly3 nodes. Overflow clipped inside hand region, page scroll available. Existing flows unchanged. Regression checks sample full timeline and replay/keyboard/resize/reduced motion. Build unaffected (no production imports), no deployment.

Card names and motif keys from src/duel/cards.js: place=정타 노림/bat, strike=밀어치기/bat, slug=당겨 넘기기/comet. Only labels and simplified geometric bat/comet motifs are shown; no invented stats or effects. Always labelled fixed demonstration. Art source is unchanged PR135 separated PNG data; preview-only flat contact shadow retained. No art quality or camera registration issues are resolved by this motion study.

## Result and validation

420ms card flight,145ms stagger, all3 settled at710ms; small upward settle overshoot before final fan. Replay cancels prior animations, removes old nodes and uses a run token to prevent stale completion. Native button supports click/Enter/Space. Reduced motion places3 immediately. Resize cancels/redeals3. No sound, RNG or extra effect.

Protected lane derives from rendered canvas source x170..235 through full field height. In portrait the entire hand clip is below field; landscape/desktop hand clip starts at70% viewport, right of protected lane. This spatial clipping protects every animation frame, independent of easing. Additionally47 samples at16ms intervals at390×844,844×390,1440×900 test rotated visible card bounds. All pass.25 rapid replays, keyboard, active rotation, reduced-motion initial+replay pass; exactly3 nodes, no page errors, completed animations cleaned. DPR1 browser emulation, not physical Android performance. Left/middle titles partially overlap: fixed nonselectable demo only, not production card-selection legibility proof. CSS rotation can antialias edges; no claim that the whole animated UI is a uniform native pixel grid.

Full suite248 files/1706 tests passed; zone smoke10 completed; production build passed (existing chunk warning), dist52.8/60MiB. Existing gameplay was not manually replayed; no production files changed. Independent read-only reviewer inspected3 screenshots and animation lifecycle and passed bounded publication. No merge/deployment.

opening-deal.gif is2.15 seconds, looping, with final1.4-second hold. Captured from actual standalone browser render; includes fixed-demo label and final3-card state. HTML is self-contained and secondary to GIF delivery. Existing PR135 camera/art HELD persists. No additional autonomous batch.

Skills: existing Library skill used only for GIF delivery; no new local pixel skill discovered or claimed. Repository AGENTS/Codex reviewer workflow followed; only one editor. No external scripts/assets fetched for card art. Motifs were authored as small flat geometric SVGs from existing bat/comet keys.
