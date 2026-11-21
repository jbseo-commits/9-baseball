# Preparation decision readability

Base: #154 `db3793c14abe85d0fc55fe96bbe4129e6e999b77`. Presentation-only follow-up; no engine, save, outcome, energy arithmetic, RNG, timing, actor, art loader or camera change. No merge/deployment. The earlier fresh-run audit was interrupted by executor failure and is **not** claimed as an end-to-end balance study here.

Existing compact decision rail now keeps active preparation visible when switching to another card, Basic or watch. Power says **이번 타석**; Scout remains **이번 공 간파** and disappears after the pitch. Prepared modern Slugger explains **1칸 주공격 안타 +6**, explicitly excluding support-only hits; broad primary says excluded. Basic explicitly states the same condition applies at zero energy. This is conditional existing damage, not guaranteed success or an added bonus. Legacy classes without buildVersion1 gain no such claim.

Watch keeps the existing short action hint and adds next actual pitch's exact energy capacity, derived from public base+1: normal base2 becomes3, not remaining energy plus3. Strikeout/game end are excluded; at two strikes the strikeout warning stays visible. No actual uncommitted pitch or exact hidden probability is read. All information is below the existing hand in the decision rail, not above the pitcher. HP-only and hold-for-details remain.

Small 667×375 captures initially exposed clipping in the old 19vh rail. A scoped `:has` height allowance (max116px/31vh) for these status lines fixes that; no global layout override. Browser assertions check status bottoms at default scroll position, not just DOM presence.

## Exact output

`playable-build.zip`: 52,246,162 bytes; SHA256 `6b6a65af72007d9d1f8495bfeb2be5ba02c8c4db49b7b15348fcdbeb31b26925`. 634 dist files, 54,596,571 bytes extracted, Vite base `./`. Serve extracted `dist/`, open normal `/`, no diagnostic query. Exact extracted bytes used for browser QA. Full per-path manifest accompanies it; preserve all nine privately installed host art files. No private candidate bytes are committed.

## Validation provenance

- Six new tests cover paid prep→energy1→Basic, scoped narrow/broad primary with support, actual support-only/miss classBonus0, Scout expiry, Power same-PA persistence, next energy3/nonaccumulation, legacy build, next-batter reset, hidden pending mutation invariance, and rendered conditional copy.
- Final full suite: **276 files / 1,858 tests passed**. 100-seed public-information smoke, production + review builds and 52.1MiB/60MiB budget passed. CI result is reported in final handoff. Initial test attempts exposed a missing happy-dom annotation, an old empty-watch-copy expectation, and CSS prefix contract; corrected test environment/expectation and scoped CSS before final checks.
- Actual touch-event browser sequence in exact ZIP: 667×375 normal Power and Scout cases, reduced-motion 2S case, 844×390 and desktop1440×900. QA uses explicitly injected starting hands/count/course checkpoints; subsequent prep, take, next, bank-to3, prep/Slug and results are actual controls/engine actions. These are not fresh full runs or blind-play balance evidence.
- Power→Basic active condition; take→Power persists; Scout→take→clue expires but preparation still counts; energy3→paid Power→Slug affordable; 2S called strike→next batter resets prep and base energy. All five scenarios passed, no page errors, status/energy text within rail at default scroll position. Independent reviewer measured no rail/zone/action overlap and valid action hit-test. First attempt used occupied old server port; final host is4240.
- Fresh normal title→Slugger→guide→map→battle and existing optional synthetic Slugger atlas fresh/late/reduced scenarios passed. Hold-details keyboard focus/escape/rotation/reload passed (`flows.json`, `hold-focus.json`). Synthetic approved atlas tests do not claim new private art approval.
- The existing auto-next can remove a transient next button between query and click; harness accepts that only after confirming actual deciding phase, rather than forcing engine advancement.

## Limits

Physical Android and a new three-act blind victory are not verified. Existing extreme-zone bat geometry and held Contact art remain unchanged. No balance conclusion follows from these UI fixtures. Long lists of many stacked preparation effects may still require the existing rail scroll; the tested relevant Power/Scout/class/energy states fit without scrolling. Private nine-file art set remains the parent's responsibility and is preserved by overlay, not regenerated here.
