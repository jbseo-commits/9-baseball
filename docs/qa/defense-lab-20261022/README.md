# 3아웃 공방 실험 검증 자료

[설계·결과·미검증 항목](../../design/DEFENSE-LAB-20261022.md)을 먼저 읽는다. main 출시 승인이 아닌 opt-in 실험 기록이다.

- `method.json`: 완료한 정상 비교3전, 별도 위기/기능 QA3전, 미완주 probe2개, 0구 재시작을 분리한 집계. 보호/반격의 자연 UI 발동은 미관측이다.
- `ui-log.json`: 루트가 CUA로 조작한 실제 공개 DOM 원본. 준비/선택/진행 중 화면과 미완주 probe도 포함한다. 마지막 화면만 골라 승률을 산출하면 안 된다.
- `normal-flow.json`: 별도 검수자의 본게임 보상·시설·다음 경로·이어하기 확인. 실제 확인 범위와 HMR 영향을 기재했다.
- `normal-equivalence.json`: 원본 main과75개 자동 런의4,014개 상태가 같은 엔진 회귀 검사. 사람 플레이·재미·밸런스 증거가 아니다.
- `vitest-final.txt`, `smoke-summary.json`, `build-final.txt`: 전체 검사1,079개 및 기존smoke4종·production build 결과. 강제 pending을 쓰는 단위 검사는 실제 플레이와 별개다.
- `battle-responsive.json`, `compact-action-rects.json`: 뷰포트/카드/플랜/버튼 실측. 중간 실패 측정도 남겼으므로 `final` 표식과 기록 순서를 함께 읽는다. 320×568 최종은 스크롤568, 버튼 하단564, 9존 탭을 확인했다.
- `experiment-final.png`: production 빌드의 **0구 위기 연습** 화면. 보호 파울 발동 스크린샷이 아니다. 기존 카드 이미지를 그대로 사용했다.

추가 원본 스크린샷과 smoke 전체 JSON은 작성자의 작업 공간 `defense-lab-audit-20261022`에도 보존했다. 별도 reviewer의 마지막 검토는 `review-summary.json`에 기록한다. 실기기·사람 평가는 이 자료에 포함하지 않는다.
