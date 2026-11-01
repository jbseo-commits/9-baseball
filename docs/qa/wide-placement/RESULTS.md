# 여러 칸 블록 형성·장착 검증

2026-10-30 KST. 사전 영향도: [WIDE-PLACEMENT](../../design/atbat-hand/WIDE-PLACEMENT.md).

문제는 세로 3칸 전체를 카드 높이에 축소하고, 모양이 읽히기 전에 이동하던 것이다. 실제 여러 칸은 카드 그림이 걷히며 밝은 블록과 공동 외곽선으로 형성된다. 260–400ms에 모양을 보여주고, 같은 carrier로 이동해 680ms에 함께 장착한다. 뒤따르는 순서는 표면광에만 적용한다. 1칸은 기존 460ms 장착/1040ms 수명이다. 여러 칸 수명은1280ms이며 입력·투구 실행을 기다리게 하지 않는다.

| 확인 | 근거 |
| --- | --- |
| 출발 카드 | 별도 source layer에 원래 크기·중심·그림 방향 유지. 이름/효과의 내부 여백과 오른쪽 그림의 비중첩도 실제 브라우저에서 확인. 독립 검토가 찾은 0×0 wrapper의 padding 문제 수정. |
| 큰 연결 모양 | 667×375/740×360/844×390/1024×768/1440×900/1920×1080 실제 1/세로3칸. 형성된 셀 최소36px, viewport 내 staging,280/380ms 위치 동일. 실제 source와 t0 clone 오차3px 이내. |
| 가로3칸 | 정상 link 시작팩을 엔진으로 구성해667/1440에서 [6,7,8] 형성과 동시 장착 확인. 일반 첫 손패에 없는 카드를 보장한다고 주장하지 않는다. |
| 5/9/모서리 | 별도 QA에서 카드 종류만 wall/bunt로 교체했다고 명시.667/844에서 십자5/9칸/모서리 실제3칸 [0,1,3]의 범위·가시영역·동시 착지 확인. 정상 시작덱 플레이 증거와 구별. |
| 딱 맞는 착지 | 실제 모든 tile과 해당 DOM 셀 rect 오차0.5px 이내. 중앙존 고정, 실제 커버만 표시. 장착만으로 에너지 소비/투구 없음. |
| 배속·소리 | .25/.5/2배 실제 CSS/수명과 저음 seating oscillator의 시작을680/rate에 맞춤. 한 번의 형성음과 한 번의 저음 착지 몸체. 기존 master gain 사용. 취소·메뉴·phase·resize·visibility 정리. 녹화는 시각 증거이며 청감 평가를 주장하지 않는다. |
| 즉시 실행 | 형성 중 실행해도 즉시 flight, 예약 소리·진동 취소. reduced-motion에서는 이동·형성광 없이 실제 도착 범위만 표시. |

![기존: 작은 세로3칸](before-column.jpg)
![수정: 출발 카드 내부](source-844.jpg)
![수정: 크게 드러나는 연결3칸](formed-column.jpg)
![수정: 실제 셀에 함께 장착](seated-column.jpg)
![가로3칸](formed-row.jpg)

실제 브라우저 재현: `scripts/qa-wide-placement.cjs` (`QA_BASE`, `QA_OUT`, `QA_SIZES` 지원). 기본6뷰와 normal-link row, 명시적 QA grant5/9/clipped3, reduced-motion, 정지하지 않은 실제 연출→투구HP60→48 녹화를 포함한다. 프레임 분석은 WAAPI 시각을 고정하며, 별도로 unpaused 녹화를 남겼다. 테스트/프레임 수를 재미나 상업 완성도의 증명으로 사용하지 않는다.

## 회귀

- 최종 전체223파일/1,506테스트 통과. 관련4파일32테스트도 통과.
- `zone-report10` / `v9-report30` / `growth-report2` / `deck-report1` 정상 종료. 엔진 수치 변경 없음.
- 정상 seed3 실제11구 HP60→0→보상→경로→reload/타이틀 이어하기→다음 노드; 지켜보기만으로 자연3아웃 패배/reload; 정상3에너지 실제3장 소비/한 투구와Escape 계획 보존.
- 기본/vnext prepare/take/next·Inspector pause·동일 seed 저장·resume 통과. vnext 회전 선택 유지. 기본 회전은 해당 공용 스크립트에서 실행하지 않았음.
- 경로/보상/시설 844가로·390/320세로9조건 스크롤/폭·경로 이동 통과.
- Pages 하위 경로 production build59.9MB/60MB. CSS350리소스 경로와diff whitespace 통과. 새 런타임 이미지 없음.
- [최종 production 브라우저 JSON](wide-browser.json), [.25/.5/2배 실제 시계·사운드 스케줄](speed-browser.json), [정상 플레이](playthrough.json), [전투 흐름](flows.json), [비전투9조건](noncombat.json), [정지하지 않은 장착→투구 녹화](live-column3.webm).
- 독립 읽기 전용 검토의 source 내부 여백 지적을 수정하고 실제 브라우저 회귀에 포함. 재미·청감·상업 완성도는 별도의 사람 플레이 피드백이 필요하다.
- 공개 Pages 검증은 브랜치 배포 뒤 PR66에 해당 커밋/실행번호로 기록한다.
