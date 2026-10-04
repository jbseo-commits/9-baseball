# Claude 야구 개발 한 바퀴

AGENTS.md → docs/MODEL-ROUTING.md → HANDOFF.md의 최신 최우선 절 → docs/ANTIGRAVITY-LOOP.md → docs/antigravity/QUEUE.md 순서로 읽는다.

현재 작업 브랜치에서 큐의 미완료 항목 하나 또는 사용자 지정 항목 하나만 수행한다. 필요한 영향도 분석과 기존 9축·X1~X12·검증·실제 화면 비교를 그대로 따른다. 계획 전에 advisor 상담, explorer로 근거 탐색, researcher로 필요한 공식 문서 확인, worker로 허용 파일 구현, ag-reviewer·ag-qa로 독립 검수를 한다. 같은 오류가 두 번이면 메인이 advisor로 원인 탐색 방향을 재검토한다. 완료 전 메인이 advisor와 누락을 확인한다.

main에는 push·merge·auto-merge하지 않는다. 자기 작업 브랜치의 커밋·PR·실제 프리뷰 링크까지만 남긴다. 작업자의 편집은 하나씩 수행한다. 에이전트 모델·effort, 검증·상담 결과·미검증·다음 한 단계를 보고한다. 한 바퀴 후 멈춘다. 기존 종료 조건을 무시하거나 큐 항목을 여러 개 섞지 않는다.
