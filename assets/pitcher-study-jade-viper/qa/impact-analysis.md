# Jade Viper atlas candidate — pre-implementation impact analysis

Approved scope: preserve Motion R1, draw additional transitions, package a 120-cell candidate on a feature branch, and open a draft asset PR. Runtime, roster, balance, main merge and deployment are outside scope.

| Axis | Assessment | Isolation / verification |
| --- | --- | --- |
| UI / layout | No production impact | Standalone preview only; do not modify game selectors. |
| Input / gestures | No production impact | Player controls remain inside the standalone preview. |
| Game logic / balance | No impact | No gameplay modules, values or mappings are changed. |
| Save / load | No impact | No schema or persistence changes. |
| Mobile viewport | Requires candidate QA | Show 166px, 256px and larger inspection scales; actual game landscape/desktop acceptance remains pending. |
| Scroll / overflow | No production impact | No game CSS changes. |
| Existing user flow | No impact | Candidate is not imported by the game. |
| Tests / regression | Requires asset QA | Validate source hashes, atlas cells, release ball state, bounds and preview playback. Full gameplay regressions are not a substitute for visual review. |
| Build / deployment | Requires packaging QA | Reproducible isolated builder; no deployment changes. Confirm changed-file scope before push. |

## Plan review

Independent reviewer `motion_final_review` recommended preserving all 12 approved drawings and adding 18 actual inbetween drawings across every gap, with two drawings in the seven largest-motion gaps. The 2-second atlas uses a new timing proposal rather than claiming the earlier 3.07-second animatic timing is unchanged.

Frame 76 is a zero-based atlas cell index, following `scripts/build-tide-vesper.py`: preceding segment lengths sum to 76. A retained reference contract is not evidence of runtime integration. Do not use whole-body rotation, opacity crossfades, or forced unique hashes to simulate new limb drawings.

Candidate status remains mandatory if frame-by-frame art continuity, support contacts or timing do not pass. 120 cells and encoded 60fps alone cannot establish smooth production motion.
