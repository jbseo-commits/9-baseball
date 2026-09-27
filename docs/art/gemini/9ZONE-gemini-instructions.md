# 9ZONE HOMEBOUND — UI 에셋 생성 지시서 (Gemini용)

이 파일과 함께 올린 그림 3장을 기준으로, 사용자가 **에셋 ID만 입력하면** 그 에셋 이미지를 1장 생성한다.

## 너의 동작 규칙

1. 사용자가 `A1` ~ `A11` 중 하나만 입력하면: 아래 **[공통 규칙]** + 해당 **[에셋 프롬프트]**를 그대로 합쳐서 이미지 1장을 생성한다. 질문하지 말고 바로 생성한다.
2. 생성 후에는 짧게 한 줄만 답한다: `A1-bubble.png 로 저장하세요` 처럼 **저장할 파일 이름**만 알려준다. 설명·제안을 길게 쓰지 않는다.
3. 사용자가 `A1 다시` 라고 하면 같은 프롬프트로 새로 생성한다. `A1 다시: <문제>` 라고 하면 그 문제를 고치라는 지시를 프롬프트 끝에 추가해서 다시 생성한다.
4. 사용자가 `다음` 이라고 하면 추천 순서의 다음 에셋을 생성한다. 추천 순서: A1 → A4 → A5 → A6 → A7 → A3 → A9 → A8 → A10 → A2 → A11
5. **첨부된 투수 캐릭터 그림 2장이 화풍 기준이다.** 구장 그림은 색과 밝기 기준이다. 모든 에셋은 그 옆에 놓았을 때 같은 게임으로 보여야 한다.
6. 이미지 안에 **글자·숫자·한글·로고를 절대 넣지 않는다.** 텍스트는 게임 코드가 넣는다.
7. 배경은 진짜 투명. 불가능하면 완전 단색 마젠타 #FF00FF (그라데이션·그림자·체크무늬 없음).

## 스스로 검사할 것 (생성 전에 확인)

- 투수 그림과 같은 고밀도 픽셀 아트인가 (매끈한 벡터·페인팅 번짐 아님)
- 한 에셋 안에서 픽셀 크기가 하나인가
- 늘어나는 틀(9-slice)은 네 변 테두리 두께가 같고 가운데 면이 무늬 없는 단색인가
- 여러 상태를 그리는 에셋은 한 이미지 안에 같은 크기 칸으로 가로로 나란히 있는가
- 팔레트 10색 밖의 색이 크게 들어가지 않았는가

## [공통 규칙] — 모든 에셋 프롬프트 앞에 붙인다

```text
You are creating one UI asset for 9ZONE HOMEBOUND, an anime pixel-art baseball roguelike played at night in a floodlit stadium.
Match the attached pitcher character images EXACTLY in rendering style: exquisite high-density 2D pixel art, visible square pixels, crisp stair-stepped highlights, controlled 3–5 step hue-shifted cel shading, 1-pixel #07080d outer outline, selective inner outlines. Draw on a native pixel grid, then enlarge with clean nearest-neighbor x4. Never a smooth painting with a pixel filter, never 3D, never blurry, never noisy, never airbrushed.
Materials: cream baseball leather (#ece4cf, shadow #b7b09e) with red baseball stitching (#d23a3a); navy scoreboard enamel (#141a33, inner line #2a3152) with brass rivets (#c8923a); sodium-lamp gold (#ffc861) is the ONLY glowing accent. Light comes from warm stadium floodlights above.
Use only these colors and their shading steps: #07080d #141a33 #2a3152 #7b84a6 #ece4cf #b7b09e #ffc861 #d23a3a #c8923a #8a5a32.
OUTPUT: genuine transparent PNG. If true transparency is impossible, use one perfectly flat solid #FF00FF background with no gradient, shadow or noise, and never use #FF00FF inside the asset. Keep at least 4 native pixels of empty margin around the asset.
ABSOLUTELY NO text, letters, numbers, Korean characters, logos, watermarks or checkerboard pattern. No outer glow or drop shadow outside the asset. No fantasy decoration (no parchment, runes, vines, leaves).
```

## [에셋 프롬프트]

### A1 — 대사 말풍선  → 저장 이름: `A1-bubble.png`

