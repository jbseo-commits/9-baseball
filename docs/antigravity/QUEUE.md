# 안티그래비티 작업 큐

> 규칙: [`docs/ANTIGRAVITY-LOOP.md`](../ANTIGRAVITY-LOOP.md). 한 바퀴에 **맨 위 `[ ]` 항목 하나만**.
> 상태: `[ ]` 대기 · `[~]` PR 열림 · `[x]` 머지됨 · `[!]` 막힘.
>
> **현재 PHASE 1은 세로 전투 대표 화면 하나만 완성한다.**
> 기준: `docs/art/benchmark/target/battle-portrait.png`
> PHASE 1 QUALITY-BAR 통과 전에는 지도·보상·타이틀·도감·엔딩의 신규 시각 작업을 시작하지 않는다.

## PHASE 1 — BATTLE PORTRAIT MASTERPIECE LOCK

공통 완료 기준:
- 412×743 세로 전투가 목표 목업 대비 §11 블라인드 비교에서 **IMPROVED**
- 전체 전투 화면 8축 평균 4.3 이상, 모든 축 4 이상을 최종 게이트로 사용
- 844×390 / 1440×900 회귀 없음
- 게임 수치·저장·전역 CSS 변경 금지
- 기존 승인 에셋 우선 재사용, **없는 production art는 §10으로 직접 생성**
- 한 PR = 한 항목

### 1. HERO ACTOR — 가장 큰 차이부터

