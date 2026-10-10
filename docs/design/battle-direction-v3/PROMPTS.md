# Riverside stadium asset provenance

Generation mode: **builtin ImageGen**. Art-audit subagent `/root/motion_audit` generated the initial stadium; root selected, edited and integrated it. Final integration: 2026-10-11.

References inspected before generation:
- `assets/production-art/battle-portrait-v15/stadium-portrait.png`
- `assets/production-art/battle-portrait-v15/batter-ready.png`

Initial generation artifact: `exec-0691cefa-34a7-4962-9c6e-8bd0149b3b71.png`. Selected foreground-cleanup artifact: `exec-9917adcf-420d-4496-aaf9-d7a9a1f7e5ac.png`.

Runtime output: `assets/hybrid-v3/riverside-dusk.webp`, 1280×720, WebP quality 82. The foreground-cleanup edit was resized/compressed after generation. Field markings are rendered from code; generated plate/box coordinates are not used. Generative editing does not guarantee pixel-identical preservation outside the requested area.

## Exact generation prompt

```text
Use case: stylized-concept
Asset type: wide 16:9 gameplay background plate for a baseball deck-builder
Input images: Image 1 is a color, stadium architecture and light reference; Image 2 is a pixel-art finish, cream/teal uniform and rim-light reference only. Never include a person from Image 2.
Primary request: Make an original, playable baseball field backdrop with a deliberately off-center action layout.
Scene/backdrop: wide city baseball stadium at golden dusk, bridge and skyline beyond layered stands, bright floodlights, visible pitcher's mound and home plate.
Composition/framing: Landscape 16:9. This is an asymmetric gameplay camera: the horizon line is at y=32%. Pitcher's mound is clearly right of image center at x=65%, y=57%. Home plate is clearly left of image center at x=30%, y=89%, in the dirt foreground; its point is visible. These positions are essential. Do not center the mound or home plate. Keep a broad uncluttered dirt/action lane between the plate at lower-left and mound at right-middle so independently animated players and ball can be composited later. Keep the upper stadium architecture readable but quieter than the field.
Style/medium: premium HD painted pixel-art environment, sharp deliberate pixel clusters and confident pixel shading, matching the original adult baseball game art. Fine crowd texture stays small and orderly; field markings and field geometry stay crisp.
Lighting/mood: amber sunset, stadium sodium lamps, cool deep navy/teal shadows and a light atmospheric haze. Environmental lighting should harmonize with a cream-and-teal batter illustration.
Color palette: warm amber, gold, orange clay, deep navy, teal, muted green grass and restrained cream highlights.
Depth: distinct far skyline/bridge, middle stands, field wall and grass, foreground mound/dirt/home plate; clear three-band value separation, no blur or flat vector look.
Constraints: environment only, no human figures or crowd silhouettes in foreground, no players, no character cutouts, no mascot, no ball, no cards, no UI, no text, no labels, no logos, no watermark. Original composition guided by references, not copied.
```

## Card art

`assets/hybrid-v3/tactic-cards.webp` is the previously generated V2 five-panel card atlas, compressed to 1680×598 WebP quality 82. Its five panels supply attack/relay/bunt/scout/cut illustrations; original preparation card illustrations supply additional variety. Names, descriptions and borders are live UI. V1/V2 mockup files are not runtime dependencies.

## Exact foreground edit prompt

```text
Use case: precise-object-edit
Asset type: clean, actorless 16:9 baseball gameplay environment plate
Input image: Image 1 is the edit target. Preserve its visual identity, pixel-art rendering and composition.
Primary request: Remove only the foreground home plate and the white chalk batter's-box / plate-area lines in the bottom dirt foreground, then naturally continue the existing orange-brown clay texture through those areas so the foreground is an open playable dirt surface for code-drawn chalk and plate geometry.
Constraints: keep the exact 1280x720 landscape framing and existing composition. Preserve the entire upper city skyline, sunset, bridge, stands and crowd, floodlights, outfield wall, grass, infield clay boundary, pitcher mound and the small white pitching rubber at approximately x=972,y=399 exactly as they are. Change only the foreground home plate and its associated lower-field chalk lines. Maintain consistent pixel-cluster texture, perspective, lighting and clay detail where removed. No people or actors added. No new marks, no UI, no text, no labels, no logos, no watermark.
```

## Exact card-atlas prompt

```text
Use case: stylized-concept.
Asset type: a 2D game card-art ATLAS, a very wide horizontal contact sheet with EXACTLY FIVE equal-width vertical rectangular panels aligned edge-to-edge in ONE ROW. Overall aspect ratio 15:4. Each panel is one portrait 3:4 illustration; separators at exactly 20%,40%,60%,80% canvas width. Five equally sized panels, not a collage. No text, no card frames, no icons, no labels, no numbers, no UI. Every panel art fills its rectangle.
Use supplied image as STYLE/CHARACTER/PALETTE reference only. Beautiful professional hand-painted baseball graphic novel, dark petrol teal/navy, warm chalk ivory, vermilion orange, cold stadium floodlights, assertive brush silhouettes and ink edges, tactile cloth/gloves/wood. The male team's uniforms are cream and teal. Baseball anatomy and equipment correct. ONE athlete-centered action per card, strong readable focal silhouette at thumbnail size. No generic magic.
Panels LEFT to RIGHT:
1 PUSH HIT: medium close view of an adult male batter driving an outside pitch toward the opposite field, controlled level swing, ivory uniform and teal helmet, wooden bat makes crisp contact, energetic diagonal camera.
2 RUNNER RELAY: two adult male baseball runners, one large in foreground rounding a chalk-white base, another following behind; ivory uniforms teal helmets, kicking up terracotta dirt, aggressive diagonal forward motion, teamwork.
3 SACRIFICE BUNT: dramatic close-up of TWO anatomically correct gloved hands on a horizontal wooden bat bunting a baseball; correct baseball bunt grip, cream/teal sleeve, focused batting face partially visible upper background, quiet precise technique. Ball touching wood, no extra fingers.
4 RELEASE READ: extreme focused adult batter eye under teal helmet foreground, sharp rimlight on the eye; in same composition a small distant ADULT FEMALE red-ponytailed black/red-uniform pitcher at release, a simple pale chalk analysis arc linking the gaze and arm, conveys observation, no writing.
5 CUT SWING: adult male batter with compact defensive swing deflecting a white ball to foul territory, cream/teal uniform, short orange contact slash, tense hands and compact body mechanics, sharply different pose from panel1.
A professional coherent set of five individual collectible illustrations with no writing. Do not repeat a panel, do not add a sixth, do not use one wide background across all panels. No ornate borders, no mana, no giant sparks, no gold. Keep all essential action inside each panel's center 80% for cropping.
```
