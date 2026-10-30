# Separate-asset mockup rebuild

2026-10-29 · branch `codex/mockup-v1-c05-integration`. Replaces the previous CSS-only visual cleanup with new scene/actor/card/skin derivatives. Source and processing: [asset README](../../../assets/production-art/mockup-rebuild/README.md) · [impact analysis](../../design/atbat-hand/ASSET-REBUILD.md).

Actual production build screenshots, with fixture tools hidden:

| State | Desktop1672×941 | Phone landscape844×390 |
| --- | --- | --- |
| Folded | [image](folded-1672.jpg) | [image](folded-844.jpg) |
| Expanded | [image](expanded-1672.jpg) | [image](expanded-844.jpg) |
| Actual coverage blocks | — | [image](insert-844.jpg) |
| Actual result | — | [image](result-844.jpg) |

[Actual interaction recording](interaction-844.webm) includes unfolded hand, card placement, pitch, follow-through and return. It contains a real miss, not a fabricated successful outcome. `reference-boss` starts from an actual engine boss with diagnostic HP78/112; first-pitch costs and results come from the real engine. The narrow `watch-read0` coverage-flow checks separately verify actual HP60→48.

## Validation

- Full Vitest: **215 files /1,421 tests passed**. New regression covers mixed swing/watch rapid taps in both orders, prepare→direct watch, cost shortage→watch, inspector/flight locks, real reference fixture costs and every current original card-art filename mapping.
- Foreground camera: seven sizes, intentional near-leg viewport crop, complete source atlas silhouettes, full pitcher visibility, mound-foot equality and accessible drawn contact point. Contact/release/KO use the same field coordinate system. Ready atlas stays mounted under the high-resolution idle overlay.
- [Six-size real touch browser checks](browser.json):667×375,740×360,844×390,1024×768,1440×900,1920×1080. Fold/fan/fixed scene and zone, visible costs/glyphs/circular actions, tap+actual CDP touch drag, real coverage2/5/8, no auto-pitch on placement, real HP60→48, support own aim, vertical swipe not selecting, inspector scroll return, first header tap after drag, isolated save, reduced motion and rotation passed.
- `scripts/qa-reference-rebuild.cjs` on the actual Pages-base production build at1672×941 and844×390: all new actor/field/card/skin/font loads successful, no404/page error. [Resource evidence](assets-browser.json). Captures wait for image decoding and fonts. Only the short decorative insertion capture pauses the QA clock; the clock resumes before actual pitch execution. No product timing was extended to suit screenshots.
- Existing default and vnext roster-fallback: preparation, take, next pitch, inspector pause, save/resume, identical seeded saved states. Noncombat map/reward/locker at844×390,390×844,320×568 (nine cases), scrolling and next-node/reward path passed. Evidence retained at `/tmp/9zone-rebuild-flows` in the task environment.
- Engine smoke: [zone10](zones.json),[v9 30](v9.json),[growth2](growth.json),[deck1](deck.json) completed successfully.
- `VITE_BASE=/9-baseball/previews/codex-mockup-v1-c05-integration/ npm run build` passed. Distribution **59.8MiB /60MiB**. CSS resource checker resolved350 resources including nested Pages paths. `git diff --check` passed.
- Independent read-only reviewer inspected final actual1672/open and844/folded captures and found no additional code or composition blocker.

The source reference is the locally retained mockup family, not a claim of byte-identical latest chat-upload reproduction. The14 batter and5 sample pitcher drawings are actual authored poses; they are not120 independent frames or complete production roster replacement. Approval coverage and default fallback remain unchanged. Checks do not establish commercial readiness or fun. Branch preview, no main merge.
