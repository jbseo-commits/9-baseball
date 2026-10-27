# 인수 기록

계획 패키지 작성 완료. C00 기준 확인(Claude, 축약)과 C01 구현 완료 — 아래 기록. C02–C08은 TODO.

기준 main: `f3ec4beef5b245e0e98696d3174d47b6a8b09005` (2026-10-27 조회).
문서 게시 브랜치: `docs/mockup-implementation-handoff-20261027`.
실제 게임 구현 브랜치: `feat/mockup-battle-v1` (로컬 작업 폴더 `9-baseball-mockup-v1`, 원격 미게시). 패키지 커밋 `bb409c0` 위에서 시작.

계획 검토: 독립 reviewer의 문서 검토를 수행했다. C08 착수/완료 의존성, 샘플 배우의 실제 artId 매핑과 기존 세로 View fallback, 첫 연습 파일 소유권, 전체 확장 후 재검증 조건을 반영했다. 이는 구현 테스트 통과 기록이 아니다.

| 티켓 | 상태 | 편집 담당 | HEAD_SHA | 검수/다음 단계 |
|---|---|---|---|---|
| C00 | 부분 (Claude) | Claude | `bb409c0` | SHA·브랜치·테스트 기준만. 본편 캡처·해시 확인은 미실행 |
| C01 | 구현·코드 검증 | Claude | `4457144` | Codex 독립 리뷰 → C03 |
| C02 | TODO | Claude | — | Scene |
| C03 | TODO | Claude | — | 손패 |
| C04 | TODO | Claude | — | 판단·결과 |
| C05 | TODO | Codex | — | 통합·G1 |
| C06 | TODO | Claude/아트 교대 | — | 모션·G2 |
| C07 | TODO | Claude 수정/Codex 검수 | — | G3 |
| C08 | TODO | Codex | — | 확장 상태·G4 |

## 매 인수에 복사하는 양식

```text
티켓:
기준 BASE_SHA / 직전 인수 SHA:
작업 브랜치 / HEAD_SHA:
실제 담당 모델 / effort:
편집 소유권: [누가] → [누가], 현재 미커밋 변경 유무:
변경 파일과 목적:
계약 변경 및 통합자에게 필요한 연결:
실행한 검사 / 명령 / exit code / 결과:
실제 브라우저 증거: URL / build SHA / seed / viewport / 파일:
미실행·차단 검증과 이유:
시각 검수: PASS/FAIL/BLOCKED, 구체적 결함:
코드·동작 검수: PASS/FAIL/BLOCKED, 구체적 결함:
남은 문제 / 다음 티켓 / 다음 담당:
PR / 프리뷰 / 배포 상태: 실제 존재하는 것만:
```

최종 판정은 보고 내용과 diff·스크린샷·실제 실행을 대조한다. 부정확한 완료/모델/테스트 기록을 만들지 않는다.

## C00 (축약) — 2026-10-27 · Claude

```text
티켓: C00 기준 확인 (사용자 지시로 Claude가 C01 착수 전 최소 범위만 수행)
기준 BASE_SHA / 직전 인수 SHA: main f3ec4beef5b245e0e98696d3174d47b6a8b09005 (2026-10-27 19시 fetch, 계획 기준과 같음) / 패키지 bb409c093fb27b83f30105d0642593e541eacb90 (PR #63)
작업 브랜치 / HEAD_SHA: feat/mockup-battle-v1 = git worktree ../9-baseball-mockup-v1, origin/docs/mockup-implementation-handoff-20261027 에서 분기 / bb409c0
실제 담당 모델 / effort: Claude Opus 5.5 (claude-opus-5-5), Claude Code 데스크톱 앱. effort 설정값은 이 세션에서 확인하지 않음
편집 소유권: 없음 → Claude. 기존 작업 폴더(9-baseball 등)는 건드리지 않음
변경 파일과 목적: 없음 (기준 확인만)
실행한 검사 / 명령 / exit code / 결과: pnpm install --frozen-lockfile → 0 · pnpm test → 0, 193 files / 1219 tests passed (bb409c0)
미실행·차단 검증과 이유: 본편 PC·844×390·390×844 캡처, 원화 4개·캡처 해시 대조, production build 기준치, 파일 경로·preview 이름(?battleUi=vnext) 확정 — 이번 범위 밖. Codex C00 담당이 보완
남은 문제 / 다음 담당: 위 미실행 항목은 Codex
```

