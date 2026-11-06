# 게임주스 레퍼런스100 — 9ZONE 적용 분석

2026-11-06 KST · 게임100종 / 공식 페이지100 / 첫 공식 스크린샷100 / 공식 트레일러15종에서 시각 확인한 표본90장.

**핵심은 더 많은 효과가 아니라, 내가 놓은 모양·던져진 공·맞은 접점·확정된 결과가 한 행동으로 읽히는 것이다.** 이 게임에서는 액션 게임의 화면 전체 폭발보다 정리/블록 게임의 목적지 정합과 야구 동작의 연속성이 우선한다. 카드가 3칸을 덮으면 세 번 터지는 것이 아니라 하나의 3칸 물체가 들어맞아야 한다.

## 확인 수준

- 100종은 DLC·데모·다른 플랫폼판 중복 없이 정식 게임 App ID100개다. 후속작은 다른 게임이지만 참고 포인트도 구별한다. 상업 성공 순위나 인기100위 목록이 아니다.
- 공식 Steam 검색/appdetails로 게임명·제작사·소개·미디어 출처를 확인했다. URL만 살아 있다는 사실은 해당 애니메이션의 증거가 아니다.
- 첫 스크린샷100장을 실제 확인했다. 타이틀/홍보 이미지인 사례는 연속 게임 동작을 입증하지 않는다. A02/J05/J09/H09 등은 이 한계를 각 행에 적었다.
- 핵심15종은 공식 HLS를 실제 디코딩하고 각6개의 시간 표시 프레임을 확인했다. 홍보 문구/컷 전환도 그대로 기록했다. [영상 관찰 원장](video-evidence.json)은 실제 movie ID·URL·native rate·표본 시각·보이는 것/입증되지 않은 것을 보존한다. 전체 영상 재생·청취·정밀 프레임 실측100개를 했다고 주장하지 않는다.
- 개별 게임의 hitstop 길이·카메라 진폭·소리의 음색은 이 자료에서 실측하지 않았다. 아래 메커니즘은 공식 설명/화면과 알려진 게임 구조를 바탕으로 한 **설계 해석·검증할 가설**이며, 우리 게임용 시간 수치는 **제안 또는 기존 구현값**이다.

## 이 게임에 필요한 일곱 원리

| 원리 | 왜 필요한가 | 적용 방향 |
|---|---|---|
| 사건 전 대비 | 계속 밝으면 접점이 커 보이지 않는다 | 선택 중은 안정, 준비 포즈→릴리스→접점의 대비 |
| 같은 모양 유지 | 카드가 사라지고 다른 효과가 나오면 원인을 잃는다 | 실제 coverage를 유지한 한 덩어리와 같은 목적지 외곽선 |
| 정확한 정합 | 대충 가까이 오는 효과는 '꽂힘'이 아니다 | 실제 DOM 셀 경계와 실루엣 일치, clipped shape/구멍 보존 |
| 한 번의 잠금 | 3칸이 독립적으로 터지면 한 카드로 안 보인다 | 공동 착지 유지, 한 번의 짧은 주변부 반응 |
| 결과가 남음 | 반짝임 뒤 원래 상태로 돌아가면 선택을 기억하기 어렵다 | 임시 몸체를 걷고 기존 실제 범위·역할 번호를 즉시 읽힘 |
| 보상의 강약 | 평타가 잭팟이면 홈런도 평범해진다 | 장착·범위 적중·정타·홈런·강판 차등, 실제 결과에만 반응 |
| 감각과 조작 분리 | 멋진 효과가 입력을 막으면 손맛이 나빠진다 | 추가 확인 단계/입력 잠금 없이 배속·취소·음소거·reduced 경로 보존 |

## 실제 적용 범위

현재 후보 기준28f4fa3에서 공동 carrier·3칸 hold·동시 착지·2/3장 배치는 이미 구현돼 있다. 이번 개선은 **목적지 ghost/닫힌 topology, 하나의 주변부 잠금, 장착 직후 가독성 회복, 다중 보이스 gain 정규화, 실제 위치 stereo 이동**이다. 타자/투수의 새 팔·골반 중간 그림을 이 연구나 필터로 대신하지 않는다. 기존 G020 HELD3/3/G013 보류는 초기화하지 않으며 전체 후보는 Draft다. 최신 G021 독립 판정도 **3.27→3.38(+0.10),1/8축 개선, NOT_IMPROVED / HELD1/3**다. R6 글자 가독 평균은2.2→3.0으로 좋아졌지만 전체 시각 개선 기준은 통과하지 못했다. 상업 품질 PASS가 아니다.

| 상태 | 사례 수 | 뜻 |
|---|---:|---|
| 이번 원리 적용 | 44 | 해당 사례에서 뽑은 공통 원리를 P01~P05에 연결. 개별 게임 기능을 그대로 복제한 수가 아님 |
| 기존 후보 연결 | 41 | 기존 후보에 있는 계약을 유지. 이번 신규 구현이나 시각 품질 통과를 뜻하지 않음 |
| 후속 원화·검수 | 9 | 새 동작 원화/별도 검수가 필요하며 이번에 완료했다고 하지 않음 |
| 충돌로 제외 | 6 | 현 게임의 턴제·가로 입력·가독성과 충돌하는 원작 규칙은 추가하지 않음 |

### 구현 연결표

| 묶음 | 구체적인 적용 | 파일/상태 |
|---|---|---|
| P01 | 실제 coverage와 같은 닫힌 목적지 실루엣·정합 | placement-motion.js / CoverageInsert.jsx |
| P02 | 장착 직후 불투명 표면을 걷어 존 정보 회복 | placement-feedback.css |
| P03 | 한 물체의 주변부 잠금·짧은 외곽선 trace | placement-feedback.css |
| P04 | 동시 배치 보이스 gain 정규화·자연 종료/취소 회수 | placement-audio.js |
| P05 | 실제 출발→도착 위치에 맞춘 stereo pan | CoverageInsert.jsx / placement-audio.js |
| P06 | 기존 주공격/지원 역할·순서·겹침 유지 | 기존 StackPlacement.jsx / 실제 pieces와 links |
| P07 | 기존 G020 공유 시계·릴리스·공/접촉 FX 후보 유지 | 기존 G020 후보; 여전히 HELD3/3 |
| P08 | 기존 실제 결과 공개 경계·발동/HP 인과 유지 | 기존 VM / presentation boundary; 계산 재작성 없음 |
| P09 | 새 사지 중간 그림·실제 폼별 연속 동작 후속 제작 | 아래 원화 명세, 미완료 |
| P10 | 기존 홈런/강판 전용 대비 유지·상업 품질 미확정 | 기존 cinema-director / 결과 타이밍, 추가 변경 없음 |
| P11 | 새 장르 규칙·QTE·지속 자극은 충돌로 제외 | 이번 규칙 추가 제외 |

### 제안 시간의 출처

기존 카드1칸 lock460ms, 여러 칸 lock680ms·읽기260–400ms·수명1280ms는 이미 게임에 있던 값이다. 이번 표면 회수150ms·외곽선 trace310ms·보이스 gain 전이12ms는 **우리 게임용 조정값**이며 Tetris/Balatro 등에서 실측한 수치가 아니다. 배속에 따라 시각/이벤트 시작이 함께 변하며 소리 자체의 envelope/pitch는 유지한다. 청감·재미·실기기 성능은 별도 사람 검증이 필요하다.

## 우선 검토할15개 실제 미디어

### A01 Super Mega Baseball™ 4

