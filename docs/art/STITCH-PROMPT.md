# 스티치(Google Stitch) 프롬프트 — 9ZONE HOMEBOUND 마스터피스 시안

> 사용법: 스티치 새 프로젝트 → **Mobile** 선택 → 아래 [1] 전투 화면 프롬프트를 붙여 넣는다.
> 첨부 가능하면 `assets/pitcher-mobs-v1/regular-01-red-rush.png`, `assets/duel/stadium.png`, `docs/art/benchmark/ref-01-commercial.png`를 같이 올린다.
> 전투 화면이 마음에 들면 **같은 프로젝트에서** [2] 지도, [3] 보상 프롬프트를 이어서 넣는다 (디자인 시스템 유지).
> 결과 HTML은 그대로 쓰지 않는다. 구도·재질·위계를 뽑아 우리 코드(.bp-*)와 UI 킷(A1~A11)으로 옮긴다.

---

## [1] 전투 화면 (메인)

```text
Design ONE portrait mobile game screen (390x844) for "9ZONE HOMEBOUND", a premium Korean pixel-art baseball roguelike deckbuilder. It must look like a finished commercial game at the level of top-grossing gacha/indie hits (think the density and polish of Octopath-style HD-2D menus and Slay the Spire's clarity), NOT a web dashboard and NOT a sci-fi HUD.

WORLD & MOOD: a night baseball duel in a floodlit Korean stadium at dusk-to-night. Warm sodium floodlights from above, purple-orange sky, packed stands, clay infield. Cozy-dramatic, like a boss fight under lights. The enemy is a glamorous adult woman pitcher (red high ponytail, black-and-crimson cropped jersey, ivory shorts) drawn in high-density anime pixel art; the batter is a smaller pixel-art player in cream uniform and teal helmet, seen from behind-left. Characters must feel grounded: floor shadows, rim light from floodlights.

ART DIRECTION (strict):
- One art style everywhere: crisp high-density pixel art for characters/background, and UI that is DRAWN, not flat boxes.
- UI materials: cream baseball leather with red V-stitching (speech bubbles, cards), navy scoreboard enamel with brass rivets (panels, HP), sodium gold #FFC861 as the ONLY glowing accent (primary button, selected state, rare items).
- Palette only: #07080D ink, #141A33 night navy, #2A3152 line, #7B84A6 slate, #ECE4CF cream, #B7B09E cream shadow, #FFC861 sodium gold, #D23A3A stitch red, #C8923A brass, #8A5A32 glove brown.
- Typography: a Korean pixel/bitmap-style display face for big calls and names, a clean rounded Korean sans for body. Minimum text size 12px; call-outs 28–40px. No English jargon except tiny labels.
- Forbidden: neon cyan/mint, scanlines, glassmorphism, emojis, bottom tab bar, fake phone status bar, dense stat tables, more than one accent colour, text smaller than 12px.

LAYOUT (top to bottom):
1. Thin top bar: "1막" at left; two small leather tabs at right: "덱 9", "버림 2".
2. THE SCENE (about 55% of the height) — the stadium is the screen:
   - Pitcher standing on the mound at right-center, large and fully visible (face, glove, legs). Nothing covers her face or body.
   - Above her head, a compact navy-enamel HP strip: name "레드 러시", 12 cream HP pips (3 just lost in red), tiny "흔들림" 3 pips.
   - Beside her, a small gold-edged tell chip: "▸ 낮게 떨어뜨린다".
   - A cream-leather speech bubble with red stitching and a tail pointing at her: "첫 타석부터 불 붙여볼까?"
   - Batter at bottom-left, bat raised, cut off by the bottom edge.
   - The 3x3 strike zone floats in front of the plate, semi-transparent white frame, each cell showing a big percentage (e.g. 7%, 11%, 24%); the most likely cell marked "최다" in gold; dimmed cells say "안 던짐". Around it a dashed ball band labelled "바깥 띠 = 볼 11%". One cell aimed: gold border with a numbered token "1" and a brass diamond. It must not cover the pitcher.
   - Count (B ●●○ / S ●○ / O ○○) as a small scoreboard plate in a corner; three diamond bases showing runners.
3. One narrator line under the scene in cream: "낮은 공이 온다. 맞혀도 타구가 무겁다."
4. THE HAND: a row of 4–5 baseball-leather cards (portrait, stitched frame): each has a tiny 3x3 coverage glyph, a role chip (장타 gold / 정타 red / 범위 cream), the name ("정타 노림", "밀어치기", "당겨 넘기기"), one short effect line ("정확 적중 HP +50%"). The selected card is lifted with a gold frame and a "1" order badge.
5. TWO VERBS at the bottom, big and thumb-friendly: primary gold leather button "휘두른다" with sub-line "적중권 62% · 피해 ×1.0"; secondary navy button "지켜본다".

FEEL: every element should look hand-crafted with depth (bevels, stitching, rivets, soft inner shadows), strong hierarchy (scene first, then zone, then hand, then verbs), generous spacing, perfectly aligned 8px grid. Show the moment right before the pitch: tension, anticipation.
Deliver high-fidelity visuals, not a wireframe.
```

