# 유사 게임 HUD 레퍼런스 20 (2026-10-25)

> **한계**: 작성 세션의 네트워크 정책상 Steam·이미지 서버 접속이 막혀 스크린샷 원본을 직접 열지 못했다.
> 아래 20개는 대표 HUD 화면을 장면 단위로 고른 것이며, 근거는 각 게임의 알려진 UI와 검색으로 확인한 설명이다.
> 세부 배치는 실제 화면과 다를 수 있으니 출처 링크로 대조한다. 짝 문서: [SCREEN-AUDIT-20261025.md](SCREEN-AUDIT-20261025.md).

## 20개 화면과 9ZONE 적용점

| # | 게임 · 장면 | HUD 핵심 | 9ZONE에 가져올 것 |
|---|---|---|---|
| 1 | Slay the Spire · 전투 | 적 머리 위 의도 아이콘+숫자(⚔6×2), 왼쪽 아래 에너지 구슬, 양쪽 아래 덱·버림, 오른쪽 아래 턴 종료 | 의도는 대상 머리 위 하나. 에너지는 큰 구슬로 고정 위치 |
| 2 | Slay the Spire · 카드 조준 | 조준 중 카드 숫자가 실제 피해로 바뀜(버프 초록, 디버프 빨강) | 예측은 행동하는 자리에서만. 하단 중복 줄 제거 |
| 3 | Slay the Spire · 지도 | 세로 노드 지도 + 아이콘 범례 | 현재 지도와 같은 구조, 유지 |
| 4 | Slay the Spire 2 · 다중 의도 | 여러 행동을 나란히, 숫자 포함 | 의도 아이콘 2개가 필요할 때 나란히 |
| 5 | Balatro · 카드 선택 중 | 족보 이름과 `칩 × 배수` 두 상자 즉시 갱신 | 피해를 `기본 × 배율` 두 칸으로, 출처는 정보 패널 |
| 6 | Balatro · 블라인드 선택 | 목표 점수·보상·보스 효과 사전 공개 | 지도 노드에 상대 기믹 한 줄 |
| 7 | Into the Breach · 적 예고 | 맞을 타일 붉게, 밀림 화살표, 피해 숫자 | 투수 분포를 칸 색으로 직접 칠하기 |
| 8 | Into the Breach · 내 공격 미리보기 | 확정 전 결과를 판 위에 표시, 되돌리기 | 칸 hover·슬라이드 미리보기(P1) 방향 유지 |
| 9 | Monster Train · 전투 | 왼쪽 위 엠버, 층별 유닛 공격/체력 아이콘 | 자원 하나만 크게, 나머지는 대상에 붙이기 |
| 10 | Inscryption · 저울 | 피해가 저울 기울기 하나로 보임 | 승리(HP)·패배(아웃) 조건을 같은 비중으로 |
| 11 | Wildfrost · 카운터 | 적마다 "몇 턴 뒤 공격" 숫자 | 볼카운트를 위험 타이머처럼(2S 붉게) |
| 12 | Shogun Showdown · 1줄 트랙 | 적 위 의도+남은 턴, 판이 단순 | 정보는 9존에 몰고 판 밖은 비우기 |
| 13 | Cobalt Core · 공격 화살표 | 적이 맞힐 내 함선 칸을 화살표로 | "공이 이 칸으로"를 화살표·열 하이라이트로 |
| 14 | Peglin · 발사 중 | 튈 때마다 피해 숫자 누적 | 결과 연출 때 피해가 쌓이는 과정 |
| 15 | Luck be a Landlord · 월세 | 남은 스핀·내야 할 돈만 크게 | 남은 HP·남은 아웃 두 숫자 |
| 16 | Marvel Snap · 레인 파워 | 레인마다 합계 숫자, 이기는 쪽 색 | 9존 칸마다 숫자 하나 |
| 17 | MLB The Show · 존 타격 PCI | 존 위 커서, 바깥 링=시야, 안쪽=정타 | 커버를 존 위에 그리는 방식은 표준 |
| 18 | MLB The Show · 타자 핫/콜드 존 | 칸 열지도(빨강~파랑) | `가끔/자주` 낱말보다 색 농도 |
| 19 | Super Mega Baseball 4 · 투구 위치 표시 | 패치로 표시를 늦게 띄워 변화구 읽기 유지 | 정보를 숨기려면 이유가 보여야 함(읽기 단계) |
| 20 | Walk-Off 199X · 피치 휠 (출시 전) | 공마다 휠로 결과, 카드로 휠 조작 | 가장 가까운 장르 경쟁작. 확률을 원판 하나로 |

