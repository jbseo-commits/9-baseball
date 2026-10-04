# Codex 야구 개발 한 바퀴

AGENTS.md → docs/codex-loop.md → HANDOFF.md의 최신 최우선 절 → docs/ANTIGRAVITY-LOOP.md → docs/antigravity/QUEUE.md 순서로 읽는다.

현재 작업 브랜치에서 큐의 미완료 항목 하나 또는 사용자 지정 항목 하나만 수행한다. 필요한 영향도 분석과 기존 9축·X1~X12·검증·실제 화면 비교를 그대로 따른다. 계획 전에 reviewer 상담, explorer로 근거 탐색, researcher로 필요한 공식 문서 확인, worker로 허용 파일 구현, reviewer로 코드와 실제 화면 근거를 독립 검수한다. 같은 오류가 두 번이면 메인이 reviewer로 원인 탐색 방향을 재검토한다. 완료 전 메인이 reviewer와 누락을 확인한다.

main에는 push·merge·auto-merge하지 않는다. 변경분과 검증 근거를 준비하고 보고한다. 원격 게시·프리뷰 배포는 별도 지시를 따른다. 작업자의 편집은 하나씩 수행한다. 에이전트 모델·effort, 검증·상담 결과·미검증·다음 한 단계를 보고한다. 한 바퀴 후 멈춘다. 기존 종료 조건을 무시하거나 큐 항목을 여러 개 섞지 않는다.


현재 custom agents explorer, worker, researcher, reviewer를 필요할 때 명시적으로 호출한다. reviewer는 별도 읽기 전용 검수이며 .codex/agents/reviewer.toml 역할을 사용한다. 주어진 역할 모델을 지원하지 않거나 역할이 로드되지 않으면 BLOCKED로 보고한다. 큰 계획 전, 동일 오류 두 번째, 긴 작업 완료 전 reviewer에게 근거와 diff를 보내 확인한다. 동시에 쓰는 worker는 하나다. 원격 commit/push/merge/배포를 이 실행에서 수행하지 않는다. 변경분과 검증 근거를 작업 브랜치에 남긴 뒤 한 바퀴 후 멈춘다.

진행 상태는 메인이 node scripts/loop-status.mjs --engine codex --role <역할> --status <상태> --stage <단계> --summary "짧은 근거" 형식으로 시작/종료마다 기록한다. runId는 런처가 제공한 값을 사용한다. 검토는 --checkpoint before-plan|repeat-error|before-done을 붙인다. worker의 실제 테스트 종료 코드를 확인한 경우만 --test "테스트 이름" --result passed|failed|blocked로 기록한다. 읽기 전용 에이전트에 로그 쓰기를 맡기지 않는다. 로그에는 raw 출력, 원고, 비밀키를 넣지 않는다. docs/codex-loop.md의 기록 계약을 따른다. 기록 실패를 제품 작업 성공으로 숨기지 않는다.
