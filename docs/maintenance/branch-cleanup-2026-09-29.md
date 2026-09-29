# 브랜치 정리 기록 — 2026-09-29

원격 브랜치 129개 → 정리. 삭제한 브랜치는 아래 SHA로 복구한다:

```sh
git push origin <sha>:refs/heads/<branch>
```

## 1. main에 이미 포함된 브랜치 (17개)

모든 커밋이 main의 조상. 삭제해도 잃는 커밋 없음.

| 브랜치 | SHA |
|---|---|
| `ag/20260927-p1-batter-ready` | `0d78a02e2260326acff7edafce92525cadc03e20` |
| `ag/20260927-p1-golden-pass` | `7be5d46614456e24f2136c10889bd6210cc4b8a8` |
| `ag/20260927-p1-hit-polish` | `80b4837cc337d12867b7b635b68e21dfbd74ce22` |
| `ag/20260927-p1-result-splash` | `c6e6736462d5c10a6f5f0a928310de32cd5a92aa` |
| `ag/20260927-portrait-masterpiece` | `0fa0b65ad554afbd77bf990cf60e1c05c3de330a` |
| `ag/20260928-p2-deck-dex` | `75c61451cc6522e20252289f3288582a6b60dd1a` |
| `ag/20260928-p2-landscape-battle` | `0ca3f9e89da7c172ea598f5977f37ff4f1eda38b` |
| `ag/20260928-p2-map-masterpiece` | `c0505ec09fafafac9376e4c66e2bde69ecc5b42e` |
| `ag/20260928-p2-reward-masterpiece` | `8c968e8ae05ad57adc0706f4a979b359de51c5ed` |
| `ag/20260928-red-rush-female-art` | `c2f2b26e3cdc212297b8e7fcbdf6a2c4e84d0089` |
| `ag/apply-new-card-assets` | `9450f31ca5e13b652979048c061609e2d7beb07c` |
| `ag/portrait-css-refine` | `4b4aa471e6f3786a23c8e9787db442a71d96cfbe` |
| `claude/game-ui-ux-improvement-y7lyq3` | `8c60b81f531ae6955c2041039e8809402b79e0af` |
| `claude/integrate-ag-v15` | `3ae979768bb441a56a996e5290d90dc71b844c61` |
| `claude/pixellab-pitch-anim` | `2f305854e16632017d0cbe3d3fc32e5cb0dcbd84` |
| `codex/card-docking-assets-v1` | `ecdc6a00ad39c77594c29aff2004c5d6de01996e` |
| `codex/v14-batter-production-art` | `5747a929d93fb490cd1a32413165881ac280ff18` |

## 2. 09-26 main 히스토리 재구성 이전 브랜치 (94개)

main과 공통 조상이 없음 (main 루트 `82eefcb`, 2026-09-26). 연결된 PR은 모두 머지 또는 닫힘.
커밋은 `archive/pre-reset-2026-09-26` 브랜치(`f3cf0fe`)의 부모로 전부 보존 — 이 브랜치는 지우지 않는다.

