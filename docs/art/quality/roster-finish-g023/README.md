# 투수20명 실제 재생 검수 — G023

원본·인접 자세를 검수한 뒤 문제가 있던 중간 그림13개를 교체하고 복귀10개를 추가했습니다. 원본240키와 릴리스/착지 좌표를 보존했습니다. 20명 모두 준비0까지 실제 재생·모든 그림 표시를 확인했고, 강판 시 새 준비 복귀가 나오지 않는 실제 경기까지 검증했습니다.

아래 GIF는 **844×390 실제 게임의0.5배속 녹화**에서 배우 영역을 잘라 마지막7초를12fps·200px로 변환한 검수 자료입니다. 게임 FPS/새 그림수와 다르며 기존 조명·가림·결과FX·영상압축을 그대로 포함합니다.19명은 실제 지도 상대 저장, Red는 renderer 검수용 artId치환입니다.

| 투수 | 실제 그림수 | 실제 재생 |
|---|---:|---|
| regular-01-red-rush | 17 | [GIF](replays/regular-01-red-rush.gif) |
| regular-02-teal-mirage | 16 | [GIF](replays/regular-02-teal-mirage.gif) |
| regular-03-amber-sinker | 18 | [GIF](replays/regular-03-amber-sinker.gif) |
| regular-04-ivory-ace | 17 | [GIF](replays/regular-04-ivory-ace.gif) |
| regular-05-violet-sting | 18 | [GIF](replays/regular-05-violet-sting.gif) |
| regular-06-rose-paint | 17 | [GIF](replays/regular-06-rose-paint.gif) |
| sky-phantom | 18 | [GIF](replays/sky-phantom.gif) |
| gale-twister | 17 | [GIF](replays/gale-twister.gif) |
| vulcan-blaze | 15 | [GIF](replays/vulcan-blaze.gif) |
| tide-vesper | 17 | [GIF](replays/tide-vesper.gif) |
| elite-01-cobalt-impact | 15 | [GIF](replays/elite-01-cobalt-impact.gif) |
| elite-02-neon-trick | 15 | [GIF](replays/elite-02-neon-trick.gif) |
| elite-03-wine-bluff | 15 | [GIF](replays/elite-03-wine-bluff.gif) |
| jade-viper | 15 | [GIF](replays/jade-viper.gif) |
| copper-sirocco | 16 | [GIF](replays/copper-sirocco.gif) |
| boss-01-emerald-tyrant | 16 | [GIF](replays/boss-01-emerald-tyrant.gif) |
| boss-02-platinum-halo | 16 | [GIF](replays/boss-02-platinum-halo.gif) |
| boss-03-black-eclipse | 15 | [GIF](replays/boss-03-black-eclipse.gif) |
| emerald-tempest | 15 | [GIF](replays/emerald-tempest.gif) |
| onyx-eclipse | 17 | [GIF](replays/onyx-eclipse.gif) |

[원본키/그림해시·잘림 검증](asset-validation.json) · [실제20명 모든그림 관찰/끝0](roster-browser.json) · [경기/회전/저장검증](validation-summary.json) · [13교체 원본검수와거절이력](repair-review.json) · [복귀후보 검수](recovery-review.json)

기존 G020/G021 HELD 기록은 변경하지 않았습니다. 위 결과를 사람의 재미·기기 성능·상업 품질 PASS로 해석하지 않습니다. 원본 키의 화풍과 일부 작은 발 정착 차이는 독립검수 기록에 남깁니다.


반복 검수: `scripts/qa-roster-motion.cjs`는 실제20명 지도상대 QA저장을 만들고 카드/존을 직접 입력해 엔진 결과와 비교합니다. `QA_BASE`, `QA_RATE`, `QA_VIEWPORT`, `QA_IDS`, `QA_OUT`을 지정할 수 있습니다. Playwright 설치가 필요하며 `QA_CHROMIUM`으로 로컬 Chromium 경로, `PLAYWRIGHT_MODULE`로 설치 모듈을 지정할 수 있습니다. `QA_VIDEO=1`일 때만 ffmpeg 녹화를 사용합니다. 실제 플레이어 저장과 별도 브라우저 컨텍스트를 사용합니다.
