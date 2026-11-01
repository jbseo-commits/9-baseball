# C05 통합 프리뷰 영향도 분석 — 2026-10-28

기준 d7ac2b5, PR #65가 feat/mockup-battle-v1에 반영됨을 확인. 독립 reviewer와 explorer의 읽기 전용 사전 검토를 반영했다. 편집자는 Codex 한 명.

| 축 | 영향 | 대응 |
|---|---|---|
| UI/레이아웃 | 있음 | 새 BattleView를 기존 BallparkBattle controller에서 선택. 새 root만 CSS 적용. 승인 없는 상대는 기존 View 전체를 스크롤 가능한 패널에 유지. |
| 입력/제스처 | 있음 | 기존 카드/지원/실행 콜백 재사용. 새 손패 ref로 정보창 scroll/focus 복원. 지원 대기 재탭 취소. 9존 터치 슬라이드 유지. |
| 게임 로직/밸런스 | 없음 | engine/cards 계산 불변. 엔진 함수를 그대로 호출하고 같은 seed/action 결과 비교. |
| 저장/불러오기 | 확인 필요 | App 저장 소유권 유지, fixture는 별도 메모리 전용 route. 실제 이어하기 회귀. schema 불변. |
| 모바일 뷰포트 | 있음 | battleUi=vnext에서만 iframe/회전 힌트 우회. resize가 App를 재마운트하지 않음. 1440/844/667/390/320 검증. |
| 스크롤/오버플로 | 있음 | 새 전투 root 내부만 제약. fallback/비전투 화면은 문서 스크롤 허용. 작은 높이는 필수 컨트롤을 자르지 않음. |
| 기존 플로우 | 확인 필요 | 기본 query 없는 경로 보존. 첫 연습/방어 실험은 기존 controller/View 유지. 지도/보상/시설/전환 회귀. |
| 테스트/회귀 | 있음 | query 격리, 지원 취소, 실행/준비/정보창/타이머/resize, 저장 및 실제 브라우저 검사. |
| 빌드/배포 | 있음 | fixture lazy import, 불필요 sample atlas import 분리. build와 dist 60MiB 상한 확인. 별도 branch/PR까지만 게시. |

## 범위 및 인수 제한

actor-coverage approvedArtIds=[]를 변경하지 않는다. SAMPLE_ACTORS는 명시된 메모리 검수 화면에서만 허용. 실제 상대가 새 Scene에서 플레이되는 G1은 승인된 artId 연결 전까지 미완료다. first practice의 별도 학습 controller를 이번에 복제하거나 교체하지 않는다. 정지 포즈를 완성 모션으로 보고하지 않는다.

## 위험과 완화

- landscape fallback은 폭만 줄여도 portrait media가 적용되지 않는다. 명시적 root 규칙과 최소 높이/문서 scroll로 입력을 보존하고 실 캡처로 확인한다.
- controller hook 이전 조건 반환 금지, 두 View 동시 마운트 금지. auto-next/commitBeat/FX/state/save 시점 유지.
- inspector는 inert Scene 밖에 유지, 타이머 pause 및 실제 정보 등급 보존.
- legacy JS landscapeMedia는 계속 inert; query bypass와 함께 부활시키지 않는다.
- 완성 여부는 실행 증거로 기록하고 미실행 항목을 구별한다.
