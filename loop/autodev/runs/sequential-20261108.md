# Sequential polish — 2026-11-08 KST

- 기준 main:567ab65add1b19feb62be477062e31cc68fcaaf5 (PR86 카드 여러장 배치복구 포함).
- 작업브랜치:codex/sequential-polish-20261108, 기존 checkout 재사용. root 단일 편집자, 독립 읽기/검수 위임 최대3명.
- 사용자 지시: 제시한5개 항목을 “순차적으로 개선해줘”. 첫플레이UX→2배속검수→동작연속성→전략/리플레이→카드아트/용량 순서.
- 기존 사용자 원격/메인병합/공개배포 승인 재사용. GitHub jbseo-commits/9-baseball, forcepush없음.
- 실행 시작:2026-11-08 19:19 KST. 기본6회차/120분, 종료기한21:19 KST. 실제 작업/검수/대기 모두 포함. 예산 내에서 각 범주의 구체적 개선을 완성하고 사람검증/52종 전체/65장 전체와 기술완료를 구분한다.
- 범위: 현재 규칙에 맞춘 표시/입력/정보공개/연출/기존성인캐릭터연결포즈/기믹학습/리소스 최적화. 엔진확률·비용·피해·세이브·세계관 변경없음. 새로운 유료서비스/패키지/예약작업 없음.
- 가로전용 개발이라는 사용자 지시가 문서의 옛 세로전용 문구보다 우선한다. 기존 회전가드/진행보존은 검사한다.

## 순서 / 현재 상태

| 회차 | 목표 | 상태 | 검증 게이트 |
| --- | --- | --- | --- |
|1a|#77·#76 투구중 정보공개 경계|PR87 main2d45f88 병합·배포·공개PASS|기본연습·시작덱·접촉전손패/에너지/타자 비공개, PR86탭스택 유지|
|1b|#78·#75 가로 연습·시작덱 첫진입|로컬검증완료·독립검수PASS|667×375·844×390 실제 기본 진입, 텍스트/버튼·스크롤 검수|
|2|2배속 카드삽입·투구·결과 읽힘과 입력/취소 검수 후 실제결함수정|대기|동일행동 타임라인/실제영상/중복입력·무음·reduced 비교|
|3|동작연속성의 가장 큰 키포즈 결손 보강|대기|image_gen 전체포즈 작화, 원형/손잡이/발/공 이벤트, blind+실플검수. 120tick과고유그림 구분|
|4|20명 기믹과 판단 차이를 분석하고 학습/공략 피드백 개선|대기|공개정보만 쓰는 동일seed정책비교, 기믹정보경계·규칙불변. 사람재미 검증은 별도|
|5|카드아트/용량의 실제 병목 해결|대기|실제 import/사용파일, byte/시각동일성, dist<60MB, 누락카드아트는 채택분만 완료 표시|

## 현재 검수 역할

- sequential_pr_audit: readonly explorer gpt-6-luna/high, PR75–78 변경/충돌 조사.
- sequential_asset_audit: readonly explorer gpt-6-luna/high, 자산사용/용량 조사.
- sequential_plan_review: readonly independent reviewer gpt-6.1-sol/high, 계획/반복실패/완료 검수.
- root: 근거·영향도·단일구현·통합·실제재생/허용게시. 다른 agent의 제품 편집없음.

## 1a 구현 전 9축 영향도 (10:28 UTC)

1. UI/레이아웃 영향 있음: flight 손패/더미는 pre-action 공개 스냅샷, impact 이후 실제 엔진 표시. 수량 미확인 시 —.
2. 입력 영향 있음: flight 카드 비활성 유지, PR86 다중 탭 배치/명시 메인교체 회귀검사.
3. 게임로직 영향 없음: engine/cards 미수정; 실제 결과·소모 동일 비교.
4. 저장 영향 없음: transient execution만 확장, save schema 미수정; reload/resume 검수.
5. 뷰포트 영향 있음: 작은 가로 손패 카운트/라벨 실제 확인; 회전 가드 보존.
6. 스크롤 영향 없음: CSS·전역 overflow 미수정, 경로/시설 검수.
7. 플로우 영향 있음: 결과·삼진·볼넷·강판·준비의 next 안내 구별, 정상 런→보상→시설 검수.
8. 테스트 영향 있음: PR77·76 기존 재현 테스트 먼저 실행, 현재 multi-card 기대 조정은 impact 전까지 보존하는 계약만.
9. 빌드/배포 영향 있음: 전체 테스트·zone smoke·build·60MiB 체크 후 독립 PR/main/public 재생.

1a 검증: docs/qa/sequential-polish-20261108/round1a.md 및 JSON. 최종238파일1617PASS, build/budget/smokePASS, Chromium 정상런·회전·시설·다중배치PASS. partial-hand 검수 보강1회(누적 수정1/3).

## 1b 구현 전 9축 영향도

1. UI 영향 있음: practice data-lesson+landscape에만2열, 시작팩3열·선택9장 별도영역. safe-area 고려.
2. 입력 영향 있음: 버튼/9존44px이상·hit-test·스크롤 제스처 실제 확인.
3. 규칙 영향 없음: 카드/연습 판정·덱구성 함수 변경없음.
4. 저장 영향 확인 필요: 새런 생성 시점·기존런 연습 취소/완료 보존을 검사.
5. 뷰포트 영향 있음:667×375·844×390·844×300·1366×768, 회전가드 확인.
6. 스크롤 영향 있음: lesson만fixedheight,설명dock 내부scroll, 시작팩짧은높이문서scroll; 전역CSS 없음.
7. 플로우 영향 있음: title→practice3단계→packs→map→battle및취소.
8. 테스트 영향 있음: 기존75 UI테스트 이식; 실패한가로QA(640px>375px)를 같은조건재실행.
9. 배포 영향 있음:CSS·JS소량, assets경로변경없음; fullsuite/smoke/build/budget후독립PR.

1b 수정누적2/3:300px선택후제목잘림·덱마지막줄잘림보강. 첫play blindIMPROVED2.88→3.19,BAR_NOT_MET.독립root외판정/코드검수완료.
