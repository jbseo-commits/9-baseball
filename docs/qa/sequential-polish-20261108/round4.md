# 고유 패턴 직접 확인 — 2026-11-08

기준main373d770. 기존HUD투수이름·패턴영역을tap/Enter/Space하면기존투수정보창을직접연다. 새상시문구/패널/레이아웃없음. deciding&&!menuOpen에서만활성,기존controller의locked/commit/inFx가드추가유지.정보창닫으면카드계획/손패scroll/focus복귀.

rolebutton전환시자식공개패턴문구가SR이름에서빠질수있다는독립검수지적을반영해HP+기존label/current+열기를접근성이름에명시했다.실제ChromiumariaSnapshot포함.

667×375/844×390/844×300실제tap/Space및1440×900마우스/Space/선택카드존·state전체동일·focus복귀PASS.기본상태before/afterRGBA변경0pixels각각.키보드focusring외상시그림은동일하므로새시각개선/상업품질판정을주장하지않는다.최종238파일1620검사PASS,build/dist59.3/60MiB,zone10seedPASS.정상2×7pitchKO/reward/resume/event및2/3cardengineequalPASS.

## 판단 민감도

`scripts/pitcher-decision-sensitivity.mjs`재현:20고유기믹×seed1..20=400합성공통첫상태.각seed같은deck/기본상태에기믹만켜고끄며기존baseIntent재계산.모든한카드/basic×9존중UI의publicForecast공개확률구간중앙값×조건부HP피해구간중앙값만읽는단순policy. support/prep최적화없음.

228/400선택변화. pending.zone을+1mod10교란한400경우선택변화0.다른숨은roll전체검증은아니다. 이전exactpreview.hit/expectedBasespolicy의6/19결과는UI공개정보기준에맞지않아폐기했다.

이자료는합성판단민감도이며실제로20명완주한승률·밸런스·사람학습·재미증거가아니다. 검은역광0/20은직전노림이없는첫공만검사한한계로,기믹실패로단정하지않는다.52종확장전실제순환/스택/이전노림이쌓인전투와사람반복플레이는남아있다.
