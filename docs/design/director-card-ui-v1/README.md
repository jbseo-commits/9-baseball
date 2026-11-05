# 카드가 조준판으로 펼쳐지는 전투 UI 목업

선택한 카드의 그림·효과·조준·지원 위치를 한 작전 카드에 모았다. 실행하면 같은 영역이 경기 장면으로 전환되고 결과를 확인한 뒤 다음 공/타자로 이어진다.

손패를 위로 끌어 조준 칸에 놓으면 주 카드와 조준을 함께 배치한다. 지원 버튼을 끌면 지원 위치를 직접 배치한다. 그림 위의 역할 표식으로 한 칸 집중·세로 3칸·손패 보충·공 읽기를 구별하고, 결과에는 계획한 범위와 실제 착탄을 나란히 남긴다.

- [게시용 독립 HTML](../../../public/ui-lab/director-card/index.html)
- [영향도 분석](IMPACT_ANALYSIS.md)
- 프리뷰: https://jbseo-commits.github.io/9-baseball/previews/codex-director-card-ui-preview/ui-lab/director-card/

## 범위

본편을 교체하는 구현이 아니라 첫 전투의 조작을 확인하는 독립 목업이다. 기존 카드 그림·구장·타자·레드 러시 에셋을 재사용했다. 원본 에셋을 덮어쓰거나 새 캐릭터를 추가하지 않는다.

- 카드 본체 탭: 주 타격 카드 선택. `+ 지원` 후 조준 칸 탭: 지원 배치.
- 타격 카드 / `+ 지원` 위로 끌기: 조준판에 직접 배치. 수평 움직임은 손패 넘김에 남긴다. 준비 카드에서는 탭으로 타격 카드에 돌아온 후 끌 수 있다.
- 조준판 밖에 놓기, 포인터 취소/손실, Esc: 기존 계획 보존. 유효한 드롭도 카드·에너지를 소비하지 않으며 실행 버튼으로 확정한다.
- 빈 지원 슬롯: 지원 선택 안내. 채워진 슬롯: 해당 지원 제거. `×`: 선택 취소.
- 준비 카드: 같은 작전 카드 영역에서 효과를 읽고 실행. 공을 넘기지 않고 타격 계획으로 돌아온다.
- 기본 타격: 카드/에너지 소모 없음, 지원 불가.
- 자동 결과 팝업 없음. 상세 정보는 `⋯`로 열며 다음 조작 시 경기로 돌아온다.
- 손패 5장 초과 시 가로 넘김, 다음 카드 일부, 넘김 안내를 제공한다.
- 결과 기록: 실행 직전 타격 범위와 주 조준을 보존하고 투구 후 실제 착탄만 표시한다. 지켜봄은 타격 범위를 표시하지 않는다. 범위 안이라는 이유로 안타라고 단정하지 않으며 실제 엔진 판정을 표시한다.
- 새로고침하면 초기화한다. 본편 저장 데이터를 읽거나 쓰지 않는다.
- 첫 전투 종료 후 새 시드의 첫 전투로 다시 시작한다. 경로·보상·시설을 포함한 전체 런은 이 목업 범위가 아니다.

## 엔진과 에셋 출처

목업 엔진은 `7030d50f9c11061306f6b8242f49293a13f49ad2`의 `src/duel/engine.js`, `cards.js`, `information.js` 및 재귀 import 의존 파일을 그대로 읽어 Rolldown 1.2.6으로 IIFE 번들했다. 최신 본편 엔진을 실시간으로 import하지 않는 고정 기준 목업이다.

번들 entry:

```js
export * from './src/duel/engine.js';
export {CARDS, cardCost} from './src/duel/cards.js';
export * from './src/duel/information.js';
```

