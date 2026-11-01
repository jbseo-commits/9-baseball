# 구도 보정 검증

2026-10-29 KST · [설계](../../design/comparison-alignment/README.md). 기준a93fbde. 이전 [비교판 캡처](../battle-comparison/comparison-1440.jpg)에서 타자가 왼쪽으로 잘린 상태를 확인할 수 있다.

- [새 나란히 화면](played-1440.jpg), [440px 단독 화면](standalone-1440.jpg), [390px 단독 화면](standalone-390.jpg). 같은 배우 원화를 보존하고 비교판에서 source등록만 보정했다.
- [geometry.json](geometry.json): 390/440/667/844/1440/1920의 실제 브라우저 CSS와 실제 image canvas를 읽어 paintedrubber와 source기준발 사이 거리 **0.6CSSpx 미만**, 구장→손패 간격0, 모든7포즈의 불투명 그림이 구장 안에 있음을 확인했다. 숫자상의 배우상자만 검사하지 않았다.
- [batter-alpha.json](batter-alpha.json): 원본PNG SHA256와 threshold160에서7cell의 실제불투명범위. 원화가 바뀌면 회귀검사가 등록 자료 갱신을 요구한다.
- [접촉320ms](motion-320.jpg), [팔로스루850ms](motion-850.jpg), ready/trigger/swing-mid/follow/settle도 실제 legacySprite를 재생해 촬영했다. 비교판A의 배경·배우 wrapper transform은 모든stage에서none이며, 내부 authored pose동작은 유지된다. 시각타이밍은 browser고정시계로 재현한 값이다.
- standalone390/1440에서 실제scene390/440과 background390/440 일치, 배우/9존의 가로잘림없음. 독립review가 넓은wrapper폭으로 카메라가 커지는 문제를 찾아 실제scene측정으로 고쳤고 회귀검사를 추가했다.
- [flows/browser.json](flows/browser.json): 기존비교6크기에서 실제legacy 카드/코스조작, 탭선택유지, 공통초기화, 숨김autoNext정지, save sentinel유지, pageerror0. 나란히 캡처는 B의 카메라와 그림 decode가 완료된 뒤 촬영한다.
- [smoke.json](smoke.json): 기존default/opt-in 준비·지켜보기·자동다음·Inspector정지·resume·회전선택과동일save확인. [noncombat.json](noncombat.json): 경로/보상/시설9조합. 실제저장·엔진·카드·에너지·로스터승인불변.
- 독립 reviewer가 준비/접촉/팔로스루 및최종나란히를 확인했고, standalone폭 수정까지 blocker없음을 확인했다.
- 전체 **209파일/1,388테스트 통과** [tests-full.txt](tests-full.txt). production build/check:dist **59.9MB/60MB 통과** [build.txt](build.txt). unit환경의 예상iframe-loading-disabled메시지는 로그에 보존했다.
- root의 v버전을 iframe/standalone링크에도전달한다. 이전자식HTML캐시가보정을가리지않도록했고 QA_VERSION으로실제두iframe URL을검증했다.
- 공개branch배포 후 같은기하·그림검증을실제URL에서 수행하고 PR66에 기록한다. 실제휴대폰Safari/사람의미감인수를 테스트숫자로 대체하지 않는다.

재현: Vite5223 실행 후 `node scripts/qa-comparison-alignment.cjs`. QA_BASE/QA_OUT/QA_SCRIPT를 주면공개배포에서도 같은검증을사용한다. Playwright와 `/usr/bin/chromium`이필요하다.
