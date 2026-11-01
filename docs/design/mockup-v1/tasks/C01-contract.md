# C01 — 표시 모델과 기존 상태 경계

담당: Claude Code. 선행 C00. 목표: UI 작업들이 동일한 데이터를 사용하고 엔진을 중복 구현하지 않게 한다.

읽기: PLAN/CONTRACTS, App/BallparkBattle, SwingForecast, card-face, information, energy, v10-storage, 관련 기존 테스트.

**허용 파일**: `src/duel/battle-vnext/view-model.js`, `fixtures.js`, `README.md`, `tests/battle-vnext-model.test.js`, 계약 문서의 실제 API 보정. 공통 파일은 수정하지 않는다.

## 구현

- 기존 계산·콜백·commit/자동진행 소유 위치를 정리한다. 공개 selector에서 얻은 값과 기존 UI snapshot을 새 view model에 매핑한다.
- 상태 변경 없는 함수로 구성한다. 카드 목록과 모든 결과 규칙을 새로운 테이블로 복제하지 않는다.
- 무선택/공격/준비/지원 대기/비용 부족/잠금/결과/정보창을 표현한다.
- 읽기 0/I/II, 준비 사용 전후, 현재/다음 에너지, 안타/희생타 조건을 분리한다.
- test fixture는 본편 엔진으로 만들어 고정 seed·actions를 기록한다. 일반 본 런과 방어 실험 규칙을 구별한다. 표시 fixture가 생산 세이브를 쓰지 않게 한다.
- C02–C04에 넘길 export·필드·콜백 의미를 README/CONTRACTS에 확정한다. 사용되지 않는 범용 상태관리 프레임워크를 추가하지 않는다.

## 인수

- 읽기 하위 단계의 숨은 정답/정확확률이 view model에 섞이지 않는 회귀 검사가 있다.
- 선택/지원/에너지/피해 조건이 실제 selector 값과 일치하고 원본 state를 변형하지 않는다.
- 실제 알려진 행동 callback을 그대로 연결할 수 있다. `onExecute` 같은 새 이름을 쓰면 기존 onSwing/onTake 매핑이 명시돼 있다.
- 관련 Vitest 명령·결과와 금지 파일 미수정 diff를 제공한다. 이 단계는 시각 통과가 아니다.

Claude 전달 문구: “C01만 구현해. 본편 엔진/세이브는 유지하고 표시 계약·fixture·정보 경계 회귀를 만들어. 완료 후 C02를 시작하지 말고 WORKLOG로 넘겨.”
