# C02 — 경기장·배우·공유 카메라

담당: Claude Code. 선행 C01 + A01 선정본. 목표: 가장 호평받은 그림과 야구 구도를 반응형 실제 Scene으로 유지한다.

**허용 파일**: `src/duel/battle-vnext/BattleScene.jsx`, `scene-geometry.js`, `scene.css`, `tests/battle-vnext-scene.test.jsx`, `tests/battle-vnext-geometry.test.js`. 아트 반입/최적화 공통 manifest는 통합자에게 요청한다.

## 구현

- reference/scene.js의 순수 계산을 React 크기 관찰/정리 수명주기에 맞춰 이식한다. `document.querySelector`로 다른 화면을 조작하지 않는다.
- 원화 4개 중 구장·타자·투수를 분리 레이어로 배치한다. 피벗·그림자는 구장 좌표를 사용한다.
- 이미지 import 경로는 A01 납품에 맞춘다. 텍스트·UI가 들어간 전체 스크린샷을 배경으로 사용하지 않는다.
- 기존 본편 배우 renderer는 `BallparkActors`이고 `ArenaRenderer2`는 QA/실험 경로임을 유의한다. 새 Scene은 초기 정적 이미지 레이어를 사용하고 기존 canvas를 중복 마운트하지 않는다. 최종 모션 renderer 연결은 C06 계약으로 남긴다.
- 새 Scene은 `playToken/fxStage`를 읽을 수 있지만 엔진 판정과 다음 공을 호출하지 않는다. 아직 동작이 없는 상태는 검토 화면에서 명시한다.
- resize/회전 뒤에도 배경·인물 상대 위치가 유지되게 하고 ResizeObserver를 정리한다.

## 인수

- 홈/마운드/배우 접점과 원근 비율의 계산 검사가 있다. 잘못된 좌우 반전이 없다.
- Scene standalone 요소 검사는 통과하고, 실제 미감·겹침 판정은 C05에서 손패/9존까지 연결한 캡처로 받는다.
- 인물이 손패 때문에 뜨거나 투수가 타자보다 가까워지는 보정을 하지 않는다.
- G1에서는 정지 원화 수준으로만 완료 보고한다. 실제 투구·타격 완성이라고 하지 않는다.

Claude 전달 문구: “C02 Scene 파일만 구현해. 선정 원화와 공유 카메라·피벗을 유지하고, 카드/행동/엔진은 건드리지 마. C05 연결에 필요한 props와 모션 미구현 상태를 넘겨.”
