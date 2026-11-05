# Pitcher unique encounters

Every newly generated map assigns a versioned `opponent.encounter` to all 20 roster entries. The label, public summary, and counter travel with the map node and are saved with the run. Old saves without the field keep the old encounter behavior. Red Rush is included in the signature catalog but remains the tutorial opponent.

Encounter distributions use only public history, count, and pitcher HP phase. They never inspect the current aim, chosen card, pending pitch, or random seed. Descriptions of an ordered pattern mean preferred locations in the public distribution, not guaranteed pitch outcomes. The public intent is finalized after both the legacy gimmick and encounter modifiers; zones outside the live repertoire are zeroed and the result is normalized before the single pitch sample. For encounters with lane movement, movement is folded into that final distribution. Old saves without encounter metadata retain their legacy trick sampling path.

HP effects are returned by `encounterPlan` and included in `v10DamageTerms`, which is shared by forecast and resolution. They add a small damage rate or flat bonus; card costs and legacy HP rules are unchanged. Defense Lab and zone-first states opt out. Map generation derives the pitch style and opening repertoire from the roster archetype so the visible pitcher and pitch profile agree.

The signatures are defined in `src/duel/pitcher-encounters.js`. Their public counter copy is data, so map and battle presentation can consume the same object. The V10 save version is unchanged; optional encounter metadata remains backward-compatible.

## 전원 공개 규칙과 공략

패턴은 열린 코스 안에서 실제 확률을 기울이는 경향이며 확정 투구가 아닙니다. 화면의 현재 예고는 실제 가능한 목표로 보정된 뒤 고정됩니다. 기본·비례 피해 배율은 정타·주자 보너스에도 적용하며, 카드/유물/전용 고정 추가 HP는 그 뒤 별도로 더합니다.

| 투수 ID | 전용 기믹 | 공개 규칙 | 공략 |
| --- | --- | --- | --- |
| regular-01-red-rush | 연속 직구 | 같은 직구 코스를 연속해 노립니다. 정타 보너스 +2 HP. | 연속 공략을 노리세요. |
| regular-02-teal-mirage | 청록 왕복 | 바깥쪽 위아래를 번갈아 노립니다. 직전과 다른 노림의 안타 +4 HP, 반복 노림은 기본 피해 ×0.8. | 노림을 바꾸고 바깥 높낮이를 읽으세요. |
| regular-03-amber-sinker | 낮은 갑옷 | 낮은 코스를 넓게 노립니다. 좁은 낮은 정타 +4 HP, 낮은 3존 이상 겹침 기본 피해 ×0.8. | 낮은 곳은 좁게 노리세요. |
| regular-04-ivory-ace | 세 구의 서명 | 몸쪽·중앙·바깥을 차례로 노립니다. 세 번째 공의 안타 +5 HP. | 세 번째 공을 준비하세요. |
| regular-05-violet-sting | 중단 횡단 | 중단 열을 가로질러 노립니다. 본 카드 정타 +4 HP, 지원만 적중하면 기본 피해 ×0.8. | 중단 정타를 본 카드로 노리세요. |
| regular-06-rose-paint | 모서리 순환 | 존 모서리를 차례로 노립니다. 모서리 정타 +4 HP. | 모서리 코스를 읽으세요. |
| tide-vesper | 밀물과 썰물 | 낮은 공과 높은 공을 번갈아 노립니다. 지켜본 다음 안타 +5 HP. | 높낮이 교대를 읽고 기다린 뒤 승부하세요. |
| sky-phantom | 하늘 그물 | 높은 공을 선호하고 깊은 수비를 합니다. 홈런 +8 HP. | 높은 공을 공략해 큰 타구를 노리세요. |
| elite-01-cobalt-impact | 압축 압박 | 투스트라이크에 압박이 강해집니다. 투스트라이크 정타 +6 HP, 초구 기본 피해 ×0.85. | 투스트라이크 전에 흐름을 끊으세요. |
| elite-02-neon-trick | 삼각 잔상 | 세 코스를 삼각 순서로 노립니다. 직전과 다른 노림의 안타 +6 HP. | 노림을 바꾸며 삼각 순환을 읽으세요. |
| elite-03-wine-bluff | 볼 유인 | 존 밖 볼을 유인합니다. 실제 볼을 지켜보면 +3 HP. | 존 밖 공은 참으세요. |
| gale-twister | 시계 회전 | 코스를 시계 방향 순서로 노립니다. 카드 두 장 연결 안타 +6 HP. | 회전 순서와 카드 연결을 활용하세요. |
| vulcan-blaze | 삼구 과열 | 세 번째 공은 취약하고 나머지는 단단합니다. 세 번째 안타 +8 HP, 그 외 기본 피해 ×0.85. | 세 번째 공을 기다리세요. |
| jade-viper | 허물 방패 | 직전 안타 뒤 다음 공 기본 피해 ×0.75. 연속 본 카드 정타로 깨면 +8 HP가 별도 추가됩니다. | 연속 정타로 방패를 돌파하세요. |
| copper-sirocco | 모래 폭풍 | 두 볼 전 준비는 타석당 1회, 두 볼 뒤 준비 횟수는 기본값입니다. 두 볼 뒤 안타 +6 HP. | 볼카운트를 활용하세요. |
| boss-01-emerald-tyrant | 낮은 성벽 | 낮은 코스 3존 이상 겹침 기본 피해 ×0.7, 좁은 낮은 정타 +8 HP. | 낮은 코스를 좁게 공략하세요. |
| boss-02-platinum-halo | 후광 거울 | 세 장 겹침 기본 피해 ×0.75. 홈런 +10 HP가 별도 추가됩니다. | 큰 타구로 후퇴 수비를 넘으세요. |
| boss-03-black-eclipse | 검은 역광 | 직전 노림 반대 열을 선호합니다. 다른 열 정타 +8 HP. | 직전과 다른 열을 노리세요. |
| emerald-tempest | 세 높이의 폭풍 | 높음·중간·낮음 순서로 노립니다. 세 번째 공의 연결 적중 +10 HP. | 세 번째 공에 카드를 연결하세요. |
| onyx-eclipse | 오닉스 사각 | 최근 두 번 쓰지 않은 열을 노립니다. 세 번째 공은 스택 최대 2장, 정타 +10 HP. | 안 쓴 열과 세 번째 공에 대비하세요. |

## 호환과 미리보기

`encounters:false`는 이전 규칙의 지도·분포·연출 검수 상태를 재현하는 명시적 옵션입니다. 일반 신규 런은 기본값 true를 사용하며, 저장된 구 런에는 소급 주입하지 않습니다. `battlePlay=1&previewRun=encounters-v1`은 새 규칙 확인용 별도 sessionStorage를 사용하며 기존 프리뷰와 본편 저장을 바꾸지 않습니다.
