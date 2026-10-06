# Home Run Cutscene V2 — Impact Analysis

## Goal
홈런 판정 직후 기존 경기 UI 위에 큰 카드가 얹히는 구조를, `contact → world suppression → hero art takeover → HOME RUN payoff → result recovery`의 단일 시네마틱 시퀀스로 재구성한다. 제공된 모바일 캡처에서 보이는 실제 타자/9ZONE/HUD/결과 패널과 홈런 아트의 중복 노출을 제거하는 것이 1차 목표다.

## 9-axis impact analysis
1. UI/layout — **영향 있음**. 홈런 컷신 동안 battle world/HUD를 일시 억제하고 hero layer를 최상위로 승격한다. 기존 actor geometry 자체는 바꾸지 않는다.
2. Input/gestures — **영향 있음**. 컷신의 짧은 takeover 동안 중복 입력을 막고 recovery 후 기존 결과 흐름으로 돌려보낸다.
3. Game logic/balance — **영향 없음**. 홈런 판정, 피해량, HP, 카드 결과는 변경하지 않는다.
4. Save/load — **영향 없음**. `9zone-v10-run` schema와 저장 데이터는 건드리지 않는다.
5. Mobile viewport — **영향 있음**. 412×743을 우선으로 하고 844×390 / 1440×900에서도 hero art crop과 타이포가 안전해야 한다.
6. Scroll/overflow — **영향 있음**. takeover layer가 문서 높이를 늘리거나 결과 화면 스크롤 위치를 밀지 않도록 absolute/scene-contained 방식으로 제한한다.
7. Existing user flow — **영향 있음**. 홈런 결과의 시각적 순서만 바꾸며 `판정 → 결과 → 다음 타자` 흐름은 유지한다.
8. Tests/regression — **영향 있음**. 홈런일 때만 world suppression/hero takeover가 켜지고 일반 안타·파울·미스에는 누출되지 않는 회귀 테스트를 추가한다.
9. Build/deploy — **확인 필요**. 기존 홈런 아트를 재사용하고 새 대형 에셋은 추가하지 않는 것을 원칙으로 한다. PR Verify/build/Pages preview로 검증한다.

## Visual contract
- 홈런 순간에는 실제 타자, 9ZONE, 주자 다이아, 투수 HUD가 hero art와 경쟁하지 않는다.
- 홈런 아트는 작은 결과 카드가 아니라 scene takeover다.
- `HOME RUN` payoff는 contact보다 먼저 나오지 않는다.
- 컷신이 끝난 뒤에만 기존 PLAN / ACTUAL / NEXT 결과 정보가 읽기의 주도권을 가진다.
- reduced-motion에서는 확대/카메라 이동을 줄이되 정보 순서는 유지한다.

## Non-goals
- 홈런 확률/피해량 변경
- 타자/투수 원본 좌표 재설계
- 일반 안타/파울/미스 결과 연출 재설계
- 신규 이미지 에셋 제작

## Verification gate
- 홈런: 중복 타자/9ZONE/HUD가 hero art 뒤에서 보이지 않음
- 홈런 종료 후 결과 UI 정상 복귀
- 비홈런 결과에 takeover 스타일이 누출되지 않음
- portrait 412×743, landscape 844×390, desktop 1440×900 확인
- 관련 테스트 + 전체 test + build + zone-report