```text
ASSET: speech bubble frame for a pitcher's spoken line, designed as a 9-slice.
Native size 96x48 pixels. Cream baseball-leather surface with a row of small red V-shaped baseball stitches running parallel to the border, 3 native pixels inside the edge, evenly spaced on all four sides. Softly rounded corners (radius 6 native px). Border band 12 native px thick, identical on all four sides; the center area is plain flat cream leather with no pattern so text can sit on it.
Draw THREE variants side by side in one row, equal cells, separated by magenta gaps: (1) no tail, (2) short pointed tail at the bottom-right corner pointing down-right, (3) the same tail at the bottom-left pointing down-left. Tails are part of the same leather with stitching continuing onto them.
```

### A2 — 이름표 탭  → 저장 이름: `A2-nametab.png`

```text
ASSET: small name tab that sits on the top-left edge of the speech bubble, 9-slice.
Native size 48x14. Navy scoreboard enamel with a 1px brass inner border and a tiny brass rivet at each end. Center plain and flat for a name to be written by code.
Two variants side by side: (1) navy, (2) navy with a red stitch-colored left edge stripe.
```

### A3 — 정보 패널  → 저장 이름: `A3-panel.png`

```text
ASSET: information panel, 9-slice. Native size 64x40.
Navy scoreboard enamel plate, 1px #2a3152 inner bevel line, thin brass frame, one small round brass rivet in each corner. Slight top highlight from floodlights, darker bottom edge. Border band 10 native px thick on all four sides; center plain flat navy, very slightly lighter than the border, no pattern.
```

### A4 — 주 버튼  → 저장 이름: `A4-button-primary.png`

```text
ASSET: primary action button, 9-slice. Native size 80x24.
Sodium-gold (#ffc861) leather button with a brown leather side (#8a5a32) visible below it, like a thick pressed baseball-glove patch; a row of small red stitches along the top and bottom edges. Border band 10 native px; center plain flat gold.
Three states side by side, equal cells: (1) normal — raised, bright top highlight; (2) pressed — pushed down 2 native px, side almost hidden, slightly darker; (3) disabled — desaturated grey-navy (#7b84a6 family), no stitches highlighted, flat.
```

### A5 — 보조 버튼  → 저장 이름: `A5-button-secondary.png`

```text
ASSET: secondary action button, 9-slice. Native size 80x24.
Navy scoreboard enamel button with a thin cream (#ece4cf) inner outline and brass end rivets; side depth in #07080d. Border band 10 native px; center plain flat navy.
Three states side by side: (1) normal, (2) pressed (down 2 native px), (3) disabled (dim, low contrast).
```

### A6 — 카드 틀  → 저장 이름: `A6-card-frame.png`

```text
ASSET: card frame for a hand of baseball batting cards, 9-slice. Native size 40x56 (portrait).
Cream baseball-leather card face bordered by a navy enamel frame with red stitching along the inside of the frame. Border band 8 native px; center plain flat cream for code to draw the card content.
Four variants side by side, equal cells: (1) common — as described; (2) selected — frame edge turns sodium gold with brighter top highlight; (3) signature/rare — brass-and-gold frame with four small gold diamond studs at the corners and a subtle warm sheen band across the top border only; (4) skill — same as common but with fully rounded pill-like corners (radius 10 native px).
```

### A7 — 카드 뒷면  → 저장 이름: `A7-card-back.png`

```text
ASSET: back side of the same card, not a 9-slice. Native size 40x56.
Navy enamel back with a centered emblem: a 3x3 grid of small square cells (a strike zone) inside a baseball-diamond outline, in brass and sodium gold. Diagonal fine leather grain pattern in two navy shades. Frame and stitching identical to A6 common.
```

### A8 — 진행 단계 노드  → 저장 이름: `A8-steps.png`

```text
ASSET: step progress indicator parts. Draw on one canvas in a row with magenta gaps:
- Node, native 16x16: a baseball base (square rotated 45 degrees) made of cream leather with a brass rim. Three states: (1) off — dim navy-grey; (2) current — cream with sodium-gold rim and a small bright gold core; (3) done — cream with a small red stitch check mark shape (not a letter).
- Connector line, native 16x4: two states — (1) off: dotted navy; (2) on: solid sodium gold with a 1px highlight.
```

### A9 — HP 게이지  → 저장 이름: `A9-hp.png`

```text
ASSET: pitcher HP gauge parts on one canvas, row with magenta gaps.
- Gauge frame, 9-slice, native 64x8: navy enamel groove with brass end caps, border 3 native px, plain dark center.
- Segment, native 4x6, three states: (1) full — cream with warm top highlight; (2) just lost — red #d23a3a; (3) empty — dark navy slot.
```

### A10 — 지도 노드 받침  → 저장 이름: `A10-map-node.png`

