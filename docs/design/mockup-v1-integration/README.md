# C05 통합 프리뷰 — 부분 인수

기준: `feat/mockup-battle-v1`의 `d7ac2b5` (PR #65 반영). 작업 브랜치 `codex/mockup-v1-c05-integration`.

## 확인하는 방법

- `?battleUi=vnext&battleFixture=swing-main` — 새 화면의 메모리 검수. 실제 엔진과 BallparkBattle 컨트롤러로 카드·준비·지원·타격·지켜보기·다음 공을 조작한다. 샘플 투수, 정지 원화, 단축 진단 연출이다. 생산 세이브를 읽거나 쓰지 않는다. 상단 선택기로 14개 상태를 검수하며 고정 flight fixture는 의도적으로 정지 상태다. 다시 시작/다른 상태로 전환할 수 있다.
- `?battleUi=vnext` — 실제 App과 저장/이어하기 경로. 승인된 artId만 새 BattleView를 선택한다. 현재 승인 목록이 비어 있어 모든 상대는 기존 전투 View 전체를 사용한다. 같은 App 상태를 유지하고 스크롤 가능한 세로 패널로 수용한다.
- query 없음 — 기존 제품 진입, portrait iframe/회전 안내 및 모든 기존 규칙을 유지한다.

URL 옵션 파서는 `battle-ui-mode.js` 한 곳이다. vnext query만 iframe/재시작/회전 안내를 우회하며 `PORTRAIT_ONLY=true`와 legacy `landscapeMedia()` 비활성은 유지한다. 새 화면은 별도 `.battle-vnext` root를 쓰므로 옛 `.bp-battle` sidecar가 붙지 않는다. 기존 fallback의 portrait 컴팩트 스타일은 `legacy-fallback.css` 안에서만 제한적으로 적용한다.

## 구현 소유권

- App: 엔진/저장/FX timeline/선택의 소유권 불변. 장면 진입점과 callbacks 그대로다.
- BallparkBattle: 기존 armed/commitBeat/hover/inspector/auto-next와 retry를 재사용한다. 모든 hook 뒤에서 View 한 개만 선택한다. HandDock ref로 scroll/focus 복원. 터치 슬라이드는 같은 pickZone을 호출한다. 지원 대기 재탭 취소·대기 중 실행 잠금 적용.
- BattleView: HUD/Scene/항상 보이는 손패/9존/단일 행동을 배치한다. 에너지는 손패 위 한 번, 결과 해설은 결정 패널 한 곳. 자동 다음 공 뒤 최근 결과는 다음 카드/코스 조작 전까지만 유지한다.
- IntegrationPreview: 명시적인 메모리 전용 진단 route. fixtures + 엔진을 사용하며 App/storage를 import하지 않는다. 준비는 공을 쓰지 않고, 실제 공은 짧은 진단 FX 뒤 기존 auto-next를 따른다. 본편 FX timeline을 대체하지 않는다.
- 승인 목록과 엔진/카드/저장 schema 무변경. 승인 여부는 `approvedPitcherArt`로 판정한다. 테스트만의 승인 seam을 실제 로스터 연결로 보고하지 않는다.

## 반응형 및 입력

1440×900/844×390/667×375는 HUD·구장·하단 손패·오른쪽 결정 영역이다. 짧은 가로에서는 카드 그림을 줄이고 투수 발이 손패 위에 남도록 world 전체 카메라에 30px 이내의 여백을 둔다. 배우만 따로 옮기거나 반전하지 않는다. 390×844/320×568은 같은 DOM을 구장→손패→2열 결정 패널로 재배치하고 세로 스크롤을 허용한다. 손패 보기 버튼을 추가하지 않았다. 큰 목록은 가로 스와이프한다.

공용 길게 누르기/키보드 i가 새 손패를 인식한다. 비행/commit 중 거절된 정보 요청은 전역 카드 팝업으로 우회하지 않는다. 정보창 중 손패 탭은 검사 카드만 바꾸고 현재 플랜과 에너지를 유지한다. 마우스 hover/터치 슬라이드는 확정 전 미리보기만 바꾼다.

샘플 시트 도구 `mockupSheetArt/MOCKUP_CARD_SHEET`는 `sample-card-art.js`로 분리했다. 이를 import하지 않는 실행 경로의 dist에서 미승인 카드 atlas 426,520B를 제외한다. 기본 카드 원화는 기존 kind별 연결을 쓴다.

## 다음 인수 / 제한

C05/G1 **미완료**: 실제 상대 최소 한 명의 검수된 artId 연결이 없다. 원화 샘플을 실제 상대에 임의 배정하지 않았다. 첫 연습과 방어 실험은 기존 controller/View를 유지한다(새 표시부품 이식 미실행). 이번 작업은 일반 제품의 기본 UI 전환이나 main 배포가 아니다.

Claude의 다음 작업은 실제 상대 원화 매핑 검수 및 첫 연습 표시 어댑터다. 승인된 매핑 후 실제 런의 새 View에서 G1을 재검증해야 한다. C06 모션은 그 뒤이며 현재 정지 배우를 완성 애니메이션으로 취급하지 않는다. 아직 사람의 이해도·재미·상업 품질 테스트, Safari/실기기 검수는 하지 않았다.

검증 및 실제 캡처: `docs/qa/mockup-v1-integration/RESULTS.md`. 전투 layout 제약은 지도/보상/시설로 누출되지 않는지 3 viewport에서 확인했다.
