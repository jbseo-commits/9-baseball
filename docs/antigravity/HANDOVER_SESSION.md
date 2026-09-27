# 9ZONE HOMEBOUND — 다음 세션 인수인계서 (Handover)

- **작성 일시**: 2026-09-27 18:57
- **현재 작업 브랜치**: `ag/20260927-p1-result-splash` (최신 커밋: `816774b`)
- **원격 저장소 반영**: `origin/ag/20260927-p1-result-splash` (push 완료, working tree clean)
- **로컬 개발 서버**: `http://localhost:5174` (백그라운드 실행 중)

---

## 1. 완료된 작업 요약 (이번 세션 진행 내역)

### ① 코덱스 잔여 작업 인수 및 가로 모드 회귀 0% 완전 해소
- **문제**: 가로 모드(`max-height: 500px`)에서 칭호·HP 게이지가 포함된 `.bp-ptag`가 투수를 45% 가리던 QA 이슈
- **해결**: `ballpark.css`에서 `.bp-pcol`을 마운드 우측(`left: 68%; top: 4%`)으로 재배치하고 판정 배너(`.bp-verdict`)를 9존 앞(`left: 34%`)으로 이동하여 **투수 가림률 0% 달성**
- **결과**: `scripts/qa-shots.mjs` 검증 27개 전원 통과 (세로 9/9, 가로 9/9, PC 9/9)

### ② P1-01 ~ P1-10 세로 인플레이 목업 1:1 완벽 동기화 (PR #98)
- `src/duel/v14-portrait-master.css` 구현: 목표 목업(`battle-portrait.png`)과 1:1 비율 세로 배치
- 상단 HUD: `HOMEBOUND` 골드 서브브랜드 노출, `1막` 골드 테두리 캡슐 뱃지, 사운드 토글/도움말 모달/타이틀 복귀 버튼 정상 연동
- 카드 영역: 다이아몬드 코스트 칩, 3x3 미니맵 조준 표시, 2줄 전술 설명문, 선택 시 솟아오름 및 금빛 테두리 완비
- 행동 버튼: 비활성화 시 어두운 앰버+배트 실루엣, 조준 시 금빛 더블 프레임+발광 버튼 완비

### ③ P1-11 타격 순간 polish (`ag/20260927-p1-hit-polish`, `80b4837`)
- Pixi `BallparkActors.jsx`에 contact 좌표 `(tx, ty)` 기반 동적 충격파 링(`impactFx.circle`) 및 4방향 스타버스트 섬광 구현
- 타구 외야 비행 시 연결형 레이저 스피드 트레일 구현
- 타격 강도별(`homer`, `grand-slam`, `extra`, `dead-center`, `solid`, `jammed`, `lucky`) 맞춤형 카메라 마이크로 쉐이크 애니메이션 구현
- `tests/v14-hit-impact-polish.test.js` 추가 및 통과

### ④ P1-12 전투 결과 연출 (`ag/20260927-p1-result-splash`, `816774b`)
- 홈런 및 투수 강판 시 단순 토스트가 아닌 보상 장면 수준의 대형 트라이엄프 스플래시 오버레이(`.bp-verdict.splash`) 구현
- `★ HOME RUN ★` / `★ PITCHER KNOCKED OUT ★` 상단 리본, 38px 전용 임팩트 타이포그래피, 골드 엠보싱 더블 프레임
- 세로/가로/PC 전 뷰포트 반응형 최적화 및 `prefers-reduced-motion: reduce` 접근성 완비
- `tests/v14-result-splash.test.jsx` 추가 및 통과

---

## 2. 현재 품질 게이트 검증 상태

1. **전체 테스트 스위트**: **110개 테스트 파일 전원 통과, 672개 테스트 ALL PASS (0 실패)**
   ```bash
   npx.cmd vitest run
   ```
2. **공식 시각 QA 자동화**: **27 / 27 PASS (0 실패)**
   ```bash
   node scripts/qa-shots.mjs --url http://localhost:5174 --out work/qa-v14-inplay
   ```
3. **프로덕션 빌드**: **정상 성공 (1.47s)**
   ```bash
   npm.cmd run build
   ```

---

## 3. 다음 세션이 진행할 작업 (Next Task)

`docs/antigravity/QUEUE.md` 기준:
### **`P1-13 Battle Portrait Golden Pass (PHASE 1 최종 관문)`**

- **목표**: 412×743 해상도에서 목표 `docs/art/benchmark/target/battle-portrait.png`와 최종 비교 및 PHASE 1 완수 판정.
- **체크리스트**:
  1. 실제 한 판 플레이 검증: 타이틀 → 메인 런 이어하기/시작 → 카드 선택 → 9존 조준 → 휘두른다 → 타격 임팩트 및 스플래시 → 투수 HP 차감/강판 → 보상 화면 정상 진입.
  2. 스크린샷 비교: `work/qa-v14-inplay/phone-portrait-battle-decide.png`와 `docs/art/benchmark/target/battle-portrait.png` 비교.
  3. `docs/art/QUALITY-BAR.md` 8축 기준 전 항목 4.0 이상, 평균 4.3 이상 최종 검증.
  4. 통과 시 `QUEUE.md`에서 P1-13을 `[x]`로 완료 처리하고 **PHASE 2 (가로/보상/지도 등)** 큐 수립으로 전이.

---

## 4. 주의사항 (Strict Constraints)

1. **전역 스타일 금지**: `html`, `body`, `#root`, `.duel-app` 전역 규칙을 변경하지 않는다. 스타일은 `.v14-battle-portrait` 또는 `.bp-*` 하위로 격리한다.
2. **CSS 임포트 순서 유지**: `src/main.jsx`에서 `./duel/title-pixel.css`가 반드시 가장 마지막 CSS 임포트로 유지되어야 테스트(`tests/title-pixel.test.jsx`, `tests/v12-ux2-polish.test.js`)가 통과한다.
3. **엔진 로직 불변**: 판정 확률, 대미지 공식, HP 계산, 저장 스키마(`9zone-v10-run`)는 절대 손대지 않는다.
4. **시각 검증 우선**: 화면 변경 시 반드시 `scripts/qa-shots.mjs` 또는 `scripts/qa-capture.mjs`를 구동해 실제 캡처 PNG를 직접 눈으로 확인한다.
