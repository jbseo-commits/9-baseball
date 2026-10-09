# 홈런 영상 V1 — 영향도 분석 및 검증

사용자 승인: 제작한 14초 홈런 컷신을 게임에 넣는다. 공식 저장소 `jbseo-commits/9-baseball`, 최신 main `efff947` 위 작업 브랜치 `codex/homer-video-20261009`에서 진행한다. 기존 `ag/20261009-homer-v4-shot-assets`의 미검수 프로토타입 전체를 병합하지 않는다.

## 구현 전 영향도 분석

<!-- IMPACT_ANALYSIS_REQUIRED -->
| 축 | 영향 | 대응 |
|---|---|---|
| UI/레이아웃 | 있음 | V10 홈런/만루홈런에 한정한 별도 모달 레이어. 기존 경기장 및 정적 홈런 결과 유지. |
| 입력/제스처 | 있음 | 재생 중 다음 행동 잠금, 건너뛰기/Escape와 포커스 격리. 종료/오류 시 한 번만 복귀. |
| 게임 규칙/밸런스 | 없음 | 엔진 판정·HP·카드 소비·점수와 원래 persist 순서는 그대로. 미디어만 별도 잠금. |
| 저장/불러오기 | 확인 필요 | 판정 저장은 기존 한 번, 미디어 상태는 저장 안 함. 재접속에 컷신 재발동 없음. |
| 모바일 뷰포트 | 있음 | 세로 원본을 object-fit:contain으로 표시, safe-area 버튼, 가로/PC는 기존 프레임 계약. |
| 스크롤/overflow | 없음 | body/html/#root 스타일 변경 없음. 컷신 로컬 컨테이너만 격리. |
| 기존 흐름 | 있음 | 일반 FX 타이머는 연장하지 않음. 미디어 종료 후 기존 결과→다음 타자/보상/시설 흐름. |
| 테스트/회귀 | 있음 | 미디어 생명주기와 실제 App 홈런 입력·저장·다음 행동 회귀 추가, 전체 테스트/smoke. |
| 빌드/배포 | 있음 | MP4 URL만 참조, preload:none로 초기 다운로드 제한, base 경로·50MB 배포 예산 확인. |

원격 인증 계정과 대상 저장소는 `jbseo-commits`로 확인했다. 구현·검수·작업 브랜치와 PR까지 진행하며 main은 직접 변경하지 않는다.

## 예정된 검증

- 홈런/만루홈런 입력 뒤 재생 중 다음 행동 잠금 및 중복 저장 없음
- ended/건너뛰기/오류/자동재생 차단/정체에 따른 복귀
- 모션 감소에서는 기존 짧은 정적 결과, 소리 기본 OFF 및 ON 준수
- 타이틀/지도/전투/보상/시설/저장 복원 회귀
- 모바일 세로/작은 세로/가로·PC 프레임과 회전
- 전체 테스트, zone smoke, production build, shipped-size budget
- 작업 브랜치 프리뷰에서 영상 로드·재생·복귀

검증 결과는 실제 실행 후 이 문서에 기록한다.

## 실제 검증 결과 (2026-10-09)

- 전체: 150 files / 908 tests 통과. 직접 관련 전투 포함 42개.
- 최초 main efff947에서도 동일한 기존 실패 5개 재현; V2의 실제 22/15 trail 및 contact ::after 계약으로 테스트 정정. 타이틀 한정 CSS 마지막 로드 복원. 별도 reviewer 승인, 시각/게임 규칙 변경 없음.
- zone smoke 10 seeds 통과; production build 통과; clean dist 49.6MB / 50MB. 새 npm 의존성 없음.
- 원격 영상: immutable media commit 1b207e16d25b62412467ffe26ea5830e5a170485, 8,556,734 bytes. HTTP200 및 브라우저 range206 확인. 초기 로딩30초, 재생 시작 후 정체8초, 총45초 상한 및 언제든 건너뛰기.
- 실제 Chromium 390×844: 원격 미디어 currentTime1.020488, duration14, readyState4, mutedtrue. 모의 media가 아닌 실제 H264 디코딩/재생.
- 실제 App 저장 fixture로 홈런 타격 → 원격 영상 재생 → 건너뛰기 → 다음 타자; skip 저장 변경 없음, phasebattle, root.inertfalse 확인.
- GitHub Pages branch preview 배포 성공. PR#21 생성; GitHub 전체 테스트/smoke/build/50MB와 영향도 CI 통과(초기907 테스트 커밋). 추가 로딩 회귀는 로컬908 전체 통과 후 재검사.
- 프리뷰: https://jbseo-commits.github.io/9-baseball/previews/codex-homer-video-20261009/ ; 컷신만보기 ?showcase=homer-video

스트리밍 트레이드오프: 초기 게임 다운로드에8MB 영상을 포함하지 않으며 홈런 때 네트워크 접근이 필요하다. 오프라인/오류에서는 기존 판정과 저장을 유지하고 경기로 복귀한다.
