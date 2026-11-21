# Recovery route readability

Base: #155 `81c15310adfa626504584ea9a79e5a23e852eeca`. Map presentation only. No route generation, encounter, combat, balance, seed, save, card, art, timing or battle code changes. No merge/deployment.

When carrying outs and previewing a currently selectable unfinished node, the existing selected detail shows the **minimum number of combats before a same-act rest**, including the selected battle/elite/boss. A rest itself says `지금 휴식`; utility→rest without combat says `전투 없이 휴식 가능`; unreachable says `이 막에서 닿는 휴식 없음` (not a claim that all recovery methods are unavailable). It is a shortest option, not a guarantee across every continuation. Other-act rests do not count. No new map labels or hidden edges.

The old descendant union counts remain. Their empty-category fallback omitted ordinary battles and incorrectly said `곧장 막 보스`. When ordinary fights remain, it now says `남은 경기`; otherwise the unnecessary 'straight' claim is removed. No broad route redesign.

## Verified diagnostic and UI

Seed3342695564 after entry: event `a1-r1l1` reaches the same rest after **1** fight; `a1-r1l2` and `a1-r1l3` require **3**, counting their immediate encounter. Explicit map diagnostic fixture carries1out; it is not earned-run evidence. Initial fixture used a wrong completion field and failed save validation; corrected to the canonical completedNodeIds, with no product workaround.

Cost relaxation handles utility0/combat1, branch convergence, cycles, zero vs unreachable and act boundary. Independently enumerated paths across100seeded maps agree. 13 targeted tests and final **277files/1,863tests** pass. 100seed public first-pitcher smoke, review + production build and **52.1MiB/60MiB** budget pass.

Actual touch previews at667×375,844×390,1440×900 show1/3/3, hide hint for inaccessible preview, preserve27existing edges and entry gating. First667capture exposed the hint below long encounter details; moved it directly below the selected name inside the same scrollable detail. Final captures and bounds checks place hint above the pinned go button. Independent reviewer confirmed readable native capture, no blocker and634-file ZIP integrity.

## Artifact

`playable-build.zip`: **52,246,549bytes**, SHA256 **065877f5830e18f322258db53eea25a02eb8c7b9fd38c5724459b9595e8b2a5c**. 634files /54,597,619uncompressed bytes. Vite base`./`; serve extracted`dist/` and open normal`/`. Exact extracted final bytes used for map browser tests. Preserve all nine separately hosted private assets; none are committed here. Full manifest and #155 delta transfer supplied with final handoff.

Natural run evidence is recorded separately below; diagnostic fixtures and natural outcomes are not interchangeable. Physical Android and commercial-quality balance are not established by this pass.

## Earned ordinary run (not a win)

Fresh title→Slugger→guide→normal map, natural seed **3624441963**, no seeded query, checkpoint injection, outcome override or live hidden course/RNG access. An automated UI policy compared visible card/aim hit-range and conditional damage text, used public Scout, and prioritized the displayed shortest-rest path when outs were carried. This is public-information browser play, not a human skill/fun verdict. All controls were real; no engine action calls by the policy. Seed was logged only, never used for choices.

**Eight-minute timebox:**53actual pitches,21hits,28whiffs,3fouls,10runs,3total outs; paused in Act3 `a3-r2l0`, with2carried outs. Both Act1 Emerald and Act2 Platinum bosses were defeated and their rewards claimed; Act3 entry Red Fox was also defeated. No terminal victory/loss occurred. `natural-run.json` records public decisions, route choices, results and zero page errors. Save/resume after3pitches was exact.

Earned path:
- Act1: Cyan Mirage→event→event→training→elite Neon Trick→rest→Emerald boss. At this rest there were0outs, so actual card upgrade was chosen (not a healing claim).
- Act2: Sky Phantom2→training→training→shop→rest→Platinum boss. After the entry fight,2outs were carried. The chosen utility path showed **no more combats before rest**. Actual rest reduced2→1, confirmed by the next map. Equipment/card reward and boss relic UI were used, not granted.
- Act3: Red Fox2→locker→Ivory Ace3, paused at8minutes. The current route still has a minimum1combat to rest; success is not guaranteed.

`earned-recovery-route.mp4` is an uncut12-second excerpt (310–322s) of actual Act2 reward/training/shop/rest/boss entry, not a composite or forced win. Still captures make the2→1 decision readable. Original full recording remains locally at the path in the run log; the excerpt is durable in this commit.

Provenance limitation: this run began on the first layout candidate, where the new route text was lower in the same scrollable detail. The policy read public DOM text; it did not demonstrate human discovery of that clipped position. The final change moved only that text higher. Final exact ZIP map tests were rerun, and the **unaltered earned save** was reopened on the final ZIP at667×375: phase/pitch53/save bytes semantically unchanged (`earned-resume.json`). This transfer is a legitimate earned resume, not an artificial progression checkpoint. Combat/route/engine bytes never changed.

No reproducible combat balance blocker was established.28whiffs reflect this one policy/seed and cannot distinguish player strategy from RNG sufficiently to justify tuning. The demonstrated recovery route and later-act reach are actionable evidence; overall commercial polish, ordinary human completion and final win remain unverified. No extra balance patch or class unlock was made.
