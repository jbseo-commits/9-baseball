# Mockup World V15 — 후보 아트 패키지

`docs/art/benchmark/target/`의 전투 가로, 보상, 지도, 덱, 도감, 타이틀, 홈런, 강판, 엔딩 목업을 구현할 때 사용할 후보 이미지다. `manifest.json`은 파일의 실제 크기와 색상 모드를, `card-map.json`은 현재 카드 16종의 아트 대응을 기록한다. 현재 이 폴더의 이미지는 런타임에 연결되지 않았다.

## 주요 묶음

- 경기장·지도: `battle-landscape-stadium.png`, `map-island-city.png`, `map-node-selected-stadium.png`, `map-node-battle.png`, `map-node-elite.png`
- 카드·보상: 카드 16종 대응 이미지, `frame-reward-rare.png`, `frame-reward-epic.png`
- 도감: 아래 12종 투수 초상과 `deck-dex-backdrop.png`
- 컷씬: `title-keyart.png`, `homerun-scene.png`, `knockout-red-rush-scene.png`, `ending-keyart.png`

## 도감 초상과 기존 투수 ID

| 투수 | 후보 초상 |
| --- | --- |
| Red Rush | `dex-red-rush.png` |
| Teal Mirage | `dex-teal-mirage.png` |
| Amber Sinker | `dex-amber-sinker.png` |
| Ivory Ace | `dex-ivory-ace-v2.png` |
| Violet Sting | `dex-violet-sting.png` |
| Rose Paint | `dex-rose-paint-v2.png` |
| Cobalt Impact | `dex-cobalt-impact-v2.png` |
| Neon Trick | `dex-neon-trick-v2.png` |
| Wine Bluff | `dex-wine-bluff-v2.png` |
| Emerald Tyrant | `dex-emerald-tyrant-v2.png` |
| Platinum Halo | `dex-platinum-halo-v2.png` |
| Black Eclipse | `dex-black-eclipse-v2.png` |

새 초상 7종은 `assets/pitcher-sd-v2/previews/`의 해당 캐릭터 포즈 시트를 정체성 기준으로 제작했다. 최초 `dex-*.png` 7종은 팔·손목·얼굴 비례가 불안정해 **추천 대상에서 제외**했다. 아이보리 에이스 기존 초상도 장갑이 얼굴을 가려 수정했다. `-v2.png` 8종은 눈높이 카메라와 연결이 읽히는 양팔 배치로 다시 그린 수정 후보이며, 원본과 나란히 보존한다. 실제 카드 크기에서의 인체·얼굴 판독은 여전히 수동 최종 검수가 필요하다.

초상은 1122×1402 불투명 아트이고, 지도 노드는 1254×1254 투명 PNG다. 타이틀/컷씬은 단일 불투명 이미지여서 패럴랙스 애니메이션에는 레이어 분리가 필요하다. 초상·카드 크롭, 축소 가독성, 실제 화면 배치와 목업 비교는 연결 과정에서 검수해야 한다. 이 패키지는 품질 게이트 통과 판정을 의미하지 않는다.
