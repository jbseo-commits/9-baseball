# 작업 브랜치 선별 통합 — 2026-10-15

기준: `main` @ `dd70f4cc0250d4f634ca0027061fa8d71bba764f`. 사용자는 여러 작업 브랜치의 유효한 변경을 `main`에 통합하도록 요청했다. 원격 브랜치 52개(main 포함)를 조회하고, Git 조상 관계뿐 아니라 실제 파일·현행 런타임·PR 상태를 비교했다.

## 통합한 변경

- `ag/20261010-v16-cards` (`ff23235`): PR #22 이후의 카드 23장 후속 수정. 100px 비교와 실제 375px 상세 UI에서 확인하고 13개 초점 위치를 보정했다. 캐릭터가 더 잘 분리되고 카드별 동작이 읽히는지 검사했으며, 새 그림의 WebP는 기존 768px/q82 정책으로 생성했다.
- `ccr-d10b9ab6-dlyj7d` (`99f6a09`): 사용되지 않는 React/Tailwind 플러그인 제거, `latest` 범위를 잠금 버전 기반 범위로 변경. 현행 `1.0.0`과 모든 CI/배포 워크플로는 유지했다.
- `plan/masterpiece-2.0` (`8b74943`, `a79d1a2`): 품질 계획과 큐 문서. 작성 당시의 제안임을 명시했다.
- `codex/worldbuilding-draft-20261006` (`92c6823`): 미확정 초안 문서만 보존. 세계관·대사·밸런스 구현 승인을 의미하지 않는다.

## 영향도 분석

구현 전 9축 분석을 수행했다. 직접 영향은 카드 그림·초점과 빌드 의존성이다. 입력/제스처, 게임 규칙/밸런스, 저장 스키마, 전투 타이밍, 전역 CSS, 현행 배포 워크플로는 변경하지 않는다. 모바일/PC의 기존 카드 슬롯·상세·스크롤·저장 복원·전투/보상/시설 흐름과 WebP 매니페스트 무결성을 검증한다. 변경된 그림은 같은 카드 키와 파일 경로를 사용한다.

## 검증

- `pnpm install --frozen-lockfile`: 통과. 현행 버전 유지, 미사용 패키지 62개 감소.
- `pnpm test --maxWorkers=4`: 172파일 / 1,018개 통과, 실패·스킵 없음.
- `node --test tools/agent-dashboard/agent-loop.node.mjs`: 10개 통과.
- `node scripts/zone-report.js 10`: 통과, 기준 main의 JSON과 바이트 동일.
- 프로덕션 빌드와 `/9-baseball/` base 빌드: 통과. `check:dist` 58.3MB / 60MB (기준 59.0MB). CSS 산출물은 기준과 바이트 동일.
- 기존 `scripts/qa-shots.mjs`: 최종 직렬 실행 24/24 통과. 최초 병렬 실행은 연출 진행 중의 투수/HUD 측정 1개 실패(23/24); 동일 검사·동일 기준의 직렬 재실행 결과와 최초 실패 보고서를 모두 보존했다.
- 추가 브라우저 흐름: 53/53 통과. 375×667 / 390×844 / 1440×900에서 타이틀, 지도 진입, 9존·스택·검사, 투구 1회·HP 반영, 재로드 후 이어하기를 확인했다. 보상과 라커룸은 엔진으로 만든 결정적 저장 상태를 주입해 진입·다음 지도 전환을 검사했으며, 자연 플레이 완주를 뜻하지 않는다. 터치 기기의 짧은 가로 화면에서는 회전 안내와 세로 복귀를 확인했다.
- 실제 프로덕션 `/9-baseball/` 경로: 8/8 통과. 새 게임 → 시작 팩 → 웰컴 가이드 닫기 → 지도 실제 휠 스크롤(HTML scrollTop 0→240→복귀) → 전투, 오류·실패한 에셋 요청 없음을 확인했다. 검사 스크립트의 초기 시도는 웰컴 가이드가 열린 상태를 지도 입력으로 오인했으며, 정상 UI로 가이드를 닫고 스크롤 변화를 기다리도록 검사만 바로잡았다.
- 시각 검수: 23장 모두 실제 375px `CardDetailSheet`에서 로드·렌더. 100px 비교와 상세 크롭을 메인 및 별도 검토자가 확인했다. `relayBat`, `eyeTest`, `countBattle`의 초점도 재검수했다.

