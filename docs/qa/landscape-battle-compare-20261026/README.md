# 가로 전투 비교 검증

기준 main `f3ec4be`, 선택형 `?battleLayout=compare`. 로컬 서버 51936, 브라우저 UI로 직접 조작. 새 이미지/엔진/저장 스키마 변경 없음.

## 실제 확인

- 기존 새 런→버티기 선택→지도→첫 전투 진입. 이후 아래 별도 생성 fixture는 UX/흐름 검증이며 자연 런/밸런스 증거가 아니다.
- 568×320(전투 568×288), 844×390(844×358), 1280×720(1280×688). 위 32px는 외부 비교 도구다. `acceptance.json`의 9개 최종 상태 모두 페이지 overflow 0, 카드 직사각형 비중첩/전체 노출, 9존 ≥44px, 실행 44px, dialog 0.
- 최대 손패 실제 카드6 + 맨손1 = 7개 버튼. `max-seven-final-568.png`.
- 메인 선택 후 지원 대기→세로→가로→지원 코스 배치, 선택·지원 대기·조준·공개 확률·HP·아웃·에너지 유지. `armed-support-*`, `support-placed-wide`.
- 실제 지원 타격: HP60→50, 다음 공 에너지2. 실행 중 비교 버튼 잠김, 확률 색 숨김. `support-flight-844`, `after-support-swing-844`.
- 준비 선택·사용, 에너지3→2와 볼/스트라이크/아웃 유지, 이미 얻은 준비 효과 표시. `preparation-*`.
- 에너지0, 2S 번트 선택: 실행 차단, 비용 경고·파울 삼진 조건을 요약 옆에 표시. `bunt-zero-two-strikes-568`.
- 공방: 남은 아웃1, 보호, 다음 제약, 선택 카드 표시, 같은 상태 세로 전환. `defense-selected-final-568`, `defense-same-portrait`, `defense-desktop`.
- 생성한 HP1 fixture에서 실제 카드로 강판→보상→지도→훈련 강화→지도→다음 전투→새로고침/이어하기. `flow-*`, `next-battle-after-facility-844`, `resume-next-battle-844`.
- 비전투는 같은 iframe을 세로 크기로 돌리고 문서 스크롤 유지. 실제 지도 scrollHeight998/clientHeight640/scrollTop358 (`map-scroll.json`). 훈련은 640px 안에 들어가 스크롤 필요 없음 (`facility-scroll.json`).
- 기본 URL의 320×568 원래 화면: 비교 클래스/iframe 0, page320×568. `unchanged-default-portrait-320.png`.
- WebGL 배우 사용. 투수와 플레이트를 transform 없이 배치하여 offset 기반 Pixi 좌표와 DOM 좌표 일치. DOM fallback 표적 선택은 단위 테스트로 확인.

## 자동 검사

- 전체 194파일 / 1,227테스트 통과 (`full-tests.txt`).
- 최종 관련 4파일 / 29테스트 통과 (`related-tests.txt`), 신규 비교 회귀 8개 포함.
- smoke 4종 exit0 (`smoke-*.txt`).
- production build 성공, dist58.6MB/60MB (`build.txt`).
- 별도 reviewer의 가로 터치폰 외부 회전 안내/Pixi transform 좌표 발견을 수정. 자식 승인/실행 중 거절, 외부 메시지 거절, 저장/RNG/지원 대기 보존 회귀 추가.

## 범위와 한계

기본 전투에서 새로운 팝업·가로/세로 스크롤을 쓰지 않는다. 기존 ☰ 정보 검사기는 선택적으로 여는 기존 인라인 화면이며, 직접 선택/조준/실행에는 필요하지 않다. 실제 물리 기기의 주소창·safe area·롱프레스·터치 회전은 미측정. 32px 비교 도구와 축소한 세로 프리뷰는 완성 제품의 물리 터치 크기라고 주장하지 않는다. 초기 측정(label normal-selected-568 등)과 최종 보정된 측정을 구분하며 acceptance.json에 채택 상태를 지정했다.

프리뷰 배포/공개 확인은 PR과 최종 응답에 실제 결과를 남긴다. 본게임 기본 화면은 자동으로 교체하지 않는다.
