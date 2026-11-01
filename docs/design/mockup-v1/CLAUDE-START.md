# Claude Code 시작 지시문

이 패키지를 다른 PC에 전달할 때는 ZIP 전체를 사용한다. GitHub에서는 이 브랜치의 `docs/design/mockup-v1/` 전체를 checkout해도 된다. 파일 하나만 전달하면 선정 원화·실제 캡처·계약이 빠진다. 저장소에서 사용할 권장 위치는 `docs/design/mockup-v1/`이다. 런타임에서 이 문서 폴더를 import하지 않는다.

## 처음 붙여넣을 내용

```text
jbseo-commits/9-baseball의 현재 가로 목업을 본편에 구현할 준비를 해줘.
전달한 패키지의 PLAN.md, CONTRACTS.md, CLAUDE-START.md와 현재 저장소의
AGENTS.md, docs/MODEL-ROUTING.md를 먼저 읽어.

이번 세션 범위는 C00의 기준 확인과 C01 한 티켓이야.
C00 기록이 이미 있다면 BASE_SHA와 현재 HEAD를 대조하고 재사용해.
준비가 끝났다는 말로 멈추지 말고, 충돌이 없으면 C01 구현과 관련 검증까지 해줘.
나머지 티켓·main 병합·배포·밸런스 변경은 자동으로 시작하지 마.

시각 기준은 reference/shots/phone.png와 desktop.png,
선정 자산은 PACKAGE-MANIFEST.json에 적힌 4개야.
손패는 항상 보이고 에너지는 그 바로 위에 있어야 해.
본편의 단일 행동 버튼과 읽기 단계별 공개 정보·기존 엔진·세이브를 유지해.
목업의 별도 엔진과 두 행동 버튼을 복사하지 마.

한 번에 편집 담당은 한 명이야. C01 허용 파일만 수정하고,
App.jsx, BallparkBattle.jsx, main.jsx, 전역 CSS/방향 정책은 통합자에게 연결 메모로 넘겨.
새 API는 CONTRACTS.md의 제안을 실제 코드에 맞춰 확정하고,
순수 표시 변환과 기존 상태/콜백 소유권을 분리해.

완료하면 WORKLOG.md 양식으로 BASE_SHA/HEAD_SHA/파일/실제 실행 결과/
미실행 항목/캡처 또는 증거/남은 결함/다음 담당을 남겨줘.
현재 도구로 실행하지 않은 테스트나 화면 검수는 PASS라고 쓰지 마.
```

C00을 Codex가 이미 마쳤다면 “이번 범위는 C01”로 줄여 전달한다. 스킬·계정·원격 권한을 매 티켓마다 다시 묻지 않고 기존 확인을 재사용한다. 필요한 입력이 실제로 빠졌을 때만 구체적인 차단 지점을 보고한다.

## 작업 브랜치 준비 예시 — C00 담당만 실행

먼저 실제 origin과 dirty 상태·동시 편집 여부를 확인한다. 기존 작업 브랜치를 reset/checkout으로 덮어쓰지 않는다. 새 경로·브랜치가 아직 없는 경우의 예시:

```bash
git fetch origin main
git rev-parse origin/main
git worktree add -b feat/mockup-battle-v1 ../9-baseball-mockup-v1 origin/main
```

새 작업 폴더에서 패키지를 `docs/design/mockup-v1/`에 두고 실제 BASE_SHA를 기록한다. main이 이 계획의 기준보다 새로우면 관련 파일 차이를 읽고 계약을 갱신한다. 계정·권한·홈 설정을 임의로 변경하지 않는다. 본 패키지 작성 시에는 위 브랜치를 생성하거나 원격 쓰기를 실행하지 않았다.

## 다음 티켓을 맡기는 짧은 양식

```text
9ZONE 목업 이식의 [C03]을 진행해줘.
기준은 WORKLOG의 [BASE_SHA] 및 직전 인수 [HEAD_SHA]야.
PLAN/CONTRACTS와 tasks/C03-hand.md를 읽고 허용 파일만 수정해.
이번 편집 담당은 Claude이며 Codex는 읽기 전용 리뷰만 할 거야.
화면 미감은 선정 캡처를 유지하고, 명시된 검증을 실행해.
다른 티켓으로 범위를 넓히지 말고 완료 보고를 WORKLOG 양식으로 남겨줘.
```

실제 SHA를 채운 뒤 전달한다. `[HEAD_SHA]` 같은 미정 문자열을 실제 커밋으로 보고하지 않는다.

## 교대와 리뷰

1. 현재 편집자가 작업을 종료하고 커밋 SHA·증거를 전달한다. 미커밋 변경이 있으면 파일과 이유를 먼저 기록한다.
2. 인수자는 해당 SHA의 diff를 읽고 관련 계약을 확인한다. 다른 PC에서는 실제 원격 게시가 이뤄진 뒤 fetch하며, 게시 전이면 patch/묶음을 전달받는다.
3. 공통 파일 소유권은 `Codex → Claude(C05만) → Codex`처럼 WORKLOG에 기록한다. 두 에이전트가 동시에 통합하지 않는다.
4. 리뷰는 같은 결함 목록에 이어서 진행한다. 통과한 검증은 이후 변경이 영향을 주지 않으면 불필요하게 반복하지 않는다.
5. PR/프리뷰 게시가 맡겨진 경우 저장소 PR 템플릿의 영향도 항목을 채우고 정확한 build SHA를 남긴다. 이 계획서만으로 실제 게시·main 병합이 완료된 것은 아니다.

본 계획 작성 단계에서 원격 쓰기나 main 병합은 수행하지 않았다. 구현 세션은 그때의 사용자 지시와 기존 승인 범위를 따른다.
