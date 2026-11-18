# Playable swing prototype — pre-implementation impact

Base: dc67424a5bd4039784bb3f12accd351f2f8a55a1 (Draft #123). Separate review/pitch-swing-prototype-20261118 branch. No main, engine, RNG, storage, production deployment changes.

| Axis | Assessment | Isolation / required evidence |
| --- | --- | --- |
| UI/layout | affected | New standalone query route; existing comparison/live layouts unchanged. Eight viewport screenshots, effects off. |
| Input/gestures | affected | Scoped pointer capture pad, first pointer only, single attempt, keyboard alternative. Cancel, repeat, blur, visibility, resize, restart tests. |
| Logic/balance | affected only in sandbox | Explicit experimental timing + measured swipe classification. Parent-provided 1/1.5/3 score factors are hypotheses applied only to isolated memory score; no live HP/card integration. Small swipe actual overlap yields provisional cut foul, protected at two prototype strikes; misses/takes advance sandbox count. |
| Save/load | no intended effect | Memory-only attempts/counts; spy zero writes and deletes. Check existing resume. |
| Mobile | affected | Standalone route excluded from forced fullscreen/reload; small landscape, portrait, coarse touch, rotation. |
| Overflow | affected | Scoped CSS, normal page scroll, touch-action:none only on swing pad. |
| Existing flow | indirect bootstrap risk | Preserve route dispatch; title/map/battle/cards/result/reward/facility/next node/resume checks and document baseline failures. |
| Tests | affected | Pure timing/gesture boundaries and browser actual input/result/cancellation tests, full Vitest and smoke. |
| Build/deploy | affected | Lazy chunk, asset reuse, build/dist budget. Isolated preview only; existing Pages workflow redeploys production root and is prohibited. Vercel currently team authorization403; no portal configured. |

Pitch choice is private before throw in reading mode (visual movement necessarily observable); reveal only after result, explicit tutorial disclosure optional. No claim of anti-cheat security in client-side sandbox. 300ms is true wall-clock flight; slower practice explicitly labeled. No claim of human reaction feasibility without user testing. Existing #121 visual NOT_IMPROVED / NOT BAR_MET and #123 art limitations stay held.