- [공식 출처](https://store.steampowered.com/app/1487210/) · 트레일러 `Buy Now version` / ID `256948711`.
- 확인 표본: 9.009s, 21.021s, 33.033s, 45.045s, 57.057s, 67.568s.
- 직접 보이는 근거: 33.033s 슬라이딩하는 야수의 몸과 공/글러브,45.045s 타자 소개의 큰 표정,57.057s 포수 뒤 타격 장면과 큰 홍보 문구,67.568s 팔을 벌린 인물 컷이 보인다.
- 한계: 6표본 중 순수 연속 투구가 없어 실제 팔/발 릴리스 타이밍이나 손맛을 실측했다고 할 수 없다. 소리 미청취.

### A02 BASEBALL STARS 2

- [공식 출처](https://store.steampowered.com/app/366230/) · 트레일러 `BASEBALL STARS 2 promotional trailer` / ID `256663236`.
- 확인 표본: 9.008s, 21.019s, 33.029s, 45.04s, 57.051s, 67.56s.
- 직접 보이는 근거: 21.019/33.029/57.051s 타자 뒤 카메라의 타석·투수·대치 포즈,67.56s 크게 잡힌 공의 추적 컷이 보인다. 첫 정지화면은 타이틀이었으나 영상에는 실제 플레이가 있다.
- 한계: 분리된 샘플이므로 같은 투구의 준비→릴리스→접촉 순서나 정지 길이를 증명하지 않는다. 소리 미청취.

### A03 Lethal League Blaze

- [공식 출처](https://store.steampowered.com/app/553310/) · 트레일러 `Lethal League Blaze Trailer` / ID `256728369`.
- 확인 표본: 8.326s, 19.428s, 30.53s, 41.632s, 52.733s, 62.447s.
- 직접 보이는 근거: 41.632s 큰 휘두름 실루엣,52.733s 작은 발광 공 중심의 원·방향선과 바닥 근처 인물이 보인다. 다른 표본은 배경 소개/캐릭터 컷이다.
- 한계: 타격정지·공 가속·상대 피격 기간을 이 표본에서 수치화할 수 없다. 소리 미청취.

### B06 Katana ZERO

- [공식 출처](https://store.steampowered.com/app/460950/) · 트레일러 `Launch Trailer` / ID `256748374`.
- 확인 표본: 9.008s, 21.019s, 33.029s, 45.04s, 57.051s, 67.56s.
- 직접 보이는 근거: 9.008s side-view pixel-art corridor; player character is small against a long, quiet, high-contrast hallway and window light. / 21.019s cluster of red and cyan effects and several tiny figures overlap near the floor in a dark room. / 33.029s a cyan horizontal slash/blur crosses several red sprites; an enemy figure appears at the right edge of the effect. / 45.04s two enemies stand at left while player appears low/center in a side-view room. / 57.051s combat composition with multiple sprites, bright clustered effects, and the phrase “HALT MEATMAN. YOUR PUNY” visible at left. / 67.56s wide cutaway view of two adjacent rooms, characters and environmental objects visible.
- 한계: 6개 표본이며 연속 동작·정지 길이·음향을 검증하지 않음

### C08 Darkest Dungeon® II

- [공식 출처](https://store.steampowered.com/app/1940340/) · 트레일러 `Darkest Dungeon II - K3: Curse of the Court` / ID `257189874`.
- 확인 표본: 8.102s, 18.905s, 29.707s, 40.51s, 51.313s, 60.765s.
- 직접 보이는 근거: 8.102s dark red publisher/title card. / 18.905s stylized combat illustration with multiple combatants and “The Thirst” label. / 29.707s map selection screen with multiple branching route diagrams and small node symbols. / 40.51s combat image with a “Bloodlust” label; figures/effects occupy a tight horizontal strip. / 51.313s wide side-on lineup: party at center with enemies visible on both sides; dark red palette. / 60.765s red title card “Darkest Dungeon: Kingdoms Curse of the Court.”
- 한계: 6개 표본이며 연속 동작·정지 길이·음향을 검증하지 않음

### D01 Slay the Spire

- [공식 출처](https://store.steampowered.com/app/646570/) · 트레일러 `Launch Trailer` / ID `256740869`.
- 확인 표본: 9.004s, 21.009s, 33.015s, 45.02s, 57.025s, 67.53s.
- 직접 보이는 근거: 9.004s: card-like game art/title card with a large number and a loading/progress strip. / 33.015s: branching map nodes and a cursor/marker over a selected route. / 67.530s: combat screen with player and enemy, health bars, and status/number UI. / Other sampled moments are review quote/title cards.
- 한계: The sparse samples do not show a continuous card being picked up, ranged, moved into a slot, or settling. / No causal card-play-to-impact sequence, animation duration, sound, or timing can be derived from these frames.

### D05 Balatro

- [공식 출처](https://store.steampowered.com/app/2379780/) · 트레일러 `Accolades Gameplay Video` / ID `257198110`.
- 확인 표본: 4.64s, 10.827s, 17.013s, 23.2s, 29.387s, 34.8s.
- 직접 보이는 근거: 4.64s 조커 그림 열,10.827s 덱/스테이크 선택,17.013s 토성 카드,29.387s 플레이 손패·곱셈·조커·점수가 다른 영역에 위치한다.
- 한계: 배율 발동의 정확한 순서·팝 타이밍·오디오 상승은 6표본으로 측정하지 않았다. 소리 미청취.

### E01 Into the Breach

- [공식 출처](https://store.steampowered.com/app/590380/) · 트레일러 `Into The Breach - Announcement Trailer` / ID `256679224`.
- 확인 표본: 8.464s, 19.75s, 31.036s, 42.322s, 53.608s, 63.483s.
- 직접 보이는 근거: 8.464s: isometric tactical tile board with units/terrain; dialogue overlay. / 19.750s: tactical board with highlighted cells, unit/attack UI and visible target/effect markers around enemies. / 31.036s: a bright attack-like line/effect crosses a dark board between separated units/tiles. / 42.322s: board state with many highlighted/outlined tiles and units, plus turn/attack UI. / 53.608s: another board state with units and terrain; 63.483s is a studio end card.
- 한계: Six stills do not establish the order or duration of target preview, movement, attack, impact, or tile resolution. / No card hand/range-to-slot insertion sequence is visible in these samples; this is a grid-threat/target-preview reference only. / No sound, input latency, exact frame timing, or continuous animation claim.

### F01 Tetris® Effect: Connected

- [공식 출처](https://store.steampowered.com/app/1003590/) · 트레일러 `Launch Trailer` / ID `256847227`.
- 확인 표본: 9.005s, 21.012s, 33.018s, 45.025s, 57.032s, 67.537s.
- 직접 보이는 근거: 9.005s 리뷰 문구 뒤 작은 테트리스 필드,45.025s 파란 블록 군집의 연결형 보드와 중앙 국소 섬광이 보인다.21/33/57/67초는 문구·브랜딩 비중이 크다.
- 한계: 이 트레일러 샘플에서 하드드롭·고스트·lock delay·음악 동기화를 관찰했다고 하면 안 된다. 기존 테트리스 규칙 기반 가설과 별도로 표시한다.

### G02 A Little to the Left

- [공식 출처](https://store.steampowered.com/app/1629520/) · 트레일러 `Launch Trailer` / ID `256915259`.
- 확인 표본: 7.338s, 17.122s, 26.906s, 36.69s, 46.474s, 55.035s.
- 직접 보이는 근거: 7.338s: game title/menu. / 17.122s: a row of patterned books aligned upright on a shelf. / 26.906s: three framed picture panels arranged side by side. / 36.690s: overhead dish/place setting with centered plate and utensils. / 46.474s: handheld gameplay view; 55.035s: objects organized on horizontal shelves.
- 한계: These samples show ordered end states, not the continuous act of dragging, snapping, or settling an object. / No evidence for a card range, grid slot, animation timing, or audio cue.

### G04 Assemble with Care

- [공식 출처](https://store.steampowered.com/app/1202900/) · 트레일러 `Gameplay Preview` / ID `256770354`.
- 확인 표본: 3.6s, 8.4s, 13.2s, 18.0s, 22.8s, 27.0s.
- 직접 보이는 근거: 3.600s: disassembled electronics and tools laid out on a work surface. / 8.400s and 13.200s: a central device board with small separate components around it; the frames differ in component arrangement. / 18.000s: a larger dark casing/part is isolated prominently among smaller objects. / 22.800s and 27.000s: a more assembled portable player is centered, with nearby accessories.
- 한계: The stills suggest parts and assembled states, but do not prove that a particular small component travels from a specific source position into a specific slot. / No continuous range-to-slot movement, snap/settle timing, sound, or frame duration is established.

### H03 Ballionaire

- [공식 출처](https://store.steampowered.com/app/2667120/) · 트레일러 `Launch Trailer` / ID `257078919`.
- 확인 표본: 5.984s, 13.963s, 21.941s, 29.92s, 37.899s, 44.88s.
- 직접 보이는 근거: 5.984s triangular pegboard-like board with many small characters/objects, values such as $400, and bouncing/impact-like visual clusters in a promotional game capture. / 13.963s closer view of the board shows many distinct fruit/food-like pieces, labels such as $1/$600, and multipliers like x3. / 21.941s banner text reads “MASTER EACH BOARD” over an illustrated patterned background. / 29.92s banner reads “MAKE COOL COMBOS” with small game pieces and coin-like icons. / 37.899s cartoon character holds a globe-like object; non-gameplay promotional imagery. / 44.88s Ballionaire logo and “AVAILABLE NOW ON STEAM” end card.
- 한계: 6개 표본이며 연속 동작·정지 길이·음향을 검증하지 않음

### H06 Stacklands

- [공식 출처](https://store.steampowered.com/app/1948280/) · 트레일러 `gameplay_trailer` / ID `256880780`.
- 확인 표본: 8.12s, 18.947s, 29.774s, 40.601s, 51.427s, 60.901s.
- 직접 보이는 근거: 8.120s: separate resource/entity cards on a green field; a Tree/Villager card and Berry Bush card are labeled. / 18.947s: cards remain spatially separated; a turn/end-of-month panel is visible. / 29.774s: tutorial subtitle explicitly says “For example, dragging a ‘Villager’ card”; a card is shown overlapping/near another card, with a dark overlap/shadow. / 40.601s: instruction text explicitly states two wood, one stone, and one villager are needed to create a house. / 51.427s: many cards and organized stacks occupy a broad play area.
- 한계: The six samples support card dragging/overlap as a mechanic, but cannot reconstruct the full drag path, exact target hitbox, snap behavior, or settle duration. / The overlap shadow does not by itself prove a specific placement preview or final lock state. No audio or timing claim.

### I01 Hi-Fi RUSH

- [공식 출처](https://store.steampowered.com/app/1817230/) · 트레일러 `Hi-Fi RUSH | Gameplay Deep Dive Trailer` / ID `257229003`.
- 확인 표본: 9.005s, 21.012s, 33.018s, 45.025s, 57.032s, 67.537s.
- 직접 보이는 근거: 9.005s third-person character lies on a city street; broad scene, no combat HUD visible. / 21.012s combat arena with player, an enemy, hit-count/score HUD and a prominent C grade at upper right. / 33.018s player and enemy mid-combat with bright curved attack effects; combo count and C grade visible. / 45.025s player faces camera in arena; a red “LOCKED” label appears over a door, with clear floor emblem. / 57.032s player stands over a downed enemy; C grade remains visible; scene is relatively uncluttered. / 67.537s player low to the ground with a curved cyan effect and a bright white figure/effect at right; combat HUD remains.
- 한계: 6개 표본이며 연속 동작·정지 길이·음향을 검증하지 않음

### J01 Vampire Survivors

- [공식 출처](https://store.steampowered.com/app/1794680/) · 트레일러 `Refreshed Trailer` / ID `256964120`.
- 확인 표본: 7.2s, 16.8s, 26.4s, 36.0s, 45.6s, 54.0s.
- 직접 보이는 근거: 7.2s small player centered in an open grass field with a few separated enemies; narrow dirt path provides an axis. / 16.8s player faces a dense group of enemies; several blue/cyan effects or pickups sit near the mass; quote text overlays left. / 26.4s large circular/arcane-looking effect fills most of the view; player remains small near center and yellow upgrade text is visible. / 36.0s upgrade/item selection-like screen with several colored radial lanes, item icons, and a heart icon. / 45.6s award logos on a promotional card. / 54.0s promotional character art and platform logos.
- 한계: 6개 표본이며 연속 동작·정지 길이·음향을 검증하지 않음

## 100개 개별 분석

각 행의 ‘원리’는 설계 해석이다. 화면/영상의 실제 관찰 범위는 [전체 데이터](references.json)의 근거 항목과 위 원장을 함께 본다.

### A. 야구·스포츠의 신체 동작

| ID·공식 출처 | 참고 장면·작동 원리 | 9ZONE 적용 | 피할 점 | 처리 |
|---|---|---|---|---|
| A01 [Super Mega Baseball™ 4](https://store.steampowered.com/app/1487210/) | 투구·스윙·타구 추적<br>설계 해석: 스포츠의 무게감은 공보다 몸의 예비 동작과 결과 뒤 몸짓에서 시작한다 | 후속 제작·검수: 새 사지 중간 그림·실제 폼별 연속 동작 후속 제작. 이번 적용 완료가 아니며 새 사지 그림을 아직 반입하지 않았다. | 타격마다 중계 카메라를 전환하면 중앙 존 조작 기준이 사라진다 | 후속 원화·검수 · P09 |
| A02 [BASEBALL STARS 2](https://store.steampowered.com/app/366230/) | 투구 대치와 큰 공·얼굴 컷<br>설계 해석: 작은 도트 선수도 자세·공 크기·선택적 클로즈업으로 사건의 급을 나눈다 | 후속 제작·검수: 새 사지 중간 그림·실제 폼별 연속 동작 후속 제작. 이번 적용 완료가 아니며 새 사지 그림을 아직 반입하지 않았다. | 낮은 해상도와 과장 비율을 그대로 복사하지 않는다 | 후속 원화·검수 · P09 |
| A03 [Lethal League Blaze](https://store.steampowered.com/app/553310/) | 공을 받아칠 때의 방향성 있는 반응<br>설계 해석: 원형 타격 지점과 길게 읽히는 몸 실루엣이 같은 곳을 가리키면 입력 결과가 연결된다 | 기존 후보의 원리를 유지: 기존 G020 공유 시계·릴리스·공/접촉 FX 후보 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 공의 속도 표현을 위해 존 전체를 가리지 않는다 | 기존 후보 연결 · P07 |
| A04 [Windjammers 2](https://store.steampowered.com/app/1114290/) | 원반을 받거나 되치는 접점<br>설계 해석: 빠른 물체의 가는 궤적과 선수 주변의 짧은 호가 이동과 접촉을 나눈다 | 기존 후보의 원리를 유지: 기존 G020 공유 시계·릴리스·공/접촉 FX 후보 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 공격 예고와 결과 궤적을 같은 색·밝기로 쓰지 않는다 | 기존 후보 연결 · P07 |
| A05 [Tape to Tape](https://store.steampowered.com/app/1566200/) | 슛 방향과 퍽·선수의 위치 관계<br>설계 해석: 지면의 방향 표시가 결과를 설명하므로 거대한 효과 없이 공격 의도가 읽힌다 | 기존 후보의 원리를 유지: 기존 실제 결과 공개 경계·발동/HP 인과 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 적의 실제 투구 위치를 결정 단계에서 미리 알려 주지 않는다 | 기존 후보 연결 · P08 |
| A06 [Golf With Your Friends](https://store.steampowered.com/app/431240/) | 공을 보내고 정지 위치를 확인<br>설계 해석: 모든 이동을 보상으로 포장하기보다 작은 물체가 목적지에 멈추는 순간이 기준이 된다 | 물체가 목적지에 멈추는 원리를 실제 coverage와 동일한 고정 ghost에 적용한다. 새 카메라 이동이나 골프 규칙은 추가하지 않는다. | 매 장착마다 카메라 이동·줌을 하지 않는다 | 이번 원리 적용 · P01 |
| A07 [Pyre](https://store.steampowered.com/app/462770/) | 팀·구체·목표 영역 구별<br>설계 해석: 캐릭터보다 지면 링과 구체의 위치를 먼저 읽게 하면 공간 의사결정이 쉬워진다 | 기존 후보의 원리를 유지: 기존 주공격/지원 역할·순서·겹침 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 필드 전체를 계속 발광시키면 공과 타자 실루엣이 묻힌다 | 기존 후보 연결 · P06 |
| A08 [WHAT THE GOLF?](https://store.steampowered.com/app/785790/) | 예상과 다른 결과의 짧은 반전<br>설계 해석: 결과의 한 가지 변화가 화면 중심에 남으면 설명 없이 기억된다 | 원작의 장르 규칙은 제외한다. 카드 규칙을 임의로 뒤집는 농담을 매 타석 넣지 않는다 이 원작 규칙을 우리 게임에 새로 구현했다고 하지 않는다. | 카드 규칙을 임의로 뒤집는 농담을 매 타석 넣지 않는다 | 충돌로 제외 · P11 |
| A09 [Cursed to Golf](https://store.steampowered.com/app/1726120/) | 발사 경로와 다음 지형 확인<br>설계 해석: 발사 전 경로가 보이고 발사 뒤 실제 물체를 추적하면 오차를 이해한다 | 발사 전후의 공간 대응 원리를 카드 범위→같은 목적지 실루엣에 적용한다. 실제 투수의 공 경로는 미리 표시하지 않는다. | 카드 범위 예고를 투수 실제 경로 예측선으로 오인시키지 않는다 | 이번 원리 적용 · P01 |
| A10 [Dodgeball Academia](https://store.steampowered.com/app/1422420/) | 타구와 피격 개체의 반응<br>설계 해석: 맞은 대상 가까이 숫자·짧은 효과가 붙으면 무엇이 발동했는지 공간적으로 연결된다 | 기존 후보의 원리를 유지: 기존 실제 결과 공개 경계·발동/HP 인과 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 여러 숫자와 카툰 구름을 동시에 복제하면 작은 가로 화면이 복잡해진다 | 기존 후보 연결 · P08 |

### B. 공격과 접점의 읽힘

| ID·공식 출처 | 참고 장면·작동 원리 | 9ZONE 적용 | 피할 점 | 처리 |
|---|---|---|---|---|
| B01 [Hades](https://store.steampowered.com/app/1145360/) | 방 하나에서 차지 공격을 마치고 적의 위치에 맞춰 휘두르는 순간.<br>입력 시작과 공격 궤적을 짧게 예고한 뒤, 적중 프레임에만 밝은 호와 경직을 겹친다. | 기존 후보의 원리를 유지: 기존 G020 공유 시계·릴리스·공/접촉 FX 후보 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 매 투사체마다 큰 화면 흔들림이나 넓은 섬광을 붙이지 않는다. | 기존 후보 연결 · P07 |
| B02 [Hades II](https://store.steampowered.com/app/1145350/) | 주문을 놓고 범위가 형성된 뒤, 적이 범위 안에 들어오는 순간.<br>행동 전 바닥의 공간 점유를 읽게 하고, 효과가 발생할 때 표식을 회수하듯 정리한다. | 기존 후보의 원리를 유지: 기존 실제 결과 공개 경계·발동/HP 인과 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 모든 주문을 화면 전체를 채우는 효과로 만들지 않는다. | 기존 후보 연결 · P08 |
| B03 [Dead Cells](https://store.steampowered.com/app/588650/) | 구르기 직후 근접 무기로 적의 빈틈에 들어가는 교환.<br>회피가 공격 기회로 바뀌는 위치 이동을 먼저 읽히고, 타격은 작은 흰색 접촉 반응으로 분리한다. | 기존 후보의 원리를 유지: 기존 G020 공유 시계·릴리스·공/접촉 FX 후보 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 캐릭터 이동 전체에 잔상과 흔들림을 누적하지 않는다. | 기존 후보 연결 · P07 |
| B04 [Hollow Knight](https://store.steampowered.com/app/367520/) | 적의 긴 예비동작을 보고 짧은 회피 뒤 한 번 찌르는 교환.<br>얇고 분명한 예고 포즈와 짧은 피격 정지로 좁은 전장을 읽게 한다. | 기존 후보의 원리를 유지: 기존 G020 공유 시계·릴리스·공/접촉 FX 후보 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 어두운 배경과 비슷한 명도의 공·존 테두리로 대비를 잃지 않는다. | 기존 후보 연결 · P07 |
| B05 [Celeste](https://store.steampowered.com/app/504230/) | 대시 후 벽에 닿아 멈추고, 다음 점프를 결정하는 순간.<br>빠른 이동을 착지/정지로 명확히 끝내 다음 입력의 기준점을 만든다. | 움직임 뒤 기준점 회복 원리를 장착 후150ms 표면 회수에 적용해 존 확률 글자가 다시 보이게 한다. 대시/착지 규칙을 추가한 것이 아니다. | 연속 이동 때 카메라를 흔들어 착지 기준을 흐리지 않는다. | 이번 원리 적용 · P02 |
| B06 [Katana ZERO](https://store.steampowered.com/app/460950/) | 방 진입 후 시간을 늦춰 적의 발사선을 통과하고 한 번 베는 장면.<br>위협은 슬로모션 중에도 계속 보이고, 플레이어 궤적은 짧고 명료하게 표시된다. | 기존 후보의 원리를 유지: 기존 G020 공유 시계·릴리스·공/접촉 FX 후보 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 시간 정지를 자주 써서 판정의 실제 순서를 숨기지 않는다. | 기존 후보 연결 · P07 |
| B07 [Nuclear Throne](https://store.steampowered.com/app/242680/) | 적 탄막이 좁아지는 틈에 플레이어가 한 발을 되돌려 쏘는 교전.<br>수많은 탄환 중 플레이어 탄과 위협 방향을 대비/크기로 구분한다. | 기존 후보의 원리를 유지: 기존 G020 공유 시계·릴리스·공/접촉 FX 후보 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 공과 결과 배지를 같은 색/크기로 겹쳐 혼잡을 만들지 않는다. | 기존 후보 연결 · P07 |
| B08 [Enter the Gungeon](https://store.steampowered.com/app/311690/) | 탄막을 구르기로 넘고, 회피 무적이 끝날 때 보스를 향해 반격.<br>구르기 끝의 발 위치가 안전 구역을 확인시켜 다음 행동으로 연결한다. | 기존 후보의 원리를 유지: 기존 G020 공유 시계·릴리스·공/접촉 FX 후보 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 구르는 동작의 화면 추적으로 공의 경로를 가리지 않는다. | 기존 후보 연결 · P07 |
| B09 [Brotato](https://store.steampowered.com/app/1942280/) | 무기 자동 발사 속에서 레벨업 선택으로 빌드 방향을 정하는 순간.<br>전투 밀도를 잠시 낮추고 선택 UI만 선명하게 만들어 행동 전환을 알린다. | 기존 후보의 원리를 유지: 기존 실제 결과 공개 경계·발동/HP 인과 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 매 공격 탄환과 숫자를 모두 최전면에 표시하지 않는다. | 기존 후보 연결 · P08 |
| B10 [Hotline Miami](https://store.steampowered.com/app/219150/) | 문을 열고 방 안의 적을 빠르게 처리하는 짧은 교전.<br>문턱 진입의 정지와 방 내부 전투의 속도를 대비해 시작/끝을 읽힌다. | 기존 후보의 원리를 유지: 기존 G020 공유 시계·릴리스·공/접촉 FX 후보 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 잔혹한 피격 스프라이트의 강도/밀도를 야구 UI에 가져오지 않는다. | 기존 후보 연결 · P07 |

### C. 예고·위협·보스 대비

| ID·공식 출처 | 참고 장면·작동 원리 | 9ZONE 적용 | 피할 점 | 처리 |
|---|---|---|---|---|
| C01 [Sekiro™: Shadows Die Twice - GOTY Edition](https://store.steampowered.com/app/814380/) | 보스의 큰 내려치기를 방어해 자세를 무너뜨리고 반격하는 교환.<br>적의 어깨/무기 준비와 공격 궤적을 읽게 하고, 성공 방어는 선명한 금속 접촉으로 보상한다. | 후속 제작·검수: 새 사지 중간 그림·실제 폼별 연속 동작 후속 제작. 이번 적용 완료가 아니며 새 사지 그림을 아직 반입하지 않았다. | 모든 투구를 같은 길이로 늦추거나 카메라 흔들기로 박자를 대신하지 않는다. | 후속 원화·검수 · P09 |
| C02 [MONSTER HUNTER RISE](https://store.steampowered.com/app/1446780/) | 몬스터가 숨을 들이켜 돌진을 예고하고 헌터가 옆으로 빠지는 장면.<br>덩치 큰 적의 방향 전환을 몸통/머리 방향으로 미리 보여줘 회피 판단 시간을 준다. | 후속 제작·검수: 새 사지 중간 그림·실제 폼별 연속 동작 후속 제작. 이번 적용 완료가 아니며 새 사지 그림을 아직 반입하지 않았다. | 큰 몬스터처럼 공을 확대해 존 경계와 상대 자세를 가리지 않는다. | 후속 원화·검수 · P09 |
| C03 [Monster Hunter: World](https://store.steampowered.com/app/582010/) | 몬스터가 포효/선회한 뒤 지형 장애물에 공격이 막히는 순간.<br>공격 자체뿐 아니라 환경 충돌이 결과를 설명한다. | 후속 제작·검수: 새 사지 중간 그림·실제 폼별 연속 동작 후속 제작. 이번 적용 완료가 아니며 새 사지 그림을 아직 반입하지 않았다. | 모든 공 결과를 같은 폭발/섬광으로 처리하지 않는다. | 후속 원화·검수 · P09 |
| C04 [ELDEN RING](https://store.steampowered.com/app/1245620/) | 보스의 광역 공격이 바닥에 남긴 예고 영역에서 탈출하는 순간.<br>공격이 오기 전 바닥에 목표 범위를 보여 위험 공간을 읽힌다. | 후속 제작·검수: 새 사지 중간 그림·실제 폼별 연속 동작 후속 제작. 이번 적용 완료가 아니며 새 사지 그림을 아직 반입하지 않았다. | 예고 도형을 실시간 공 궤적 위에 계속 남겨 정보가 겹치게 하지 않는다. | 후속 원화·검수 · P09 |
| C05 [Furi](https://store.steampowered.com/app/423230/) | 근접/원거리 페이즈가 교체되는 보스 공격을 읽는 장면.<br>페이즈 색과 패턴으로 지금 피해야 할 위협 종류를 미리 구분한다. | 후속 제작·검수: 새 사지 중간 그림·실제 폼별 연속 동작 후속 제작. 이번 적용 완료가 아니며 새 사지 그림을 아직 반입하지 않았다. | 장식 컬러를 구종 의미와 혼용해 판독 규칙을 깨지 않는다. | 후속 원화·검수 · P09 |
| C06 [Cuphead](https://store.steampowered.com/app/268910/) | 보스의 형태 변화 뒤 공격 패턴이 시작되는 순간.<br>형태 변화가 다음 공격 종류의 신호가 되어 결과를 사전에 예고한다. | 후속 제작·검수: 새 사지 중간 그림·실제 폼별 연속 동작 후속 제작. 이번 적용 완료가 아니며 새 사지 그림을 아직 반입하지 않았다. | 공격마다 새로운 경고 아이콘을 추가해 학습 부담을 늘리지 않는다. | 후속 원화·검수 · P09 |
| C07 [Darkest Dungeon®](https://store.steampowered.com/app/262060/) | 턴 종료 전에 영웅의 스트레스/체력 상태를 확인하고 행동을 선택.<br>전투 액션과 누적 상태를 작은 고정 HUD로 나눠 결과 원인을 추적 가능하게 한다. | 기존 후보의 원리를 유지: 기존 G020 공유 시계·릴리스·공/접촉 FX 후보 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 타격 직후 모든 HUD를 흔들어 영구 상태 수치까지 읽기 어렵게 만들지 않는다. | 기존 후보 연결 · P07 |
| C08 [Darkest Dungeon® II](https://store.steampowered.com/app/1940340/) | 영웅 관계/스트레스가 흔들린 후 전투 선택이 달라지는 구간.<br>앞선 결과가 다음 턴의 선택 범위를 바꾸는 연결을 드러낸다. | 기존 후보의 원리를 유지: 기존 G020 공유 시계·릴리스·공/접촉 FX 후보 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 한 번의 플레이를 모든 카드가 즉시 다 해결하는 단절된 연출로 만들지 않는다. | 기존 후보 연결 · P07 |
| C09 [OCTOPATH TRAVELER II](https://store.steampowered.com/app/1971650/) | 브레이크 직전 적의 약점을 알아내고 약점 무기를 고르는 턴.<br>약점 정보가 보스 행동 전에 선택을 좁혀 전략의 근거를 보여준다. | 기존 후보의 원리를 유지: 기존 실제 결과 공개 경계·발동/HP 인과 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 타율 같은 세부 수치를 매 카드 애니메이션에 모두 띄우지 않는다. | 기존 후보 연결 · P08 |
| C10 [Sea of Stars: Sunset Edition](https://store.steampowered.com/app/1244090/) | 공격 전 타이밍 입력으로 방어/반격을 얻는 교환.<br>결과가 나올 때 입력 타이밍과 방어 성공 여부를 접촉 모션으로 피드백한다. | 원작의 장르 규칙은 제외한다. 등급 텍스트가 접촉 순간보다 먼저 떠서 충돌 감각을 약화시키지 않는다. 이 원작 규칙을 우리 게임에 새로 구현했다고 하지 않는다. | 등급 텍스트가 접촉 순간보다 먼저 떠서 충돌 감각을 약화시키지 않는다. | 충돌로 제외 · P11 |

### D. 카드 정체성과 발동 인과

| ID·공식 출처 | 참고 장면·작동 원리 | 9ZONE 적용 | 피할 점 | 처리 |
|---|---|---|---|---|
| D01 [Slay the Spire](https://store.steampowered.com/app/646570/) | 관찰(첫 공식 스크린샷): 첫 장면에 하단 카드 손패와 적 의도/체력이 동시에 보임. / 추가 표본6프레임 확인, 연속동작 미검증. 원장 참조.<br>설계 해석: 카드 선택→비용 소모→적 의도에 대응하는 결과를 같은 전투 프레임에서 읽게 함. | 기존 후보의 원리를 유지: 기존 주공격/지원 역할·순서·겹침 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 손패·전투 UI까지 복제하거나 모든 카드에 큰 폭발을 붙이지 않기. | 기존 후보 연결 · P06 |
| D02 [Slay the Spire 2](https://store.steampowered.com/app/2868840/) | 관찰(첫 공식 스크린샷): 첫 장면에서 카드 손패가 크게 부채꼴로 떠 있고 중앙 전장에 적과 아군이 분리됨. / 동영상은 열람/재생하지 않음.<br>설계 해석: 선택 가능한 카드 한 장을 키워 선택 초점을 만들고, 해결 후 손패를 다시 읽을 수 있게 함. | 선택 초점의 원리를 기존 카드 carrier와 같은 coverage의 수신 외곽선으로 연결한다. 카드 확대·새 팝업을 추가하지 않는다. | 큰 카드 팝업을 오래 유지해 던지기/타격을 가리지 않기. | 이번 원리 적용 · P01 |
| D03 [Monster Train](https://store.steampowered.com/app/1102190/) | 관찰(첫 공식 스크린샷): 첫 장면에 여러 수직 층의 아군/적 유닛, 카드 손패, 하단 진행 버튼. / 동영상은 열람/재생하지 않음.<br>설계 해석: 층별 공간이 방어 목표와 적 이동 경로를 나눠서, 유닛 배치의 결과 위치를 이해시킴. | 기존 후보의 원리를 유지: 기존 주공격/지원 역할·순서·겹침 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 화면을 다층 전장처럼 과밀하게 만들지 않기. | 기존 후보 연결 · P06 |
| D04 [Monster Train 2](https://store.steampowered.com/app/2742830/) | 관찰(첫 공식 스크린샷): 첫 장면에서 전장 여러 층과 카드 손패가 지속적으로 시야 안에 있음. / 동영상은 열람/재생하지 않음.<br>설계 해석: 층 구조와 방어 목표를 유지해 여러 위협을 공간 우선순위로 바꿈. | 기존 후보의 원리를 유지: 기존 주공격/지원 역할·순서·겹침 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 공격/방어 효과를 각 층에 겹쳐 가독성 낮추지 않기. | 기존 후보 연결 · P06 |
| D05 [Balatro](https://store.steampowered.com/app/2379780/) | 관찰(첫 공식 스크린샷): 첫 장면에서 포커 손패, 점수 배율, 손의 점수 산출이 선명한 UI로 동시 표시. / 추가 표본6프레임 확인, 연속동작 미검증. 원장 참조.<br>설계 해석: 기본 조합을 만든 뒤 조커가 배수를 곱해 예상보다 큰 점수 상승을 발생시킴. | 기존 후보의 원리를 유지: 기존 실제 결과 공개 경계·발동/HP 인과 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 연속 숫자 팝업과 화면 흔들림을 전 타격에 적용하지 않기. | 기존 후보 연결 · P08 |
| D06 [Inscryption](https://store.steampowered.com/app/1092790/) | 관찰(첫 공식 스크린샷): 첫 장면에서 탁상형 카드 결투판, 상대편 카드와 손의 카드가 낮은 대비의 숲 배경에 놓임. / 동영상은 열람/재생하지 않음.<br>설계 해석: 테이블이라는 고정된 무대가 카드 상호작용을 중심에 두고 배경은 분위기로 물러남. | 손에 든 카드와 보드 위 물체의 정체성 대응만 채택해 실제 footprint와 같은 목적지를 표시한다. 경기장 dimming은 이번 변경에 없다. | 공포 연출의 어둠/잡음을 야구 UI에 가져오지 않기. | 이번 원리 적용 · P01 |
| D07 [Wildfrost](https://store.steampowered.com/app/1811990/) | 관찰(첫 공식 스크린샷): 첫 장면에서 캐릭터 카드가 줄 맞춰 놓이고 각 카드에 작은 턴/상태 표식이 있음. / 동영상은 열람/재생하지 않음.<br>설계 해석: 카운트다운 표식이 다음 발동 시점을 예고해 공격 결과가 갑자기 튀어나오지 않게 함. | 한 대상의 국소 반응 원리를 카드 전체의 단일 주변부 잠금으로 적용한다. 셀별 독립 폭발은 추가하지 않는다. | 상태 아이콘을 너무 많이 쌓거나 모든 셀에 타이머를 표시하지 않기. | 이번 원리 적용 · P03 |
| D08 [Dicey Dungeons](https://store.steampowered.com/app/861540/) | 관찰(첫 공식 스크린샷): 첫 장면에 주사위 결과와 장비 슬롯이 나뉘고 현재 굴림값이 크게 표시됨. / 동영상은 열람/재생하지 않음.<br>설계 해석: 무작위 굴림값이 장비별 요구조건에 들어가며, 주사위 결과가 행동 선택을 제한/유도. | 자원이 들어갈 슬롯의 대응 원리를 실제 카드 coverage의 닫힌 ghost에 적용한다. 구속/회전 수치나 입력창은 추가하지 않는다. | 주사위 굴림처럼 보이는 추가 랜덤 연출로 플레이 결과의 원인을 흐리지 않기. | 이번 원리 적용 · P01 |
| D09 [Alina of the Arena](https://store.steampowered.com/app/1668690/) | 관찰(첫 공식 스크린샷): 첫 장면에 헥스 격자 전장, 유닛, 여러 카드 액션과 체력 표시가 있음. / 동영상은 열람/재생하지 않음.<br>설계 해석: 공격·회피·밀치기 같은 카드 액션이 상대 위치를 바꾸고, 밀치기는 다음 공격선/위험을 바꿈. | 위치가 효과 범위를 결정하는 원리를 현재 엔진의 coverage→동일 목적지 형태 정합으로 적용한다. 카드가 공 궤적을 새로 변경하지 않는다. | 모든 플레이에 복잡한 넉백 연쇄 추가하지 않기. | 이번 원리 적용 · P01 |
| D10 [Chrono Ark](https://store.steampowered.com/app/1188930/) | 관찰(첫 공식 스크린샷): 첫 장면에 파티/적과 하단 캐릭터별 스킬 카드가 함께 보임. / 동영상은 열람/재생하지 않음.<br>설계 해석: 스킬이 캐릭터별로 묶여 있어 플레이어가 카드의 주체와 파티 반응을 연관시킴. | 기존 후보의 원리를 유지: 기존 실제 결과 공개 경계·발동/HP 인과 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 카드별 캐릭터 컷인으로 플레이 중단하지 않기. | 기존 후보 연결 · P08 |

### E. 격자·전술의 결과 예측

| ID·공식 출처 | 참고 장면·작동 원리 | 9ZONE 적용 | 피할 점 | 처리 |
|---|---|---|---|---|
| E01 [Into the Breach](https://store.steampowered.com/app/590380/) | 관찰(첫 공식 스크린샷): 첫 장면에 작고 또렷한 격자, 메카/적, 위협 타일과 공격선이 함께 표시됨. / 추가 표본6프레임 확인, 연속동작 미검증. 원장 참조.<br>설계 해석: 적의 다음 공격을 먼저 타일로 예고; 플레이어의 밀치기/위치 변경으로 피해 대상과 구조물 결과를 바꿈. | 행동 전 목표 범위를 읽는 원리를 실제 카드 coverage 수신 외곽선에 적용한다. 미공개 실제 투구·예상 타격점은 보여 주지 않는다. | 타격 결과 전에 예고선 지우거나 카메라 이동으로 그리드 기준을 잃게 하지 않기. | 이번 원리 적용 · P01 |
| E02 [FTL: Faster Than Light](https://store.steampowered.com/app/212680/) | 관찰(첫 공식 스크린샷): 첫 장면에서 우주선 내부 방이 격자로 나뉘고 승무원/시스템과 위협 정보가 병렬 배치. / 동영상은 열람/재생하지 않음.<br>설계 해석: 방 단위 시스템 상태가 공격의 표적과 결과를 명확히 구분; 작은 변화가 선박 전체 위협으로 이어짐. | 선택과 해결 상태를 구분하는 원리를 임시 블록 표면 회수와 기존 존 정보 복귀로 적용한다. 실시간 정지나 새 전력 배분은 추가하지 않는다. | 야구 장면 위에 함선 수준의 복잡한 계기판을 중복하지 않기. | 이번 원리 적용 · P02 |
| E03 [Fights in Tight Spaces](https://store.steampowered.com/app/1265820/) | 관찰(첫 공식 스크린샷): 첫 장면에서 미니어처 격자 위 전투 유닛, 큼직한 행동 카드, 이동/공격 안내가 보임. / 동영상은 열람/재생하지 않음.<br>설계 해석: 카드 선택과 이동을 묶고 위치가 공격의 유효성·연쇄를 결정; 깔끔한 액션 시퀀스로 해결. | 계획의 공간적 기준이 남는 원리를 장착 후 불투명 덮개를 걷어 기존 실제 범위·역할 표식이 보이게 적용한다. 새 이동/되감기 기능은 없다. | 각 셀에서 따로 전투 이펙트가 터져 리듬이 끊기는 연출을 피하기. | 이번 원리 적용 · P02 |
| E04 [Shogun Showdown](https://store.steampowered.com/app/2084000/) | 관찰(첫 공식 스크린샷): 첫 장면에서 작은 전장과 하단 액션 타일, 공격 대기/방향 표식이 보임. / 동영상은 열람/재생하지 않음.<br>설계 해석: 한정된 타일 행동을 준비/업그레이드해 위치와 공격 타이밍을 맞추며 콤보를 만듦. | 한 행동의 시작·확정 구분을 한 번의 주변부 잠금과 짧은 contour trace로 적용한다. 새 타임라인/공격 예약 규칙은 없다. | 타일 활성 상태와 카드 상태를 동시에 과장하지 않기. | 이번 원리 적용 · P03 |
| E05 [Shotgun King: The Final Checkmate](https://store.steampowered.com/app/1972440/) | 관찰(첫 공식 스크린샷): 첫 장면은 체크무늬 판 위 왕과 상대 말, 최소 HUD로 구성. / 동영상은 열람/재생하지 않음.<br>설계 해석: 체스판 규칙을 알아볼 수 있는 격자/말 대비로 즉시 전략 상태를 전달. | 대상 칸을 분명히 읽는 원리를 실제 점유 셀과 일치하는 수신 외곽선으로 적용한다. 피해·적 행동 규칙은 바꾸지 않는다. | 체스의 고대비 체크무늬를 그대로 써서 9존 컬러 신호와 충돌하지 않기. | 이번 원리 적용 · P01 |
| E06 [Backpack Hero](https://store.steampowered.com/app/1970580/) | 관찰(첫 공식 스크린샷): 첫 장면에서 작은 인벤토리 격자에 아이템을 배치하고 전투 대화가 주변에 놓임. / 동영상은 열람/재생하지 않음.<br>설계 해석: 아이템의 위치와 인접 관계가 효과를 결정하므로 배치 자체가 전투 준비 행동이 됨. | 인벤토리 물체의 모양 정합 원리를 다칸 카드의 닫힌 contour에 적용한다. 모서리에서 없는 칸을 채우거나 자동 재배치하지 않는다. | 아이템 설명 툴팁처럼 세부 능력치를 3x3 안에 다 채우지 않기. | 이번 원리 적용 · P01 |
| E07 [Backpack Battles](https://store.steampowered.com/app/2427700/) | 관찰(첫 공식 스크린샷): 첫 장면에서 넓은 가방 격자 안 아이템들의 배치와 조합을 보여줌. / 동영상은 열람/재생하지 않음.<br>설계 해석: 아이템을 배치·조합해 전투 전 빌드를 만들고, 공간 효율이 선택의 비용이 됨. | 붙어 있는 물체의 실루엣 원리를 실제 footprint에 적용한다. 겹침만으로 시너지가 생겼다고 표시하지 않는다. | 드래그 배치 중 지나친 선/오라로 가방 격자를 덮지 않기. | 이번 원리 적용 · P01 |
| E08 [Slice & Dice](https://store.steampowered.com/app/1775490/) | 관찰(첫 공식 스크린샷): 첫 장면에 각 영웅별 주사위/액션 슬롯이 가로로 나뉘고 적 정보는 상단에 분리됨. / 동영상은 열람/재생하지 않음.<br>설계 해석: 각 캐릭터 턴 결과를 슬롯 단위로 정리해 여러 행동을 한꺼번에 비교 가능. | 기존 후보의 원리를 유지: 기존 실제 결과 공개 경계·발동/HP 인과 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 모든 셀에 숫자 배지와 액션 아이콘 중복 표시하지 않기. | 기존 후보 연결 · P08 |
| E09 [Tactical Breach Wizards](https://store.steampowered.com/app/1043810/) | 관찰(첫 공식 스크린샷): 첫 장면에서 등각 격자 건물, 유닛, 선택된 주문 카드/타깃 경로가 보임. / 동영상은 열람/재생하지 않음.<br>설계 해석: 특수 능력을 조합하고 되감기로 결과를 탐색해 공간 상호작용을 학습시킴. | 해결 전후 같은 보드를 읽는 원리를 표면 회수 뒤 기존 존 글자·표식 복귀로 적용한다. 예상 타격점·되돌리기는 추가하지 않는다. | 긴 되감기/계획 UI를 실시간 타격 장면에 노출하지 않기. | 이번 원리 적용 · P02 |
| E10 [The Last Spell](https://store.steampowered.com/app/1105670/) | 관찰(첫 공식 스크린샷): 첫 장면에 방어 전장, 다수 적, 영웅/액션 정보가 화면 가장자리로 분리됨. / 동영상은 열람/재생하지 않음.<br>설계 해석: 밤의 적 떼와 수비 공간을 동시에 보여 주되 아군 액션 영역을 별도로 둬 전투 읽기를 돕는다. | 기존 후보의 원리를 유지: 기존 실제 결과 공개 경계·발동/HP 인과 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 상황 정보를 많이 보여준다는 이유로 매 타격 때 경기장 전체를 흔들지 않기. | 기존 후보 연결 · P08 |

### F. 블록·연결·착지

| ID·공식 출처 | 참고 장면·작동 원리 | 9ZONE 적용 | 피할 점 | 처리 |
|---|---|---|---|---|
| F01 [Tetris® Effect: Connected](https://store.steampowered.com/app/1003590/) | 관찰(첫 공식 스크린샷): 첫 장면에서 낙하 블록, 홀드/다음 블록, 플레이 보드가 분리되어 보임; 배경 입자 존재. / 추가 표본6프레임 확인, 연속동작 미검증. 원장 참조.<br>설계 해석: 조각이 떨어져 쌓이는 단일 운동 경로를 유지하고 줄 삭제 때 보드의 결과를 하나로 읽게 함; 강한 시청각 동기화는 옵션적. | 블록과 목적지의 대응 원리를 고정 ghost와 실제 coverage의 정확한 정합으로 적용한다. 원작 lock delay나 음악 동기화를 실측·복제하지 않았다. | 셀마다 파티클을 따로 폭발시키거나 화면 전체 입자/섬광을 상시 켜지 않기. | 이번 원리 적용 · P01 |
| F02 [Puyo Puyo™ Tetris® 2](https://store.steampowered.com/app/1259790/) | 관찰(첫 공식 스크린샷): 첫 장면에서 2개 보드와 플레이어별 점수/다음 조각이 분명히 분할됨. / 동영상은 열람/재생하지 않음.<br>설계 해석: 각 보드의 입력과 결과를 분리해서 경쟁 상황에서도 누구의 상태인지 읽게 함. | 여러 셀이 한 묶음으로 읽히는 원리를 공동 외곽선 잠금·한 번의 trace로 적용한다. 새 연쇄/블록 제거 규칙은 추가하지 않는다. | 투수 투구와 타자 임팩트에 서로 다른 풀스크린 효과를 겹치지 않기. | 이번 원리 적용 · P03 |
| F03 [LUMINES REMASTERED](https://store.steampowered.com/app/851670/) | 관찰(첫 공식 스크린샷): 첫 장면에서 정사각형 보드, 진행하는 세로 타임라인, 블록 제거 순간의 빛/선이 보임. / 동영상은 열람/재생하지 않음.<br>설계 해석: 리듬선이 블록 완성 후 보드를 훑어 제거를 지연/강조해, 놓기→조건 성립→정리의 읽기 쉬운 순서를 만듦. | 블록 동작과 주변 장식을 구별하는 원리를 한 contour만 짧게 읽히는 잠금으로 적용한다. 음악 반응형 배경은 추가하지 않는다. | 각 조각의 잠금 후 매번 긴 sweep를 넣어 템포 늦추지 않기. | 이번 원리 적용 · P03 |
| F04 [Tricky Towers](https://store.steampowered.com/app/437920/) | 관찰(첫 공식 스크린샷): 첫 장면에서 여러 탑이 실제 블록을 쌓아 올리고 균형/물리 결과가 같이 보임. / 동영상은 열람/재생하지 않음.<br>설계 해석: 블록 한 개의 착지가 기존 탑을 흔들어 성공/실패를 전역 물리 결과로 이어줌. | 큰 물체가 자리를 차지하는 원리를 실제 셀 실루엣과 고정 목적지에 적용한다. 흔들리는 물리 탑이나 균형 판정을 추가하지 않는다. | 셀별로 서로 다른 탄성/흔들림을 주어 모양이 해체되는 듯 보이지 않기. | 이번 원리 적용 · P01 |
| F05 [Tumblestone](https://store.steampowered.com/app/269710/) | 관찰(첫 공식 스크린샷): 첫 장면에 세로 블록열과 여러 플레이어 판이 나란히 배치됨. / 동영상은 열람/재생하지 않음.<br>설계 해석: 선택한 블록 집단이 사라지며 아래/위의 상태가 갱신돼 제거 결과의 공간 변화를 읽음. | 정해진 묶음의 명료한 경계를 카드 전체의 주변부 잠금에 적용한다. 퍼즐 제거 순서·새 장르 규칙은 추가하지 않는다. | 여러 셀 숫자가 순차로 튀어 나와 타격 결과가 다단 입력처럼 보이지 않기. | 이번 원리 적용 · P03 |
| F06 [Petal Crash](https://store.steampowered.com/app/1211110/) | 관찰(첫 공식 스크린샷): 첫 장면에서 보드의 블록 색/형태가 뚜렷하고 한 덩어리 제거에 따른 연쇄 공간이 보임. / 동영상은 열람/재생하지 않음.<br>설계 해석: 블록 충돌→그룹 파괴→연쇄라는 원인-결과 연결이 큰 연쇄 보상으로 확장됨. | 인접한 셀이 한 형태로 읽히는 원리를 실제 footprint contour와 한 번의 잠금 반응에 적용한다. 판정 없는 셀까지 연결하지 않는다. | 각 보정마다 별도 폭죽/색상 팝업을 추가해 핵심 컨택을 묻히지 않기. | 이번 원리 적용 · P03 |
| F07 [Shovel Knight Pocket Dungeon](https://store.steampowered.com/app/1184760/) | 관찰(첫 공식 스크린샷): 첫 장면에서 여러 캐릭터/적/블록이 한 격자 안에 있고 플레이어 캐릭터는 중앙 부근. / 동영상은 열람/재생하지 않음.<br>설계 해석: 캐릭터의 이동과 인접 매치가 격자 상태를 함께 바꾸어, 한 동작이 전장의 여러 대상에 연결됨. | 선택한 범위와 정리된 상태의 차이를 장착 후 표면 회수에 적용한다. 새 퍼즐 소거·그리드 전투 규칙은 없다. | 격자 위에 별도 큰 타자 컷인을 띄워 위치 감각을 없애지 않기. | 이번 원리 적용 · P02 |
| F08 [Grindstone](https://store.steampowered.com/app/1818690/) | 관찰(첫 공식 스크린샷): 첫 장면은 지도와 목표 선택 UI, 진행 가능한 노드가 또렷하게 분리됨. / 동영상은 열람/재생하지 않음.<br>설계 해석: 복수 경로 중 보상/위험에 맞는 다음 목표를 선택하게 함; 현재 전투에서 다음 진행 방향을 유지. | 연결 모양을 읽는 원리를 한 덩어리 외곽선과 짧은 trace로 적용한다. 색/그리드가 같다는 이유로 엔진 연결을 생성하지 않는다. | 장면 종료 직후 불필요한 지도식 화면 전환을 끼우지 않기. | 이번 원리 적용 · P03 |
| F09 [Super Puzzle Platformer Deluxe](https://store.steampowered.com/app/238530/) | 관찰(첫 공식 스크린샷): 첫 장면에서 컬러 블록과 각 블록의 즉각적인 파괴/점수 효과가 플레이 공간 안에 겹쳐 보임. / 동영상은 열람/재생하지 않음.<br>설계 해석: 블록을 직접 쏘아 제거하는 방식이라 행동과 블록 소거가 맞닿아 즉시 확인됨. | 낙하 후 기준 상태가 분명해지는 원리를 임시 몸체 회수·기존 존 정보 복귀로 적용한다. 적중 셀 삭제나 새 점수 규칙은 없다. | 기본 타구마다 화면 전체를 터뜨리는 상시 과장 피하기. | 이번 원리 적용 · P02 |
| F10 [Mixolumia](https://store.steampowered.com/app/1414020/) | 관찰(첫 공식 스크린샷): 첫 장면에서 마름모 보드의 작은 보석 블록이 연속 제거될 수 있는 구성으로 보임. / 동영상은 열람/재생하지 않음.<br>설계 해석: 밀어 움직인 보석이 정합해 붙고 조건이 맞으면 함께 폭발/연쇄; 단순 입자보다 보석의 집단 실루엣이 먼저 전달. | 연결된 추상 블록의 모양을 한 contour의 잠금으로 적용한다. 연쇄/박자 판정이나 상시 배경 효과는 추가하지 않는다. | 세 셀에 각각 별도 파티클/충격을 줘 하나의 카드 모양과 공-존 대응을 해체하지 않기. | 이번 원리 적용 · P03 |

### G. 정리·맞춤·완성 상태

| ID·공식 출처 | 참고 장면·작동 원리 | 9ZONE 적용 | 피할 점 | 처리 |
|---|---|---|---|---|
| G01 [Unpacking](https://store.steampowered.com/app/1135690/) | 물건의 배치·정리 완료<br>설계 해석: 들고 있던 물건이 내려앉고 그 자리에 남는 것이 완료 피드백의 본체다 | 내려놓은 뒤 실제 물건이 남는 원리를 임시 블록 표면 회수·기존 settled 범위 유지로 적용한다. | 반짝임만 남기고 어느 카드가 어디 갔는지 지우지 않는다 | 이번 원리 적용 · P02 |
| G02 [A Little to the Left](https://store.steampowered.com/app/1629520/) | 홈 모양에 맞는 도구 정리<br>설계 해석: 목적지의 음각 형태와 물체 실루엣이 일치할 때 설명 없이 맞았음을 안다 | 물체와 빈 홈의 같은 실루엣을 실제 coverage ghost와 정확히 맞는 착지 외곽선으로 적용한다. | 각 칸마다 폭발시키거나 실제로 없는 셀까지 채우지 않는다 | 이번 원리 적용 · P01 |
| G03 [Wilmot's Warehouse](https://store.steampowered.com/app/839870/) | 같은 분류의 물품을 묶어 창고 정리<br>설계 해석: 반복되는 작은 표식이 큰 묶음의 정체성을 유지한다 | 기존 후보의 원리를 유지: 기존 주공격/지원 역할·순서·겹침 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 카드 수만큼 장문의 이름표를 존에 추가하지 않는다 | 기존 후보 연결 · P06 |
| G04 [Assemble with Care](https://store.steampowered.com/app/1202900/) | 분해된 부품을 본체에 조립<br>설계 해석: 부품·들어갈 자리·조립된 완성체가 같은 좌표 규칙을 쓰면 맞물림이 물리적으로 납득된다 | 부품과 목적지의 정합 원리를 실제 DOM 셀 경계를 쓰는 닫힌 contour로 적용한다. 임의의 공간 늘리기는 하지 않는다. | 몸체를 통째로 찌그러뜨려 잘못된 공간 변형을 만들지 않는다 | 이번 원리 적용 · P01 |
| G05 [Sticky Business](https://store.steampowered.com/app/2303350/) | 스티커를 골라 실제 결과물 만들기<br>설계 해석: 선택한 그림이 최종 결과물에 남으면 장식이 행동의 증거가 된다 | 기존 후보의 원리를 유지: 기존 주공격/지원 역할·순서·겹침 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 카드 그림을 9칸에 확대 복사해 질감을 어지럽히지 않는다 | 기존 후보 연결 · P06 |
| G06 [Strange Horticulture](https://store.steampowered.com/app/1574580/) | 식물과 도감의 대응 찾기<br>설계 해석: 현재 확인하는 대상과 비교 기준이 가까워야 성공 원인을 이해한다 | 기존 후보의 원리를 유지: 기존 실제 결과 공개 경계·발동/HP 인과 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 추가 도감·텍스트 상자를 전투마다 상시 배치하지 않는다 | 기존 후보 연결 · P08 |
| G07 [PowerWash Simulator](https://store.steampowered.com/app/1290000/) | 오염된 표면을 씻어 깨끗한 영역 남기기<br>설계 해석: 작업 전후 상태 차이가 지속되므로 작은 부분 완성도 보상이 된다 | 작업 후 남는 상태의 차이를 금색 임시 몸체 회수와 실제 범위/확률 글자의 재등장으로 적용한다. | 매 카드에 성공 보이스·폭죽을 재생하지 않는다 | 이번 원리 적용 · P02 |
| G08 [House Flipper 2](https://store.steampowered.com/app/1190970/) | 표면을 정리하고 공간을 바꾸기<br>설계 해석: 국소 입력이 지속되는 상태 변화를 만들면 결과를 다시 확인할 필요가 줄어든다 | 국소 입력 뒤 안정된 상태가 남는 원리를 장착 후 표면을 짧게 걷고 기존 셀 표식을 읽히는 방식으로 적용한다. | 완료된 칸도 계속 출렁이게 해 불안정하게 보이지 않는다 | 이번 원리 적용 · P02 |
| G09 [Fresh Start Cleaning Simulator](https://store.steampowered.com/app/1856030/) | 청소 전후 환경의 회복<br>설계 해석: 작업의 끝을 깨끗해진 면적이 설명하면 성공 팝업이 적어도 된다 | 정리된 상태 자체가 보상이 되는 원리를 착지 후 기존 존의 상태를 가리지 않는 회수 방식으로 적용한다. | 녹음·꽃·대형 회복 효과 같은 다른 게임의 상징까지 이식하지 않는다 | 이번 원리 적용 · P02 |
| G10 [Save Room - Organization Puzzle](https://store.steampowered.com/app/1955330/) | 인벤토리 모양 맞춰 넣기<br>설계 해석: 물건의 점유 칸과 빈칸이 정확히 대응하면 '딱 맞음'을 눈으로 판단한다 | 점유 칸과 빈칸의 대응을3/5/9칸·모서리·분리 영역·구멍을 보존하는 실제 contour로 적용한다. | 회전·자동 최적화 같은 새 규칙을 연출 요청에 끼워 넣지 않는다 | 이번 원리 적용 · P01 |

### H. 물리·연쇄·누적 보상

| ID·공식 출처 | 참고 장면·작동 원리 | 9ZONE 적용 | 피할 점 | 처리 |
|---|---|---|---|---|
| H01 [Peggle Deluxe](https://store.steampowered.com/app/3480/) | 튕긴 공과 사라진 핀·마지막 목표<br>설계 해석: 반복된 작은 충돌 뒤 중요한 마지막 결과만 따로 강조하면 누적 기대가 생긴다 | 기존 후보의 원리를 유지: 기존 홈런/강판 전용 대비 유지·상업 품질 미확정. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 카드 착지를 전부 잭팟으로 만들지 않는다 | 기존 후보 연결 · P10 |
| H02 [Peglin](https://store.steampowered.com/app/1296610/) | 핀 충돌의 누적과 적에게 전달되는 피해<br>설계 해석: 미세 충돌의 과정과 최종 피해 합계를 분리하면 연쇄를 이해한다 | 기존 후보의 원리를 유지: 기존 실제 결과 공개 경계·발동/HP 인과 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | coverage 셀 개수만큼 가짜 피해 숫자를 만들지 않는다 | 기존 후보 연결 · P08 |
| H03 [Ballionaire](https://store.steampowered.com/app/2667120/) | 공이 보드를 지나며 발동하는 오브젝트<br>설계 해석: 어떤 오브젝트가 점수를 냈는지 위치별 반응이 남아야 조합이 읽힌다 | 기존 후보의 원리를 유지: 기존 실제 결과 공개 경계·발동/HP 인과 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 폭발하는 점수·돈 숫자를 모든 칸에 복제하지 않는다 | 기존 후보 연결 · P08 |
| H04 [Roundguard](https://store.steampowered.com/app/848030/) | 한 번의 발사와 착지까지의 피드백<br>설계 해석: 발사체 하나를 추적하고 최종 안정 상태를 확인하면 긴 과정도 한 행동으로 읽힌다 | 한 물체의 이동이 한 번의 도착으로 끝나는 원리를 같은 coverage 실루엣의 운반·수신 정합에 적용한다. | 블록 조각을 독립 물리로 흩뿌리지 않는다 | 이번 원리 적용 · P01 |
| H05 [Luck be a Landlord](https://store.steampowered.com/app/1404850/) | 회전 결과에서 실제 시너지 계산<br>설계 해석: 기본 결과와 추가 보너스를 구별하면 우연과 빌드 선택의 공이 나뉜다 | 기존 후보의 원리를 유지: 기존 실제 결과 공개 경계·발동/HP 인과 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 배치만으로 당첨·추가 데미지가 났다고 들리는 보상음을 쓰지 않는다 | 기존 후보 연결 · P08 |
| H06 [Stacklands](https://store.steampowered.com/app/1948280/) | 카드 겹침과 제작 대기<br>설계 해석: 겹친 사각 카드가 물리적 묶음처럼 남으면 상태를 기억하기 쉽다 | 기존 후보의 원리를 유지: 기존 주공격/지원 역할·순서·겹침 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 겹치기만 하면 성공이라는 새 규칙을 암시하지 않는다 | 기존 후보 연결 · P06 |
| H07 [Potion Craft: Alchemist Simulator](https://store.steampowered.com/app/1210320/) | 재료 경로와 목표 물약 위치<br>설계 해석: 실제 이동 경로와 최종 목표가 한 지도에서 비교되면 정밀한 맞춤이 만족스럽다 | 목표와 도착 위치를 같은 공간에서 비교하는 원리를 실제 footprint ghost와 착지 contour 정합으로 적용한다. | 진행 방향의 경로선을 실제 투구 예언처럼 보이게 하지 않는다 | 이번 원리 적용 · P01 |
| H08 [World of Goo](https://store.steampowered.com/app/22000/) | 구조물을 연결하고 장력을 읽기<br>설계 해석: 연결 부위의 방향과 구조가 분명해야 물리적 안정감이 생긴다 | 연결부의 일관된 경계가 안정감을 주는 원리를 실제 셀 외곽의 연속 contour 잠금에 적용한다. 대각선 섬은 분리한다. | 실제 엔진 연결이 아닌 모서리 인접을 성공으로 장식하지 않는다 | 이번 원리 적용 · P03 |
| H09 [Poly Bridge 3](https://store.steampowered.com/app/1850160/) | 다리를 만든 뒤 하중 결과 확인<br>설계 해석: 편집 상태와 실행 상태가 분리되면 실패 원인을 구조에서 찾을 수 있다 | 편집 상태와 실행 상태를 구분하는 원리를 임시 장착 표면을 걷고 기존 계획 범위를 드러내는 방식으로 적용한다. 새 하중/물리 판정은 없다. | 편집 확인음과 공격 성공음을 같게 만들지 않는다 | 이번 원리 적용 · P02 |
| H10 [Noita](https://store.steampowered.com/app/881100/) | 물질에 닿은 투사체와 환경 반응<br>설계 해석: 접점 재질에 따른 반응 차이가 있어야 강한 효과가 무조건 같은 폭발로 보이지 않는다 | 기존 후보의 원리를 유지: 기존 G020 공유 시계·릴리스·공/접촉 FX 후보 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 유체·파편을 늘려 존의 정보를 가리지 않는다 | 기존 후보 연결 · P07 |

### I. 리듬·반복·소리의 강약

| ID·공식 출처 | 참고 장면·작동 원리 | 9ZONE 적용 | 피할 점 | 처리 |
|---|---|---|---|---|
| I01 [Hi-Fi RUSH](https://store.steampowered.com/app/1817230/) | 콤보 공격의 준비/마무리가 박자에 맞아 랭크를 올리는 구간.<br>기본 액션을 음악 박자에 붙이고 성공 시 화면/UI 피드백을 박자 위에 정렬한다. | 반복되는 소리의 강약을 관리한다는 원리만 채택해 동시 배치 보이스 게인을 정규화한다. 음악 박자틀·리듬 보너스는 추가하지 않는다. | 모든 애니메이션을 같은 박자에 강제해 실제 결과의 예외성을 없애지 않는다. | 이번 원리 적용 · P04 |
| I02 [Metal: Hellsinger](https://store.steampowered.com/app/1061910/) | 발사 타이밍과 음악 박자가 맞을 때 적중 반응이 강화되는 순간.<br>리듬 입력의 성공을 발사 반응과 점수로 짧게 연결해 오차를 알아차리게 한다. | 기존 후보의 원리를 유지: 기존 G020 공유 시계·릴리스·공/접촉 FX 후보 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 오디오 파일을 듣지 않고 특정 타악기/밀리초 타이밍을 사실처럼 단정하지 않는다. | 기존 후보 연결 · P07 |
| I03 [Crypt of the NecroDancer](https://store.steampowered.com/app/247080/) | 박자마다 한 칸 이동하는 중 몬스터 위치 때문에 한 박을 넘기는 선택.<br>이동과 공격의 입력 가능 시점을 규칙적인 박자로 가르친다. | 원작의 장르 규칙은 제외한다. 야구 시뮬레이션을 음악 게임처럼 자동 박자 판정으로 바꾸지 않는다. 이 원작 규칙을 우리 게임에 새로 구현했다고 하지 않는다. | 야구 시뮬레이션을 음악 게임처럼 자동 박자 판정으로 바꾸지 않는다. | 충돌로 제외 · P11 |
| I04 [Beat Saber](https://store.steampowered.com/app/620980/) | 가까워지는 블록을 보고 손을 준비한 뒤 방향 맞춰 가르는 순간.<br>대상 접근, 방향 요구, 접촉의 순서가 몸의 준비 동작을 만든다. | 원작의 장르 규칙은 제외한다. VR 특유의 큰 손동작/화면 이동을 작은 모바일 카드 UI에 그대로 복사하지 않는다. 이 원작 규칙을 우리 게임에 새로 구현했다고 하지 않는다. | VR 특유의 큰 손동작/화면 이동을 작은 모바일 카드 UI에 그대로 복사하지 않는다. | 충돌로 제외 · P11 |
| I05 [Thumper](https://store.steampowered.com/app/356400/) | 트랙의 커브에 맞춰 이동한 뒤 충격이 오는 구간.<br>시야의 길/커브가 다음 입력을 예고하고 충격은 트랙과 동기화된다. | 한 충돌 지점에 초점을 모으는 원리만 카드의 단일 주변부 잠금으로 적용한다. 새로운 공 진입 경로나 리듬 장애물은 없다. | 빠른 트랙 줌으로 존의 크기와 고정 위치가 계속 변하게 하지 않는다. | 이번 원리 적용 · P03 |
| I06 [Just Shapes & Beats](https://store.steampowered.com/app/531510/) | 화면의 안전지대가 줄어드는 패턴을 함께 피하는 구간.<br>위험 영역과 안전 경로의 대비가 즉시 읽히고, 패턴 변화는 박자 단위로 온다. | 원작의 장르 규칙은 제외한다. 네온색 경고를 계속 켜두어 실제 공/카드 대비를 먹지 않는다. 이 원작 규칙을 우리 게임에 새로 구현했다고 하지 않는다. | 네온색 경고를 계속 켜두어 실제 공/카드 대비를 먹지 않는다. | 충돌로 제외 · P11 |
| I07 [Geometry Dash](https://store.steampowered.com/app/322170/) | 장애물 앞 연속 점프를 한 번의 반복 패턴으로 익히는 구간.<br>반복 패턴은 예측 가능한 입력 단위로 묶이고, 실수 후 즉시 재시작한다. | 원작의 장르 규칙은 제외한다. 9칸을 동시에 튀게 해 각 결과를 비교할 시간을 없애지 않는다. 이 원작 규칙을 우리 게임에 새로 구현했다고 하지 않는다. | 9칸을 동시에 튀게 해 각 결과를 비교할 시간을 없애지 않는다. | 충돌로 제외 · P11 |
| I08 [Spin Rhythm XD](https://store.steampowered.com/app/1058830/) | 트랙 색과 입력 도구를 맞추고 회전할 때의 손동작.<br>색/동작의 일대일 대응으로 입력 의미를 빠르게 익힌다. | 움직이는 대상의 감각 위치가 따라간다는 설계 가설만 채택해 실제 화면 출발→도착 pan을 연결한다. 색상/구종 대응은 구현하지 않는다. | 팀 컬러, 존 상태, 구종을 같은 색으로 동시에 인코딩하지 않는다. | 이번 원리 적용 · P05 |
| I09 [A Dance of Fire and Ice](https://store.steampowered.com/app/977950/) | 경로 꺾임을 미리 읽고 궤도 전환을 입력하는 구간.<br>시각 경로가 다음 입력 위치를 직접 예고한다. | 반복 입력의 청각 강약 관리 원리를 동시 배치 보이스 게인 정규화에 적용한다. 투구 도착 예고·박자 판정은 새로 넣지 않는다. | 경로 표시가 타자의 몸/카드 위를 가로질러 핵심 실루엣을 자르지 않는다. | 이번 원리 적용 · P04 |
| I10 [Rhythm Doctor](https://store.steampowered.com/app/774181/) | 환자별 박동 패턴을 익히고 방해가 낀 뒤 정답 박자를 누르는 순간.<br>기본 박동에 예외 패턴을 학습시키고, 정답 시 환자 상태가 안정되는 결과를 잇는다. | 짧은 반복 신호를 겹쳐 과장하지 않는 원리를 배치 보이스 게인 정규화·자연 종료 회수에 적용한다. 새 투수 루틴이나 박자 입력은 없다. | 재생하지 않은 심장음의 박자나 박자 간격을 숫자로 설정하지 않는다. | 이번 원리 적용 · P04 |

### J. 보상·성장·평상시 대비

| ID·공식 출처 | 참고 장면·작동 원리 | 9ZONE 적용 | 피할 점 | 처리 |
|---|---|---|---|---|
| J01 [Vampire Survivors](https://store.steampowered.com/app/1794680/) | 작은 처치·경험치 수집과 큰 성장<br>설계 해석: 상시 반복 보상과 레벨업 같은 큰 결과에 강약이 있어야 피로가 적다 | 기존 후보의 원리를 유지: 기존 홈런/강판 전용 대비 유지·상업 품질 미확정. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 작은 성공도 매번 보상창·큰 슬로모로 막지 않는다 | 기존 후보 연결 · P10 |
| J02 [Deep Rock Galactic: Survivor](https://store.steampowered.com/app/2321470/) | 채굴·적 압박·목표 진행<br>설계 해석: 화면 중심의 위험과 외곽의 누적 목표가 분리되어야 동시 행동을 이해한다 | 기존 후보의 원리를 유지: 기존 실제 결과 공개 경계·발동/HP 인과 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 타격 목표를 반짝이는 UI 여러 곳으로 흩어 놓지 않는다 | 기존 후보 연결 · P08 |
| J03 [Risk of Rain 2](https://store.steampowered.com/app/632360/) | 위험이 커질수록 커지는 전투 결과<br>설계 해석: 크기·공간·명도 차이가 실제 위협의 차이를 말해야 강한 장면이 정당하다 | 기존 후보의 원리를 유지: 기존 홈런/강판 전용 대비 유지·상업 품질 미확정. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 보통 1칸 카드도 보스 처치만큼 흔들지 않는다 | 기존 후보 연결 · P10 |
| J04 [Dead Estate](https://store.steampowered.com/app/1484720/) | 방 안 가까운 적과 짧은 공격 흔적<br>설계 해석: 충돌 근처만 밝히면 작은 화면에서도 누가 맞았는지 읽힌다 | 기존 후보의 원리를 유지: 기존 G020 공유 시계·릴리스·공/접촉 FX 후보 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 모든 배경 면을 계속 어둡게 만들지 않는다 | 기존 후보 연결 · P07 |
| J05 [HoloCure - Save the Fans!](https://store.steampowered.com/app/2420510/) | 다수의 작은 보상과 성장 선택<br>설계 해석: 이미 익숙한 반복은 짧게, 빌드가 변하는 결정은 명확하게 보여준다 | 기존 후보의 원리를 유지: 기존 실제 결과 공개 경계·발동/HP 인과 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 과한 숫자 샤워를 야구의 모든 투구에 적용하지 않는다 | 기존 후보 연결 · P08 |
| J06 [Stardew Valley](https://store.steampowered.com/app/413150/) | 도구 입력·작물/자원 결과·수집<br>설계 해석: 손의 동작과 작업물 변화가 직접 이어지면 작은 행동도 완결감을 준다 | 후속 제작·검수: 새 사지 중간 그림·실제 폼별 연속 동작 후속 제작. 이번 적용 완료가 아니며 새 사지 그림을 아직 반입하지 않았다. | 성공 피드백 때문에 카드·존 선택 단계를 하나 더 넣지 않는다 | 후속 원화·검수 · P09 |
| J07 [Terraria](https://store.steampowered.com/app/105600/) | 채굴/공격 후 재료·적 반응<br>설계 해석: 입력한 위치에서 작은 상태 변화가 반복되어 조작의 믿음을 만든다 | 기존 후보의 원리를 유지: 기존 실제 결과 공개 경계·발동/HP 인과 유지. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 지속 파티클과 숫자를 쌓아 카드를 가리지 않는다 | 기존 후보 연결 · P08 |
| J08 [DAVE THE DIVER](https://store.steampowered.com/app/1868140/) | 준비·조준·획득과 짧은 보상<br>설계 해석: 획득 과정은 짧고 새 수집 성과만 별도 강조하면 진행의 리듬이 생긴다 | 기존 후보의 원리를 유지: 기존 홈런/강판 전용 대비 유지·상업 품질 미확정. 이 행은 신규 기능이나 시각 검수 통과를 뜻하지 않는다. | 매 결과를 미니게임·컷신으로 바꾸지 않는다 | 기존 후보 연결 · P10 |
| J09 [DREDGE](https://store.steampowered.com/app/1562430/) | 평온한 이동과 위험/획득의 대비<br>설계 해석: 고요한 기본 상태가 있어야 작은 경고·결과도 크게 느껴진다 | 평상시와 사건의 대비 원리를 착지 후 임시 광원/몸체를 걷는 방식으로 적용한다. 존 정보가 계속 읽히는 안정 상태로 돌아간다. | 평상시부터 지속 흔들림·잔광을 켜 두지 않는다 | 이번 원리 적용 · P02 |
| J10 [Loop Hero](https://store.steampowered.com/app/1282730/) | 자동 진행 속에서 카드 배치로 세계 바꾸기<br>설계 해석: 결정한 카드가 실제 보드에 남으면 긴 진행에서도 내 선택이 보인다 | 내가 놓은 카드의 결과가 보드에 남는 원리를 임시 표면 회수 뒤 기존 실제 coverage·역할 토큰 유지로 적용한다. | 한 칸 배치에도 긴 연출을 강제하지 않는다 | 이번 원리 적용 · P01 |

## 효과로 해결할 수 없는 부분

투수는 축발 고정→골반 선행→디딤→몸통 회전→팔꿈치 이동→팔 가속→빈손 릴리스→가슴이 앞다리 위로 넘어감→회복이 실제 그림으로 이어져야 한다. 좌완/우완/사이드/언더는 팔 슬롯·글러브 손·뒤다리 동작이 다르다. 기존12그림을 재배치한 것을 새120장 애니메이션으로 부르지 않는다. 세부 후속 원화 명세는 [G020 기록](../../art/quality/pitch-juice-g020/README.md#what-blocks-the-next-quality-step)에 남아 있다.

텍스트 가독성과 결과 정보 위계도 파티클만 늘려 해결하지 못한다. 같은 사건의 시간·접점·원인만 강조하고, 새 카드 규칙·미니게임·실시간 박자 판정은 이번 작업에 넣지 않는다. 작품별 원본 이미지는 게임 자산으로 가져오지 않는다.

## 검증 기록

최신 G021은 HELD1/3:3.27→3.38(+0.10),1/8축 개선으로 NOT_IMPROVED이며 Draft다. [원본 시각 판정](../../art/quality/card-feedback-g021/README.md)에5쌍·sealed점수·reveal·같은 입력/coverage/시각 manifest를 보존했다. 기존 G020 HELD3/3도 유지한다. 기능·배속·실제 플레이·시각 판정의 최종 결과는 [G021 작업 기록](../../../loop/autodev/issues/G-021.md)에 이어서 기록한다. 연구 자료를 작성한 사실을 구현 완료·재미 검증·상업 품질 통과로 바꾸지 않는다.
