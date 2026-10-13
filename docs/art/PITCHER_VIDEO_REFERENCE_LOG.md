# 투수 영상 참고 이력

이 로그는 새 투수 제작에서 채택하거나 이미 알려진 영상 출처를 기록한다. **과거에 채택했거나 아래 과거 출처 표에 등록한 클립은 이후 실행에서 어떤 참고 역할로도 새로 채택하지 않는다.** 검색에서만 발견하고 채택하지 않은 후보는 사용 이력과 구별한다. 새 실행은 포수캠과 심판캠 영상을 검색하고 원칙적으로 서로 다른 미사용 클립을 하나씩 채택한다. 단일 새 클립이 두 관점을 모두 충족한다는 실제 영상 근거가 확인될 때만 하나로 대체할 수 있다.

## 검증된 분석 캐시 사용 정책 (2026-10)

신규 제작에 과거 영상을 새로 채택한 것처럼 기록하는 것은 금지한다. 그러나 실제 영상을 보고 검증한 **키포즈 분석 노트**의 재사용은 허용한다. 재사용 시 기존 clip ID·시점·실제 관찰 타임스탬프와 원래의 검증 기록을 추적할 수 있어야 한다. 과거 출처 표의 `historical_page_only` 항목은 검증된 분석 캐시로 취급하지 않는다. 채팅 원화 제작 단계에서는 신규 영상 검색을 생략할 수 있다. 신규 조사가 필요하면 카메라 관점별 검색 후보를 최대 3개씩 시도하고 재생 실패를 투명하게 보고한다. 상세 지침: [`PITCHER_CHAT_FIRST_CACHE_WORKFLOW.md`](PITCHER_CHAT_FIRST_CACHE_WORKFLOW.md). 기존 새 영상 채택 이력 및 중복 방지 기록은 유지한다.

## 정규화 및 상태

- URL 비교 시 scheme/host를 소문자로 바꾸고, 끝 슬래시와 추적용 query/fragment만 제거한다. 영상 식별에 필요한 query 값은 보존한다. 이 로그의 MLB 비교 키는 `www.mlb.com`과 `mlb.com`을 `mlb.com`으로 통일한다. 다른 호스트는 같은 출처임이 확인된 경우에만 합친다. 리디렉션 목적지와 출처가 확인된 별칭은 같은 항목의 `aliases`에 추가한다.
- YouTube를 사용할 경우 `watch?v=<ID>`, `youtu.be/<ID>`, `shorts/<ID>`는 확인된 동일 ID로 비교한다. 공식 영상 ID가 없는 페이지·재업로드는 제목·투수·경기·실제 장면도 대조해 동일 클립의 다른 링크를 새 영상으로 채택하지 않는다.
- 클립 식별자가 확인되면 `clip_id`에 원출처의 ID를 기록한다. 확인되지 않은 경우 정규화 URL에서 만든 `url:<host>/<path>`를 비교용 키로 쓰며, 영상 식별에 필요한 query가 있으면 이름·값을 안정적인 순서로 정렬해 `url:<host>/<path>?<identity-query>`에 보존한다. 이 키를 원출처의 공식 ID라고 표현하지 않는다.
- 상태는 실제로 확인한 범위만 표현한다. `historical_page_only`는 이미 알려진 페이지 URL이라는 뜻이며 영상 시청·프레임 관찰·채택을 뜻하지 않는다. 실행별 후보는 `attempted`, `adopted`, `blocked`, `reference_unverified` 등 실제 상태로 기록한다.
- 새 실행은 검색한 시각(ISO 8601, 시간대 포함), 검색 출처/질의, 발견한 후보, 선택 여부, 실제 재생 여부, 관찰한 타임스탬프와 키포즈 메모를 기록한다. URL이나 클립 ID를 확인하지 못하면 `unknown`으로 둔다. 검색 전이나 재생 전의 상태를 완료로 표시하지 않는다.

## 실행별 기록 형식

새 실행마다 아래 항목을 추가한다. 같은 로그에 검색 후보와 채택 자료를 모두 적어 재사용 여부를 확인할 수 있게 한다.

