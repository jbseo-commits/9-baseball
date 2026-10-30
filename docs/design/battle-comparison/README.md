# 두 전투 UI 비교 페이지

2026-10-29 KST · [사전 영향도](IMPACT.md) · [검증](../../qa/battle-comparison/RESULTS.md).

경로는 현재 Pages prefix에 `?battleUi=vnext&battleCompare=1`. 큰 화면(1200px 이상)은 나란히, 작은 화면은 A/B 탭이다. 큰 화면에서도 ‘한 화면씩 보기’를 선택할 수 있다. 공통 장면 선택/함께 다시 시작은 양쪽을 같은 엔진 fixture로 초기화한다. 이후 조작은 각각 독립적이다. 비교창은 무음·진동 없음이며 별도 창으로 열면 일반 프리뷰 소리를 켤 수 있다.

- A는 현재 코드의 기존 BallparkBattle 전투UI·기존 선택 규칙·실제 production DOM 배우를 사용한다. 기존 portrait wrapper와 자연스러운 프레임 내부 세로스크롤을 유지한다.
- B는 새 가로 BattleView·샘플 배우·직접 카드/코스 선택을 사용한다.
- 두 버전은 같은 엔진/seed/카드/HP/시작팩을 쓴다. 독립 historical main checkout 전체 비교가 아닌 두 UI 표현의 비교다.
- A는 실제portrait폭<=440과 가용높이, B는 가로 native viewport를 사용한다. [비교판 구도 보정](../comparison-alignment/README.md)에서 실제발/구장기준점 등록을 설명한다. iframe은 native CSS viewport를 사용한다. 부모에서 그림처럼 줄여 터치 영역을 축소하지 않는다. 기존 UI의 손패는 프레임 안에서 아래로 스크롤한다.
- 탭 전환은 iframe을 유지한다. 숨긴 게임에는 input lock과 onNext=null을 적용한다. 진행 중 연출은 끝날 수 있지만 엔진의 다음 공은 진행하지 않는다.
- frame은 초기 잠금 상태에서 parent handshake를 기다린다. 메시지의 origin/source/type/version/boolean을 검사한다. 숨긴 pane은 inert·aria-hidden·tabIndex=-1이다.
- 기존 IntegrationPreview의 순수 엔진 메모리 상태를 재사용한다. App의 배우 컴포넌트 named export는 재사용하지만 Duel은 렌더하지 않고 저장 함수는 호출하지 않는다. 비교 페이지·embedded child·양쪽 크게 열기는 저장 삭제 기능이 없는 MemoryPreviewBoundary를 사용한다.
- 비교 opt-in이 없는 main/default/일반 fixture route의 동작은 유지한다. approved roster mapping은 변경하지 않는다. main merge는 포함하지 않는다.

`compareScenario=prepare|support-stacked|cinema-exact|cinema-near|cinema-homer|cinema-knockout`로 시작 장면을 공유할 수 있다. 기본은 watch-read0(직접 플레이). 선택을 바꾸면 이 query를 갱신하며 실제 세이브를 쓰지 않는다.
