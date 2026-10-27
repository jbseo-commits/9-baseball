# C00 — 최신 기준과 작업 환경 고정

담당: Codex 통합자. 선행 없음. 산출물은 최신 기준과 재현 가능한 작업 브랜치다. 이 티켓에서 UI를 구현하지 않는다.

읽기: PLAN, CONTRACTS, 저장소 AGENTS, 현재 관련 HANDOFF, docs/MODEL-ROUTING, 실제 main의 main/App/BallparkBattle/layout-mode/PortraitFrame, PR 검증 workflow.

## 수행

1. origin, 최신 main SHA, 현재 branch/dirty 상태, 다른 PC/세션의 편집 여부를 확인한다. 기존 작업은 보존하고 별도 worktree에 `feat/mockup-battle-v1`을 만든다.
2. 계획 기준 f3ec4be와 최신 main의 관련 변경을 비교한다. PLAN/계약에서 바뀐 파일·규칙만 갱신한다.
3. 새 작업 환경에서 현행 테스트/스모크/빌드의 baseline을 기록한다. 기존 실패를 새 작업의 성공처럼 지우지 않는다.
4. 실제 본편 PC·844×390·390×844에서 타이틀/전투/결과/회전 정책을 캡처한다. 저장은 별도 브라우저 context로 격리한다.
5. 신규 파일 경로·공통 파일 소유권·preview 이름을 고정한다. 제안 URL query는 `?battleUi=vnext`; 충돌하면 한 번 변경해 전 문서에 반영한다.
6. 원화 4개·선정 캡처의 해시를 확인한다. WORKLOG에 BASE_SHA, 첫 담당, 기준 실패, 9축 영향을 기록한다.

허용: 이 계획 문서/작업 기록, 별도 브랜치·작업 폴더 준비. 금지: 기존 작업 reset, 엔진·카드·세이브 변경, 이 단계의 main 게시.

인수: C01 담당이 같은 SHA와 경로로 시작할 수 있다. 링크만 열어 놓거나 README만 읽고 검증했다고 하지 않는다.
