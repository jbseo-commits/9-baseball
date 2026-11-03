# 투수 작업물 전체 게시 · 2026-11-02

사용자의 “음 일단 다 올려줘” 요청에 따라 그동안 로컬에 있던 투수 작업물을 보존·게시한다. 이번 게시가 원화·모션의 합격 판정이나 게임 연결·main 병합을 의미하지는 않는다.

## 먼저 볼 자료

- **[Release 전체 다운로드](https://github.com/jbseo-commits/9-baseball/releases/tag/pitcher-work-20261102-r4)**
- [최신 원화 R4 전후 비교 · 단일 HTML](https://github.com/jbseo-commits/9-baseball/releases/download/pitcher-work-20261102-r4/pitcher-art-r4-compare.html) — 내려받아 브라우저에서 열기. 원화 20명 전후·확대·130px 보기.
- [전원 모션 R3 플레이어 · 단일 HTML](https://github.com/jbseo-commits/9-baseball/releases/download/pitcher-work-20261102-r4/pitcher-motion-r3-player.html) — 내려받아 브라우저에서 열기. 20명 선택·배속·프레임 이동.
- [이전 R2 원화/가이드 비교 · 단일 HTML](https://github.com/jbseo-commits/9-baseball/releases/download/pitcher-work-20261102-r4/pitcher-source-r2-gallery.html).

**R4는 최신 정적 기준 원화 20명이다. R3는 그보다 앞선 r2 원화 방향을 토대로 제작한 모션 후보 20명이다. R4 원화를 애니메이션으로 만든 결과가 R3인 것은 아니다.** R3는 전신 그림을 연결한 프레임 후보이며, 120타임라인 샘플을 독립 원화 120장 또는 완성된 관절 리깅으로 세지 않는다.

## 전체 보존 범위

| 폴더 | 파일 | 원본 바이트 | 보존 |
|---|---:|---:|---|
| `9zone-roster-rebuild-20261031` | 10,855 | 1,776,308,469 | 전체 파일 SHA-256 대조 완료 |
| `9zone-roster-art-revision-20261031` | 103 | 65,870,833 | 전체 파일 SHA-256 대조 완료 |

합계 **10,958개 원본 파일**. 두 폴더 전체를 보존했고, 선택 패키지·보기 파일은 편의를 위해 별도 첨부했다. 원본·중간 결과·실패 자료·기존 ZIP·로그/lock도 의도적으로 전체 보존 압축에 포함한다. 실패 프로토타입을 최신 완료 자산으로 분류하지 않는다.

| 다운로드 | 포함 범위 |
|---|---|
| [9zone-roster-art-revision-20261031-inventory.json](https://github.com/jbseo-commits/9-baseball/releases/download/pitcher-work-20261102-r4/9zone-roster-art-revision-20261031-inventory.json) · 0.0 MiB | 전체 R4 파일별 경로·바이트·SHA-256. |
| [9zone-roster-rebuild-20261031-inventory.json](https://github.com/jbseo-commits/9-baseball/releases/download/pitcher-work-20261102-r4/9zone-roster-rebuild-20261031-inventory.json) · 2.1 MiB | 전체 재제작 파일별 경로·바이트·SHA-256. |
| [pitcher-art-r4-compare.html](https://github.com/jbseo-commits/9-baseball/releases/download/pitcher-work-20261102-r4/pitcher-art-r4-compare.html) · 7.9 MiB | 자체 내장 이미지로 열리는 최신 원화 비교 문서. |
| [pitcher-art-r4-complete.zip](https://github.com/jbseo-commits/9-baseball/releases/download/pitcher-work-20261102-r4/pitcher-art-r4-complete.zip) · 59.9 MiB | R4 작업 폴더 전체 103파일. 첫 20장과 추가 9개 편집, 미선택 대안, 비교/생성/검수 원본 포함. |
| [pitcher-art-r4-selected20.zip](https://github.com/jbseo-commits/9-baseball/releases/download/pitcher-work-20261102-r4/pitcher-art-r4-selected20.zip) · 43.0 MiB | 현재 선택 PNG 20장 + 전후 비교·검수 자료(총 74파일). 바로 검토할 때 사용. |
| [pitcher-motion-r3-player.html](https://github.com/jbseo-commits/9-baseball/releases/download/pitcher-work-20261102-r4/pitcher-motion-r3-player.html) · 19.3 MiB | 자체 내장 이미지로 열리는 이전 원화 기반 전원 모션 후보 플레이어. |
| [pitcher-motion-r3-selected20.zip](https://github.com/jbseo-commits/9-baseball/releases/download/pitcher-work-20261102-r4/pitcher-motion-r3-selected20.zip) · 27.6 MiB | 전원 모션 후보의 선택된 256px PNG·타임라인·미리보기·검사 자료. |
| [pitcher-rebuild-r3-complete.tar.zst](https://github.com/jbseo-commits/9-baseball/releases/download/pitcher-work-20261102-r4/pitcher-rebuild-r3-complete.tar.zst) · 1306.8 MiB | 재제작 폴더 전체 10,855파일. 고해상도 원화·바인드·모션 소스·실패 리그·프레임 출력·이전 ZIP 모두 포함. zstd 해제 후 tar 풀기. |
| [pitcher-source-r2-gallery.html](https://github.com/jbseo-commits/9-baseball/releases/download/pitcher-work-20261102-r4/pitcher-source-r2-gallery.html) · 17.1 MiB | 자체 내장 이미지로 열리는 이전 기준 원화/가이드 시트 비교. |

`publication-manifest.json`에는 압축물/보기 파일의 크기·해시·원본 집계가 있고 `SHA256SUMS`로 다운로드 파일을 확인할 수 있다. 전체 원본은 압축 해제 스트림을 읽어 파일별 SHA-256까지 대조했다. 대용량 원본은 Git 이력에 직접 넣지 않고 같은 GitHub 저장소의 Release에 첨부한다.

## 기존 PR과의 관계

- [PR #67](https://github.com/jbseo-commits/9-baseball/pull/67): 시각 품질 문제가 지적된 이전 분리 부위 리깅 통합. 이번 게시로 승인하거나 main에 병합하지 않는다.
- [PR #68](https://github.com/jbseo-commits/9-baseball/pull/68): 첫 4명 전투 기믹 구현. 아트 게시와 별개다.
- [PR #69](https://github.com/jbseo-commits/9-baseball/pull/69): 52종 편성 기획. 아직 새 투수 52명의 원화/모션이 제작됐다는 뜻이 아니다.
- 이번 브랜치: 원화/모션/중간자료 보존·게시 전용. `src`, `public`, 엔진, 저장, 빌드 설정은 변경하지 않는다.

전체 보존 폴더의 `SCOPE.md`와 WORKLOG에는 과거 계획 및 PR67 업데이트 계획도 남아 있다. 역사 자료 그대로 보존한 내용이며 이번 게시 지시나 승인 상태가 아니다. 원본 절대경로는 당시 제작 환경의 출처다. 미리보기 HTML은 자체 포함 자료로 열 수 있지만 모든 제작 스크립트가 외부 의존성 없이 즉시 실행된다고 주장하지 않는다.

## 현재 원화 20명

이 목록은 보기용 WebP다. PNG 원본·대체안과 SHA-256은 위 Release에서 받는다. 아래 그림을 누르면 크게 볼 수 있다.

| 캐릭터·선택 | 수정 전 | 수정 후 |
|---|---|---|
| 레드 러시 · r4a · 우완 | <img src="r4/before/regular-01-red-rush-identity.webp" width="150" alt="레드 러시 기존"> | <img src="r4/review-assets/regular-01-red-rush-r4a.webp" width="150" alt="레드 러시 수정"> |
| 청록 미라주 · r4a · 우완 | <img src="r4/before/regular-02-teal-mirage-identity.webp" width="150" alt="청록 미라주 기존"> | <img src="r4/review-assets/regular-02-teal-mirage-r4a.webp" width="150" alt="청록 미라주 수정"> |
| 앰버 싱커 · r4a · 우완 | <img src="r4/before/regular-03-amber-sinker-identity.webp" width="150" alt="앰버 싱커 기존"> | <img src="r4/review-assets/regular-03-amber-sinker-r4a.webp" width="150" alt="앰버 싱커 수정"> |
| 아이보리 에이스 · r4a · 우완 | <img src="r4/before/regular-04-ivory-ace-identity.webp" width="150" alt="아이보리 에이스 기존"> | <img src="r4/review-assets/regular-04-ivory-ace-r4a.webp" width="150" alt="아이보리 에이스 수정"> |
| 바이올렛 스팅 · r4a · 우완 | <img src="r4/before/regular-05-violet-sting-identity.webp" width="150" alt="바이올렛 스팅 기존"> | <img src="r4/review-assets/regular-05-violet-sting-r4a.webp" width="150" alt="바이올렛 스팅 수정"> |
| 로즈 페인트 · r4a · 우완 | <img src="r4/before/regular-06-rose-paint-identity.webp" width="150" alt="로즈 페인트 기존"> | <img src="r4/review-assets/regular-06-rose-paint-r4a.webp" width="150" alt="로즈 페인트 수정"> |
| 코발트 임팩트 · r4a · 우완 | <img src="r4/before/elite-01-cobalt-impact-identity.webp" width="150" alt="코발트 임팩트 기존"> | <img src="r4/review-assets/elite-01-cobalt-impact-r4a.webp" width="150" alt="코발트 임팩트 수정"> |
| 네온 트릭 · r4a · 우완 | <img src="r4/before/elite-02-neon-trick-identity.webp" width="150" alt="네온 트릭 기존"> | <img src="r4/review-assets/elite-02-neon-trick-r4a.webp" width="150" alt="네온 트릭 수정"> |
| 와인 블러프 · r4a · 우완 | <img src="r4/before/elite-03-wine-bluff-identity.webp" width="150" alt="와인 블러프 기존"> | <img src="r4/review-assets/elite-03-wine-bluff-r4a.webp" width="150" alt="와인 블러프 수정"> |
| 에메랄드 타이런트 · r4a · 우완 | <img src="r4/before/boss-01-emerald-tyrant-identity.webp" width="150" alt="에메랄드 타이런트 기존"> | <img src="r4/review-assets/boss-01-emerald-tyrant-r4a.webp" width="150" alt="에메랄드 타이런트 수정"> |
| 플래티넘 헤일로 · r4a · 우완 | <img src="r4/before/boss-02-platinum-halo-identity.webp" width="150" alt="플래티넘 헤일로 기존"> | <img src="r4/review-assets/boss-02-platinum-halo-r4a.webp" width="150" alt="플래티넘 헤일로 수정"> |
| 블랙 이클립스 · r4a · 우완 | <img src="r4/before/boss-03-black-eclipse-identity.webp" width="150" alt="블랙 이클립스 기존"> | <img src="r4/review-assets/boss-03-black-eclipse-r4a.webp" width="150" alt="블랙 이클립스 수정"> |
| 타이드 베스퍼 · r4a · 우완 | <img src="r4/before/tide-vesper-identity.webp" width="150" alt="타이드 베스퍼 기존"> | <img src="r4/review-assets/tide-vesper-r4a.webp" width="150" alt="타이드 베스퍼 수정"> |
| 스카이 팬텀 · r4b · 우완 | <img src="r4/before/sky-phantom-identity.webp" width="150" alt="스카이 팬텀 기존"> | <img src="r4/review-assets/sky-phantom-r4b.webp" width="150" alt="스카이 팬텀 수정"> |
| 게일 트위스터 · r4c · 우완 | <img src="r4/before/gale-twister-identity.webp" width="150" alt="게일 트위스터 기존"> | <img src="r4/review-assets/gale-twister-r4c.webp" width="150" alt="게일 트위스터 수정"> |
| 볼칸 블레이즈 · r4b · 우완 | <img src="r4/before/vulcan-blaze-identity.webp" width="150" alt="볼칸 블레이즈 기존"> | <img src="r4/review-assets/vulcan-blaze-r4b.webp" width="150" alt="볼칸 블레이즈 수정"> |
| 제이드 바이퍼 · r4b · 우완 | <img src="r4/before/jade-viper-identity.webp" width="150" alt="제이드 바이퍼 기존"> | <img src="r4/review-assets/jade-viper-r4b.webp" width="150" alt="제이드 바이퍼 수정"> |
| 코퍼 시로코 · r4a · 우완 | <img src="r4/before/copper-sirocco-identity.webp" width="150" alt="코퍼 시로코 기존"> | <img src="r4/review-assets/copper-sirocco-r4a.webp" width="150" alt="코퍼 시로코 수정"> |
| 오닉스 이클립스 · r4b · 좌완 | <img src="r4/before/onyx-eclipse-identity.webp" width="150" alt="오닉스 이클립스 기존"> | <img src="r4/review-assets/onyx-eclipse-r4b.webp" width="150" alt="오닉스 이클립스 수정"> |
| 에메랄드 템페스트 · r4b · 우완 | <img src="r4/before/emerald-tempest-identity.webp" width="150" alt="에메랄드 템페스트 기존"> | <img src="r4/review-assets/emerald-tempest-r4b.webp" width="150" alt="에메랄드 템페스트 수정"> |

## 검수·남은 한계

- [원화 상세 점검](r4/README.md), [독립 원화 검수](r4/independent-review.md), [선택 manifest](r4/selection-manifest.json).
- [전원 모션 R3 기록](r3/REVIEW-MOTION-R3-KO.md), [모션 기술 감사](r3/motion-audit.json).
- R4의 Jade 유광 느낌, Teal/Copper의 좁은 상하 여백, 픽셀 밀도 통일 등은 기존 검수에 남은 항목이다.
- R3의 원화 경계/포즈 전환 한계와 일부 제안 폼은 원본 기록대로 보존한다. 언더핸드를 새로 제작·검증했다고 세지 않는다.
- 과거 브라우저/원화 검수와 이번 보존·게시 검증을 구분한다. 이번 작업은 원본 파일을 다시 그리거나 게임에 연결하지 않는다.

## 게시 영향도 (구현 전 확인)

| 축 | 판단·대응 |
|---|---|
| UI/레이아웃 | 게임 영향 없음. 독립 비교 HTML과 Markdown/WebP만 보존. |
| 입력/제스처 | 게임 영향 없음. 독립 HTML의 기존 버튼/확대만 확인. |
| 규칙/밸런스 | 영향 없음. 원화·모션·게시 승인과 실판정 규칙을 분리. |
| 저장/불러오기 | 영향 없음. 앱/세이브 파일 미변경. |
| 모바일 뷰포트 | 게임 영향 없음. 비교 자료의 작은 가로/세로 폭 확인. |
| 스크롤/오버플로 | 게임 영향 없음. 전역 CSS를 가져오지 않음. |
| 사용자 흐름 | 기존 게임 진입·지도·전투·보상 영향 없음. |
| 테스트/회귀 | 원본/압축 파일별 해시, 선택20, HTML 이미지/조작, 업로드 자산 검증. 게임 테스트 변경 없음. |
| 빌드/배포 | docs/와 GitHub Release에 격리. 게임 번들·Pages 자동배포 설정 미변경. |
