# Claude Code 인수 — Codex의 A01 에셋 준비

사용자가 Claude에 전체 구현 계획을 전달했다고 확인했다. 충돌을 피하려고 Codex는 C01–C08 전투 코드/전역 설정 대신 아래 독립 경로만 맡는다.

- `assets/production-art/mockup-v1-intake/`: 원본 해상도의 WebP 4개, source/output receipt, 구장/배우 좌표, actor coverage.
- `tools/art/mockup-v1-intake/`: 재생성·무결성 검사 도구.
- `docs/design/mockup-v1-intake/`, `docs/qa/mockup-v1-intake/`: 인수·영향도·원본/파생본 비교.

기준은 PR #63 커밋 `bb409c0`. 이 작업은 별도 `codex/mockup-v1-asset-intake` 브랜치다. Claude의 App/main/표시 계약/전투 View/전역 스타일/WORKLOG를 수정하지 않는다.

## 가져다 쓰기

이 브랜치를 fetch한 뒤 PR #63 이후의 intake 커밋들을 작업 브랜치에 cherry-pick하거나, PR을 통합한다. 최신 HEAD 하나만 가져오면 문서 보완만 포함될 수 있으므로 커밋 범위를 확인한다. 이 경로가 이미 만들어졌다면 덮어쓰지 말고 기존 변경과 비교한다. 두 명이 원화와 receipt를 동시에 재생성하지 않는다.

`src/duel/battle-vnext/`에서 사용할 예:

```js
import stadiumUrl from '../../../assets/production-art/mockup-v1-intake/stadium-wide.webp';
import batterUrl from '../../../assets/production-art/mockup-v1-intake/batter-catcher.webp';
import pitcherUrl from '../../../assets/production-art/mockup-v1-intake/pitcher-home.webp';
import cardsUrl from '../../../assets/production-art/mockup-v1-intake/cards.webp';
import layout from '../../../assets/production-art/mockup-v1-intake/scene-layout.json';
```

원본은 `docs/design/mockup-v1/reference/art/`에 이미 있으므로 같은 PNG를 다시 반입하지 않는다. 실제 빌드에서는 WebP URL을 import해 Pages base path와 해시 파일명을 Vite가 처리하게 한다. 문서 폴더를 public으로 복사하지 않는다.

현재 측정 dist는 61,457,462 bytes(58.6104 MiB)다. 기존 파일을 유지한 채 WebP 네 개를 모두 추가하면 62,732,260 bytes(59.8261 MiB)로, 60 MiB 한도까지 182,300 bytes만 남는다. C05에서 실제 import 후 코드·새 자산까지 포함해 용량 검사를 다시 해야 한다. 지연 로딩도 dist 총량에는 포함된다. 용량을 맞추려고 필요한 fallback/기존 로스터를 먼저 삭제하거나 예산을 임의로 올리지 않는다.

## C02/C05가 지킬 것

카메라/앵커는 현재 선정 정지 포즈 전용이다. `worldHeight/sourceHeight`로 배우를 배치하고 배경·배우에 같은 world camera를 쓴다. 발을 손패 기준으로 옮기지 않고 배우를 좌우 반전하지 않는다. 공의 release/contact 값은 목업 참고점이며 실제 모션 이벤트 검증을 대신하지 않는다.

`actor-coverage.json`의 `approvedArtIds`는 비어 있다. 선정 그림을 특정 기존 상대 artId에 자동 매핑하지 않는다. 시각 fixture에서 sampleActor로 사용할 수 있지만 실제 상대 한 명의 매핑이 검수돼야 G1을 완료할 수 있다. 카드 6셀은 151종 kind 매핑 완료가 아니다.

A01의 최적화·배치 정보 산출물이며 본편 연결/전체 A01 로스터 검수/G1 통과/모션 완성을 주장하지 않는다. 실제 게임 성능 절감량은 WebP를 import한 후 측정한다.

## 검토 화면

저장소 루트에서 `python -m http.server 5194 --bind 127.0.0.1` 후 `/docs/qa/mockup-v1-intake/`를 연다. 이 서버는 원화 비교 도구이며 본편 실행 서버가 아니다. PNG와 WebP 전환으로 그립·신발·배트·윤곽·카드 원화를 비교할 수 있다.

실제 실행 결과와 캡처는 `docs/qa/mockup-v1-intake/RESULTS.md`에 기록한다. 미실행 항목은 통과로 취급하지 않는다.
