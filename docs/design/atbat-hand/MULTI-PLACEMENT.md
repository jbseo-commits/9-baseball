# 2·3장 카드 배치와 조립 — 구현 전 영향도

2026-10-30(KST). 사용자 요청: 카드2개·3개를 존에 꽂는 실제 조합 흐름까지 구현. 기존 카드 비용/기본 에너지2/실제 엔진·저장/목업 구도는 유지한다.

| 축 | 판정 | 대응 |
| --- | --- | --- |
| UI/레이아웃 | 영향 있음 | 정착 조각은 현재 zones.pieces에서 파생. 메인/지원 순서색·겹침·실제 연결을 표시하고 작은 조합 tray로 개별 제거 제공. 임시 비행만 ID/seq별로 유한관리. |
| 입력/제스처 | 영향 있음 | 일반 카드 비교 tap의 메인교체 계약 유지. 카드→존 drag는 컨테이너에 명시적 배치 intent로 전달해 기존 메인에 추가/지원 재배치. 준비/기본/번트·stackcap·비용 부족은 기존 엔진 경계 유지. |
| 로직/밸런스 | 영향 없음 | 실제 v10ActionCost/v10StackMax와 supports별 aim을 사용. CONNECT는 zones.links의 ordered aim 연결이며 footprint 겹침을 성공으로 판정하지 않음. 지원은 coverage 보완, 고유 효과3중 발동 아님. |
| 저장/불러오기 | 영향 없음 | UI/효과 상태만 로컬. 신규 저장 필드 없음. 사용 시 실제 카드·에너지·투구·HP를 엔진과 대조. |
| 모바일 뷰포트 | 영향 있음 | 6개 가로 크기, 조합 tray는 기존 오른쪽 rail 안. 중앙존 이동/새 확인 단계 없음. rotate/resize 시 비행 취소, 현재 정착만 재측정. |
| 스크롤/오버플로 | 영향 있음 | 전역overflow 변경 없음. 실제 손패 scroll/drag 구분과 Inspector 복원 유지. |
| 기존 플로우 | 확인 필요 | 기본/vnext fallback, 준비·지켜보기·다음공·save/resume 및 경로/보상/시설 확인. |
| 테스트/회귀 | 영향 있음 | 실제energy2 두장, take→next energy3 세장(별개ID), own aims·겹침·LINK·제거재번호·메인재aim·빠른연속drop·한번실행·실제소비·mute/menu/rotation/phase취소. |
| 빌드/배포 | 영향 있음 | 원화 추가 없이 DOM/SVG, 60MiB·Pages base·공개 프리뷰 검증. |

## 구현 범위

- tap 지원 추가는 기존 카드 겹치기 모드 유지. 일반 tap을 조용히 추가 모드로 바꾸지 않는다. 직접 drag는 메인 존재 시 명시적으로 추가/지원 재배치하며, 불가 시 메인을 교체하지 않는다.
- 정착 overlay는 현재 모델을 진실로 삼고, 동시 비행은 카드별로 최대4개만 유지. 재선택/해제/제거/메뉴/회전/숨김/실행에 남은 비행과 예약 소리를 취소한다.
- 최종 조립은 기존720ms 스택 확정 구간만 사용한다. 새 지연이나 자동투구는 없다.
- 3장 검증 fixture는 seed3의 정상 스타터 손패와 실제 take→next 결과(energy3, place3장)를 쓴다. 기본 에너지나 카드 비용을 바꿔 연출하지 않는다.

## 실제 터치/레이아웃 회귀 보완

- Android형 터치 스트림에서 drag 직후 tap의 pointerdown/up은 오지만 호환 click이 생략되는 경우를 실제 Chromium으로 재현했다. 새 tray 추가/삭제는 유효 touch release에서 한 번 실행하고 이후 호환 click을 차단한다. 새 pointerdown/키보드는 즉시 다시 허용하며 이동/취소는 실행하지 않는다. 전역 gesture를 바꾸지 않는다.
- 조합 tray로 손패 높이가 줄면서 Inspector가 예측 영역을 감출 때 scrollTop이 clamp되는 사례를 확인했다. vnext의 Inspector 닫기는 DOM/layout 복귀 후 useLayoutEffect에서 저장 scroll을 복원하고 preventScroll focus를 돌려준다. 기존 본편 fallback 복원 경로는 그대로다.
- 제거된 card ID의 receipt는 렌더에서만 감추지 않고 부모 상태에서도 layout 시 정리한다. 같은 카드 즉시 재드롭 시 옛 seq/source/예약 음원을 다시 시작하지 않는다.

동일한 drag 직후 click 생략은 기존 해제/실행에도 재현되어 이 전투 UI의 해제와 BattleAction도 유효 touch release에서 실행하도록 연결했다. 실제 중복 실행 방지 ref는 유지하고, 준비 효과가 끝나 실행 버튼의 역할이 바뀐 뒤 도착하는 호환 click도 차단한다. 다음 실제 pointerdown/키보드는 다시 허용한다.