---

## [2] 원정 지도 (같은 프로젝트에서 이어서)

```text
Using the SAME design system, create the run map screen (390x844) for 9ZONE HOMEBOUND.
- Top: stadium sky banner with the line "어느 마운드부터 무너뜨릴까." in the pixel display face; top bar "1막 · 덱 9".
- Middle: a vertical route of stadium plaques connected by stitched dotted paths (like baseball seams). Nodes are diamond-shaped base plaques: regular fight (navy+brass), elite (red stitch rim), boss (gold, bigger, at the top), facilities (cream leather: 라커룸, 타격 훈련, 장비 상점, 휴식일). Fights show the pitcher as a black silhouette; reachable nodes glow softly in sodium gold; completed nodes are dimmed with a small stitched check.
- Bottom sheet (leather card): selected pitcher's full-colour pixel portrait on the left, tag "정규전", name "청록 미라주", habit line "바깥쪽을 좋아한다.", 12 HP pips "HP 60", reward "이기면 카드 3장 중 1장", and a big gold button "이 구장으로 간다".
Same palette, no neon, no emojis, min text 12px.
```

---

## [3] 보상 화면 (같은 프로젝트에서 이어서)

```text
Using the SAME design system, create the victory reward screen (390x844).
- Upper half is a stage: the knocked-out pitcher's full-body pixel portrait on the right (face fully visible, slightly defeated but charming pose), stadium lights behind her.
- Her last line in a large cream-leather speech bubble pointing at her: "...식어버렸네. 다음에 또 붙자." with a red opening quote mark.
- Title in gold pixel display type on a navy enamel plate: "레드 러시 강판", small line "한 장 챙겨 가자."
- Three reward cards rise from the bottom, overlapping her legs: baseball-leather cards with stitched frames, a coverage glyph, name and one effect line ("당겨 넘기기 · 파워 +36", "주자 연결 · 주자 2베이스", "커트 스윙 · 단타 확정"). One card is a rare signature card: brass-and-gold frame, gold corner studs, soft gold glow, tag "시그니처".
- Bottom: gold button "챙긴다", navy button "그냥 간다".
Same palette, no neon, no emojis, min text 12px.
```

---

## 결과가 기준 미달일 때 덧붙일 한 줄
- 너무 웹 같음 → `Make it look like a shipped console/mobile GAME screen, not a website. Replace every flat rectangle with a crafted material (leather, enamel, brass).`
- 색이 튐 → `Use only the listed 10 colours; remove every cyan, mint, purple glow.`
- 투수가 가려짐 → `Nothing may overlap the pitcher's face and body; move the HUD to the edges.`
- 글자 작음 → `No text below 12px; enlarge the call-outs and card names.`
