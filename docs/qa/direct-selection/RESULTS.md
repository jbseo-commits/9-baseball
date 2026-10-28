# 카드·코스 직접 선택 — 2026-10-28

기준 f09f6ca. 사용자 피드백은 ‘코스와 카드 선택이 번거로움’. [사전 영향도](../../design/direct-selection/IMPACT.md).

- 카드 탭은 항상 메인 선택/교체. 같은 카드·준비·기본 스윙을 다시 눌러도 선택을 유지한다.
- 코스는 카드를 고르기 전, 준비 카드 선택 중에도 표시한다. 코스→카드와 카드→코스가 같은 계획을 만든다. 토큰①은 실제 스윙 카드가 있을 때만 표시한다.
- 겹치기는 가능한 상황에만 명시적 `카드 겹치기`로 진입한다. 지원 후보 취소는 이미 놓은 지원을 지우지 않으며, 부족한 비용의 지원 탭이 메인 교체로 바뀌지 않는다.
- 실행 버튼 옆 `해제`는 선택만 지운다. 미선택 상태에서도 같은 자리를 비활성으로 유지하므로 연속 해제 탭이 실제 지켜보기로 바뀌지 않는다. 일반 탭/코스 선택만으로 투구를 실행하지 않는다.
- engine/cards/저장/에너지/결과 공개 경계, 기존 legacy View의 선택 규칙은 유지한다.

## 검증

[터치/viewport 기록](interaction.json): 667×375/740×360/844×390/1024×768/1440×900에서 코스 먼저 선택→다른 카드 비교→같은 카드 재탭→해제→지원 후보 취소/재배치/모드 종료를 실제 Chromium touch로 확인. 모든 크기에서 header44px, 해제44px이상, 실행 버튼 화면 안, 가로 overflow없음, save sentinel 유지, pageerror0.

[740px 선택 화면](selection-740.jpg) · [667px 지원 화면](stack-667.jpg) · [PC](selection-1440.jpg). 작은 화면에서 해제를 계획 요약 안에 넣으면 조건부 피해를 밀어내는 문제가 실제 측정되어 footer고정칸으로 이동했다.740×360에서는 하단 보조 설명에 레일 스크롤이 필요할 수 있으나 핵심 적중/조건부 피해/실행 버튼은 보인다.

새 의미 회귀7개(두 선택 순서 일치/교체/재탭/해제/no auto pitch/준비 중 코스/명시적 지원/비용 부족/no phantom coverage)와 기존 통합·손패·legacy 회귀를 실행한다. 독립 reviewer는4파일59테스트와667/740/1440캡처를 확인했고 blocker없음.

**전체207파일/1,377테스트 통과**, production build/check:dist **59.9MB/60MB 통과**. 전체 테스트/빌드의 최종 실행 기록은 [tests-full.txt](tests-full.txt),[build.txt](build.txt). 본편 default/opt-in의 저장 상태 일치·자동 다음·Inspector·준비/take·resume은 [smoke.json](smoke.json), 경로·보상·시설은 [noncombat.json](noncombat.json). 공개 배포 후 bundle와 터치 확인은 PR66의 배포 확인 항목에 기록한다.

재현: `npm run dev -- --host 127.0.0.1 --port 5221` 후 `node scripts/qa-direct-selection.cjs`. 실제 휴대폰 Safari/사람의 조작감 평가는 별도다. 샘플 배우 검수 범위와 실제 미승인 상대 fallback은 유지한다.
