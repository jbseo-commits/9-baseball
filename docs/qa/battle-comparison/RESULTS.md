# 전투 UI 비교 페이지 검증

2026-10-29 KST. [설계와 인수 범위](../../design/battle-comparison/README.md).

- 핵심 회귀6개: 엄격한 opt-in/Pages URL/재귀 방지, 메시지 source·origin·schema, 탭 전환 iframe 유지와 공통reset, 실제 기존 배우/wrapper, hidden입력/자동다음 잠금, 비교 오류의 실제 저장 보호. 양쪽 standalone비교URL도 메모리 오류 경로로 검증한다.
- 독립 reviewer는 집중27테스트와 desktop/mobile 캡처를 확인했다. ‘개선판 크게 열기’가 기존 저장 삭제 오류 화면으로 연결되던 경계를 발견해 두 variant 모두 MemoryPreviewBoundary로 수정했다. 기존 UI 손패는 프레임 내부 스크롤로 실제 조작했다.
- [browser.json](browser.json): 667×375/844×390/1024×768/1440×900/1920×1080/390×844에서 실제 두 iframe 로딩·카드/코스 조작·탭 선택 유지·함께 초기화·같은 에너지·숨김 결과 고정·실제 배우·save sentinel·가로 overflow·오류 확인. 가로 중심, 좁은 폭은 기존 UI layout의 표시 회귀를 확인한다.
- [844px 탭 화면](comparison-844.jpg), [1440px 나란히](comparison-1440.jpg). 기존UI는 실제 portrait 흐름으로 손패가 아래에 있어 native iframe scroll을 사용한다. 비교는 현재 UI 컴포넌트의 동일 엔진 상태이며 과거 전체main checkout이라고 표기하지 않는다.
- [smoke.json](smoke.json): default/opt-in의 준비·지켜보기·자동다음·Inspector정지·회전선택·저장후이어하기 및 동일 저장 상태. Inspector정지 검사는 연출 종료 직후 유효한 메뉴 버튼을 즉시 눌러 auto-next race를 분리했다. 테스트 도구만 보정했으며 자동다음 정책은 변경하지 않았다.
- [noncombat.json](noncombat.json): 경로→전투/보상→경로/시설을 가로·세로 세 크기에서 확인. production save schema/engine/카드 비용/기본 에너지/실제 roster 승인 상태는 변경하지 않았다.
- **전체208파일/1,383테스트 통과**, build/check:dist **59.9MB/60MB 통과**. unit환경의 iframe page loading 비활성에 따른 예상 NotSupported 메시지는 로그에 보존하며 실제 iframe 렌더/조작은 별도 Chromium6크기로 검증했다. 전체 최종 실행은 [tests-full.txt](tests-full.txt), build/check:dist는 [build.txt](build.txt). 공개 배포 및 실제 iframe 조작 결과는 PR66의 배포 확인 항목에 기록한다.

재현: `npm run dev -- --host 127.0.0.1 --port 5222` 후 `node scripts/qa-battle-comparison.cjs`. Playwright와 `/usr/bin/chromium`을 사용한다. 공개 검증은 QA_BASE/QA_OUT/QA_SCRIPT로 같은 스크립트를 재사용한다. 비교 화면은 저장하지 않으며, 실제 휴대폰 Safari/사람의 선호도 평가를 테스트로 대체하지 않는다.
