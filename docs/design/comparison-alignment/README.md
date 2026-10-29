# 비교판 A 구도 보정

2026-10-29 KST · [사전 영향도](IMPACT.md) · [실측/캡처](../../qa/comparison-alignment/RESULTS.md).

사용자 screenshot의 타자 잘림은 실제 원화의 발/투명 여백을 무시한 배치와 비교판의 납작한 viewport가 겹친 문제였다. 이전 QA는 DOM/클릭과 actor존재를 확인했지만 실제 그림의 발과 구장 표식을 대조하지 못했다.

`legacy-scene-geometry.js`는 기존941×1672구장의 rubber(644,844), home(468,1355), 왼쪽 타석(120,1460)과 실제 V15 READY512×768cell의 anchor(140,763)을 등록한다. 이 데이터에서 배경 crop, 배우상자, 구장높이,9존위치를 같은 scale로 파생한다. 타자는 원화480px높이로 배치해 모든7포즈가 구장 안에 들어오게 한다.9존은 같은156px/같은DOM/같은행동으로 오른쪽 아래에 두어 배우를 가리지 않는다. 손패는 구장 바로 아래에 이어진다.

투수는 실제 atlas의 기존 stance를 유지한다. 기본Violet는실제로atlas를쓰며,.757/.961 stance는 해당원화와 일치한다. genericfallback만그자신의.5/.965 anchor를 사용한다. 그림자를 같은 발 위치에 둔다.

`LegacyCompareHost`는 실제 `.bp-scene` 폭을 측정하고440이하로 제한한다. 넓은 standalone창의 wrapper폭1440을 구장폭으로 쓰지 않는다. Aiframe은 원래portrait폭<=440과 가용높이로 표시하고, B의 가로 표시 방식은 유지한다. 축소된 iframe으로 터치 표적을 줄이지 않는다.

보정은 `.bc-legacy-host` 안에 한정된다. 기존 production fallback/globalCSS, 새BattleView의 카메라/배우, 엔진/카드/저장/선택 규칙은 변경하지 않는다. A의 배경과 actor wrapper에 따로 적용되던 camera transform을 해제해 authoredSprite의 pose만 움직이게 한다. 과거 전체main checkout을 고치는 작업이나 모든roster 모션 인수로 주장하지 않는다.
