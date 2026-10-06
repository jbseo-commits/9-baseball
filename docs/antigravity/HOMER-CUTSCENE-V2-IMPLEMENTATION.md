# Home Run Cutscene V2 — Implementation

## Implemented
- 기존 A01/A02/A03 홈런 에셋을 유지한다.
- 홈런 verdict를 400px 16:9 카드가 아니라 `.bp-scene` 전체 takeover로 승격했다.
- takeover 동안 실제 타자, 9ZONE, 주자 표시, 투수 패널 등 경쟁 레이어가 시각적으로 물러난다.
- coach/debrief/hand/verb 영역도 payoff 동안 물러났다가 1.72초 뒤 복귀한다.
- HOME RUN 타이포는 아트/트레일 진입 이후 피크한다.
- portrait용 crop 규칙을 별도로 추가했다.
- knockout은 기존 400px 카드 계약을 유지해 변경 범위를 홈런으로 격리했다.
- reduced-motion fallback을 유지했다.

## Timing
- 0–170ms: world yield + takeover 진입
- ~220ms: batter hero 정착
- ~480ms: HOME RUN 타이포 피크
- ~1.3s: payoff hold
- 1.72s: takeover 퇴장 + review UI 복귀

## First CI findings
- 신규 `homer-cutscene-v2.test.js`: 4/4 통과.
- 기존 `ballpark-battle.test.jsx`: 26/26 통과.
- 기존 `phone-art-v18.test.jsx`: 6/6 통과.
- 전체 suite는 main에 이미 존재하는 기대값 부채 5건에서 실패했다: title CSS import order 2건, Cinematic V2 selector contract 2건, ball-exit-vfx homer trail 기대값 1건.
- 첫 Impact Analysis Gate 실패는 코드 문제가 아니라 PR 본문의 필수 템플릿 섹션/체크박스 누락이었다. PR #17 본문을 정식 9축 템플릿으로 교체했다.
- 전체 test 단계가 실패해 build / zone-report / shipped-size 단계는 아직 실행되지 않았다.

## Verification still required
- 수정된 PR 본문 기준 Impact Analysis Gate 재확인
- 전체 테스트 부채와 이번 변경의 분리 확인
- build / zone-report / shipped-size
- Pages preview
- 412×743 / 844×390 / 1440×900 visual QA
- 실제 홈런 결과에서 hero art 뒤로 기존 타자가 비치지 않는지 확인
