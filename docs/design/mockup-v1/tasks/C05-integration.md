# C05 — 실제 런 연결과 화면 방향 전환

담당: Codex 통합자. Claude에게 위임하면 이 티켓 동안 공통 파일 편집권 전체를 한 명에게 넘긴다. 선행 C02–C04. 가장 위험도가 높은 통합 티켓이다.

**허용 파일**: `battle-vnext/BattleView.jsx`, `layout.css`, preview/fixture 연결 파일, `src/main.jsx`, `App.jsx`, `BallparkBattle.jsx`, `ZoneFirstPreview.jsx`(FirstSwingPractice 포함), `layout-mode.js`, `PortraitFrame.jsx`, `portrait-lock.css`, 실제 충돌이 확인된 sidecar/style·관련 테스트. `engine.js/cards.js/v10-storage.js` 규칙·schema 변경은 범위 밖이다.

## 순서

1. 기존 `BallparkBattle` controller에서 새 View를 선택하는 명시적 경로를 만든다. 상태 소유권은 한 곳에 두고 두 전투 UI를 동시에 마운트하지 않는다.
2. 먼저 고정 fixture를 새 View로 렌더링해 시각을 확인한다. fixture는 메모리 전용. 실제 런 모드와 분명히 구별한다.
3. `?battleUi=vnext`에서 실제 App의 런/선택/지원/행동/결과를 연결한다. 이 경로만 세로 iframe·회전 안내를 우회한다. query 해석은 한 곳에서 공유한다.
4. 기존 `PORTRAIT_ONLY`를 전역 해제해 구형 landscape sidecar를 부활시키지 않는다. 새 root에 어떤 legacy 이벤트/selector가 접근하는지 목록을 만들고 격리한다.
5. PC/휴대폰 가로는 상단HUD·중앙구장·하단손패·오른쪽결정. 세로는 같은 DOM을 재배치한다. 크기 변화가 선택·phase를 초기화하지 않게 한다.
6. 기존 commitBeat, shown snapshot, fxStage/playToken, 정보창 복귀, AUTO_NEXT_MS=1100의 조건과 다음 타자/공 콜백을 연결한다. 미학 때문에 판정/저장 시점을 옮기지 않는다.
7. 첫 연습의 별도 규칙·숨기는 정보·단계는 보존하면서 새 표시 부품을 연결한다. 안내창을 더하지 않는다. 방어 실험실은 기존 UI 경로 유지 또는 계약을 따로 검증한 뒤 연결한다.
8. 지도/보상/시설/이벤트/엔딩은 우선 정상 스크롤 중앙 패널로 연결한다. 전투 root 제약이 누출되지 않아야 한다.

실제 상대 분기는 A01의 `actor-coverage.json`을 따른다. 미지원 상대는 새 배경에 옛 배우만 섞지 않고 기존 전투 View 전체를 사용한다. 같은 App 상태를 유지한 세로 패널 fallback으로 수용하고, 회전 강제·iframe 재시작·필수 버튼 잘림이 없어야 한다. 필요하면 이 패널은 세로 스크롤을 허용한다. fallback 표시와 프리뷰 한계를 QA 기록에 남긴다.

## 인수 G1

- 같은 seed/action sequence의 엔진 결과와 저장 상태가 기존 경로와 일치한다.
- 실제 844×390·1440×900·390×844 및 짧은/좁은 화면을 캡처한다. 선정 목업과 나란히 검수한다.
- 에너지·손패·9존·한 개 실행 버튼이 실제 런에서 작동하고, 카드 상세·지원 변경·연습·이어하기가 유지된다.
- 고정 fixture만 성공하고 실제 런이 안 되면 C05 완료가 아니다.
- 실제 상대 최소 한 명이 검수된 artId와 새 Scene에 연결돼야 G1 통과다. 매핑이 없으면 기능 작업은 진행하되 G1은 미완료로 기록한다.
- 일반 경로에 켜지 않은 프리뷰라면 아직 정식 배포 전환이라고 보고하지 않는다. 정지 배우의 한계도 남긴다.

후속: G1 인수 후 A02/C06. 전체 아트 제작 전에 구도·화면 방향 결함을 먼저 고친다.
