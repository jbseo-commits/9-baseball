# 자율개발 지침 작성 시 확인한 기준 상태

기준 제품 코드·검사: `origin/main` **efff94725361b9b2003cf8718c27cb381f2963cc**. 작성일 2026-10-08(KST). 이번 작업은 개발 루프 문서·프롬프트 작성이다. 게임 코드·자산·테스트·패키지·lockfile·런처·예약 작업은 기준 main과 diff 0이며 자율개발 자체는 시작하지 않았다.

| 검사 | 실제 결과 | 범위·한계 |
| --- | --- | --- |
| 문서 링크·코드 fence·기록 경로·`git diff --check` | 통과 | 실행 지침 구조 검사. 게임 재미 검증이 아님 |
| `pnpm test` | **887 통과 / 5 실패**, 148파일·892검사, exit 1 | 코드·검사 계약 불일치가 남아 전체 기술 게이트 미통과 |
| `node scripts/zone-report.js 10` | exit 0, 리포트 생성 | 기존 정책 smoke. 현재 MAIN RUN 전체·사람 난이도 검증이 아님 |
| `pnpm build` | exit 0 | production 빌드 성공, 큰 JS chunk 경고 있음 |
| `pnpm check:dist` | exit 0, **49.4MB / 50MB** | 현행 산출물 용량 게이트. 실기기 성능·로딩 체감 검증이 아님 |
| 실제 새 런·화면·회전·모션·사람 플레이 | 이번 작업에서 미실행 | 초기 큐에서 현재 재현·검증할 대상 |

첫 sandbox 검사에서는 884 통과/8 실패였으며 추가 3건은 하위 Node/Git 프로세스의 `EPERM`이었다. 동일 검사를 허용된 실행 환경에서 재실행하자 그 3건은 통과하고 아래 5건이 남았다. 검사 조건·타임아웃·기대값은 변경하지 않았다. 원시 로그는 현재 환경의 `/tmp/9-baseball-autodev-*.log`이며 GitHub에 첨부하지 않았다.

## G-000 — 남은 실패

| 테스트 | 실제 차이 | 다음 진단 |
| --- | --- | --- |
| `tests/ball-exit-vfx.test.js` | 홈런 trailCap 기대 20 / 실제 22 | 승인된 연출 계약과 실제 궤적·의도 확인 |
| `tests/cinematic-director-css.test.js` | 기대한 `.bp-battle.cinema-contact .bp-scene::before` 문자열 없음 | 일반화된 selector와 기대 장면의 의미가 동일한지 실제 화면·CSS로 확인 |
| `tests/cinematic-live-bridge.test.js` | 기대한 `.bp-scene.fx-stage-slowmo::before` 문자열 없음 | contact 최고점·slowmo 연출의 실제 동작 확인 |
| `tests/title-pixel.test.jsx` | 마지막 CSS import 기대 title-pixel / 실제 cinematic-pitch-handoff | 타이틀·전투 격리와 cascade 회귀 여부 확인 |
| `tests/v12-ux2-polish.test.js` | 마지막 CSS import 기대 title-pixel / 실제 cinematic-pitch-handoff | 위 항목과 같은 원인인지 확인하고 중복 수정 방지 |

제품 입력 파일과 검사 파일이 기준 main과 동일함을 확인했다. 이 결과로 어느 쪽이 틀렸는지 단정하지 않는다. 승인된 계약과 실제 동작을 먼저 검증한 뒤 수정한다. 단순 기대값 갱신·검사 삭제·skip으로 게이트를 통과시키지 않는다. 실패별 이슈를 나누고 [큐](QUEUE.md)와 실행 기록에 연결한다.
