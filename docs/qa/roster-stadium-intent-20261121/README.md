# Roster / stadium / intent review — 2026-11-21

Base: unmerged Draft #140, 95ac3a9c47a4d92e6df9f21b6679c4278dfd26cb. Fetched main is fb8e7b13f043e2c17376138abe6696f48c2d8022. Unique review branch; no merge or deployment.

## Pre-implementation impact analysis

1. UI/layout: affected; all registered pitchers receive a public-only head badge, measured ready-pose cap anchors, viewport bounds and quiet unknown treatment.
2. Input/gestures: unaffected; badge pointer-events none, no controls added.
3. Rules/balance: unchanged; consume visible zone faces and existing earned outside singleton only. Never consume pending target or infer certainty from probability.
4. Save/load: unchanged, no schema or persistence edits.
5. Mobile viewport: affected; check 844×390 and desktop/DPR; no portrait layout invention.
6. Scroll/overflow: unchanged; local scene CSS only.
7. Existing flow: unchanged; actual battle controls and next pitch regression required.
8. Tests: public certainty/range/unknown, all roster anchors, viewport bounds, phase policy; existing suite and smoke.
9. Build/deployment: ordinary Vite review build, relative base. No deployment.

## Approval boundary

21 registered identities: 20 existing pitchers plus Red Fox. Main has 20. Existing runtime art stays until each replacement passes master concept → five camera poses → full motion → integration approval. The new Fox pixel-stability comparison is not approved runtime art and is not applied. Existing Fox twelve poses/timing remain unchanged. Technical checks are not aesthetic approval.

Fresh video playback has not been performed for this pass. Repository cached camera observations are methodological references, not claims of watching the requested clips.

## Exact roster / replacement approval matrix

|ID|Name|New master|5 camera poses|Motion|Runtime replacement|
|---|---|---|---|---|---|
|regular-01-red-rush|레드 러시|candidate board 1; NOT approved|await master approval|not produced|not integrated|
|regular-02-teal-mirage|청록 미라주|candidate board 1; NOT approved|await master approval|not produced|not integrated|
|regular-03-amber-sinker|앰버 싱커|candidate board 1; NOT approved|await master approval|not produced|not integrated|
|regular-04-ivory-ace|아이보리 에이스|candidate board 1; NOT approved|await master approval|not produced|not integrated|
|regular-05-violet-sting|바이올렛 스팅|candidate board 1; NOT approved|await master approval|not produced|not integrated|
|regular-06-rose-paint|로즈 페인트|candidate board 2; NOT approved|await master approval|not produced|not integrated|
|sky-phantom|스카이 팬텀|candidate board 2; NOT approved|await master approval|not produced|not integrated|
|gale-twister|게일 트위스터|candidate board 2; NOT approved|await master approval|not produced|not integrated|
|vulcan-blaze|볼칸 블레이즈|candidate board 2; NOT approved|await master approval|not produced|not integrated|
|tide-vesper|타이드 베스퍼|candidate board 2; NOT approved|await master approval|not produced|not integrated|
|elite-01-cobalt-impact|코발트 임팩트|candidate board 3; NOT approved|await master approval|not produced|not integrated|
|elite-02-neon-trick|네온 트릭|candidate board 3; NOT approved|await master approval|not produced|not integrated|
|elite-03-wine-bluff|와인 블러프|candidate board 3; NOT approved|await master approval|not produced|not integrated|
|jade-viper|제이드 바이퍼|candidate board 3; NOT approved|await master approval|not produced|not integrated|
|copper-sirocco|코퍼 시로코|candidate board 3; NOT approved|await master approval|not produced|not integrated|
|boss-01-emerald-tyrant|에메랄드 타이런트|candidate board 4; NOT approved|await master approval|not produced|not integrated|
|boss-02-platinum-halo|플래티넘 헤일로|candidate board 4; NOT approved|await master approval|not produced|not integrated|
|boss-03-black-eclipse|블랙 이클립스|candidate board 4; NOT approved|await master approval|not produced|not integrated|
|emerald-tempest|에메랄드 템페스트|candidate board 4; NOT approved|await master approval|not produced|not integrated|
|onyx-eclipse|오닉스 이클립스|candidate board 4; NOT approved|await master approval|not produced|not integrated|
|regular-07-red-fox|붉은 여우|existing approved V5 retained|unchanged|unchanged|unchanged|

