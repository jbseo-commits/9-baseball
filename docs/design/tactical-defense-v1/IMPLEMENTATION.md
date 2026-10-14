# 수비 실험 A 구현 기록 (tactical-defense-v1, 실험 구현)

2026-10-14 · 브랜치 `codex/commercial-battle-info` (로컬) · 버전 A-v1.
본 문서는 구현 세션의 실행 기록이다. 게임플레이 검증 자료가 아니며,
재미·상업적 성공을 주장하지 않는다. 사람 플레이 평가는 미확인.

## 바꾼 것 (실험 A만, B/C 없음)

- `src/duel/defense-stance.js` (신규): 12종 명시 성향표, 전이표·공간표·희생 4조건·원인 문구. 순수 함수.
- `src/duel/engine.js`: `playV10Action(state,action,opts={})` 3번째 인자,
  `playCard→resolve`로 defense 전달, `resolveDefensePlan` 기록, `lastCombat.defense`
  첨부(카드 액션+ctx 있을 때만). `resolve` 추가 진루는 후퇴 직접 안타에만 +1.
- `src/duel/pitcher-hp.js`: `applyPitcherOutcome`에 `defenseDelta`/`preDefenseDamage`
  추가. 동일 1회 적용 안에서 `max(1, D0+delta)` 계산. 미사용 시 기존과 바이트 동일.
- `src/duel/DefenseExperiment.jsx` + `defense-experiment.css` (신규):
  DEV 전용 분리 셸. 메모리 상태, `?experiment=defense-v1&case=&deck=&seed=&pending=&off=`,
  단일 진단 경기, 즉시 판정(연출 없음), 종료 패널(원인·예약·이력), 다시 시작.
- `src/duel/defense-cases.js` (신규): P/L/S 비교 덱, D1–D8 진단 상태(실제 9장·실제 ID).
- `src/duel/BallparkBattle.jsx`: `storage`·`defenseView` 선택 prop만 추가.
  없음 = 기존 UI와 0 변화. 수비 칩+마커(절대배치·비인터랙티브), 카드 효과행,
  요약 조건부 반응, 결과 다음-수비행.
- `src/main.jsx`: DEV 전용 lazy 진입. 프로덕션 빌드에서 진입 분기 전체 제거됨 확인.
- `src/duel/card-face.js`: 에너지 문제 얼굴 문구 `에너지 부족` 단축 (합계는 요약 영역).
- CSS: verbs 80px 고정(터치 유지, 명시도 주석), 손패 176px, reduced-motion 마커 정지.

## 바꾸지 않은 것

엔진 추첨·타구 종류·커버 안타 보장·카드 효과·아웃/승리 규칙·저장 스키마·키,
기존 화면/입력/제스처, `battle-readability.css`, hybrid/selective 실험.
B(아웃 이월)·C(시작 상황) 코드 없음 (`DEFENSE_VERSION='A-v1'` 고정).

## 검증 (이번 세션 실행분만)

- 신규 40: `defense-stance` 13, `defense-experiment` 17(D1–D8·parity·은폐),
  `defense-shell` 10(격리·게이트·진단·플레이).
- 전체 174파일/1054테스트 통과. smoke 3종·build·dist 55.9/60MB 통과.
- 실브라우저: `qa-defense` 15/15, `qa-shots` 18/18(본편 영향 없음).
- 카드 예산 실측: 최장(tableSetter) 포함 전 종 168px 내장, 그림 64 고정.
- 프로덕션 게이트: 빌드 산출물에 진입 문자열 없음, 실험 청크 분리·미참조.

## 알려진 실패·미확인

- 동일 행동 관측 시 실패로 기록하는 건 사람 평가에서 (NEEDS_HUMAN).
- NEEDS_HUMAN: 실기기 회전·롱프레스 전 조합·작은 높이 바·360px,
  보상→시설→다음 경로 수동 완주, P/L/S 사람 플레이(상업 합격 6항),
  별도 reviewer 에이전트에 의한 독립 검토(본 환경 미제공으로 self-review로 대체).
- D-case 에너지: 엔진 자연값 사용 (D1 명세 에너지 3과 일치).
