# P0/P1 구종 비교 — 검토 후보

**최신 후속:** [실제 PXF Hit spark PNG 적용·CC0·on/off 검증](PXF-FOLLOWUP.md). 아래 초기 검증/영상은52f88cb의 독자 표식 버전이며, 후속에서는 검증된 PNG로 교체했다.

계획 [#122](https://github.com/jbseo-commits/9-baseball/pull/122)의 첫 단일 접점 프리뷰. **P2 공간 승인 / 실제 9존 / 실전 구종 연결 / 마스터피스 완성 아님.** main 병합·배포하지 않았다.

## 재현

`pnpm dev --host 0.0.0.0` → `http://localhost:5173/?showcase=pitch-trajectory`

- 직구/슬라이더/커브 동시 비교, 한 구종 크게 보기, 안타/파울/지켜보기, 재생/정지, .25/.5/.75/1/1.5/2/6×, 60fps 프레임 이동, 시각 슬라이더, 릴리스/접점 점프.
- 짧은 잔상·접촉 표식·개발 검수선 전환. 기본은 검수선 없이 정지. reduced-motion은 재생을 눌러도 접점으로 바로 이동하며 프레임 이동은 가능하다.
- 코스 선택은 **기존 등록점만 활성**. 9존/outside 선택은 비활성 설명이다. 헛스윙의 실제 배트 비접촉은 P2 대기이므로 지원 결과로 포장하지 않는다.
- main 기준 장면을 켜면 기존 `sceneEffectAt`와 기존 배우/VFX를 같은 시각에 재생한다. 잔상/표식 전환은 후보에만 적용된다고 화면에 표시한다.

## P0 기준 및 경계

2026-11-18 원격 main `fb8e7b13f043e2c17376138abe6696f48c2d8022`. 계획 #122 head `756bbcbc65e7168376825601fcaa676d9a7b7c57`. #121 head `d7637030aef6a41c751fd3886e11ffe4f4eff260`, open Draft, **NOT_IMPROVED / NOT BAR_MET**. 기존 G-020 3/3 실패 이력도 그대로다. #121 코드·에셋을 반입하지 않았다.

최초 로컬 work `e2f283d`는 오래된 체크아웃이었다. clean 상태를 확인하고 최신 main을 fetch했다. 원격 `*trajectory*`와 `*preview*`를 조회해 해당 P1 구현이 없음을 확인했다. `review/pitch-trajectory-p1-20261118`에서 작업한다. `codex/**` push는 Pages 배포를 유발하므로 배포 금지에 맞춰 해당 패턴을 피했다.

동일 조건: 기존 레드 러시 atlas와 기존 타자, 기존 등록 R/T, 시각 seed23, 릴리스1317ms → 접점1617ms (300ms), 동일 결과. 지켜보기는 기존 공개 행동의 통과점 C+(40,10). 타격 결과 hit/foul은 접근 표본이 동일하다. 이는 엔진 seed/실전 판정이 아닌 고정 연출 fixture다. main의 실제 기준선은 현재 quadratic 시간 진행을 그대로 사용한다.

`pitch-trajectory.js`는 RNG·엔진·저장·DOM을 import하지 않는다. descriptor는 입력 좌표 복사 후 freeze. 샘플러는 절대시각에서 위치·해석적 접선·반경·회전을 계산한다. 슬라이더는75%에서 최대 횡변화, 커브는 위쪽 호의 낙차다. 잔상은 같은 곡선의 과거6표본이며 DOM 누적이 없다. hit/foul은 동일 접점·반경12·회전에서80ms hold 후 타구로 이어지고, 지켜보기는 끝점 접선과 반경/회전 속도를 유지한다.

BattleScene 변경은 명시적 `reviewFrame`만 추가한다. 검수 모드에서는 기존 내부 RAF를 끄고 같은 elapsed로 배우와 공을 그린다. 후보 공은 기존 world projection 안의 SVG 하나이고 기존 공/VFX는 비활성이다. `reviewFrame`이 없으면 기존 실행 경로를 사용한다. 게임 RNG·판정·HP·카드·저장 schema·공개 LOCK 연결·실제 연출 시계는 변경하지 않는다.6×는 편집기 전용이며 실제 게임 배속 설정에 저장하지 않는다.

## 검증

- main 기준 전체 `pnpm test`:248파일 /1706테스트 PASS.
- 최종 전체 `pnpm test`:250파일 /1728테스트 PASS (신규22개).
- 신규: 끝점/클램프/불변좌표, 독립 finite-difference 접선, 누락프레임/역탐색/배속 표본 결정성, 결과 공개 전 동등성, 접점 크기·회전 인계, 통과 접선 연속,6표본 잔상, 기존/검수 RAF·배우·공 경로.
- `node scripts/zone-report.js 10`: baseline/candidate 바이트 동일.
- `pnpm build`: PASS. 기존 큰 chunk 경고가 남음.
- `pnpm check:dist`:52.9/60MiB PASS. production bundle를 로컬 preview 서버에서 터치 세로로 열어 lazy route·접점 버튼·공3개·pageerror0도 확인했다.
- 브라우저: `scripts/qa-pitch-trajectory.cjs` 사용.568×320,667×375,844×390,932×430,1280×720,1440×900,390×844,412×915. 공의 접점 포함·가로 overflow 없음. 모든 배속은 **정지 표본 동등성** 검사이며 실제 자동 재생은1×/6×, 정지 취소는1×. reduced-motion 재생은 접점 이동. storage 쓰기/삭제0, pageerror0. 기존 부트스트랩 import의 `9zone-v10-run` 읽기는 관찰됐으며 ‘저장 접근 전무’로 주장하지 않는다.
- 기존 `scripts/qa-playable-run.cjs`: baseline과candidate 모두 seed3에서6구 승리인데 오래된 기대11구 assertion으로 실패. 원본 검사와 기대값은 변경하지 않았다. 별도 `/tmp` 진단 사본에서 관찰된6구를 사용해 **나머지** 승리→보상→지도→reload/이어하기→다음노드, 자연 패배,3카드 실제 엔진 동등성,6뷰포트를 확인했다. 원본 전체 QA PASS가 아니다.
- 시설/비전투 추가 검사: 별도 fixture 검수에서844 가로의 지도·보상·라커를 캡처했다.390 세로 진입에서 body가 pointer를 가로채 timeout. main에서도 동일하게 재현되며 현재 게임의 터치 가로 전용 정책에 따른 기존 QA 불일치다. 해당 검사 전체를 PASS로 보고하지 않는다.

초기 QA에는 ffmpeg 경로 누락과 회전 중 기존 앱 watcher의 자동 reload가 있었다. 후자는 실제 프리뷰 격리 문제로 확인해 이 경로에서만 watcher와 fullscreen/orientation-lock 초기화를 제외했다. 이 프리뷰가 마운트된 body에서만 기존 회전 안내를 숨긴다. 기존 게임의 가로 전용 정책은 유지한다. 이후 navigation 횟수·coarse 터치 세로/가로·fullscreen 요청0 검사를 추가했고 최종 모두 통과했다. 시스템 ffmpeg 경로 지정, 이미지 decode+두 RAF 대기,1× 정지 검사도 적용했다. 제품의 임계값이나 원본 게임 QA를 완화하지 않았다. 실제6× 완료 검사는 유지한다.

## 시각 검수와 남은 한계

- 접촉 표식은 공/배트 중심을 비운 작은4개 조각이다. 큰 flash·카메라 흔들림 없음. 외부 에셋 반입 없음. PXF의 독립 원리 활용을 택했다. 제공된 CC0 Hit spark와 라이선스의 이 환경 다운로드는403이었으며, 파일을 확보했다고 주장하지 않는다.
- 접점/접점±1ms/hold 후 및 비행0/75/150/225/299/300/301/380/500ms 캡처와 실제1×/6× 재생 증거를 남긴다. 기록은 등록 접점 진단이며 실제 배트 mask 충돌 인증은 아니다.
- 첫 모바일 후보의 머리/몸통 잘림은 `history/candidate-1-portrait-crop.png`에 보존. 두 번째 레이아웃에서250px stage로 머리와 주요 실루엣 가독성을 복원. 뒤쪽 발은 화면 가장자리에 걸린다. 기준과 후보는 같은 카메라/크기를 쓴다.
- 독립 gpt-6.1-sol/high 검토: 샘플러 계약·live 기본 경로에 차단 문제 없음. 최종 배속 증거 범위와 모바일 잘림을 사실대로 보고할 조건으로 Draft 후보 제시 가능.
- **IMPROVED/BAR_MET를 새로 주장하지 않는다.** 전체 전투UI의 블라인드8축 점수, 물리 Android/iOS, 실제 청취(무음 도구),30구 p95/p99/heap, 사람 선호는 미실행. 기존 배우/접촉 원화 승격도 없음.
- P2/P3 실제9존·outside·헛스윙 공간 검수, 모든 투수 연결, 저장 성공/LOCK/실제 결과와 통합은 후속 작업이다.

## 검토 자료

- [1× /6× 실제 재생 영상](comparison-1x-6x.webm)
- [효과 없는 접점 — PC](contact-no-fx-desktop.png), [세로](contact-no-fx-portrait.png)
- [비행225ms의 세 구종](flight-225ms.png)
- [main 기준 이벤트 기록](baseline-events.json), [최종 소스 지문](source-fingerprints.json)
- [자동 브라우저 검사 원자료](browser-report.json), [실제 플레이 진단](playthrough-diagnostic.json)
- [구현 전 영향도](IMPACT.md), [기존 QA 실패](history/main-playable-failure.txt)

브라우저 QA는 Playwright+Chromium+ffmpeg가 있는 환경에서 `QA_BASE=http://127.0.0.1:5173/ node scripts/qa-pitch-trajectory.cjs`로 재현한다. 이번 환경은 설치된 Playwright의 NODE_PATH와 `/tmp/pw/ffmpeg-1011/ffmpeg-linux`의 시스템 ffmpeg 연결을 사용했다. 저장소 패키지나 사용자 홈 설정은 변경하지 않았다.
