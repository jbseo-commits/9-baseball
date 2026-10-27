# battle-vnext — 표시 계약 (C01 확정본)

`docs/design/mockup-v1/CONTRACTS.md`의 제안을 실제 코드(main `f3ec4be` + 패키지 `bb409c0`)에 맞춰 확정한 API다. C02–C04는 이 모델만 받아 그린다. 본편 런타임은 아직 이 폴더를 import하지 않는다(연결은 C05).

```text
App (엔진 상태 s · hand · selected · swingStack · choice · fx/locked · onNext)
  └ 전투 컨테이너 (C05: 지금 BallparkBattle이 가진 로컬 조정 상태를 한 곳에)
       armed · commitBeat · inspect · hoverZone/hoverSkill · lastSwing · autoNext 타이머 · 터치 슬라이드
       → buildBattleViewModel(...)   ← 순수 변환, 상태 변경 없음
       → BattleScene / BattleHud / HandDock / DecisionPanel / ResultReadout
       ← onCardTap(id) · onZoneTap(z) · onExecute() · onInspect(...)
```

## export

| 이름 | 용도 |
|---|---|
| `buildBattleViewModel(input)` | 아래 입력 → `{phase,input,energy,hand,zones,forecast,hud,result,scene,effects}` |
| `battlePhase({s,fxStage,commitBeat,locked})` | `deciding / committing / flight / result / transition` |
| `zoneFace(s,z)`, `bandFace(s)` | 읽기 단계별 칸/볼 띠 표면 (0 낱말 · 1 5%p 구간 · 2 정확 %) |
| `publicForecast(forecastFor(...))` | 예측에서 공개 값만 남김 |
| `resultCall(r,shot)` | 결과 한 낱말 (`BallparkBattle` `callOf`와 같은 규칙) |
| `ACTION_LABELS`, `ACTION_CALLBACKS`, `LANDED_STAGES` | 행동 이름·콜백 매핑·도착 단계 |

`fixtures.js`(테스트·검수 전용): `VNEXT_FIXTURES`, `buildFixture(id)`, `appInputs(s,{selected,swingStack})`, `handId(s,kind,nth)`.

## 입력

| 필드 | 소유 | 출처 |
|---|---|---|
| `s, hand, selected, swingStack, choice` | App | `App.jsx`의 같은 이름 값 (`hand=[{id,entry,preview}]`, `choice=previewV10Stack/previewCard`) |
| `locked, fxStage, shot, playToken, nextLabel, hasNext(=!!onNext), artId, defenseLab` | App | `BallparkBattle`에 넘기던 prop |
| `armed, commitBeat, inspectOpen, hoverZone, hoverSkill, lastSwing` | 전투 컨테이너 | 지금 `BallparkBattle` 로컬 상태 |

## 출력 필드

- `phase` — 엔진 phase + 연출 단계에서 도출. `flight`은 판정은 끝났지만 공이 아직 닿지 않은 구간(`LANDED_STAGES` 이전).
- `input` — `canSelect, canExecute, blockedReason, actionKind, actionLabel, callback, autoNext, ariaLabel`
  - `actionKind`: `watch`(지켜보기) · `swing`(타격) · `prepare`(준비 사용) · `support-zone`(코스를 고르세요) · `busy`(투구 중…) · `next`(다음 공/다음 타자) · `none`
  - `callback`: `onTake` · `onSwing` · `onNext` · `null`. **새 이름 `onExecute`는 다음처럼 기존 콜백에 연결한다**: `onTake → onTake()`, `onSwing → 컨테이너 commitSwing()`(지원 카드가 있으면 `STACK_COMMIT_MS` beat 후 `onSwing()`, 준비 카드는 `playUse` 뒤 `onSwing()`), `onNext → onNext()`.
  - `autoNext`는 조건만 알려준다. 타이머(`AUTO_NEXT_MS`, 재시도)는 컨테이너 한 곳이 소유한다.
