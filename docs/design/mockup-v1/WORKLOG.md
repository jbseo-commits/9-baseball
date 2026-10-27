# 인수 기록

계획 패키지 작성 완료. **C00–C08 구현은 아직 시작하지 않았다.**

기준 main: `f3ec4beef5b245e0e98696d3174d47b6a8b09005` (2026-10-27 조회).
문서 게시 브랜치: `docs/mockup-implementation-handoff-20261027`.
실제 게임 구현 브랜치: 미생성. C00–C08은 아직 TODO이며 문서 게시 작업과 구별한다.

계획 검토: 독립 reviewer의 문서 검토를 수행했다. C08 착수/완료 의존성, 샘플 배우의 실제 artId 매핑과 기존 세로 View fallback, 첫 연습 파일 소유권, 전체 확장 후 재검증 조건을 반영했다. 이는 구현 테스트 통과 기록이 아니다.

| 티켓 | 상태 | 편집 담당 | HEAD_SHA | 검수/다음 단계 |
|---|---|---|---|---|
| C00 | TODO | Codex | — | 최신 기준·격리 브랜치 |
| C01 | TODO | Claude | — | 계약·fixture |
| C02 | TODO | Claude | — | Scene |
| C03 | TODO | Claude | — | 손패 |
| C04 | TODO | Claude | — | 판단·결과 |
| C05 | TODO | Codex | — | 통합·G1 |
| C06 | TODO | Claude/아트 교대 | — | 모션·G2 |
| C07 | TODO | Claude 수정/Codex 검수 | — | G3 |
| C08 | TODO | Codex | — | 확장 상태·G4 |

## 매 인수에 복사하는 양식

```text
티켓:
기준 BASE_SHA / 직전 인수 SHA:
작업 브랜치 / HEAD_SHA:
실제 담당 모델 / effort:
편집 소유권: [누가] → [누가], 현재 미커밋 변경 유무:
변경 파일과 목적:
계약 변경 및 통합자에게 필요한 연결:
실행한 검사 / 명령 / exit code / 결과:
실제 브라우저 증거: URL / build SHA / seed / viewport / 파일:
미실행·차단 검증과 이유:
시각 검수: PASS/FAIL/BLOCKED, 구체적 결함:
코드·동작 검수: PASS/FAIL/BLOCKED, 구체적 결함:
남은 문제 / 다음 티켓 / 다음 담당:
PR / 프리뷰 / 배포 상태: 실제 존재하는 것만:
```

최종 판정은 보고 내용과 diff·스크린샷·실제 실행을 대조한다. 부정확한 완료/모델/테스트 기록을 만들지 않는다.