```text
ASSET: map node base plates, native 24x24 each, row with magenta gaps. Each is a baseball-base shaped (45-degree diamond) stadium plaque seen from the front, where a pitcher silhouette or icon will be placed by code.
Five variants: (1) regular fight — navy enamel with brass rim; (2) elite — navy with red stitch rim; (3) boss — larger visual weight, gold rim with four studs; (4) facility — cream leather with brass rim; (5) locked — dark grey, no highlights.
```

### A11 — 아이콘 12종  → 저장 이름: `A11-icons.png`

```text
ASSET: icon set, 12 icons, each native 12x12, in one row (or 2 rows of 6) with magenta gaps, all same visual weight and outline.
Icons: (1) deck — stack of three cards; (2) discard — card with a small downward arrow; (3) sound on — stadium speaker with two waves; (4) sound off — speaker with a small cross; (5) help — round baseball with a question-mark-shaped stitch (not a letter, a stitch curve); (6) locker room — locker door; (7) training — baseball bat and ball; (8) shop — equipment bag; (9) rest — crescent moon over a cap; (10) runner — small running figure silhouette on a base; (11) shaken — a baseball with a crack line; (12) signature — four-point star in gold.
Cream and gold on transparent, 1px #07080d outline.
```

---

# [B 트랙] 완성형 목업용 일러스트 에셋

> 기준: 사용자가 준 **9ZONE 완성형 목업**(카드 일러스트, 코치, 지도, 스플래시). 목업 이미지를 같이 올리면 가장 좋다.
> UI 킷(A)과 달리 **색 제한 없음**(일러스트). 대신 투수 그림과 같은 고밀도 애니 픽셀 아트 화풍, 글자 없음, 배경 규칙은 동일.
> 사용자 입력: `CARD-PLACE` 같은 ID 하나 → 그 그림 1장 생성. `카드 전부` → 아래 카드 16장을 순서대로 한 장씩.

## [B 공통 규칙]
```text
You are creating one illustration asset for 9ZONE HOMEBOUND, a premium anime pixel-art baseball roguelike.
Match the attached target mockup and pitcher images in rendering: exquisite high-density 2D anime pixel art, visible square pixels, crisp stair-stepped highlights, 4–6 step hue-shifted cel shading, dramatic lighting, strong silhouette readable at small size. Never 3D, never photo, never blurry painting with a pixel filter.
Our batter: young Korean baseball player in a CREAM uniform with TEAL helmet and teal sleeves, dark hair, determined face. Night stadium world with warm floodlights.
ABSOLUTELY NO text, letters, numbers, logos or watermark in the image. No frame or border (the game draws the frame).
OUTPUT: PNG. Background as described per asset; if a transparent background is requested and impossible, use flat #FF00FF.
```

## 카드 일러스트 16장 — 공통 (각 카드 프롬프트 앞에 [B 공통 규칙] + 이 줄)
```text
ASSET: trading-card illustration, landscape 4:3, native grid 96x72 then x4. Full-bleed scene (no transparency): a close dynamic action moment with a dark vignette and ONE dominant energy colour glow, composed so the subject reads in a 90px-wide thumbnail. Same batter character in every card.
```
| ID | 카드 | 장면 (프롬프트 끝에 붙인다) |
| --- | --- | --- |
| CARD-PLACE | 정타 노림 | `Scene: the batter's bat meets the ball dead-center, a starburst of GOLD sparks at the sweet spot, ball deforming, extreme close-up on bat and ball.` |
| CARD-STRIKE | 밀어치기 | `Scene: the batter slaps an outside pitch to the opposite field, ball streaking right with a BLUE-WHITE wind trail, bat extended.` |
| CARD-SLUG | 당겨 넘기기 | `Scene: full pull swing, massive hip rotation, the ball rocketing left wrapped in RED-ORANGE fire, silhouette against flames.` |
| CARD-RALLY | 주자 연결 | `Scene: a runner sliding into second base under TEAL light trails while the batter follows through in the background.` |
| CARD-BUNT | 희생 번트 | `Scene: the batter squares to bunt, bat horizontal, ball dropping softly at his feet with a calm CREAM glow, dust at the plate.` |
| CARD-FINISHER | 갭 공략 | `Scene: a line drive splitting two outfielders in the gap, GOLD streak cutting across a dark outfield.` |
| CARD-DEFEND | 커트 스윙 | `Scene: the batter fouls off a nasty pitch with a short defensive swing, ball deflecting backward with VIOLET sparks, gritty expression.` |
| CARD-WALL | 존 봉쇄 | `Scene: a glowing 3x3 strike-zone lattice of BRASS-GOLD light in front of the batter like a shield, pitch shattering against it.` |
| CARD-LASER | 라인드라이브 | `Scene: a razor-straight line drive leaving a BRIGHT CYAN-WHITE laser beam from bat to horizon.` |
| CARD-COMMIT | 끝장 승부 | `Scene: the batter alone in a spotlight, eyes locked, bat raised, a single glowing target square in front of him, CRIMSON aura, everything else dark.` |
| CARD-SETUP | 타이밍 맞추기 | `Scene: the batter's front foot tapping, faint clock-like rings of GOLD light around the stride, calm focus.` |
| CARD-WATCH | 작전 확인 | `Scene: the batter glancing at the third-base coach giving hand signs, TEAL signal glints, dugout lights behind.` |
| CARD-SCOUT | 릴리스 간파 | `Scene: over-the-shoulder view of a pitcher's release point, the grip highlighted by a BLUE analytic glow in the batter's eyes.` |
| CARD-LURE | 코스 조정 | `Scene: the batter shifting in the box, feet sliding, GOLD guide lines on the dirt showing a new stance.` |
| CARD-FLOW | 히트앤드런 사인 | `Scene: a runner breaking from first on the pitch, TEAL motion streaks, batter preparing to swing.` |
| CARD-CALM | 호흡 고르기 | `Scene: the batter stepping out of the box, eyes closed, breathing out a soft CREAM mist, gentle warm light.` |

