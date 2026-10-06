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

## Verification still required
- CI test/build/zone-report
- Pages preview
- 412×743 / 844×390 / 1440×900 visual QA
- 실제 홈런 결과에서 hero art 뒤로 기존 타자가 비치지 않는지 확인
