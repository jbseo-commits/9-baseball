# 투수 투구 애니메이션 — PixelLab v1

2026-09-29. `pitcher-mobs-v1`의 성인 전신 디자인을 그대로 도트로 옮겨, [PixelLab](https://www.pixellab.ai)으로 실제 투구 동작을 그린 애니메이션이다. 첫 제작분은 **청록 미라주(regular-02-teal-mirage)** 파일럿이며, 전투에서 이 투수의 SD v2 아틀라스를 대체한다.

![청록 미라주 투구](previews/regular-02-teal-mirage-pitch.gif)

## 규격 — 기존 전투 계약 그대로

| 항목 | 값 |
| --- | --- |
| 프레임 | 256×256 투명, 화면 왼쪽을 향해 던짐 |
| 아틀라스 | 10열×12행 = 120틱, 60fps · 2초 (`BallparkActors` / `PitcherAtlasSprite`가 그대로 재생) |
| 릴리스 | 76틱 (`RED_RUSH_RELEASE_FRAME`, 공 비행·팔 궤적·섬광이 여기에 맞춰짐) |
| 인물 크기 | 세트 자세 키 212px, 스파이크 바닥 y=247 (기존 투수 202~228px과 같은 화면 크기) |
| 원화 | 고유 드로잉 18장을 틱 단위로 유지 — 워프나 보간 합성 없이, 모든 프레임이 그려진 원화다 |

120틱을 120장으로 채우지 않는다. 도트 애니메이션의 정석대로 **원화 한 장을 필요한 만큼 붙잡아** 리듬을 만든다. 세트 14틱 → 레그킥 정점 16틱(균형점 멈춤) → 스트라이드·코킹 5~7틱 → 머리 위 채기·릴리스 2~3틱(가장 빠른 구간) → 폴로스루 12틱 유지 → 복귀 → 세트로 끝나서 다음 공이 튀지 않는다.

| 틱 | 자세 | 틱 | 자세 |
| --- | --- | --- | --- |
| 0 | set | 72 | layback |
| 14 | rock | 74 | whip |
| 22 | turn | **76** | **release** |
| 30 | knee-lift | 79 | arm-down |
| 46 | reach | 83 | follow-through |
| 53 | stride (흙먼지) | 89 | finish |
| 59 | arm-extend | 101 | recover-1 |
| 64 | cocked | 106 | recover-2 |
| 69 | over-the-top | 111 / 116 | recover-3 / set |

## 제작 과정

1. **기준 도트** — 원본 PNG를 256 프레임의 투구 배치(키 212px, 중심 x=150, 스트라이드 공간을 왼쪽에 확보)로 4배 캔버스에 놓고 `image_to_pixelart`(faithful, strength 200)로 256×256 도트화. 배경은 원본 알파(50% 이상)로 잘라낸다.
2. **투구 전체** — `animate_image`로 세트에서 폴로스루까지 8장.
3. **사이 원화** — 시작·끝 프레임을 고정한 `animate_image` 보간 3회: 코킹→폴로스루(팔 뒤로 뻗기·머리 위), 머리 위→팔 내림(채기·릴리스), 폴로스루→세트(복귀). 끝 프레임과 같아진 마지막 장은 쓰지 않는다.
4. **공 제거** — 릴리스 이후에도 손에 남은 공은 `edit_image_pixen`으로 지우되, 편집이 글러브까지 지우므로 **던지는 손 상자만** 원본 프레임에 붙인다. 공은 게임의 Pixi가 릴리스 지점에서 이어받는다.
5. **정리** — 애니메이션 모델이 스파이크의 구리색 패널을 스우시 모양 마크로 바꿔 그려서, 원본 디자인 규칙(pitcher-mobs-v1 README)대로 평범한 구리 패널로 되돌린다. 18장을 한 팔레트(ΔE 4.5, 원화의 실제 색만 사용)에 맞춰 프레임 사이 색 깜빡임을 없앤다.
6. **빌드** — `scripts/build-pitcher-pixellab.py`가 아틀라스·미리보기·매니페스트를 만들고 발 기준점·스트라이드·릴리스 지점을 잰다.

정확한 프롬프트·시드·잡 ID·비용은 `<id>/sequence.json`의 `generator`에 있다. 생성 결과는 PixelLab 갤러리에도 저장돼 있다. 청록 미라주 1명에 **24 generations**(체험판 40 중)가 들었다.

## 파일

- `<id>/source/*.png` — 시퀀스가 쓰는 PixelLab 결과 18장 (공 제거한 두 장 포함)
- `<id>/sequence.json` — 재생 순서·틱·릴리스 자세·정리 옵션·제작 기록
- `<id>/frames/uNN-<pose>.png` — 정리된 고유 원화 (빌드 산출물)
- `atlases/<id>-pitch-120-atlas.png` — 런타임 아틀라스 (`pitcher-visuals.js`가 SD v2보다 우선 사용)
- `previews/<id>-pitch.gif`, `<id>-filmstrip.png` — 검수용
- `<id>-manifest.json` — 키 포즈 틱, 팔레트 수, 측정한 stance / stride / release

```powershell
python scripts/build-pitcher-pixellab.py regular-02-teal-mirage
python scripts/pitcher-release-points.py   # PixelLab 아틀라스를 SD보다 우선해 다시 잰다
python scripts/pitcher-stride-points.py
```

`src/duel/pitcher-stance.json`은 매니페스트의 `stance` 값을 옮긴다. `tests/pitcher-pixellab.test.js`가 세 표와 매니페스트가 어긋나지 않는지 확인한다.

## 다음 투수 추가

1. 원본 자세가 세트가 아니면(레드 러시 레그킥, 바이올렛 스팅 사이드암 등) 기준 도트 이후 세트 자세를 먼저 만든다.
2. 위 1~5단계를 따라 `source/`와 `sequence.json`을 채운다. 릴리스 자세가 76틱에서 시작하고 총합이 120틱이어야 빌드된다.
3. 빌드 → 두 측정 스크립트 → stance 반영 → `npx vitest run tests/pitcher-pixellab.test.js`.
4. `npm run build` 후 `scripts/optimize-runtime-art.py`로 무손실 WebP 파생본을 만든다.

체험판에서는 `animate_image`만 쓸 수 있다. Tier 1 이상에서 열리는 `animate_with_skeleton_v3`(관절을 프레임마다 직접 지정, 원본 한 장에서 모든 프레임을 그려 얼굴·의상이 흔들리지 않음)를 쓰면 코킹·릴리스·팔 궤적을 투수별 투구폼(오버핸드·사이드암·싱커)대로 정확히 설계할 수 있다.

## 되돌리기

`atlases/<id>-pitch-120-atlas.png`를 지우면 그 투수는 SD v2 아틀라스로 돌아간다(세 JSON 값도 측정 스크립트로 다시 만든다). SD v2 에셋은 그대로 남아 있다.
