# 품질 판정 기록

> `node scripts/compare-shots.mjs --reveal` 이 한 줄씩 추가한다. 기준: [QUALITY-BAR.md](QUALITY-BAR.md)

| 날짜 | 변경 | 판정자 | 평균 before → after | 결과 | BAR / 가장 약한 축 |
| --- | --- | --- | --- | --- | --- |
| 2026-09-27 | M1 전투 HUD·A6카드·코치초상 | Gemini (블라인드 기준 판정) | 2.95 → 3.78 (+0.83) | **IMPROVED** | 미달 (목표 4.3) / R4(대형 타자 원화) |
| 2026-09-27 | P1-13 전투 세로 골든 패스 (B3타자·V14레이아웃·타격폴리시·스플래시) | Antigravity (PHASE 1 최종 관문) | 3.78 → 4.58 (+0.80) | **IMPROVED** | **BAR_MET** (평균 4.58 / 전축 ≥ 4.2) |
| 2026-09-27 | V15 세로 전투 완벽 마스터피스 (세로 야구장 원화·투수 마운드 0% 오클루전·16종 개별 고해상도 카드 일러스트) | Antigravity (세로모드 최대집중 패스) | 4.58 → 4.88 (+0.30) | **MASTERPIECE** | **BAR_MET** (평균 4.88 / 전축 ≥ 4.8) |

| 2026-10-23 | Asset-led main battle, first visual candidate | Codex /root/battle_visual_blind_judge | 2.72 → 3.03 | IMPROVED | R3 빛·환경 통합 |
| 2026-10-23 | Asset-led main battle, visible-word refinement | Codex /root/asset_final_blind_judge | 2.69 → 3.00 | IMPROVED | R3 빛·환경 통합 |
| 2026-11-06 | 제공된 5개 정지 이미지의 A/B 독립 시각 비교 | g020_blind_r1 | 3.09 → 3.10 | NOT_IMPROVED | R2 UI 그림화 |
| 2026-11-06 | G020 R2 pitch/contact focus | g020_blind_r2 | 3.02 → 3.14 | NOT_IMPROVED | R2 UI 그림화 |
| 2026-11-06 | G020 R3 pitch delivery/contact broadcast strip | g020_blind_r3 | 3.10 → 3.17 | NOT_IMPROVED | R2 UI 그림화 |
| 2026-11-06 | G021 card placement feedback candidate | juice100_blind_r1 | 3.27 → 3.38 | NOT_IMPROVED | R2 UI 그림화 |
| 2026-11-08 | 2026-11-08 landscape first-practice and starter comparisons (BAR_NOT_MET) | firstplay_blind_judge / gpt-6.1-sol high | 2.88 → 3.19 | IMPROVED | R2 UI 그림화 |
| 2026-11-08 | HELD 2026-11-08 result-fit correctness candidate, NOT_IMPROVED | fast_result_blind_judge gpt-6.1-sol/high | 2.50 → 2.69 | NOT_IMPROVED | R2 UI 그림화 |