```yaml
- run_id: "<character-slug>-<UTC-date-or-run-id>"
  character:
    slug: "<slug>"
    adult_age: 25
  searched_at: "<ISO-8601 timestamp with timezone>"
  search_queries:
    - query: "<actual query>"
      source: "<search engine/site>"
  candidates:
    - camera_view: catcher | umpire | both
      url: "<actual URL>"
      normalized_key: "<url:host/path[?preserved-identifying-query] or verified source ID>"
      clip_id: "<verified ID or unknown>"
      aliases: []
      status: attempted | adopted | blocked | rejected
      adopted: false
      played: false
      observed_timestamps: []
      keypose_observations: []
      notes: "<evidence or reason not adopted>"
  motion_validation: pending | passed | blocked | reference_unverified
  files:
    portrait: "<path>"
    keyposes: []
    bridge_poses: []
    atlas: "<path or pending>"
    build_script: "<path>"
  validation_status: "<actual checks/results>"
  usage_history: "<where these newly adopted references were used>"
```

## 이전에 알려진 출처

아래 페이지는 기존 제작 문서나 작업 맥락에 이미 등장한 자료다. `previously_known`은 과거 출처 중복 방지를 위한 표기이며, 검색 날짜가 알려져 있다는 뜻이 아니다. 모두 실제 프레임 재생·관찰 기록이 확인되지 않아 `viewed: false`, 분석 타임스탬프 없음으로 남긴다. 이들은 새 실행에서 선택할 수 없으며, 영상 분석 결과나 검증된 동작 자료로 인용하지 않는다.

| 정규화 비교 키 | 페이지 URL | 분류 / 상태 | 최초 사용 시각 | 프레임 분석 |
| --- | --- | --- | --- | --- |
| `url:mlb.com/video/behind-the-plate-view-of-cease` | https://www.mlb.com/video/behind-the-plate-view-of-cease | 포수캠 페이지, previously_known / historical_page_only | unknown | 확인 기록 없음; timestamps 없음 |
| `url:mlb.com/video/best-of-ump-cam-from-dodgers-vs-mets` | https://www.mlb.com/video/best-of-ump-cam-from-dodgers-vs-mets | 심판캠 페이지, previously_known / historical_page_only | unknown | 확인 기록 없음; timestamps 없음 |
| `url:mlb.com/cut4/behind-the-plate-view-of-japanese-submarine-pitcher/c-300564600` | https://www.mlb.com/cut4/behind-the-plate-view-of-japanese-submarine-pitcher/c-300564600 | 포수 뒤 시점 페이지, previously_known / historical_page_only | unknown | 확인 기록 없음; timestamps 없음 |
| `url:mlb.com/video/tyler-rogers-unique-delivery` | https://www.mlb.com/video/tyler-rogers-unique-delivery | 투구 전달 동작 페이지, previously_known / historical_page_only | unknown | 확인 기록 없음; timestamps 없음 |
| `url:mlb.com/cut4/rich-hill-pitches-sidearm-during-nlcs-game-3-c206550496` | https://www.mlb.com/cut4/rich-hill-pitches-sidearm-during-nlcs-game-3-c206550496 | 사이드암 동작 페이지, previously_known / historical_page_only | unknown | 확인 기록 없음; timestamps 없음 |

## 새 실행 기록

아래 실행별 기록을 기준으로 새 출처 사용 여부를 확인한다.

## Copper Sirocco — 2026-10-11