- `energy` — `current, cap, base, selectedCost, armedCost, remainingIfExecuted, shortfall, nextTakeHint, upcoming, refill`. V10만, 그 외 `null`. 한 화면에 한 번만 그린다.
- `hand[]` — 기본 칩 → 스윙 → 준비 순. `id, kind, plus, name, type(basic|swing|prepare), cost, artKey, coverage(스윙 glyph, 준비=null), role, summary, condition, drawNote, warning, problem, overBudget, selectionRole(main|support|armed|null), order, disabled, unavailable`. 문구는 `cardFaceOf`/`shortCardProblem` 그대로.
- `zones` — `level, sources[], cells[9]{zone,word,live,face,aimed,aim,cover,support,tokens[],actual}, band{face,actual}, clue, targetingSupport, links`. `face`는 선택 중에만 값이 있다.
- `forecast` — 선택 중·정보창 닫힘·선택 있음일 때만. `outcome(안타|희생타), chance[lo,hi], chanceText, damageMin/Max, damageText, damageLabel('안타 시 −12~30'), coverage, cardCount, runners, shaken, shakenHp, reasons[], before(준비 전), preparation, problem`.
- `hud` — `pitcher{name,hp,maxHp,phase}, count, outsLeft, bases[3], tell, tellDetail, intent, readLevel, momentum, momentumRate, shaken, mentalCap, gimmick`. `flight` 동안은 던지기 전 값.
- `result` — `result` phase에서만. `call, label, kind, action, good, exact, assistOnly, aimZone, actualZone, outside, outsideNote, explanation(노림 → 실제 → 판정), damage, hpBefore, hpAfter, knockedOut, moves[], next(pitch|batter)`.
- `scene` — `artId, playToken, fxStage, shotGrade, pitchZone(판정 뒤 연출용), knockedOut, motionEnabled(false: 정지 원화 게이트)`.
- `effects[]` — 유지 중인 준비 효과 문구.

## 정보 경계 (회귀: `tests/battle-vnext-model.test.js`)

- `battle.pending`(이미 정해진 다음 공·난수)은 읽지 않는다. 바꿔도 선택 중 모델이 같다.
- 읽기 0/1에서 같은 공개 표면 안의 실제 확률 변화가 모델을 바꾸지 않는다. 읽기 2에서는 바뀐다(대조군).
- `previewSwing`의 `hitChance/expected/outcomes/missMin/missMax`, `intent.probabilities`는 키로도 나오지 않는다.
- `flight`에서는 결과·실제 칸·이후 HP/카운트가 없다.

## 지금 코드와 다르게 확정한 점 (통합자 확인 필요)

1. **지원 코스 대기 중 실행 잠금.** 지금 컴팩트 버튼은 대기 중에 눌러도 대기 카드를 버리고 휘두른다. 계약 표(“코스를 고르세요”)에 맞춰 `canExecute=false`로 했다. 취소 경로가 필요하다: 대기 카드를 다시 누르면 대기 해제(지금 `pickSwing`은 다시 대기시킨다) — C03/C05.
2. **카드 문제 표시는 선택 중에만.** 지금 준비 카드는 결과 화면에서도 “먼저 투구 결과를 확인…”으로 꺼져 보인다.
3. **적중 수치는 하나.** 지금 요약줄의 `적중권`은 `probabilityBounds`(속임수 이동 미반영), 예측 칩은 `v10HitBounds`(반영)라 기믹 상대에서 두 값이 다를 수 있다. vnext는 `forecast.chanceText` 하나만 쓴다 — C04.
4. `resultCall`·`zoneFace`·`bandFace`는 `BallparkBattle`의 `callOf`·`cellFace`·`bandFace`와 같은 규칙의 사본이다. C05에서 `BallparkBattle`이 이 모듈을 import하게 바꿔 한 곳으로 합친다.
5. `forecastFor`는 `SwingForecast.jsx`(React·CSS import)에 있다. 순수 모듈로 옮기면 Node 단독 실행도 된다 — 통합자 판단.
6. 기존 불일치(유지): 읽기 0 칸 낱말은 존 안 비율(`p/inZone`), `probabilityBounds`는 전체 비율로 명암을 정한다.

## fixture

seed `20261027`, 노드 `a1-entry`, 첫 손패 strike(2)·strike(2)·scout(1)·place(1)·watch(1), 에너지 2/2. 단계(`steps`)는 엔진 함수 호출 그대로이고, 엔진 밖 단계는 `grant-relics`(읽기 1/2용 스코프·호크아이 부여) 하나다. `defense-lab`은 `createDefenseLabState(20261022)`로 본 런과 분리된다. storage를 받지 않아 생산 세이브를 읽거나 쓰지 않는다.
