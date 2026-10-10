<!-- IMPACT_ANALYSIS_REQUIRED -->
# Home Run Cutscene V2 — PR Gate

## Scope
기존 16:9 verdict-card 홈런 컷인을 scene takeover로 전환한다. 홈런 순간 실제 경기 actor/HUD와 hero art가 동시에 경쟁하는 문제를 해결하며 게임 판정/HP/카드/save schema는 변경하지 않는다.

## Impact checklist
- [x] UI/layout: 영향 있음 — hero takeover가 scene을 지배하며 기존 actor geometry는 유지
- [x] input/gestures: 영향 있음 — 연출 중 기존 resolving lock을 유지
- [x] game logic/balance: 영향 없음
- [x] save/load: 영향 없음
- [x] mobile viewport: 영향 있음 — portrait/landscape crop 확인 필요
- [x] scroll/overflow: 영향 있음 — scene-contained overlay
- [x] existing flow: 영향 있음(시각 순서만)
- [x] tests/regression: 영향 있음 — 전용 source-contract 테스트 추가
- [x] build/deploy: 확인 필요 — 신규 대형 에셋 없음, CI/preview 확인 필요

## Side effects / isolation
- `.bp-verdict.splash.homer`에만 takeover 규칙을 적용한다.
- knockout은 기존 16:9 verdict card 구조를 유지한다.
- `HomeRunCut`의 기존 A01/A02/A03 에셋을 재사용한다.
- BallparkBattle/engine/save schema는 변경하지 않는다.
- reduced-motion에서 이동을 제거하고 최종 takeover 상태는 유지한다.

## Verification
- [ ] PR Verify 전체 통과
- [ ] Impact Analysis Gate 통과
- [ ] 412×743: 중복 타자/9ZONE/HUD가 hero art와 경쟁하지 않음
- [ ] 844×390: crop/overflow 이상 없음
- [ ] 1440×900: 과도한 확대/빈 공간 없음
- [ ] 홈런 종료 후 기존 결과/복기 흐름 정상
- [ ] 비홈런/knockout에 takeover 누출 없음

main merge는 위 검증과 사용자 승인 전까지 금지한다.
