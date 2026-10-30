# 가로 전투 연출 검증 — 2026-10-28

[범위와 연결](../../design/landscape-battle-cinema/README.md) · [사전 9축 분석](../../design/landscape-battle-cinema/IMPACT.md). 구현 순서는 타이밍/사운드→원화 포즈→공/접촉/근접 실패→실제 카드/HP→홈런/강판이다. 5단계 커밋은 각각 `5648920`, `a36ff59`, `bbfcd12`, `2991c77`, `6c82b20`이며 이후 최종 검수 보정을 포함한다.

## 실행 근거

- 전체 Vitest **206파일 / 1,370테스트 통과**: [최종 로그](tests-full.txt). source-contract 검사 두 곳은 새 snapshot 인수/새 animated fixture를 반영해 갱신했다. 엔진/카드/저장 스키마를 변경하지 않았다.
- Chromium 본편 기본 경로와 opt-in 경로: 준비 사용(투구 증가 없음), 지켜보기, 자동 다음 공, Inspector 중 진행 정지, 저장 후 이어하기, 회전 선택 보존. 동일 seed/action의 저장 상태 일치. 메모리 검수 save sentinel 유지. [smoke.json](smoke.json).
- 경로→전투, 강판 보상→다음 경로, 시설을 844×390/390×844/320×568에서 확인. 가로/세로 기본 흐름의 가로 overflow 없음, 지도/시설의 세로 overflow auto 유지. [noncombat.json](noncombat.json).
- 667×375/740×360/844×390/1024×768/1440×900 × 선택/지원/결과 **15개 가로 조합**: 행동 버튼 화면 안, 에너지 손패 위, document 가로 overflow 없음. [viewports.json](viewports.json). 좁은 높이의 오른쪽 설명은 필요하면 레일 안에서 스크롤하고 행동 버튼은 고정한다.
- 실제 접촉/근접 실패/홈런/강판을 같은 presentation 시계로 고정 촬영. [프레임/포즈 기록](final-captures.json), 아래 대표 장면.
- 독립 읽기 전용 reviewer: clock/snapshot/effects/motion/finale 25개 테스트 및844×390 최종 장면 확인, 검토 범위 내 blocker 없음. 지연 복귀 시 CSS 확인 애니메이션이 다시 짧게 재생될 수 있다는 비차단 의견은 남긴다. 게임 판정/자동 진행/소리의 중복은 방지한다.
- production build + `check:dist`: **59.9MB / 60MB**, 예산 증액 없음. [빌드 로그](build.txt). 새 runtime atlas651,516B, 원본/무손실 atlas는 배포하지 않는다.
- GitHub Pages branch 배포 후 실제 공개 번들·재생 검증 결과는 [PR #66](https://github.com/jbseo-commits/9-baseball/pull/66)의 배포 확인 항목에 기록한다. production root는 main에서 빌드되는 기존 정책을 유지한다.

## 실제 브라우저 영상과 소리

[정확 적중](cinema-exact.mp4) · [한 칸 차이](cinema-near.mp4) · [홈런](cinema-homer.mp4) · [강판](cinema-knockout.mp4).

실제 Chromium 재생 화면을 CDP로 샘플링하고 **같은 실행의 Web Audio master 출력**을 MediaRecorder로 녹음해 시간 차를 맞춰 H264/AAC로 묶었다. [실행 시각·포즈·이벤트](av-capture.json). 원본 아트로 만든 가짜 영상이 아니다. 화면 캡처 주기는 브라우저 실행 fps 측정값이 아니며, 사람의 직접 청취/실기기 음질 승인도 아니다. 오디오 스트림의 실제 신호와 peak/mean은 [audio-levels.json](audio-levels.json)에 기록한다.

| 장면 | 확인 지점 |
|---|---|
| [접촉245ms](final-cinema-exact-245.jpg) | 공과 그려진 배럴의 국소 접촉, 접촉 포즈, 아직 HP 감소 전 |
| [적중600ms](final-cinema-exact-600.jpg) | 팔로스루, 읽었다!, 실제 HP/카드 기여 |
| [근접 실패245ms](final-cinema-near-245.jpg) | 접촉 섬광/카메라 반응 없이 통과, 실제9존의 놓친 경계 |
| [홈런1000ms](final-cinema-homer-1000.jpg) | 일반 안타와 다른 타구·빛·마무리 |
| [강판1100ms](final-cinema-knockout-1100.jpg) | HP1→0 뒤 피로 포즈·마운드 초점·강판 |

## 재현

`npm run dev -- --host 127.0.0.1 --port 5220` 실행 후 다음을 사용한다. QA 환경의 Playwright, `/usr/bin/chromium`, 영상에는 ffmpeg가 필요하다. 이 도구들은 게임 번들에 포함되지 않는다.

```
node scripts/qa-landscape-cinema-capture.cjs
node scripts/qa-landscape-cinema-av.cjs
node scripts/qa-landscape-cinema-viewports.cjs
node scripts/qa-landscape-cinema-smoke.cjs
node scripts/qa-landscape-cinema-flows.cjs
npm test
VITE_BASE=/9-baseball/previews/codex-mockup-v1-c05-integration/ npm run build
npm run check:dist
```

공개 roster 승인·실기기 Safari·사람 플레이 재미/음질 평가는 미완료다. 14개의 타자 그림을 120개 독립 작화 또는 모든 상대의 완성 모션이라고 주장하지 않는다.