| 브랜치 | SHA |
|---|---|
| `claude/batter-motion-v3` | `47b4f3d7a8f96a3d63eb94f1a38a2ed5e9414f67` |
| `claude/feedback-review-plan-vw24at` | `211a703bff6659bbd9d29081054c103bd743978c` |
| `claude/fix-locker-hand-crash` | `9bfe3cdb6e92c6731ce486db978f6efb6abbd017` |
| `claude/github-task-assignment-review-a5bx4i` | `e558b9337be6b313ea2636677b68c000be76c386` |
| `claude/progress-check-ydvdeo` | `3dfcc3ce5fffd3c2587696e9559fbc4032933762` |
| `claude/ux-small-phone` | `68d881dee279d9d4bd0165af4968922694443f52` |
| `claude/v10-map-merge` | `74b44ad57733b69a9777c3cb1a97e086bfacca18` |
| `claude/v10-ui-shell` | `361eeaa62df15d2e0cb63614ae4ea47c1b42b1f5` |
| `codex/actor-animation-runtime-smoothness` | `f1d356c9cf36e5de94f9e078e394f2f2553335c7` |
| `codex/adaptive-60fps-budget` | `8130e1d25bb5a00ad7e54e4a8c175c92303df8a4` |
| `codex/auto-battle-tutorial-v1` | `4717eaa92f39bd014d52c0b761169f15b7222c56` |
| `codex/ballpark-commit-beat-v1` | `abc358dccd020eee08002e1be70014c43c4d62d4` |
| `codex/ballpark-debrief-loop-v1` | `b26146c8cba7a8653566e55a8844e49f7148817f` |
| `codex/batter-asset-loop-v1` | `579a88f1152a95e99f64fe848e7d709b4eaf51ed` |
| `codex/batter-motion-loop-v2` | `9fa7d266fa0cc2a59bfdbc7e0efdbae9906ffcc8` |
| `codex/batter-motion-loop-v3` | `db4843613ec6924fa57da3fe5e5891b16f26f95e` |
| `codex/combat-readability-hp-impact` | `c5ea9f172346ab3ecc8d25682eacfb2d4d9c03ea` |
| `codex/combat-readability-hp-impact-v2` | `6f8b3a7bed1693a90aefee232a48674c46d16341` |
| `codex/fix-landscape-run-scroll` | `30c4a0771751ae9ede1be13b29be66841d922f8d` |
| `codex/fix-landscape-scroll-final` | `30c4a0771751ae9ede1be13b29be66841d922f8d` |
| `codex/fix-landscape-scroll-hotfix` | `30c4a0771751ae9ede1be13b29be66841d922f8d` |
| `codex/fix-landscape-scroll-live` | `30c4a0771751ae9ede1be13b29be66841d922f8d` |
| `codex/fix-landscape-scroll-v2` | `30c4a0771751ae9ede1be13b29be66841d922f8d` |
| `codex/fix-landscape-scroll-v3` | `30c4a0771751ae9ede1be13b29be66841d922f8d` |
| `codex/fix-scroll-actual` | `30c4a0771751ae9ede1be13b29be66841d922f8d` |
| `codex/fix-scroll-actual-2` | `30c4a0771751ae9ede1be13b29be66841d922f8d` |
| `codex/fix-scroll-actual-3` | `30c4a0771751ae9ede1be13b29be66841d922f8d` |
| `codex/fix-scroll-actual-4` | `30c4a0771751ae9ede1be13b29be66841d922f8d` |
| `codex/fix-scroll-actual-5` | `30c4a0771751ae9ede1be13b29be66841d922f8d` |
| `codex/fix-scroll-actual-6` | `30c4a0771751ae9ede1be13b29be66841d922f8d` |
| `codex/fix-scroll-final-final` | `6b093445bdc13db4d2104fdc316f0039e96e6728` |
| `codex/fix-stack-remove-deadlock` | `a69b6b69179f51c9fd8dc3bfc9db6e9f72784f19` |
| `codex/gm07-animation-fluidity` | `9d4121b5d1297f5a1d80346db87008d7624c9df4` |
| `codex/gm08-v4-60fps-atlas` | `5a5b2bdb8948a1088e4707cc593e91cad389ac11` |
| `codex/gm10-actor-focus-relay` | `e456a2f681eb7cf61b856012466cb1adb50e21de` |
| `codex/gm11-batter-hero-poses` | `6017a1e964fd15aa831ffb5f5f8d9cfc336fcac0` |
| `codex/golden-master-01-polish` | `ef589e2c15750ad344ddd54b1505c11113e21f39` |
| `codex/golden-master-02-choreography-v2` | `0b5d750b233912d2a260887c9de654be85425d0c` |
| `codex/golden-master-02-duel-choreography` | `e4667ce9c558ff0946fa83c749c4dc4c9e4b48ff` |
| `codex/golden-master-03-stadium-depth` | `ec4467c580326fbb186f379c4edfe10660c0d2f3` |
| `codex/golden-master-04-cinematic-timing` | `e2bbe372cf820694655c2876b2f81dca093da2b6` |
| `codex/golden-master-05-actor-silhouettes` | `1b6a00a8aff69cdd0460d5f2ba51d85a020600b8` |
| `codex/golden-master-06-authored-actor-art` | `4fc7852ed54063bbbad666cd49f0960aa7a1a007` |
| `codex/hotfix-v4-canvas-60hz` | `2114eb8b66918e4868c26d341ac1011b0765d085` |
| `codex/hotfix-v4-real-60frame-sprites` | `7ade36ff9e65c048aea61b4fb7ffb7790988df7c` |
| `codex/landscape-progressive-disclosure` | `dd4f287629a43e279d9cbac2c2fb4f14bf6b07d4` |
| `codex/mandatory-impact-analysis` | `7676056f0eeeb8f7512075d1ba005ecc2a35dad6` |
| `codex/mobile-landscape-hand-first` | `f5fe36e4ece4f476cfe80fe92e3e915434039bee` |
| `codex/protagonist-visibility-zone-english` | `99fa6bbf4deba2e4fda0bfccd6df1f7573415c4d` |
| `codex/responsive-master-character-pass` | `be69b5f36b26acce4fb78bc901243dc4a576f3bf` |
| `codex/sprite-gen-batter-pipeline-v1` | `a1b18e43339cd6123cfffcbf0a1808cb43ee2d57` |
| `codex/sts-landscape-battleboard` | `dd55b2930d74df85907339a5f2499566629c55c0` |
| `codex/v10-act23-deckbuilding-masterpiece` | `deae35198dcd689aac5b8de12b0339177bb75f2f` |
| `codex/v10-assist-cover` | `cb45f815c12c0943037f10657e4c4fb19061b970` |
| `codex/v10-direct-multicard-tap` | `f1bfe6fa1d011fd89282715d9023327729c6e249` |
| `codex/v10-engine-map` | `bfb0b001c1b78f5ab65c9104b90ccabca66b0107` |
| `codex/v10-integration` | `40f5763711ea3217300109d11562a42d2f790ebf` |
| `codex/v10-landscape-first` | `3c5f2d7643abb102b5e1cf17aa6c6e1768d5b387` |
| `codex/v10-map-magnum-slice` | `ad69fbfea5fcfb55eaaf093a2c8ed96eefdf8e08` |
| `codex/v10-map-masterpiece` | `e399e3319d404ea955542de15e92354b38b47567` |
| `codex/v10-map-rebuild-main` | `10d855a2bdcadcffde64962c2b9ecf83fa4af5e6` |
| `codex/v10-relic-builds` | `2b580708bff9983fe935d6dea2dac8c67813d6c5` |
| `codex/v10-swing-stack-masterpiece` | `a11a31fd787637d11f18d469b7045933bf332c39` |
| `codex/v10-swipe-stack` | `56cd42cbc2b11e741a0b3125245fe0430b1ce630` |
| `codex/v11-battle-readout` | `757422e45b1c72933f6a61268f960de8b38a1dd5` |
| `codex/v11-direct-zone-edit` | `1c1f6b72eaef4aa4c18a0b24475b6cca36eb02e1` |
| `codex/v11-drag-reorder` | `34693fca5f1cc9f0fa95c2ff80237ae7a8dc0096` |
| `codex/v11-reorder-guidance` | `d221bf780bd6fab29a99a7da7c0aa383d9d310c3` |
| `codex/v11-resolve-commit-beat` | `1b2c2bc780daf50a5ac1b247c263fcf8723995eb` |
| `codex/v11-result-debrief` | `a6e35b7df3b0462cd98b720564f36c8546f6b355` |
| `codex/v11-stack-balance-report` | `c35529ede64b15ad42749284533b7500e808f50a` |
| `codex/v11-stack-balance-tune` | `1c6602270ab6883f2f3473fe8b5f21f02c653415` |
| `codex/v11-stack-board-integrate` | `45d717fb593a1b4a62822c16cbd1a9bd3aacf845` |
| `codex/v11-stack-board-ux` | `5861c72b36c58836e6e242ef71abf0d9a7262975` |
| `codex/v11-stack-order-core` | `b1386301040d6f4f247e370a768b650c38396b63` |
| `codex/v11-stack-resolve-cinematic` | `c6ccc19ce893a17ee6aac5b78f84ca7623f092ce` |
| `codex/v11-stack-result-echo` | `7f08f08d3efad23393960e031d6ac231d1727ba9` |
| `codex/v11-starter-identity` | `646cb05b6721f17b4b6b753d085030bec7682027` |
| `codex/v8-release` | `7e20491ec850a5fdcc5ac64cabe43fff2a2eb642` |
| `codex/v9-deckbuilder` | `92806b3773c8173325c9236518dce05cc8d67a04` |
| `codex/visual-loop1-batter-gm12` | `1977447bada6313204e3ff3ec824f6f5db8d0291` |
| `codex/visual-loop4-outcome-director` | `c736b4987d1df3df2f8dcdd218c8d849eacbe333` |
| `codex/visual-reboot-golden-master` | `2065e6160686fd9041ddf94a3a2a21a003d4fbc8` |
| `codex/visual-reboot-golden-master-1` | `9fbab0a963a26b52414e3de2ab6a001519ea0489` |
| `codex/zone-card-board-ux` | `e77de2936610fd25e19847cc036efa8cd6e610fe` |
| `codex/zone-magnetic-polish` | `37cfaafc79fc55a256aedf5264c72feaafcc9363` |
| `codex/zone-placement-impact` | `143f93650883f06bd8f06d653259f967b3a170e1` |
| `codex/zone-touch-targets` | `cc9bf57a6ba65f79d6bee0f5e4aa20f3ae95b47a` |
| `deckbuilding-v8` | `87cba77fed1d587d5f06d91f36e139c550309aff` |
| `docs/visual-reset-handoff` | `30d53eb0c26bee47475c59820e80c3cf1e669c4a` |
| `feat/all-pitcher-sd` | `51aceb9a4891e2a4d1c800131de514c39f9b482b` |
| `feat/pitcher-red-rush-main` | `2256cc1ab0c92bed972de3be8c448882dbd444e2` |
| `homebound-v4-mobile-ux` | `33d0120a8e283487e9fcf3e23b0866102929ff8d` |
| `visual-loop-batter` | `aab446adca7b1f4505dcf8cec5c9ae5bd5e4ecd8` |

## 유지

- `main`, `backup/main-before-v15-20260928`, `archive/pre-reset-2026-09-26`
- 열린 PR head 브랜치 전부 (고아 PR #1·#82·#86은 닫았지만 브랜치 유지)
- 진행 중 세션 브랜치 `ccr-*`, PR 없는 최근 작업 `ag/20260927-a1-bubble`, `ag/20260928-hero-batter-glass-9zone`, `codex/gemini-ui-capture`
