# 도감 초상 카드 크기 검수 — 2026-09-28

`assets/production-art/mockup-world-v15/`의 추천 초상 12장을 각각 100×125로 축소해 `dex-card-size-qa-v16.png`의 4열×3행에 배치했다. 이 파일은 축소 판독을 위한 검수 이미지이며 게임 에셋이 아니다.

| 행 | 왼쪽부터 파일 | 관찰 |
| --- | --- | --- |
| 1 | `dex-red-rush.png`, `dex-teal-mirage.png`, `dex-amber-sinker.png`, `dex-violet-sting.png` | 얼굴과 캐릭터 색상은 구별된다. 공/글러브 실루엣도 100px 폭에서 읽힌다. |
| 2 | `dex-ivory-ace-v2.png`, `dex-rose-paint-v2.png`, `dex-cobalt-impact-v2.png`, `dex-neon-trick-v2.png` | 기존 문제 컷의 수정 버전. 얼굴이 가려지지 않고 양팔 위치가 분리된다. |
| 3 | `dex-wine-bluff-v2.png`, `dex-emerald-tyrant-v2.png`, `dex-platinum-halo-v2.png`, `dex-black-eclipse-v2.png` | 같은 크기에서 얼굴과 유니폼 색상은 구별된다. `black-eclipse`는 어두운 팔레트 탓에 글러브가 가장 약하게 읽힌다. |

각 원본의 얼굴, 어깨→팔꿈치→손목, 공 쥔 손, 글러브를 확대해 육안 검수했다. 추천 `-v2` 8종에서 명백한 여분의 팔·손이나 분리된 관절은 보이지 않았다. 다만 대부분 같은 정면 반신·공과 글러브 배치여서 캐릭터별 포즈 개성이 약하다. 목표 `docs/art/benchmark/target/dex.png`의 인물 성별/정체성과도 다르다. 실제 카드 프레임의 크롭·테두리·이름을 얹은 런타임 최종 검수 전에는 품질 게이트 통과로 표시하지 않는다.

`assets/production-art/mockup-world-v15/manifest.json`의 8종 `recommended_portrait_revisions` 매핑은 유지한다. 이 QA에서는 원본을 교체하거나 런타임에 연결하지 않았다.