Red Rush is the tutorial first opponent, excluded from normal main roster draws. Other regular/elite identities can appear in acts 1–3. Bosses: act1 Emerald Tyrant; act2 Platinum Halo / Emerald Tempest; act3 Black Eclipse / Onyx Eclipse. Repeated suffixes 2/3, HP phases, and four stages are not new identities. Onyx is left-handed; all others registered right-handed. Violet Nocturne, Copper Lynx and historical Midnight Orchid are not active roster entries.

## Art review, not integration

Four imagegen concept boards cover all twenty non-Fox identities, using a directly inspected current-runtime ready sheet as reference. They are newly generated concept illustrations with pixel styling, NOT native production sprites, NOT approved masters, and not motion sheets. Glove anatomy/handedness and small-size consistency remain review gates (especially Onyx). Files remain outside GitHub production assets under `/workspace/roster-art-review-20261121/` in accordance with the chat-first gate.

Two stadium attempts were inspected. Both reduce crowd noise and retain approximate landmark composition, but both still contain smooth tonal shading. HELD: neither meets the requested native flat-cluster pixel standard. Neither replaces the runtime background; no geometric camera fix is claimed. Latest candidate is `stadium-candidate-HELD.png`. No extra autonomous generation batch started.

Library: current openai-library:library skill and fresh bundled prepared upload helper used for five local art files; failed before upload with `hosted apps tools/list request failed: proxy tunnel HTTP 403`. No confirmed Library IDs. No download of the optional Fox stability video was attempted; it is not claimed viewed or applied. Local `.agents/skills` and `.codex/skills` contained no applicable installed pixel SKILL.md. Repository art workflow and cached method documents were applied, not mislabeled as installed skills.

## Intent implementation

All21 existing actors now use the same public-only head badge. Exactly public singleton zone/outside uses a dot/! or explicit 볼. Partial candidates are neutral/dotted; nine candidates or unknown has no bright selected cells. No raw pending/RNG/probability input. The badge hides during actual flight/result. Ready silhouette top includes ponytail clearance; fixed head x tracks the actual actor through existing projection, snapped to CSS pixels. A clipped head suppresses its badge rather than detaching it onto a face/HUD. No engine, actor atlas, camera, release/contact schedule, save or input changes.

## Verified review build

Exact relative-base ZIP: `playable-build.zip`; SHA256 `083f80ba409c3515add848f681ebe2d27774da27f6049fb45f5347a300727a77`, 52,232,272 bytes. Dist630files /54,568,842bytes, every extracted file byte-identical. Serve extracted `dist` using `python3 -m http.server 8000 --directory dist`, then open `http://localhost:8000/?battleUi=vnext&battlePlay=1&seed=20261119`. This build implements intent only; it deliberately does not contain unapproved replacement pitchers or the failed stadium candidates.

Actual Chromium mobile emulation844×390, desktop1440×900, reducedmotion: real card→zone2→swing hit (60→42HP), take lookingstrike, nextpitch/reload/rotation/storage/no404 PASS. Separate actual hit/take/whiff sixruns retain V5 path/radius contract (maximum projection residual below0.02CSSpx). No Android physical device was used.

84 rendered opponent cases: all21 actors ×844×390DPR1/3,1440×900DPR1,667×375DPR2. Controlled generated map-node fixtures override reachability only in QA; these are not claimed campaign victories. Badges visible, inside viewport; real assets loaded, no404. Ten controlled actual-browser target fixtures execute existing upgradedScout through real controls; public cell0–8/outside9 exactly matches test oracle only after disclosure. Before disclosure remains uncertain. Read-only reviewer independently checked all21 alpha outlines: zero badge collisions, minimum5.56CSSpx gap at844×390.

Badge is absent throughout pitch focus/flight/result, so it cannot jitter over the pitcher during that zoom. Ready coordinates are CSS-pixel snapped and stable across successive samples. This does not claim to fix pre-existing sprite shimmer. Existing stage/camera/pose HELD limitations remain.

Screenshots are actual runtime. `actual-gameplay.gif` is a real browser recording, not a composited art mockup. `public-exact-*.png` are explicitly controlled disclosure fixtures, not claims of natural RNG occurrence.

An earlier roster browser run timed out while dist was being rebuilt (cause not independently isolated); it is not counted as evidence. The completed84-case rerun uses the final identical build. The initial anchor pass overlapped ponytails; independent review caught it, anchors were corrected, and final alpha clearance passed.

Final local checks:255testfiles/1727tests PASS, ten-seed zone report completed, Viteproductionbuild PASS, dist52.0MiB/60MiB budgetPASS. HappyDOM emits pre-existing iframe environment stderr; suite exit0, no browser pageerrors in actual review runs. No deployment verification: deployment is prohibited.