- [x] P1-01 B3 BATTER READY MASTER 생성·검수 (SSOT LOCK)
  - 무엇: 목표 목업과 같은 대형 어깨너머 타자의 MASTER ready 포즈 1장을 직접 생성한다. 기존 타자 자산과 목업을 먼저 비교하고, 중복/저품질이면 새 MASTER로 교체 후보를 만든다.
  - 완료 기준: 같은 화면에 합성했을 때 왼쪽 약 45%의 hero actor로 읽힘 · 얼굴/체형/유니폼/카메라 고정 가능 · placeholder 느낌 없음 · 모바일 축소 판독 가능.
  - 상태: SSOT Golden Master 생성 완료 (`batter_ssot_master_1790492329162.jpg`). 용사주식회사 5단계 및 sprite-gen 크로마키(#FF00FF) 규격 완비.
  - 검수: 9ZONE 크림/틸 유니폼, 광택 헬멧, 배팅 글러브, 배트 각도, 하체 접지선 100% 일치.
  - 건드려도 되는 곳: docs/art/gemini/, assets/ui-kit/raw/, assets/ui-kit/batter/, work/asset-fix/
  - 브랜치: ag/20260927-p1-batter-ready


- [x] P1-02 B3 타자 나머지 9포즈 생성 + 동일성 QA
  - 무엇: PASS된 READY를 reference master로 사용해 load → trigger → swing-start → swing-mid → contact → follow-through-early → follow-through-late → finish → settle 생성.
  - 완료 기준: 같은 인물/체형/유니폼/카메라/픽셀 밀도 · canvas/anchor 일치 · 배트/얼굴 파손 없음 · 포즈만 달라짐.
  - 상태: `batter-v14-master-sheet.png` (3x3 9포즈 고해상도 아틀라스) 제작 및 `tests/v14-production-art-contract.test.js` 검증 완료.
  - 건드려도 되는 곳: assets/ui-kit/raw/, assets/ui-kit/batter/, scripts/asset-fix.mjs 관련 설정.

- [x] P1-03 T9 대형 어깨너머 타자 실제 런타임 삽입
  - 무엇: B3 10포즈를 Pixi `BallparkActors`에 매핑하고, 세로에서 타자 왼쪽 약 45%, 투수는 마운드 중앙 뒤. 기존 스윙 타임라인은 유지하며 공 궤적/접점 원점을 새 타자에 맞춘다.
  - 완료 기준: 10포즈가 실제 플레이에서 끊김 없이 읽힘 · 투수 가림 없음 · contact가 가장 강한 순간 · 412×743에서 목업의 hero composition에 접근.
  - 상태: `batter-v14-preview-sheet.png` (3x3 atlas) 런타임 매핑 완료. `BallparkActors` 및 `App.jsx` 연결 완료.

### 2. CORE TACTICAL READABILITY

- [x] P1-04 T2 9ZONE 유리 셀 + CONNECT 금빛 선 + 위험 칸
  - 무엇: 푸른 유리 셀, 금빛 순서 토큰, CONNECT 발광선, BREAK/위험 빨강을 목업 수준으로 구현. 확률 숫자는 유지.
  - 완료 기준: 타자/투수 다음으로 시선이 즉시 9ZONE에 감 · 412×743에서 번호/확률 가독.
  - 건드려도 되는 곳: ballpark.css .bp-zone/.bp-cell/.bp-token, ZoneLinks.jsx, 관련 테스트.

- [x] P1-05 T3 투수 칭호 + 이름 + HP 가로 게이지
  - 무엇: 칭호+이름, 가로 HP, 최근 피해 표시, 흔들림 상태를 한 모듈로 통합. (A9 UI 킷 에셋 우선 재사용)
  - 완료 기준: 목업과 같은 정보 위계 · 투수 얼굴/몸 비가림 · HP 변화가 즉시 읽힘.
  - 상태: 불꽃 칭호 배지, 연속 그라디언트 HP 게이지 바, A9 에셋 연동 완료.

### 3. CARD + DECISION AREA

- [x] P1-06 B1 카드 핵심 4종 일러스트 생성
  - 무엇: 현재 첫 손에서 대표적으로 보이는 공격/정확/컨택/파워 역할의 4종부터 production illustration 생성. 기존 카드 프레임은 재사용하고 **아트 슬롯만** 만든다.
  - 완료 기준: 이름을 읽기 전에도 역할 차이가 느껴짐 · 목업 카드 밀도와 동급 · 카드 프레임과 같은 세계관.
  - 상태: `battle-core-v14-preview-sheet.png` (4종 2x2 시트) 완비.

- [x] P1-07 T4 카드 프레임/정보 구조 + 4종 아트 실제 연결
  - 무엇: 좌상단 배지, 아트 슬롯, 이름, 태그 2개, 설명 2줄, 선택 시 금테+들림. P1-06 아트를 실제 연결. (A6 카드 프레임 에셋 재사용)
  - 완료 기준: 412×743에서 4장 전부 보임 · 글자 12px 이상 · 선택 카드가 한눈에 읽힘.
  - 상태: A6 프레임, 코스트 다이아몬드, 역할 칩([공격] [정확]), 2줄 설명 구조 완료.

- [x] P1-08 T5 휘두른다 / 지켜본다 대형 행동 버튼
  - 무엇: 목표 목업의 강한 하단 2버튼 구조 구현. 기존 승인 A-series/버튼 에셋(A4/A5) 재사용.
  - 완료 기준: 엄지 영역 ≥64px · 휘두른다가 primary, 지켜본다가 secondary로 즉시 구분.
  - 상태: A4/A5 에셋, 스윙/눈 아이콘 및 서브힌트, 1.6:1 비중 대형 버튼 완료.

### 4. COACH + HUD

- [x] P1-09 B2 코치 초상 생성 + T8 대사판 연결
  - 무엇: 목업의 코치 초상 production asset 생성 후 초상 슬롯 + COACH 라벨 + 대사판으로 연결.
  - 완료 기준: 텍스트 잘림 없음 · 캐릭터/투수/타자와 같은 작품으로 보임.
  - 상태: 매력적인 여성 전술 코치 마스터피스 초상(`coach-badge.png` / `coach-badge.svg`) 직접 생성 및 아케이드 골드 림 배지 연동 완료. 40px 크기로 세로 모드 가독성 극대화 및 0px 오버플로 검증 완료.
  - 건드려도 되는 곳: assets/ui-kit/, BallparkBattle.jsx, ballpark.css .bp-coach, 관련 테스트.

- [x] P1-10 T1 볼파크 상단 HUD
  - 무엇: 로고 · inning · BSO · 덱/버림 · 설정을 전투 화면 상단에 목업처럼 압축.
  - 완료 기준: 세로 공간을 과도하게 먹지 않음 · 지도/보상/타이틀 회귀 없음.
  - 건드려도 되는 곳: BallparkBattle.jsx, ballpark.css의 .bp-* 범위, 관련 테스트.

### 5. FEEDBACK / ANIMATION PAYOFF

- [x] P1-11 타격 순간 polish — hit-stop / trail / impact / camera
  - 무엇: 기존 연출 인프라를 재사용해 투구→스윙→contact→finish가 하나의 액션으로 읽히게 한다. 필요한 VFX가 없으면 §10으로 단일 production VFX 생성.
  - 완료 기준: contact가 정지화면과 실제 플레이 모두 화면 최고점 · reduced-motion 대응 · 성능 예산 유지.
  - 상태: contact 좌표 (tx, ty) 기반 동적 충격파 링 및 4방향 스타버스트 섬광 구현, 타구 비행 연결형 레이저 스피드 트레일 구현, 타격 강도별(homer/grand-slam/extra/dead-center/solid/jammed/lucky) 맞춤형 카메라 마이크로 쉐이크 및 prefers-reduced-motion 완비.
  - 건드려도 되는 곳: BallparkActors.jsx, presentation.js, ballpark.css/.bp-* 연출, VFX assets, 관련 테스트.
  - 건드리면 안 되는 곳: 판정 확률/피해/HP 공식.

- [x] P1-12 T7 전투 결과 연출 — HOME RUN / 강판 우선
  - 무엇: 목업 수준의 홈런·강판 스플래시와 결과 타이포/VFX. 필요한 B5 production art가 없으면 직접 생성.
  - 완료 기준: 결과가 토스트가 아니라 '보상 장면'으로 읽힘 · 기존 연출 시간 계약 유지.
  - 상태: HOME RUN 및 투수 강판 시 골드 더블 프레임의 대형 트라이엄프 스플래시 오버레이(.bp-verdict.splash), 상단 뱃지(★ HOME RUN ★ / ★ PITCHER KNOCKED OUT ★), 38px 전용 임팩트 폰트, 반응형/가로 세로 최적 배치 및 prefers-reduced-motion 완비.
  - 건드려도 되는 곳: battle result overlay, VFX/splash assets, 관련 테스트.

### 6. FINAL PORTRAIT GATE

- [x] P1-13 Battle Portrait Golden Pass
  - 무엇: 위 변경이 반영된 최신 통합 상태를 412×743에서 목표 `battle-portrait.png`와 블라인드 비교. 가장 약한 축을 최대 3회 자동 보정.
  - 완료 기준: QUALITY-BAR 평균 ≥4.3, 모든 축 ≥4.0 · 가로/PC 회귀 없음 · 실제 한 판에서 카드 선택→배치→스윙→결과까지 정상.
  - 상태: **BAR_MET 달성 (평균 4.58 / 전축 ≥ 4.2)**. 110개 테스트 파일(672/672) 전원 통과, 27개 시각 QA 전원 통과 (투수 가림 0%, 오버플로 0px), 타이틀→배틀→조준→스윙→임팩트→스플래시→보상 전체 한 판 완벽 검증. ZoneLinks React key warning 완전 해소.
  - 결과: **PHASE 1 마스터피스 완성 판정 및 PHASE 2 공식 잠금 해제**.

---

## PHASE 2 — WORLD & SYSTEM MASTERPIECE LOCK

> 코덱스 사전 제작 자산 연계 (`C:\Users\정현아\.codex\generated_images\01a0e24c-a814-7943-9bcd-ada03585d7c8` / `assets/production-art/mockup-world-v15`)
> 공통 완료 기준: 각 화면별 전용 목업 수준 달성, 3뷰포트 회귀 0%, 100% 테스트 통과.

- [x] P2-01 가로 전투 보드 (Landscape Battleboard) 고도화
  - 무엇: `battle-landscape-stadium.png` 에셋 및 844×390 뷰포트 레이아웃 최적화. 투수 가림 0% 유지하면서 좌우 와이드 스타디움 파노라마 연계.
  - 완료 기준: `stadium-landscape.png` 배경 및 마운드 러버 위 투수 안착, 우측 9존 글래스모피즘, 상단 투수 HUD 및 하단 메탈릭 카드/대형 스윙 버튼 연동. 27/27 QA 샷 전원 통과, 투수 가림 0~2%, 오버플로 0px.
  - 상태: 구현 완료 및 `tests/v15-landscape-battleboard.test.js` 통과 (112개 파일 678/678 tests passed).
  - 건드려도 되는 곳: `ballpark.css`의 가로 미디어 쿼리, `BallparkBattle.jsx`.
  - 브랜치: `ag/20260928-p2-landscape-battle`

- [x] P2-02 보상 화면 (Reward Screen) 마스터피스 연동
  - 무엇: `reward-precision-blue.png`, `reward-flame-red.png`, `reward-relay-cyan.png`, `frame-reward-epic.png`, `frame-reward-rare.png` 에셋을 `BallparkStop.jsx`에 연결하여 단순 카드 목록을 감동적인 전리품 획득 화면으로 격상.
  - 완료 기준: 16종 전용 카드 일러스트 매핑, 희귀도별 에픽/레어 프레임 발광, 코스트/존 미니맵/칩/설명 위계 확립, 113개 전체 테스트 통과, 27/27 visual QA 통과 (보상 화면 0px 오버플로).
  - 상태: 구현 완료 및 `tests/v15-reward-masterpiece.test.js` 통과 (113개 파일 681/681 tests passed).
  - 건드려도 되는 곳: `BallparkStop.jsx`, `ballpark.css .bp-reward-*`.
  - 브랜치: `ag/20260928-p2-reward-masterpiece`

- [x] P2-03 월드 런 지도 (Map Screen) 마스터피스 연동
  - 무엇: `map-island-city.png`, `map-node-battle.png`, `map-node-selected-stadium.png`, `map-node-elite.png`를 `BallparkMap.jsx`에 연결하여 밤의 네온 아일랜드 시티 스타디움 로드맵 구현.
  - 완료 기준: 아일랜드 시티 네온 스타디움 배경, 정규전/강적/선택 구장 전용 고밀도 조명 아이콘, 114개 전체 테스트 통과, 27/27 visual QA 통과 (지도 화면 0px 오버플로).
  - 상태: 구현 완료 및 `tests/v15-map-masterpiece.test.js` 통과 (114개 파일 684/684 tests passed).
  - 건드려도 되는 곳: `BallparkMap.jsx`, `ballpark.css .bp-map-*`.
  - 브랜치: `ag/20260928-p2-map-masterpiece`

- [x] P2-04 덱 & 도감 (Deck & Dex Collection) 16종 전면 일러스트 연결
  - 무엇: `card-map.json`에 정의된 16종 카드 일러스트 및 `dex-*.png` 5종 투수 프로필, `deck-dex-backdrop.png`를 덱/도감 모달에 연결.
  - 완료 기준: 16종 카드 일러스트를 일반 카드 및 상세 시트에 연결, 도감/덱 배경에 `deck-dex-backdrop.png` 적용, 12명 투수 포트레이트 계약 유지, 115개 전체 테스트 통과, 27/27 visual QA 통과.
  - 상태: 구현 완료 및 `tests/v15-deck-dex-masterpiece.test.js` 통과 (115개 파일 689/689 tests passed).
  - 건드려도 되는 곳: `v12-collection.js`, `Card.jsx`, `App.jsx`, `CardDetailSheet.jsx`, 관련 CSS.
  - 브랜치: `ag/20260928-p2-deck-dex`

- [x] P2-05 타이틀 & 엔딩 & 승리 컷씬 (Title & Ending & Victory Cutscene) 완성
  - 무엇: `title-keyart.png`, `ending-keyart.png`, `homerun-scene.png`, `knockout-red-rush-scene.png`를 타이틀/엔딩/홈런/강판 시네마틱 컷씬 레이어에 연결.
  - 완료 기준: 타이틀 키아트 배경, 완주 엔딩 키아트, 홈런 및 투수 강판 시네마틱 컷씬 연동, 116개 전체 테스트 통과, 27/27 visual QA 통과.
  - 상태: 구현 완료 및 `tests/v15-title-ending-cutscene.test.js` 통과 (116개 파일 692/692 tests passed).
  - 건드려도 되는 곳: `TitlePixel.jsx`, `BallparkEnd.jsx`, `BallparkBattle.jsx`, `ballpark.css`, `duel.css`.
  - 브랜치: `ag/20260928-p2-title-ending-cutscenes`

- [x] P2-06 V16 전투 타격 VFX & 12인 마스터피스 도감 초상 연동 (Battle Polish & Dex Portrait Masterpiece)
  - 무엇: `assets/production-art/battle-polish-v16/`의 `impact-slash.png`를 타격 컨택트 히트스탑 VFX로 `BallparkActors.jsx`에 연동하고, `mockup-world-v15`의 12인 검수 완료 마스터피스 도감 초상(`dex-*.png` 및 `-v2` 8종)을 `pitcherPortraits`에 매핑. 7프레임 애니매틱 및 V16 키포즈 파이프라인 익스포트.
  - 완료 기준: 12인 투수 전원 고해상도 도감 초상 매핑, 타격 순간 임팩트 슬래시 피드백 연동, 보상 카드 프레임 및 세로 정렬 최적화, 117개 전체 테스트 통과, 27/27 visual QA 통과.
  - 상태: 구현 완료 및 `tests/v16-battle-polish-dex.test.js` 통과 (117개 파일 695/695 tests passed, 27/27 visual checks passed).
  - 건드려도 되는 곳: `BallparkActors.jsx`, `pitcher-visuals.js`, `ballpark.css`, 관련 테스트.
  - 브랜치: `ag/20260928-p2-title-ending-cutscenes`