## B3 대형 타자 MASTER Ready 포즈 (SSOT LOCK) → `B3-ready.png`
```text
Reference image 1: used ONLY for high-density 2D anime pixel-art rendering style, 4-step cel-shading, crisp stair-stepped highlights, and 1-pixel outer outlines.
Reference image 2: the approved 9ZONE batter character, used for character identity, outfit, and gear colors.

Draw the hero batter from image 2 in a dramatic over-the-shoulder batting ready stance (SSOT Master pose), matching the pixel-art rendering density and master quality of image 1.
The batter is viewed from behind-left in three-quarter view, looking toward the pitcher on the right.
Maintain the exact character identity:
- Deep teal/dark green batting helmet with glossy visor reflection
- Cream/ivory baseball uniform jersey and pants with subtle dark teal pinstripe piping
- Dark teal sleeves visible under the short-sleeve cream jersey
- Brown leather batting gloves gripping the wooden baseball bat cocked back high above the back shoulder
- Sturdy athletic lower body and cleats planted on the dirt batter's box
- Entire body and complete bat are fully inside the frame with clear empty margins around the edges.
OUTPUT: Single character on a perfectly flat solid magenta (#FF00FF) background for chroma keying. Absolutely NO fake checkerboard pattern, no painted background scenery, no stadium, no text, no Korean letters, no UI, no drop shadow.
```

## B2 코치 초상 → `B2-*.png`
```text
ASSET: bust portrait of the team's veteran coach for dialogue, native 64x64 then x4, transparent background (or flat #FF00FF). A weathered Korean man in his 50s, navy team cap with a small gold 9, grey stubble, sunglasses pushed up on the cap or dark shades, navy windbreaker, a knowing half-smile. Facing right toward the dialogue box, 3/4 view, shoulders cut at the bottom edge.
```

## B4 원정 지도 배경 → `B4-*.png`
```text
ASSET: illustrated world map background for the run map, native 240x160 then x4, full-bleed (no transparency). Top-down 3/4 view of a coastal Korean city at dusk: a river with bridges, districts, and several small baseball stadiums as landmarks connected by empty space where route paths will be drawn by code. Warm city lights, purple-orange sky at the top edge. No icons, no paths, no text.
```

## B5 스플래시 2종 → `B5-*.png` (한 이미지에 두 칸 나란히, 사이 마젠타 간격)
```text
ASSET: two full-bleed splash backgrounds side by side, each native 160x96 then x4, separated by a flat #FF00FF gap.
(1) HOME RUN: the batter at the end of a huge swing seen from behind-right, ball rocketing into a night sky full of fireworks, blue-white light beams radiating from the bat, stadium lights flaring. Leave the upper-right third calm for a big title drawn by code.
(2) KNOCKOUT: dramatic red-toned stadium, blurred crowd, empty pitcher's mound with a dropped glove and cap under a single spotlight (NO pitcher figure). Leave the right half calm for text drawn by code.
```

> 정리: 받은 PNG를 `assets/ui-kit/raw/<ID>-1.png`로 저장 → `node scripts/asset-fix.mjs <ID>` (illustration 모드: 색 유지, 배경·크기·격자만 정리).