## 공통 패턴

1. **의도 = 대상 머리 위 아이콘 하나 + 숫자 하나** (1·4·11·12). P2 의도 아이콘 방향이 맞고 숫자 하나를 붙이면 완성.
2. **예측은 행동하는 자리에서만** (2·8). 존 위 칩 하나, 하단 예측 줄은 제거.
3. **이번 턴 자원은 큰 아이콘 하나, 고정 위치** (1·9). 에너지를 구슬로 키운다.
4. **배율은 공식 한 줄** (5). `기본 12 × 1.3`, 스택·기세·주자·정확 적중은 내역으로 접는다.
5. **승리와 패배 조건을 같은 무게로** (10·15). 아웃(런 목숨)이 상단 작은 불빛뿐이다.
6. **야구 게임의 표준은 색 칸** (17·18). 확률은 열지도 색 먼저, 숫자는 읽기 단계가 오르면 덧붙인다.

## 적용 순서 제안

1. 하단 예측 줄 제거 → 존 위 칩만 (패턴 2) — 화면 정리
2. 9존 칸 열지도 색, 낱말·숫자는 보조 (패턴 6) — 시안 비교 후 결정
3. 에너지 큰 구슬, 아웃을 HP와 같은 크기 (패턴 3·5) — 화면 정리
4. 피해 `기본 × 배율` 두 칸, 내역은 정보 패널 (패턴 4) — 시안 비교 후 결정
5. 의도 아이콘에 숫자 하나 (패턴 1)

## 출처

- [Walk-Off 199X - Baseball Roguelike Deckbuilder (Steam)](https://store.steampowered.com/app/4945620/)
- [Slay the Spire (Wikipedia)](https://en.wikipedia.org/wiki/Slay_the_Spire)
- [How to Read Enemy Intent in Slay the Spire 2 (Untapped)](https://sts2.untapped.gg/guides/how-to-read-enemy-intent)
- [How to Make a Deckbuilder Like Slay the Spire (Summer Engine)](https://www.summerengine.com/blog/make-a-deckbuilder-like-slay-the-spire)
- [Balatro (Wikipedia)](https://en.wikipedia.org/wiki/Balatro)
- [Balatro's 'Cursed' Design Problem (GMTK)](https://gmtk.substack.com/p/balatros-cursed-design-problem)
- [Into the Breach review (GameSpot)](https://gamespot.com/reviews/into-the-breach-review-a-mechanized-masterpiece/1900-6416865/)
- [Road to the IGF: Into the Breach (Game Developer)](https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-)
- [Into the Breach review (Nintendo Life)](https://nintendolife.com/reviews/switch-eshop/into_the_breach)
- [Shogun Showdown (Wikipedia)](https://en.wikipedia.org/wiki/Shogun_Showdown)
- [MLB The Show 25 hitting guide (Push Square)](https://www.pushsquare.com/guides/mlb-the-show-25-how-to-hit-the-ball-better-and-more-often)
- [MLB The Show guess pitch (Sportskeeda)](https://www.sportskeeda.com/baseball/how-can-guess-pitch-latest-mlb-the-show-game?related)
- [Super Mega Baseball 4 patch 3 notes (MP1st)](https://mp1st.com/news/super-mega-baseball-4-update-1-04-for-july-31-bats-out-for-patch-3)
- [Clutchtime review (Prima Games)](https://primagames.com/reviews/clutchtime-review-a-basketball-deckbuilder-roguelike-that-i-weirdly-cant-get-enough-of)
