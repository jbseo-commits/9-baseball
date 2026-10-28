# 전투 프리뷰 사용성 보완 사전 영향도 — 2026-10-28

기준 e1ff0db / PR #66 OPEN. origin/feat/mockup-battle-v1는 d7ac2b5로 추가 Claude 커밋 없음. Codex 단독 편집, 별도 reviewer 사전 읽기 전용 검토.

범위 수정: 사용자 지시 “세로는 생각하지마, 가로로 개선하고 완성하자”에 따라 이번 세로 전용 조정을 철회했다. 휴대폰 가로/PC만 개선한다. 근거: 긴 결과/지원 설명이 오른쪽 rail의 행동을 아래로 밀 수 있고, 결과는 작은 rail line만 표시하며 stage variant는 미사용. 지원/대기 선택 outline이 keyboard focus outline을 덮는 CSS 우선순위도 확인.

| 축 | 영향 | 대응 |
|---|---|---|
| UI/레이아웃 | 있음 | 같은 단일 행동을 새 View footer 한 곳에 배치. 가로 command rail에 결정 내용과 행동을 형제로 배치. 긴 설명만 scroll하고 단일 실행은 항상 rail 아래에 노출. 큰 화면에서는 요약 바로 아래로 붙여 시선 이동 축소. safe-area 공간 확보. 결과는 시각용 큰 call/tag만 추가해 해설 반복 방지. |
| 입력/제스처 | 있음 | 기존 callbacks/잠금/fired guard 공유. 손패 swipe와 inspector 유지, 키보드 focus 표시 강화. footer 겹침·중복 버튼 실검증. |
| 게임 로직/밸런스 | 없음 | engine/cards/확률/HP 무변경. 결과 표현은 실제 result/shot grade만 사용. |
| 저장/불러오기 | 없음 | 상태/저장 소유권·schema 그대로. 기존 seeded save parity smoke 재사용. |
| 모바일 viewport | 있음 | 가로 667×375/740×360/844×390/1024×768/1440×900/1920×1080에서 실제 캡처·rect. 세로 전용 추가 개발은 제외. |
| 스크롤/overflow | 있음 | 고정 footer 높이·safe area만큼 content 여백 확보. 긴 rail summary는 footer 위에서 scroll. 비전투 root 불변. |
| 기존 플로우 | 확인 필요 | 기존 UI/연습/미지원 상대 fallback 변경 없음. 새 View 선택/결과/다음 공/정보창 pause 확인. |
| 테스트/회귀 | 있음 | 중복 실행 guard·phase별 call·one action·inspector lock·keyboard focus·실 viewport 조작 검사. 전체 테스트. |
| 빌드/배포 | 있음 | 신규 이미지/패키지 없음. dist/build 및 /9-baseball/ prefix production preview 검사. PR #66 업데이트, main 변경 없음. 기존 Pages workflow가 main root+격리 branch preview를 게시함을 확인. |

최종 G1 완료는 아직 주장하지 않음. approvedArtIds=[] 그대로, 모션/원화 승인을 대신하지 않는다. 가로에서 UI와 배우의 겹침, 실행 접근성, 실제 결과 강조를 집중 검증한다.