- run_id: `copper-sirocco-20261011`; 성인 29세 여성 우완; 상태: **reference_unverified / held_pose_candidate**.
- 검색 기록 시각: `2026-10-11T07:58:02+09:00`(재확인 검색 직전 실제 시각). 전체 질의·후보는 [`references.json`](../../assets/pitcher-study-copper-sirocco/references.json).
- 포수 뒤 시점 후보(이번 실행 예약·채택, 미재생): https://x.com/BryanHoch/status/2028857346869375058 — 비교 키 `x-status:2028857346869375058`. 확인한 것은 게시물 ID이며 미디어 clip ID는 unknown. 별칭 없음.
- 심판캠 후보(이번 실행 예약·채택, 미재생): https://www.mlb.com/video/best-of-ump-cam-in-game-1-of-the-padres-dodgers-nlds — 비교 키 `url:mlb.com/video/best-of-ump-cam-in-game-1-of-the-padres-dodgers-nlds`. 미디어 clip ID unknown, 별칭 없음.
- 재생 차단: researcher의 공개 MLB 페이지 GET을 자동 승인 검토가 거부했다. 우회 요청을 하지 않았다. 실제 재생·영상 프레임 관찰·타임스탬프 측정은 **없음**. 검색 설명만으로 영상 분석을 주장하지 않는다.
- 대체 후보 발견(미채택·미재생): `https://www.mlb.com/video/ump-cam-views-from-ws-game-2`, `https://www.mlb.com/video/best-of-ump-cam-from-2025-postseason`. 자동 검토 거부 이후 가져오기를 재시도하지 않았다. 위 두 URL은 사용 이력에 포함하지 않는다.
- 과거 출처 표의 다섯 URL과 다른 후보를 골랐다. 예약·채택한 두 URL은 이후 실행에서 새 참고영상으로 재사용하지 않는다. 미디어를 받지 못해 다른 링크의 장면 중복 여부까지 검증하지는 못했다.
- 파일: [`assets/pitcher-study-copper-sirocco/`](../../assets/pitcher-study-copper-sirocco/), [`scripts/build-copper-sirocco.py`](../../scripts/build-copper-sirocco.py).
- 산출물과 실제 검증은 실행 README·manifest·validation.json에 기록한다. 이 실행은 게임 미연결 아트 후보 PR이다.

## Copper Sirocco V2 — 2026-10-11

- run_id: `copper-sirocco-v2-20261011`; 성인 29세 여성 우완. 사용자 반려에 따른 글래머 체형·손잡이·와인드업 재제작.
- 검색 시각: `2026-10-11T19:25:00+09:00`(실행 중 근사 분, 정밀 시각 아님). 실제 질의·전체 후보·출처·상태는 [V2 references.json](../../assets/pitcher-study-copper-sirocco/v2/references.json).
- 새 심판캠 채택: https://www.mlb.com/video/ump-cam-views-from-the-2024-all-star-game — 비교 키 `url:mlb.com/video/ump-cam-views-from-the-2024-all-star-game`, 공식 clip ID unknown. 확인한 미디어 basename `2d3011e5-df7c816d-7e263c16-csvm-diamondx64-asset`. 공식 공개 MP4 전체 디코딩 완료, 타임스탬프 정지 프레임 관찰. 브라우저 연속 재생은 하지 않음.
- 실제 관찰: 0초 이미 디딤/착지 단계; 0.5초 팔 가속·릴리스 근처; 1~1.5초 앞발 지지와 앞으로 숙이는 팔로스루/회복; 2초 카메라가 플레이를 따라 돌아가 투수 일부만 보임. 관찰한 시점 전체 목록은 JSON. 전체 와인드업이나 정밀 관절 궤적 근거는 없음.
- 새 포수캠 채택·예약: https://www.mlb.com/cut4/south-carolinas-catcher-wore-a-helmet-cam-during-a-game-heres-the-footage/c-47144888 — 확인된 임베드 비교 키 `youtube:Ag0l7h182Zs`. 별칭 `https://www.youtube.com/watch?v=Ag0l7h182Zs`, `https://www.youtube.com/embed/Ag0l7h182Zs`. 공개 페이지/임베드 확인 후 YouTube player LOGIN_REQUIRED로 재생 차단, 관찰 없음. 로그인/우회 없음.
- 대체 시도·미채택: `https://vimeo.com/1165033399`, `vimeo:1165033399`; 공개 player config HTTP403. 영상 관찰 없음, 사용 이력 제외.
- 상태: `camera_composition_sampled; windup_reference_unverified`. 원영상 미디어·프레임은 작업용 임시 파일로만 사용해 저장소에 게시하지 않는다. V1 및 과거 표의 채택 출처와 다른 새 클립 두 개를 이번 실행에서 예약했으며 다음 제작에서 새 출처로 재사용하지 않는다.
- 산출물: [V2 후보](../../assets/pitcher-study-copper-sirocco/v2/README.md), [V2 빌더](../../scripts/build-copper-sirocco-v2.py). 실제 고유 그림 24개/120셀 후보, 게임 미연결. 검수 결과는 validation.json과 PR.
