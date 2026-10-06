# Branch archive 2026-10-06

These remote branches were deleted on 2026-10-06 after checking that their useful
content was already in `main` or superseded by later work. Every tip is kept as a
parent of this branch through a `-s ours` merge, so the commits stay reachable.

| branch | tip | why it was archived |
| --- | --- | --- |
| `art/v14-asset-overview-reference` | `bddbb2f` | 1 stale line in a generated asset-overview SVG |
| `codex/auto-battle-tutorial-v1` | `4717eaa` | superseded tutorial wiring; only 9 lines never reached main |
| `ag/20260927-b3-card-preview` | `88d535f` | early card-preview UI pass, superseded by the BallparkBattle rework |
| `ag/20260927-a1-bubble` | `7a255e3` | UI-kit bubble overlay assets, superseded |
| `docs/gemini-masterpiece-loop` | `b327fe9` | process doc superseded by the Antigravity loop docs already on main |
| `codex/combat-readability-hp-impact` | `c5ea9f1` | v1 of combat readability; v2 was merged into main and deleted earlier |
| `codex/gemini-ui-capture` | `92a9a85` | one-shot Gemini screenshot capture workflow + script |
| `codex/mobile-playtest-report-20260928` | `5c9e552` | dated playtest report and its phone screenshots |
| `claude/link-not-opening-gzoz2c` | `f3e35f7` | off-project spike with unrelated history: novel web reader under `public/` |
| `claude/new-session-lrc8kl` | `f62e1ad` | off-project spike: legacy BaseballSim simulator under `src/game/` |
| `claude/spritebrew-character-animation-jfcrul` | `90fe001` | duplicate of `claude/determined-turing-1kbdga` (same 12 files) |

## Restore one

```sh
git branch <name> <tip-sha>
```
