# 전투 UI 두 버전 비교 페이지 — 구현 전 영향도

2026-10-29 KST · 기준7ccbebf · 사용자: 두 버전 비교 웹페이지와 GitHub 게시.

비교 대상은 현재 코드의 기존 전투UI와 새 가로UI다. 같은 fixture/seed/엔진으로 시작하고 조작은 각각 독립적이다. 별도 historical main checkout 전체와 같다고 표기하지 않는다. 기존 배우/레이아웃도 실제 production Sprite를 재사용하고 빈 배우를 비교하지 않는다. 기존UI wrapper를 유지한다. Desktop은 나란히, 작은 화면은 mountediframe 탭 전환. 공통 장면/함께 초기화, 독립 링크 제공. 비교 내부는 무음·진동 없음. 실제 저장에 접근하지 않는 기존 메모리 Preview를 재사용한다.

| 축 | 영향 | 대응 |
|---|---|---|
| UI/레이아웃 | 있음 | 별도 lazy비교 route와 scopedCSS. 두 iframe은 동일한 native가로viewport, 축소하지 않아 터치크기 유지. 기존 UI의 자연스러운 세로스크롤 유지. 비교 프레임 부모720/844/1440/1920 캡처. |
| 입력/제스처 | 있음 | 한 iframe당 기존 controller/제스처 registry. 숨긴 pane inert/focus차단, inactivechild 입력·autoNext잠금. 메시지 origin/source/schema 검증. |
| 게임/밸런스 | 없음 | 동일seed/엔진/카드/비용, 초기화만fixture 재생성. 조작 동기화하지 않고 독립임을 표시. clock는render용. |
| 저장/불러오기 | 확인필요 | 메모리 Preview만 렌더. 기존 production Sprite namedexport 재사용은 Duel컴포넌트/저장함수를 호출하지 않음. 실제 localStorage sentinel/저장 parity 확인. |
| 모바일viewport | 있음 | 작은 화면 탭, 충분한폭에서나란히. landscape 우선. 루트는기존vnext opt-in, portrait-reload/rotateoverlay가 비교를가리지않음. |
| 스크롤/overflow | 있음 | parent는고정도구+내용, iframe내기존 UI native scroll. 전역CSS변경없음. |
| 기존플로우 | 확인필요 | 일반main/query/기존preview unchanged. legacy강제는명시적 comparison child메모리안에서만. standalone기존UI메모리link 제공. |
| 테스트/회귀 | 있음 | 비교URL/variantgate/메시지검증/초기상태/hidden입력·자동다음/공통reset/iframe유지,fullsuite+smoke+nativebrowser. |
| 빌드/배포 | 있음 | 신규그림/패키지없음. 기존모듈Sprite공유와lazy페이지,60MiB예산확인. 동일PR66/branchpreview게시후공개iframe직접조작검수. |
