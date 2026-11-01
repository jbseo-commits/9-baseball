# C05 부분 통합 검증 — 2026-10-28

기준 d7ac2b5, 작업 브랜치 codex/mockup-v1-c05-integration. 브라우저는 실제 Chromium + Playwright, Vite dev localhost:5212. 사용자 기기의 실제 플레이 테스트가 아니다.

## 실행 결과

- 전체 Vitest: **200 files / 1,339 tests 통과**, exit 0 (`tests-full.txt`). 마지막 최근 결과 해제 보완 후 통합 회귀 **14/14 재확인**, exit 0 (`tests-final-targeted.txt`).
- production build + check:dist: exit 0 (`build.txt`). **62,402,147 B / 59.5113 MiB**, 60 MiB 상한까지 512,413 B 여유 (`build-budget.json`). 큰 기존 chunk 경고는 남음.
- 배경·타자·투수 WebP 3개가 실제 dist에 emit됨. 미사용 sample cards atlas(426,520 B)는 emit되지 않음. 단순 lazy 렌더가 아닌 import 경계 분리로 제외했다.
- zone-report 10: exit 0. 엔진 규칙을 변경하지 않은 smoke simulation이며 사람의 재미 입증이 아니다.

## 실제 브라우저 검증

`smoke.json`:

- 동일 초기 state(seed 20261027, a1-entry)를 기존 기본 화면(390×844)과 vnext 실제 App fallback(844×390)에 저장/이어하기로 로드했다.
- 준비 간파 사용 → 실제 지켜보기의 저장 상태를 **전체 객체로 대조해 정확히 일치**했다. 준비는 0구/에너지 1, 이후 실제 공 1구, 다음 공 보상 포함 에너지 3.
- 결과 후 정보창을 열고 1.25초 기다려도 저장 상태가 변하지 않았다. 닫으면 기존 자동 다음 공이 진행됐다.
- query 경로에서 844→390→844 resize 후 선택과 저장 상태가 유지됐다. iframe 0, coarse-pointer 회전 overlay 없음.
- reload 후 이어하기의 상태가 일치했다.
- 메모리 sandbox에서 생산 저장 key에 sentinel을 둔 후 준비/지켜보기/자동 다음 공을 실행해도 sentinel이 유지됐다.
- pageerror 0.

`noncombat.json`:

- 실제 엔진 상태를 seed로 생성해 map/reward/locker를 844×390, 390×844, 320×568에서 로드했다. reward는 검증용 HP1 수정 후 실제 타격 판정으로 생성한 진단 상태이며 정상 난이도 플레이 결과는 아니다.
- 지도 입장 → 전투, 보상 건너뛰기 → 다음 지도 정상. 모든 화면 html/body overflow-y auto, 문서 폭=viewport, 회전 overlay 없음, pageerror 0.
- 전투 root 제약이 비전투 화면에 누출되지 않았다.

## 캡처와 시각 판단

- `vnext-1440.jpg`, `vnext-844.jpg`, `vnext-667.jpg`, `vnext-390.jpg`, `vnext-320.jpg`: 실제 fixture + 기존 컨트롤러가 조합된 새 View. 선택된 fixture는 지켜보기 후 에너지 3인 메인+지원 상태다(기본 에너지 2를 바꾼 것이 아님).
- 844/667: 에너지는 손패 바로 위, 9존·예측·행동은 오른쪽. 카메라는 field/배우를 한 world로 이동하여 투수 전체가 손패 위에서 읽힌다. 타자의 하체는 전경 손패에 일부 가려진다.
- 390/320: 같은 DOM 재배치, 배우가 보이는 구장과 손패·2열 결정 패널. 세로 스크롤을 허용하며 손패는 가로 스크롤한다. 320에서는 손패 헤더가 두 줄이라 밀도가 남는다.
- `default-after-next.jpg` / `vnext-after-next.jpg`: 실제 App의 기존 화면과 새 query의 전체 legacy fallback.
- `sandbox-after-next.jpg`: 메모리 sandbox 실제 다음 공.
- map/reward/locker-{844,390,320}.jpg: 비전투 실 캡처.
- `viewports.json`: 캡처 당시 rect/overflow/pageerror 측정.

시각 판단: 새 정지 원화 조합과 조작 배치는 검토 가능. 상업 품질·완성 모션·사용자 이해도 PASS 판정은 하지 않는다. 정지 배우, 기존 kind별 카드 원화, 작은 화면의 가로/세로 스크롤이 남아 있다.

## 독립 검수

읽기 전용 explorer(gpt-6-luna/high)와 reviewer(gpt-6.1-sol/high)를 별도로 실행했다. reviewer는 사전 계획 및 최종 diff/테스트/캡처 근거를 확인했다. 지적된 fallback CSS 문법, 길게 누르기/키보드 설명 연결, 비행 중 정보창 우회, 최근 결과의 새 선택 후 해제를 수정했다. 최종 확인에서 추가 P1/P2 지적 없음. 독립 focused 실행도 통과했으며 전체 테스트와 혼합 집계하지 않는다.

## 미완료 및 미실행

- **C05/G1 미완료**: 승인된 실제 artId가 한 명도 없어 본편에서 새 Scene을 플레이한 검증은 아직 없다. 테스트의 가상 승인 seam과 메모리 샘플을 실제 로스터 연결로 간주하지 않는다.
- 첫 연습과 방어 실험은 기존 controller/View 유지. 첫 연습의 새 표시 부품 연결은 미실행.
- sandbox 진단 FX timing은 실제 App timeline과 다르다. 본편 timeline은 수정하지 않았다.
- 실제 기기/Safari, 사람의 첫30초 이해도·리플레이 재미, 전체 카드/유물/투수 확장 G4 검수 미실행.
- 브랜치/PR까지. main 병합·GitHub Pages 배포·배포 후 실 서비스 검증 없음. 기본 제품 UI를 교체한 완료 보고가 아니다.
