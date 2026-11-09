# Landscape focus anchoring

Base main `a61507b`, branch `codex/battle-focus-anchor-20261109`.

The landscape field itself was an `overflow:hidden` scroll container. Focusing a card while the hand unfolds can reveal the transformed card by scrolling the whole field. The baseline real-browser regression failed: root scrollLeft293 during opening focus,18 after touch/keyboard/folding; window scrollX0. This clips the batter/HUD and exposes a right-hand blank strip. Settled touch alone does not always reproduce it. No claim of universal ordinary-touch failure is made.

The change uses `overflow:clip` only on landscape `.battle-vnext.bv-atbat` at width600px or above. It preserves the previous crop while removing that root scroll container. Internal hand and inspector scroll containers, the narrow/portrait fallback, game rules and save schema are unchanged.

## Reproduction and regression

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
CHROMIUM_PATH=/usr/bin/chromium BASE_URL=http://127.0.0.1:5341/ \
QA_OUT=/tmp/focus-anchor node scripts/qa-battle-focus-anchor.mjs
```

Fresh normal run, seed3 power pack; no injected game state. Test unfolds and focuses during transition, touches a visible card, uses actual arrow/Escape keys, checks final-card hit testing, action scrollIntoView and exact-save resume. Five sizes:667×320/375,844×300/390,1440×900. Root scrollLeft/Top must remain0 and the zone's horizontal position must stay fixed. Intentional orbit overflow width is not itself a failure. Screenshot comparison samples the same844×390 opening-focus state.

- [Production regression report](focus-report.json)
- [Baseline failing report](baseline-report.json)
- [Blind comparison](comparison.png): reference|A|B; sealed mapping A=after/B=before was disclosed only after scoring.
- [Sealed scores](judgement.json):2.56→3.13, +.56,5/8 axes improve, no decline. IMPROVED, **not BAR_MET**. This is a layout regression fix, not a new commercial-quality art claim.

Full suite:239 files/1631 tests PASS. Smoke10, production build and dist budget52.8/60MiB PASS. [Actual normal flow](normal-flow.json):0.5× and reduced-motion2× each completed7-pitch KO→reward→map→exact-save resume→event, with UI/engine state equality. No gameplay request/page errors; console recorded an existing favicon404.

[Independent UX review](independent-ux.md):actual CDP touch2/3-card drag+execute/energy/engine equality, rotation plan preservation, route scroll and inspector opener-focus restoration PASS. **A pre-existing inspector-body clipping failure was retained as a failure**, compared with both current clip and prior hidden: same overflow/dimensions at667×320 and844×390. This fix does not create that failure; the next independent issue is to establish proper inner inspector scrolling. That limitation is not described as a PASS.

Publication verification follows in the PR body. No human fun/learning study was performed.