## C01 — 2026-10-27 · Claude

```text
티켓: C01 표시 모델과 기존 상태 경계
기준 BASE_SHA / 직전 인수 SHA: f3ec4beef5b245e0e98696d3174d47b6a8b09005 / bb409c0
작업 브랜치 / HEAD_SHA: feat/mockup-battle-v1 / 4457144 (이 WORKLOG 갱신은 그 다음 커밋)
실제 담당 모델 / effort: Claude Opus 5.5 (claude-opus-5-5). advisor 도구 없음 → 상담 BLOCKED, 미실행. 서브에이전트 미사용
편집 소유권: Claude 단독 → 인수 후 Codex 리뷰. 미커밋 변경 없음
변경 파일과 목적:
  src/duel/battle-vnext/view-model.js  buildBattleViewModel 등 순수 표시 변환
  src/duel/battle-vnext/fixtures.js    본편 엔진 seed 20261027 + steps로 만든 15개 검수 상태
  src/duel/battle-vnext/README.md      확정 API·입출력 소유권·콜백 매핑·지금 코드와 다른 점
  tests/battle-vnext-model.test.js     정보 경계·selector 일치·불변·행동 매핑 회귀 30개
  docs/design/mockup-v1/CONTRACTS.md   §2 아래 C01 확정 API 링크와 이름 변경
  공통 파일(App.jsx, BallparkBattle.jsx, main.jsx, 전역 CSS, layout-mode, PortraitFrame) 미수정
계약 변경 및 통합자에게 필요한 연결:
  1) onExecute → input.callback(onTake|onSwing|onNext). onSwing은 컨테이너 commitSwing(지원 beat·준비 playUse)을 거친다
  2) 컨테이너 소유: armed·commitBeat·inspect·hoverZone/hoverSkill·lastSwing·autoNext 타이머·터치 슬라이드 (지금 BallparkBattle 로컬)
  3) 지원 코스 대기 중 실행 잠금(지금 본편은 대기 카드를 버리고 휘두름) + 대기 카드 재탭 해제 경로 필요
  4) BallparkBattle callOf·cellFace·bandFace를 view-model의 resultCall·zoneFace·bandFace import로 합치기
  5) 적중 수치는 forecast.chanceText 하나 (지금 요약줄 적중권은 속임수 이동 미반영이라 칩과 다를 수 있음)
  6) forecastFor가 SwingForecast.jsx에 있어 view-model이 JSX 모듈을 import함. 순수 모듈 이동은 통합자 판단
실행한 검사 / 명령 / exit code / 결과:
  pnpm exec vitest run tests/battle-vnext-model.test.js → 0, 30/30 passed
  pnpm test → 0, 194 files / 1249 tests passed (기준 193 / 1219 + 신규 1 / 30)
  pnpm build → 0 (500 kB 초과 chunk 경고. 기준 build는 실행하지 않아 이번 변경 전에도 있었는지 직접 비교하지 않음. 새 모듈은 런타임 import가 없고 dist JS에 battle-vnext 문자열 0건)
  pnpm run check:dist → 0, dist 58.6MB / 60MB
  git diff --stat bb409c0..4457144: 위 5개 파일만
실제 브라우저 증거: 없음 — C01은 런타임에 연결되지 않아 화면 변화가 없다
미실행·차단 검증과 이유: 시각 검수(이 단계 대상 아님) · AGENTS §3 화면 회귀 항목(런타임 무변경) · advisor 상담(도구 없음) · 독립 리뷰(Codex 몫)
시각 검수: 해당 없음 (PASS 아님)
코드·동작 검수: 자체 테스트 통과. 독립 검수 전이므로 최종 PASS 아님
남은 문제 / 다음 티켓 / 다음 담당: 위 연결 1–6은 C03–C05에서 처리. 다음 = Codex의 C01 읽기 전용 리뷰 → C03(Claude) 또는 A01 준비 시 C02
PR / 프리뷰 / 배포 상태: feat/mockup-battle-v1 로컬 커밋만. push·PR·프리뷰·main 병합 없음
```
