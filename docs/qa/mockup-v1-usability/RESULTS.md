# 가로 전투 사용성 검증 — 2026-10-28

기준 e1ff0db, PR #66 추가 개선. 사용자 지시 “세로는 생각하지마, 가로로 개선하고 완성하자”를 반영해 세로 전용 크기/toolbar 변경을 철회하고 가로를 대상으로 삼았다. 기존 세로 CSS는 다시 설계하지 않았다. 공유 행동 DOM 추출로 세로 표현이 일부 달라질 수 있으나 이번 인수 대상은 가로다.

## 변경 및 근거

- 오른쪽 command rail에서 설명 부분만 스크롤하고 같은 단일 행동은 형제 footer에 둔다. 1920×1080에서도 버튼이 화면 바닥으로 멀어지지 않고 현재 요약 바로 아래에 있다. 짧은 가로에서도 긴 설명 때문에 행동이 아래로 밀리지 않는다.
- 구장에 실제 결과 call/tag를 표시한다. 정확 적중은 “읽었다!”, 실제 near-miss grade는 “한 칸 차이”. 확률/판정/HP/소비에 새 보너스를 만들지 않았다. 착탄 전 공개 금지와 기존 타이머 유지.
- 시각 call은 aria-hidden이고 인과 해설·피해는 기존 rail 한 곳에서 읽는다. 결과 설명의 말줄임을 풀고, 짧은 가로에서는 비활성 결과 9존만 30px로 줄여 실제 이유 전체가 행동 위에 보이게 한다. 선택 중 44px 존 터치 높이는 보존한다.
- 지원/대기 표시가 키보드 포커스를 덮던 문제를 수정했다. 포커스는 3px 금색 outline, 대기 점멸과 구별된다.
- 실제 엔진으로 생성한 result-near fixture 추가. 선정 원화·scene geometry·engine·저장·본편 controller/FX timeline 무변경.

## 검사

- 전체 Vitest: **201 files / 1,345 passed**, exit0 (`tests-full.txt`). 새 사용성 회귀6개, 기존 표시 모델 기대 phase 표에 새 fixture 등록. 별도 모델/사용성 targeted38/38 (`tests-targeted.txt`).
- build + check:dist: exit0, **62,470,455B / 59.5765 MiB**, 60MiB 이하. 신규 이미지/패키지 없음. 기존 큰 chunk 경고 남음.
- zone-report10: exit0. 재미 입증과 구별한다.
- 독립 reviewer gpt-6.1-sol/high, 읽기 전용 diff/증거 검수 및 별도20개 통과. 최종 추가 P1/P2 없음. 별도20개를 전체 합계에 다시 더하지 않았다.

## 브라우저 — 가로 24개 조합

Chromium/Playwright 실제 렌더. `landscape-checks.json`: 667×375, 740×360, 844×390, 1024×768, 1440×900, 1920×1080 × support-stacked/result-hit/result-near/flight.

- 각 상태 단일 행동1개. 버튼 중앙 hit-test, 화면 안 bounds 통과, 가로 문서 overflow 없음.
- 실제 씬 image.decode() 및 actor image2개를 기다린 뒤 캡처. 초기 완료 플래그만 검사한 1440 조기 캡처에서 배우가 아직 안 칠해진 것을 독립 검수가 발견해 폐기/재캡처했다. 현재 모든 가로 증거는 decode+2rAF 이후다. actor-paint.json에1440 실제 world/배우 rect 및 visible/opacity1을 보관한다.
- 결과 spotlight는 HUD 아래/손패 위. actual call 및 실제 exact/near 차이 확인. 비행 중 spotlight 없음.
- 결과 설명 line-clamp none, 인과 해설 전체와 피해 줄이 행동 위에 들어온다.
- 선택된 지원 카드에 키보드로 돌아오면 포커스 outline3px/animation none. 메인/지원 계획은 유지된다.
- UI에만 긴 문구25줄을 넣은 synthetic stress에서 rail 내용이 스크롤돼도 단일 행동은 화면 안에 남는다. 엔진/실제 카드 데이터를 바꾼 플레이 결과는 아니다.
- pageerror0.

## Production 및 실제 입력

`production.json`: VITE_BASE=/9-baseball/previews/codex-mockup-v1-c05-integration/ production build를 localhost:5214에서 실행. asset/console 오류0, 실제 코스2 선택→타격→정확 적중→자동 다음 공, 단일 행동1개, 생산 저장 sentinel 보존 확인. reduced-motion은 animation none이며 실제 call은 그대로 표시된다. production-hit-844.jpg는 이 빌드의 실제 타격 결과다.

`smoke.json`: 기존 화면과 query fallback의 동일 seed 저장 전체 객체 일치, 준비/지켜보기/자동 다음 공, inspector pause/복귀, 이어하기 및 memory sandbox 저장 격리를 재확인했다. 이 검사는 기본 경로 회귀이며 세로 UI 개선 작업이 아니다.

## 캡처

- landscape-667/740/844/1024/1440/1920.jpg — 선택 중, 읽기0, 메인+지원. 지켜보기 보상 이후 에너지3 상태라서 기본 에너지2를 변경한 것이 아니다.
- result-hit-740/844/1440.jpg — 정확 적중.
- result-near-740/844/1440.jpg — 실제 한 칸 차이 실패·압박 피해.
- production-hit-844.jpg — prefix가 있는 실제 production build 조작 결과.

## 제한 / 다음

가로 정지 원화 프리뷰를 개선한 결과다. 실제 상대 원화 매핑은 여전히 approvedArtIds=[]이며 본편은 전체 기존 View fallback. 첫 연습 표시 이식/승인된 실제 배우 모션/실기기 Safari/사람의 이해도·재미 테스트는 미완료. C05 G1·C06 G2·상업 출시 완료를 주장하지 않는다. main 소스 변경·병합 없음. 기존 Pages workflow는 main을 루트에 재빌드하고 별도 branch preview만 새로 게시한다.
