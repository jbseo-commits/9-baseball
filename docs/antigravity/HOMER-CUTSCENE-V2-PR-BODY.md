<!-- IMPACT_ANALYSIS_REQUIRED -->
## Home Run Cutscene V2

### What changed
- Reframe the existing A01/A02/A03 HomeRunCut from a 16:9 verdict card into a scene takeover.
- Suppress competing live battle layers visually during the payoff, then return to the existing review/result flow.
- Keep knockout on the old verdict-card presentation.
- Add source-contract/isolation regression guards.

### 9-axis impact
1. UI/layout: 영향 있음 — home-run scene takeover; actor geometry unchanged.
2. Input/gestures: 영향 있음 — existing resolving lock remains authoritative.
3. Game logic/balance: 영향 없음.
4. Save/load: 영향 없음.
5. Mobile viewport: 영향 있음 — 412×743 / 844×390 visual gate.
6. Scroll/overflow: 영향 있음 — overlay is scene-contained.
7. Existing flow: 영향 있음 visually only; result progression unchanged.
8. Tests/regression: 영향 있음 — dedicated guards added.
9. Build/deploy: 확인 필요 — no new image assets; CI/preview required.

### Side-effect controls
- Full-scene rules are scoped to `.bp-verdict.splash.homer:has(.hr-cut)`.
- No BallparkBattle, engine, damage, HP, cards, or save-schema changes.
- Existing HomeRunCut assets are reused.
- Reduced-motion fallback retained.

### Verification status
- [ ] PR Verify
- [ ] Impact Analysis Gate
- [ ] 412×743 visual QA
- [ ] 844×390 visual QA
- [ ] 1440×900 visual QA
- [ ] Home-run recovery to result/debrief
- [ ] Non-homer/knockout isolation

Independent native reviewer tooling is unavailable in this chat; independent review remains BLOCKED. Same-agent read-only review is recorded in the branch docs.

Do not merge until verification is complete and the user explicitly approves main merge.
