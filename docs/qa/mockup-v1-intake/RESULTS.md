# A01 원화 최적화·배치 검증 결과

2026-10-27 · 기준 PR #63 / bb409c0 · 구현 담당 Codex

## 결과

- 선정 PNG 4개: **8,565,812 bytes → WebP 1,274,798 bytes (85.12% 감소)**.
- 네 원화의 SHA-256, 원본 해상도, 투명 여백·알파 채널 보존 확인.
- 변환기: Pillow 12.3.0 / libwebp 1.6.0, quality 92, method 6, alpha_quality 100. 색은 손실 압축이며 원본과 완전히 같은 RGB 픽셀이라고 주장하지 않는다.
- 원화/파생본 선택 변경·키보드 조작, 7개 뷰포트 × 2포맷 검사: **14/14 통과**. 페이지 오류·이미지 HTTP 실패 0, 문서 가로 넘침 0.
- 기존 목업 `scene.js`의 camera/actorBox와 실제 DOM을 독립 대조: 위치/크기 차이 0.15px 이내.
- 원본과 WebP 캡처를 직접 열어 우타자 그립·신발·배트, 투수 실루엣, 구장 명암과 132px 카드 원화를 비교했다. 표시 크기에서 중요한 윤곽/구분 손실을 관찰하지 못했다. 사람 플레이·실기기 품질 평가는 아직 수행하지 않았다.

배우는 각각 1개 정지 포즈이며 새 로스터 승인이 아니다. 실제 게임에서 아직 import하지 않아 게임 전체 용량/로딩이 85% 줄었다는 의미도 아니다.

## 실제 실행

| 검증 | 결과 |
|---|---|
| `python tools/art/mockup-v1-intake/prepare.py` | 변환·검증 통과 |
| `python tools/art/mockup-v1-intake/prepare.py --check` | 4개 해시/크기/알파/메타데이터 통과 |
| 임시 복사본 손상 3종 | runtime 변경 / 오래된 source receipt / geometry 변경 모두 실패로 검출 |
| `node tools/art/mockup-v1-intake/verify-browser.cjs` | 7개 화면·14포맷·키보드 전환 통과 |
| `npm test` | **193 test files / 1219 tests 통과** |
| `node scripts/zone-report.js 10` | 종료 코드 0 |
| `npm run build` | 종료 코드 0 |
| `node scripts/check-dist-budget.mjs` | 58.6 MiB / 60 MiB 통과 |

처음 pnpm 실행은 환경의 pnpm 자동 설치가 사용자 홈 경로를 만들지 못해 실패해, 같은 package scripts를 npm으로 실행했다. 첫 샌드박스 테스트에서 하위 git/node 실행 4건이 EPERM으로 실패했고, 정상 하위 프로세스 실행을 허용한 재실행에서 전체 1219건이 통과했다. 이 환경 문제를 코드 회귀로 수정하거나 테스트를 삭제하지 않았다.

브라우저: headless Chromium, Linux, Playwright. 크기: 1440×900 / 932×430 / 844×390 / 740×360 / 667×375 / 390×844 / 320×568. iPhone Safari·Android 실기기·safe area·본편 모션·실제 런 통합은 미검증이다.

## 실제 캡처와 기록

- [휴대폰 원본](844-original.jpg) / [휴대폰 WebP](844-webp.jpg)
- [PC WebP](1440-webp.jpg)
- [132px 카드 원본](cards-original.jpg) / [132px 카드 WebP](cards-webp.jpg)
- [브라우저 측정](browser-report.json)
- [전체 테스트 출력](tests.txt), [빌드 출력](build.txt), [스모크 출력](smoke.json)

JPG는 브라우저 검토 화면의 캡처이며 배포용 원화가 아니다. 실제 이미지 검증은 WebP를 디코드해 원본과 별도로 수행했다.

## 다음 통합

Claude는 C02/C03에서 WebP를 직접 import하고 C05에서 실제 artId·카드 kind 매핑을 검수한다. 기존 optimizer/manifest를 이중 수정하지 않는다. `actor-coverage.json`에 승인된 artId가 없으므로 G1 로스터 게이트는 아직 남아 있다.

독립 reviewer가 코드·메타데이터·원본/변환본 캡처를 검토하고 `prepare.py --check`를 별도로 실행해 통과를 확인했다. 인수 시 용량 여유를 명시하라는 의견을 반영했다: 현재 dist 61,457,462 bytes에 새 WebP를 전부 더하면 60 MiB 한도까지 182,300 bytes가 남으므로 실제 import 후 재측정해야 한다. 지연 로딩은 dist 총량을 줄이지 않는다.
