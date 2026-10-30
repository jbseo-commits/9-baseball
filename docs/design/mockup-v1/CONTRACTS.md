# 전투 표현층 계약 — C01에서 확정할 설계

이 문서의 `battle-vnext/` API는 **제안**이다. 실제 기존 코드는 `App.jsx → BallparkBattle.jsx`다. C01에서 현재 main의 선택/연출 로직을 확인한 뒤 계약을 확정한다. 기존 `s` 전체를 모든 새 컴포넌트에 전달하는 구현은 피한다.

## 1. 단일 상태 소유자

```text
App의 실제 엔진 상태 + 기존 선택/지원/연출 상태
  → 기존 preview/public selector
  → buildBattleViewModel (표시값만, 상태 변경 없음)
  → BattleView
       ├ BattleScene
       ├ BattleHud
       ├ HandDock / BattleCard
       └ DecisionPanel / ResultReadout
  ← 기존 onSelect / onStack / onAim / onSwing / onTake / onNext
```

기존 `BallparkBattle`의 commitBeat·armed·정보창·자동 진행·표시 snapshot 같은 로컬 조정 상태는 통합자가 한 곳에 남긴다. 새 컴포넌트마다 동일 상태를 다시 만들지 않는다. 선택과 지원 순서, 카드 소비, 엔진 진행, save는 부모/기존 경로 소유다. 새 컴포넌트는 자체 타이머로 다음 공을 판정하거나 `playV10Action`을 호출하지 않는다.

`forecastFor`, `cardFaceOf`, `publicProbabilities`, `probabilityBounds`, `readLevel`, `v10Energy` 등 기존 계산을 활용한다. 별도 목업 `app.js`·복사 엔진·하드코딩 결과는 이식하지 않는다.

## 2. 최소 표시 모델

다음은 필드의 책임을 나타내는 JSDoc 수준 명세다. 임의의 새 게임 상태 schema가 아니다.

| 묶음 | 표시 데이터 | 제약 |
|---|---|---|
| `phase` | deciding / committing / flight / result / transition | 엔진 phase+fxStage에서 도출, 엔진 phase를 교체하지 않음 |
| `input` | canSelect, canExecute, blockedReason, actionKind, actionLabel | 연출·정보창·비용 부족을 함께 반영 |
| `energy` | current, cap, selectedCost, remainingIfExecuted, nextTakeHint | 중복 HUD 금지. 무료/준비/다음공3 등 실제 규칙 반영 |
| `hand` | id, kind, name, cost, artKey, coverageGlyph, shortEffect, condition, warning, selectionRole, order | kind/id 구별. 원본 카드 문구를 임의 수치로 요약하지 않음 |
| `zones` | 공개 표식/범위/정확값, aim, mainCoverage, supports와순서 | 표시 수준 판정은 selector에서. 정답 pitch를 render 전에 전달하지 않음 |
| `forecast` | hit 범위, 피해 범위, 피해 조건, 준비 전후, 사용 불가 이유 | `희생타 시`도 구별. 적중확률과 커버 면적을 같은 것으로 부르지 않음 |
| `hud` | 공개 투수 이름/HP, count, 주자, 공개 tell, 읽기 단계 | resolve 중에는 기존 presentation snapshot 사용 |
| `result` | 판정명, 노림/실제, 정확/지원/근접, 실제 HP·진루, 다음 흐름 | 공개 시점 이후만 제공. 실패 피해는 성공 예상과 분리 |
| `scene` | 검수된 actor artId, playToken, fxStage, release/contact, motionEnabled | 없는 로스터를 샘플 투수로 몰래 대체하지 않음 |

**C01 확정(2026-10-27):** 실제 API는 [`src/duel/battle-vnext/README.md`](../../../src/duel/battle-vnext/README.md)다. 위 제안과 이름이 달라진 곳: `hand.coverageGlyph → coverage`, `hand.shortEffect → summary`, `zones`의 aim/mainCoverage/supports → `cells[].aim/cover/support/tokens`, `energy`에 `shortfall/armedCost/upcoming/refill` 추가, `input.callback`은 `onTake|onSwing|onNext` 중 하나(새 `onExecute`는 이 값으로 기존 콜백을 부른다). 지원 코스 대기 중에는 실행을 잠근다(지금 본편과 다름, README의 “다르게 확정한 점” 참고).

콜백의 외부 의미는 기존 것과 같다. 지원 카드를 누르면 필요할 때 지원 코스를 고르는 기존 절차를 보존한다. 비활성 카드도 “왜 못 쓰는지”를 확인할 방법을 제공한다. 정보창 닫기 뒤 선택·가로 스크롤·키보드 포커스를 복원한다.

## 3. 단일 행동 버튼

| 상태 | 보이는 문구 | 실제 행동 / 입력 |
|---|---|---|
| 무선택 | 지켜보기 | 기존 onTake. 다음 공 이득/2S 위험은 엔진·모드별 문구 |
| 공격/무료 기본 선택 | 타격 | 기존 commitSwing→onSwing. 선택한 메인·지원·존 사용 |
| 준비 카드 선택 | 준비 사용 | 기존 준비 경로. 투구를 임의로 진행하지 않음 |
| 비용/조건 부족 | 선택 행동명 + 가까운 이유 | 실행 disabled. 카드를 해제해 지켜보기로 돌아갈 수 있음 |
| 지원 코스 결정 중 | 코스를 고르세요 | 현재 지원 선택 확정 규칙을 따름 |
| committing/flight | 투구 중… 등 현재 동작 | 중복 클릭·키 반복·스와이프로 실행되지 않음 |
| 결과·다음 흐름 | 기존 phase에 맞는 다음 공/다음 타자 | 자동 진행 계약 유지. 새 필수 확인 버튼을 만들지 않음 |
| 정보창 열림 | 배경 입력 잠금 | 자동 진행·수동 실행 경쟁 방지. 닫은 뒤 복귀 |

