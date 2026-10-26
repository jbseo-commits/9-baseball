# 가로 타석·타자 카메라 검증 — 2026-10-26

## 채택 화면

- `final-ready-844.png`: 최종 Pixi 준비 자세. 카드 원화/9존/실행 유지, 후면 타자·양 타석·홈플레이트·마운드.
- `final-wide-568.png`, `final-wide-844.png`, `final-wide-1440.png`: 최종 DOM 대체의 같은 카메라. `responsive-and-ab.json`의 문서 clientHeight=scrollHeight, 조준 칸 최소44px. 세로/가로 전환 전후 HP/자원/조준/손패 동일.
- `status-minimum-568.png`: 공방 유지 효과가 있는 최소 크기. `original-portrait-320.png`, `same-battle-portrait.png`: 기존 세로 원화/구도 보존.

## 실제 UI 플레이

로컬 fixture의 저장만 교체했고 공개 저장에서는 새 투구/초기화를 하지 않는다. 자연 완주나 밸런스 평가가 아니다.

- seed90211 긴 조건 손패, 잡아당기기·바깥쪽 조준: HP60→42, 2루타. `final-motion.json`에서 준비/로딩/트리거/스윙 시작/중간/접촉/팔로스루/감속/복귀 전부 관측. `final-contact.png`는 실제 재생의 접촉 프레임이며 강제 포즈가 아니다. 2겹의 기존 고정중심 VFX 대신 가로 Pixi의 접점 효과를 사용한다.
- 이어서 기본 스윙: HP42→41 헛스윙. `actual-motion.json`과 `dom-motion.json`에서 WebGL/DOM 양쪽의 실제 복귀 관측. DOM 미스 시 접촉 프레임이 없는 것은 기존 타임라인 계약이다.
- HP1 fixture: 실제 선택/실행→강판 KO(`ko-motion.json`: ko1 관측)→보상→지도→훈련 카드 강화→다음 스카이 팬텀 전투→새로고침/이어하기. `resume.json` 동일. 지도 문서640/998px, scrollTop29(`map-scroll.json`), 전투 전용 overflow가 지도를 잠그지 않음.

초기 `ready-844`, `motion-*`, `actual-*`, `hit-*`, `minimum-*`, `desktop-1440`는 보정 전 중간 기록을 포함한다. 최종 판정은 위 `final-*` 및 DOM/320/상태/플로우 증거를 사용한다. 강제 QA 포즈 기능은 검수용이며 실제 재생 자료와 혼동하지 않는다.

## 자동 검사 및 독립 검토

- 전체196파일 / 1,243테스트 통과 (`full-tests.txt`). 신규 카메라/지면/타격 접점/포즈 앵커/DPR 회귀8개.
- smoke4종 exit0 (`smoke-*.txt`): zone10/v9 30/growth2/deck1.
- production build 성공, dist59.5MB/60MB (`build.txt`, `budget.txt`). PNG 원본은 저장소 보존, 전송은WebP920,478bytes 추가.
- 계획 검토에서 oldrig/DOM 복귀 및 공/VFX 좌표 위험을 반영. 독립 검토에서 PC Pixi 정수 배율 내림과 세로 그림자 1% 이동을 발견해 보완했다. 가로는 정확한 투영 배율, 세로는 기존 배율/그림자. 수정 후 PC Pixi 실제 적중60→42와 접촉을 `pixi-desktop-contact.png`/`pixi-desktop-motion.json`으로 재확인했다. `pixi-final-desktop.png`는 최종 PC Pixi 준비 자세다.

실기기 주소창/safe area/터치 회전, 모든 투수의 전 포즈는 실측하지 않았다. 키포즈 기반 애니메이션을 전 프레임 신규 작화로 표현하지 않는다. 본게임 main은 병합하지 않는다. 프리뷰 배포 후 실제 URL 재검증은 별도 배포 기록에 남긴다.
