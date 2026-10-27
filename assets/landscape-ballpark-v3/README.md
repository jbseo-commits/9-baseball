# 사선 타석과 연결 키포즈 — 가로 프리뷰 전용

기존 카드 원화를 유지하며 가로 한 전투의 카메라·배우·무대를 맞춘 자산이다. 기본 세로와 원본 투수120프레임은 교체하지 않는다.

## 타자·구장

- `base.png`, `raw/`, `prompts/`, `sprite-request.json`: 2026-10-26 sprite-gen GPT 원화/행 제작의 원본과 요청. 원본은 보존했다.
- `curated/`: 공식 component-row 추출과 큐레이션을 거친14개 셀(anticipation4/swing4/recovery6). 중복 swing-row ready는 실제 스윙 시작에 사용하지 않는다.
- `batter-atlas.png/webp`, `layout.json`, `manifest.json`, `curation.json`: 공식 compose/export 결과. 셀384×320, 명시적rects14개. 논리160px·48색·2px격자. 런타임WebP43,426bytes.
- `stadium.png/webp`: 관중석·외야·내야 바탕. 배터박스/홈플레이트/마운드/투수판은 배경에 중복해서 굽지 않고 한 지면 투영으로 그린다. WebP198,464bytes.
- 타자앵커는 `landscape-batter.js`의 pose별 x와 공통304/320baseline이다. 준비/들기는 뒷신발, 식재 이후는 앞신발 뒤꿈치 구간을 기준으로 위치를 보정했다. 실제 팔/발의 자연스러움은 형식 검사와 별도로 실행 캡처로 검토했다.

## 타이드 베스퍼 복귀

- `tide-return/return-atlas.png`: 2026-10-27 GPT가 그린6개 복귀 키포즈, 공식 sprite-gen 추출/compose. 셀256×256,6열1행,43,245bytes.
- `recovery-raw.png`, `recovery-prompt.txt`, `sprite-request.json`, `manifest.json`: 원본·요청·공식 결과. 기존Tide atlas0을 identity/end 기준, atlas119를 start 기준, 공식6칸guide를 geometry 기준으로 참조했다. 새 캐릭터/의상/로스터가 아니다.
- 기존 `sprite-gen gen --provider codex`에 준비된 prompt+세 참조를 직접 전달했다. `gen-set`의 identity+guide 두 참조만으로는 시작 포즈를 전달할 수 없어 이 기존 생성 entry를 사용했다. 추출·정렬·합성 엔진은 대체하지 않았다.
- 생성 이미지는 정상 게시됐으나 별도report 디렉터리가 없어 마지막report write가 실패했다. 이미지 두 파일을 직접 확인하고 재생성하지 않았다. 이후 canonical extract/compose-atlas/compose-gif/inspect를 실행해 성공했다. 도구가 만들지 못한 generation report를 꾸며 넣지 않았다.
- 추출은 미세 원본을128논리픽셀/48색으로 정규화했다는 경고를 냈다. 정규화 성공을 미감 합격으로 취급하지 않았다. 별도 시각 검토에서 다리 내림→양발 착지→상체 세움→글러브 준비의 순서와 손잡이를 확인했고, 실제DOM/Pixi에서119→return0..5→atlas0을 관측했다.
- runtime descriptor `landscape-pitcher.js`: scale.91, sole250/256, 각 셀의 신발 구간 중심과 목표점을 명시. 2000ms 전 원본 프레임·릴리스76은 그대로 사용하고,2000~2600ms에만 새 복귀. KO가 우선하며 다른 투수에는 적용하지 않는다.

## 관측 범위

타자14포즈와 투수6복귀는 연결 키포즈이며 모든 프레임을 새로 그린60fps영상이 아니다. 실제MLB 영상은 이전 카메라 조사에 사용한 근거이며 이번 추가 복귀의 신규 영상 관찰로 주장하지 않는다. 원본119/0과 새row의 시작/끝 연결을 기준으로 검증했다. 원본 카드·확률·비용·HP·세이브 규칙은 바꾸지 않는다.

실행·회귀 기록: `docs/qa/single-battle-landscape-20261027/README.md`.