- 엔진 IIFE: 143,342 bytes, SHA-256 `0e5f908063c769fb492a390f417296446c8d36a40a960b702dceec8df4860b32`.
- 게시 HTML: 909,984 bytes, SHA-256 `3f958bbb6d64d014c63411963afc367f652dc87e57f4377a2afed585d04dd68d`.
- 첫 inline script는 엔진, 두 번째는 UI 어댑터다. 엔진과 압축한 기존 그림은 파일에 포함되어 있다.
- 카드 그림: `assets/cards-v15/card-map.json`의 place/strike/setup/watch/scout 매핑. 원래 구장·타자 시트·레드 러시 투구 시트에서 크기 조정/프레임 추출만 수행했다.
- 공개 확률은 읽기 단계별 범위/범주로 표시한다. 숨은 실제 코스를 계획 단계에 표시하지 않는다.
- 판정은 `battle.revealed.kind/label`, 투수 피해는 `v10.lastCombat.damage`를 각각 읽는다. 피해량이 있다는 이유로 안타로 분류하지 않는다.
- 비용·타격 커버·연결·지원 검증은 엔진 함수를 사용한다. 준비 카드의 보충량은 실제 손패 상한도 반영한다.

## 실행 및 게시

HTML 파일을 정적 서버로 열면 된다. 외부 CDN/호스트 API/별도 저장소 연결이 필요 없다. Vite는 `public/ui-lab/director-card/index.html`을 `dist/ui-lab/director-card/index.html`로 그대로 복사한다.

기존 `Deploy to GitHub Pages`의 `codex/**` push 트리거를 사용한다. 이 workflow는 **main의 본편 루트를 다시 빌드**하고 브랜치 빌드 결과를 `/previews/codex-director-card-ui-preview/`에 추가한다. workflow와 본편 소스는 수정하지 않았다. 다른 브랜치가 Pages를 배포하면 활성 프리뷰가 바뀔 수 있으며, 저장소의 HTML과 PR은 남는다.

## 검증 기록

2026-10-15, origin/main `dd70f4c`에서 분기한 게시 후보 기준:

| 확인 | 결과 |
|---|---|
| `pnpm test` | 172 files / 1,018 tests 통과 |
| `node --test docs/design/director-card-ui-v1/check-ui.node.mjs` | 19/19 통과. 게시 HTML 자체를 happy-dom에서 실행해 입력·취소·지원·착탄 공개 시점을 검사. 드롭 직후 새 포인터 입력 허용도 포함 |
| `node scripts/zone-report.js 10` | 4 빌드 × 10 시드 report 정상 종료. 재미·밸런스 입증으로 사용하지 않음 |
| branch base를 지정한 `pnpm run build` | 통과 |
| `node scripts/check-dist-budget.mjs` | 59.9MiB / 60MiB 통과. 예산 상향 없음 |
| source / dist HTML SHA-256 | 동일 |
| inline script 문법·개수 | 2개 정상 파싱 |
| 미치환 placeholder·호스트 API·Lucide 의존·로컬 절대 경로·외부 요청 코드 검사 | 없음 |
| 본편 `src/`, index, Vite 설정, 잠금 파일, Pages workflow diff | origin/main과 동일 |
| 독립 페이지 320/375px 세로 | 본체 320/375×667px, 수평 넘침 0. 결과 글자와 기록판 분리 확인 |
| 667×375px 가로 | 세로 목업을 일반 페이지 스크롤로 접근. Tab으로 실행 버튼을 보이게 했을 때 y=299–349, 화면 안에 있음 |
| 1280×800px PC | 본체 398×667px, 수평 넘침 0 |
| 실제 브라우저 마우스 조작 | 카드 끌어 주 카드+조준 배치, 지원 끌어 4칸 커버/연결 1 확인, 실제 안타·HP60→50·착탄 기록 확인 |
| 6장 손패 넘김 | 실제 브라우저 가로 스크롤: scrollLeft=101, clientWidth=351, scrollWidth=452. 조준 드래그로 전환되지 않음 |
| 탭/클릭 조작 | 준비 사용·조준 복귀, 지원 배치·범위/비용/연결, 상세에서 실행 시 자동 복귀, 실제 안타와 HP, 다음 타자 확인 |

터치 PointerEvent 검사는 합성 이벤트 회귀 검사다. 물리 휴대폰의 실제 드래그·회전·브라우저 바·safe-area 전 조합, 사람 플레이 평가, 본편 전체 런 수동 완주를 통과했다고 주장하지 않는다. 키보드로 조작부에 접근할 수 있지만 전체 렌더 후 포커스 복원까지 완성한 접근성 구현은 아니다. 게시 URL 확인은 PR 검증 기록을 참고한다. 검증 수치는 상업적 완성도 평가가 아니다.
