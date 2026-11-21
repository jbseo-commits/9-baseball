# Pitcher details on demand — pre-edit impact
Exact base #152 b38f5214522b09d7628b7a604496b3c751caa06d. Contact WIP611ad5a is separate and excluded.

| Axis | Impact / mitigation |
|---|---|
| UI/layout | Remove default opponent rule panel/tell/head intent in real vnext; projected bare HP above existing head; existing inspector holds details |
| Input | 450ms sprite hold, pointer capture/cancel/movement/scroll/blur cleanup, swallow compatibility click; keyboard/AT equivalent; modal focus/Escape/outside |
| Rules/balance | None: public props and frozen HP only; no pending/odds/outcome access |
| Save/load | No schema/key/flags change; saved Slugger and old classes preserved |
| Mobile | 667×375 and844×390 touch path; head/foot mapped from existing projection; rotation cancels hold |
| Scroll | Local target touch-action only; modal scroll retained; no document overflow changes |
| Flow | Normal title/map/battle/details/result/resume; existing rule content on demand |
| Regression | Short hold/drag/cancel/key/unmount/phase, HP update, normal+boss public detail, control actions |
| Build | Full tests/smoke/prod+review; extracted ZIP and#152 delta, preserve all private optional files |

No art changes, no deployment. HP uses the same frozen VM as previous panel, no speculative forecast overlay in the bare gauge.

## Independent review and fixes
Reviewer checked projected target placement, public/frozen HP boundary, timer cancellation, modal layering and screenshots read-only. Actual reduced browser exposed hidden-visibility focus refusal; bounded controller-owned restoration resolves it. Inspector content changes now preserve the original opener. Existing integration tests wait for asynchronous visibility restoration. No engine, storage, assets, outcomes, RNG or timing files changed.
