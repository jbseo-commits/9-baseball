# 2배속 실제 사건 검수 — 2026-11-08

기준 main8f443ef. `QA_EVENTS_ONLY=1`을 roster QA에 추가해 실제2배속에서 모든그림의RAF포착과 사건순서를 구분한다. 기존 기본0.5× strictdrawing 모드의 누락검사는 유지한다.

최종실행:20명각1회실제엔진행동,이미지로딩,투구token별공비행→결과,접촉전/후HP,마지막ready0 PASS.19명실제노드상태+Red는기존QA artoverride이므로20명의자연조우경기를완주한검사로쓰지않는다. 가상50ms(2×실제25ms)허용치. 초기도구의RAF함수와fiber변수가겹친오류는제품문제와구분하여수정·독립검수후새경로roster-events-validated에서전원재실행했다.

실제844×390 2× 2/3카드로 WebAudio setValueAtTime예약값과Oscillator시작을계측해pitch sine310이릴리스시점,결과음이접촉시점65realms이내에예약되는것확인. `.frequency.value`를future시점전에읽어440으로오판했던초기계측은폐기하고native출력동작을보존한WeakMap추적으로재검사했다. 이는청감품질/장치지연평가가아니다.

전체238files1618tests PASS,zone10seed/build/dist59.3/60MiBPASS.게임엔진·저장·배우·속도·SFX코드는변경하지않았다.

## HELD 후보

작은가로result요약72px영역에82px내용이들어가HP마지막줄이잘리는문제재현. result범위max-height만늘린후667×375/844×390/844×300 2×및1440×900 1×각2/3카드총8case에서내용·viewport·다음버튼hit-test·영역분리PASS.

그러나별도blind평가는가독/위계/마감3축각+.5,나머지동일로NOT_IMPROVED(+.1875,3/8축)였다. QUALITY-BAR.md의Ready게이트에따라CSS는되돌리고패치만HELD로보존했다.기능통과를시각완성으로재분류하거나무관장식을추가하지않는다. 이잘림은main의남은결함이며본PR은해결했다고주장하지않는다.독립검수권고와동일결론.
