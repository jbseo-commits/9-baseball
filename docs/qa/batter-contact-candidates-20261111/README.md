# 타격 접촉 포즈 시안 — 검토용 보존

**HELD · 누적 2/3차 · 본편 미적용.** 사용자의 “깃허브 올려줘” 요청에 따라 원본·가이드·검수 기록을 별도 Draft PR에 보존합니다. 이 게시는 시안의 품질 통과나 메인 병합, 게임 연결을 뜻하지 않습니다. 추가 생성은 하지 않았으며 기존 HELD#90과 다른 보류 항목의 횟수도 유지합니다.

## 다른 PC에서 볼 파일

| 항목 | 1차 | 2차 |
|---|---|---|
| 원본 시트 | [source-sheet.png](source-sheet.png) | [candidate2-source-sheet.png](candidate2-source-sheet.png) |
| 개별 포즈 | [높음](unpacked/frames/row-0/frame-0.png) · [중간](unpacked/frames/row-0/frame-1.png) · [낮음](unpacked/frames/row-0/frame-2.png) | [높음](candidate2-unpacked/frames/row-0/frame-0.png) · [중간](candidate2-unpacked/frames/row-0/frame-1.png) · [낮음](candidate2-unpacked/frames/row-0/frame-2.png) |
| 독립 검수 | [1차 보고](INDEPENDENT-REVIEW.md) | [2차 보고](CANDIDATE2-REVIEW.md) |

[기준 원화](baseline/reference-standard.png), [2차 좌표 가이드](candidate2-reference-guide.png), [실제 생성 프롬프트](PROMPTS.md), [상대 경로 목록](archive-manifest.json), [파일 SHA256](CHECKSUMS.json)을 함께 보존했습니다. PNG는 원본 파일 그대로 복사했으며 개별 포즈는 시트의 각 셀과 RGBA 픽셀이 일치합니다. 두 시트는 각각 2172×724, 개별 셀은 724×724입니다.

## 보류 이유

2차는 발 고정·인물·양손 그립·폭의 일관성이 개선됐지만, 제안한 접촉 높이의 세 지점을 충분히 덮지 못했습니다. 팔·몸통·배트 주변의 붉고 노란 테두리와 잔여 픽셀도 남아 있습니다. 시트당 세 장은 서로 다른 접촉 포즈이며, 완성된 스윙 애니메이션이나 14/120프레임 모션이 아닙니다.

724/768 공통 캔버스 비율은 진단용 대응이며 실제 인물의 월드 좌표 등록을 입증하지 않습니다. 독립 보고의 alpha≥64 거리는 **724px 생성 셀의 픽셀**, [별도 측정](candidate2-root-measurement.json)의 alpha128 거리는 **가설 월드 배치 픽셀**입니다. 단위·문턱값이 다르므로 같은 수치처럼 비교하거나 실제 판정으로 쓰지 않습니다. [타격면 가설](../contact-plane-contract-20261111/contract.json)도 아직 미승인입니다.

세 번째 시도 전에는 전신 기준과 공통 좌표 오버레이를 강화하고 검토해야 합니다. 공 크기·목표점·배트 길이를 바꾸거나 개별 포즈를 이동·늘려 겹침을 만들어서는 안 됩니다. 이 브랜치를 본편 에셋으로 연결하거나 자동으로 다음 생성을 실행하지 않습니다.

## 제작·보존 범위

새 원화는 built-in `image_gen`으로 생성했습니다. `sprite-gen`은 동일한 격자의 추출, `2dimg2motion`은 기준 원화 준비에 사용했습니다. 다른 생성 제공자, 보간, GIF 생성이나 여덟 도구 전체 사용을 주장하지 않습니다. 현재 요청에서는 새 그림이나 포즈 보정을 하지 않았습니다.

`PLAN.json`, `provenance-manifest.json`, 원래 도구 JSON과 검수 보고에는 당시 `/workspace/...` 경로가 남아 있습니다. 이는 **과거 실행 출처**이며 다른 PC의 실제 경로가 아닙니다. 검토할 파일은 `archive-manifest.json`의 상대 경로를 사용하세요. 이 폴더는 실행용 로스터·모션 manifest가 아닙니다.

게임 코드는 바꾸지 않았습니다. 배포된 결과 읽기 수정은 [PR111](https://github.com/jbseo-commits/9-baseball/pull/111)·[PR112](https://github.com/jbseo-commits/9-baseball/pull/112), 접점 검수 도구는 [PR113](https://github.com/jbseo-commits/9-baseball/pull/113), 보류 기록은 [PR114](https://github.com/jbseo-commits/9-baseball/pull/114)에 있습니다.

영향도: 제품 UI/입력/규칙/저장/모바일/스크롤/사용자 흐름/빌드 입력은 변경하지 않습니다. 직접 영향은 GitHub에서 검토할 문서·PNG의 보존뿐입니다. 검증은 원본 SHA256, 시트와 셀의 픽셀 일치, 상대 경로, 변경 경로와 독립 검수로 제한하며, 기존 테스트 통과를 새 원화의 품질 통과로 쓰지 않습니다.