위는 병합 전 통합 브랜치 검증이다. 원격 main 반영과 배포 성공은 PR 및 해당 커밋의 배포 실행 결과로 별도 확인한다. 실기기·사람 장기 플레이 품질은 검증하지 않았다.

## 브랜치별 판단

아래 ahead/behind는 조사 당시 main과의 커밋 수이며, 미반영 기능의 개수를 뜻하지 않는다. 보관 브랜치는 삭제하거나 병합하지 않았다.

| 브랜치 | ahead / behind | 판단 |
| --- | ---: | --- |
| `ag/20260928-hero-batter-glass-9zone` | 5 / 362 | 유물 아트 반영됨; 구형 보간·UI 실험은 현행 Pixi 구조와 달라 제외 |
| `ag/20260928-p2-title-ending-cutscenes` | 4 / 362 | 유물·화면 후속 작업으로 대체; 과거 스냅샷 재병합 제외 |
| `ag/20261001-sky-phantom` | 8 / 273 | 소스 6f051a1의 투수 포트가 이미 main에 반영됨 |
| `ag/20261006-homer-cutscene-v2` | 0 / 160 | 이미 main의 조상: 재병합 불필요 |
| `ag/20261006-port-new-pitchers` | 0 / 173 | 이미 main의 조상: 재병합 불필요 |
| `ag/20261009-homer-v4-shot-assets` | 0 / 159 | 이미 main의 조상: 재병합 불필요 |
| `ag/20261010-v16-cards` | 1 / 193 | 통합: ff23235 카드 23장 및 새 그림에 맞는 초점·WebP 파생본 |
| `archive/legacy-branches-2026-10-06` | 76 / 195 | 보관용: 통합·삭제 제외 |
| `archive/pre-reset-2026-09-26` | 334 / 401 | 보관용: 통합·삭제 제외 |
| `autodev/20261008-1952kst` | 0 / 143 | 이미 main의 조상: 재병합 불필요 |
| `backup/main-before-v15-20260928` | 0 / 386 | 보관용: 통합·삭제 제외 |
| `ccr-6f0a0684-gh9zbt` | 0 / 1 | 이미 main의 조상: 재병합 불필요 |
| `ccr-d10b9ab6-dlyj7d` | 3 / 285 | 부분 통합: 99f6a09의 의존성 정리만 적용; 현재 버전·CI 유지, 옛 삭제 명령 제외 |
| `chatgpt/pitcher-reference-cache-approval-gate` | 0 / 47 | 이미 main의 조상: 재병합 불필요 |
| `claude/cross-zone-cover-signature-comparison-bqhyp4` | 2 / 283 | 과거 카드·기믹 규칙; 현행 시그니처·artId 기믹과 달라 제외 |
| `claude/determined-turing-1kbdga` | 7 / 284 | SpriteBrew 준비용 빈 에셋 경로; 현행 배우 경로에 적용되지 않아 제외 |
| `claude/feedback-review-plan-vw24at` | 36 / 454 | 보류: 같은 존 +5%p는 미확정 밸런스; UI 링크는 이미 반영됨 |
| `claude/fix-batter-occlusion` | 1 / 576 | 구형 지도·배우·렌더러 작업: 현행 BallparkMap/Pixi/영화 연출로 대체, 재병합 제외 |
| `claude/repo-move-jbseo-commits` | 1 / 277 | 과거 배포 전환 문구·워크플로 전제; 현행 배포 설정 보존 |
| `codex/20261011-pitcher-creation-pipeline` | 1 / 67 | 동일 패치가 main에 반영됨 |
| `codex/actor-animation-runtime-smoothness` | 8 / 436 | 구형 지도·배우·렌더러 작업: 현행 BallparkMap/Pixi/영화 연출로 대체, 재병합 제외 |
| `codex/batter-asset-loop-v1` | 12 / 577 | 구형 지도·배우·렌더러 작업: 현행 BallparkMap/Pixi/영화 연출로 대체, 재병합 제외 |
| `codex/batter-motion-loop-v2` | 33 / 577 | 구형 지도·배우·렌더러 작업: 현행 BallparkMap/Pixi/영화 연출로 대체, 재병합 제외 |
| `codex/batter-motion-loop-v3` | 58 / 577 | 구형 지도·배우·렌더러 작업: 현행 BallparkMap/Pixi/영화 연출로 대체, 재병합 제외 |
| `codex/batter-ump-miss` | 2 / 283 | 보류: 미스 포즈의 실제 화면·Pixi·시각 검수 미완료, 구형 App 전제 |
| `codex/card-energy-20261008` | 0 / 192 | 이미 main의 조상: 재병합 불필요 |
| `codex/commercial-battle-info` | 2 / 14 | 보류: PR #40은 DRAFT, 사람 플레이 검증 전 병합 금지 명시 |
| `codex/game-autodev-loop-20261008` | 0 / 194 | 이미 main의 조상: 재병합 불필요 |
| `codex/gm12-batter-golden-master-redraw` | 54 / 583 | 구형 지도·배우·렌더러 작업: 현행 BallparkMap/Pixi/영화 연출로 대체, 재병합 제외 |
| `codex/homer-video-20261009` | 3 / 195 | 승인 영상과 런타임이 main에 반영됨 (PR #21) |
| `codex/hybrid-battle-v3` | 0 / 62 | 이미 main의 조상: 재병합 불필요 |
| `codex/original-ui-refinement` | 0 / 52 | 이미 main의 조상: 재병합 불필요 |
| `codex/pitcher-copper-lynx-20261011` | 0 / 54 | 이미 main의 조상: 재병합 불필요 |
| `codex/pitcher-copper-sirocco-20261011` | 0 / 64 | 이미 main의 조상: 재병합 불필요 |
| `codex/pitcher-jade-viper-atlas-20261013` | 0 / 14 | 이미 main의 조상: 재병합 불필요 |
| `codex/pitcher-midnight-orchid-20261011` | 0 / 53 | 이미 main의 조상: 재병합 불필요 |
| `codex/pitcher-v63-regression-stabilization` | 0 / 51 | 이미 main의 조상: 재병합 불필요 |
| `codex/v10-map-masterpiece` | 5 / 933 | 구형 지도·배우·렌더러 작업: 현행 BallparkMap/Pixi/영화 연출로 대체, 재병합 제외 |
| `codex/v10-map-rebuild-main` | 17 / 913 | 구형 지도·배우·렌더러 작업: 현행 BallparkMap/Pixi/영화 연출로 대체, 재병합 제외 |
| `codex/visual-loop1-batter-gm12` | 34 / 583 | 구형 지도·배우·렌더러 작업: 현행 BallparkMap/Pixi/영화 연출로 대체, 재병합 제외 |
| `codex/visual-reboot-golden-master-1` | 7 / 800 | 구형 지도·배우·렌더러 작업: 현행 BallparkMap/Pixi/영화 연출로 대체, 재병합 제외 |
| `codex/worldbuilding-draft-20261006` | 1 / 195 | 통합: 미확정 세계관 초안 문서만 보존, 코드·대사 구현 없음 |
| `design/battle-readability` | 0 / 191 | 이미 main의 조상: 재병합 불필요 |
| `design/hud-clarity-tokens` | 0 / 193 | 이미 main의 조상: 재병합 불필요 |
| `feat/all-pitcher-sd` | 1 / 422 | 보류: 손 연속성 수정은 frame 79 전제; 현행 release 76과 불일치 |
| `feat/pitcher-emerald-tempest-rhp` | 0 / 4 | 이미 main의 조상: 재병합 불필요 |
| `feat/pitcher-onyx-eclipse-lhp` | 0 / 7 | 이미 main의 조상: 재병합 불필요 |
| `game/game-20261011-a` | 0 / 43 | 이미 main의 조상: 재병합 불필요 |
| `plan/masterpiece-2.0` | 2 / 312 | 통합: 계획 문서 2개를 작성 당시 제안으로 보존 |
| `release/commercial-hardening` | 0 / 186 | 이미 main의 조상: 재병합 불필요 |
| `visual-loop-batter` | 7 / 761 | 과거 시각 작업·백업 성격; 현행 배우/경기장 구조로 대체 |

## 남은 한계

수비 실험의 사람 플레이 검증과 미확정 피해 보너스는 이번 통합으로 승인되지 않는다. 투수 손 보정은 현행 릴리스 프레임에 맞는 별도 검토가 필요하다. 카드 `relayBat`의 잔상은 연속 스윙으로 읽히며, 동료 간 핸드오프를 직접 묘사하지는 않는다. 화면 가독성·자동 검증 통과는 상업 품질이나 재미, 마스터피스 완성의 입증이 아니다.