`타격`/`준비 사용`으로 바뀌어도 버튼 위치는 유지한다. 목업의 두 실행 버튼을 가져오지 않는다. 접근성 이름과 보이는 행동 이름도 일치시킨다.

기본 무료 스윙은 손패를 차지하는 큰 카드 대신 **항상 보이는 작은 선택칩**으로 먼저 검토한다. 한 번 선택하고 같은 실행 버튼을 누르는 흐름이며 별도 실행 버튼이 아니다. 재탭/선택 해제로 지켜보기에 돌아가는 방법을 명확히 표시한다. 테스트에서 발견성이 나빠지면 크기를 조정한다.

## 4. 정보의 위치와 우선순위

선택 중 항상 보임: 투수 HP·BSO·주자, 공개 단서 한 줄, 9존, 카드/비용/핵심 차이, 손패 위 에너지, 선택 요약, 단일 행동.

조건부 표시: 2S 위험, 준비 유지 효과, 현재 행동을 바꾸는 제약, 지원 코스 선택 안내. 모든 특성·상태를 상시 펼치지 않는다.

요청 시 표시: 덱·버림·유물 전체·긴 카드 설명·기존 “이번 공” 복기. 접근은 기존 메뉴/정보창을 유지한다.

결과에서는 `노림 → 실제 → 판정`과 실제 HP/진루를 먼저 보여준다. 자동 다음 공 뒤에는 최근 결과 한 줄을 다음 선택까지 남기는 방식을 적용·검증한다. 새 손패를 가리거나 매번 클릭을 요구하지 않는다.

## 5. 구장·배우 카메라 계약

현재 선정 원화 전용 좌표. 다른 원화나 동작 프레임이면 접점 재검수한다.

| 항목 | 값 |
|---|---|
| 구장 원본 | 1672×941 |
| 홈 / 마운드 | (815,824) / (832,580) |
| 우타자 원본 / 표시 높이 | 1024×1536 / 세계 높이670 |
| 우타자 원본 뒤발 anchor / 세계 뒤발 | (470,1485) / (520,909) |
| 우타자 세계 앞발 참고 | 약 (594,814) |
| 투수 원본 / 표시 높이 | 1024×1536 / 세계 높이310 |
| 투수 원본 축발 anchor / 세계 축발 | (595,1495) / (832,580) |
| 목업 공 시작 / 접촉 참고 | (790,361) / (760,653); 실제 모션에서는 프레임 이벤트로 교체 |

배경과 배우 모두 동일한 world transform을 쓴다. `actorScale=worldHeight/sourceHeight`, `actorOrigin=worldFoot-sourceAnchor×actorScale`로 계산한다. UI는 별도 화면 좌표다.

카메라 시작점은 `reference/scene.js`의 cover scale과 yAlign이다. 가로≤540px높이는 아래 정렬, PC는 .42, 세로는 .4. 반응형 조정 시 배우만 따로 확대/이동하지 않는다. 화면 왼쪽 우타석의 우타자를 CSS 좌우 반전하지 않는다. 타자가 손패에 일부 가리는 것은 허용하지만 배트·머리·투수 실루엣·공 진행이 핵심 UI와 충돌하면 안 된다.

동작 프레임은 기본 위치에 `pivot/footContact/release/contact` metadata를 더한다. 공의 도착 UI 좌표와 실제 구장 원근을 혼동하지 않는다. 코드 배치 테스트에 더해 타석/신체/그립은 실제 캡처를 검토한다.

## 6. CSS·뷰포트 계약

- 신규 root: `.battle-vnext`, 컴포넌트 접두사 `bv-`. 색·간격은 해당 root의 custom properties로 관리한다.
- 전역 `body/#root/.duel-app`에 전투 전용 overflow/fixed를 추가하지 않는다.
- 기존 `.bp-*` 스타일과 DOM 조작 sidecar를 새 UI에 우연히 적용하지 않는다. 공용 hook을 계속 쓸 때는 C05에서 의도적으로 매핑한다.
- 새 경로에서 기존 landscape sidecar가 다시 켜지지 않게 한다. `PORTRAIT_ONLY` 단독 변경 금지.
- 손패는 한 개 DOM과 한 개 에너지 표시. 가로/세로마다 복제해 한쪽을 숨기는 방식을 피한다.
- 회전 때문에 앱 재시작/새 게임/카드 선택 유실이 발생하지 않아야 한다.
- 667×375/740×360에서 필수 입력 44px 이상을 목표로 한다. 320×568 세로에서는 우선순위를 재배치하고 필요하면 문서 세로 스크롤을 허용한다. 글자 축소만으로 맞추지 않는다.
- 원화는 asset, 수치·이름·한글·HP·존·카드 프레임·버튼은 DOM/SVG다. 텍스트를 PNG에 굽지 않는다.
