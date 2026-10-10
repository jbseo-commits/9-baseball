# 투수 영상 참고 이력

이 로그는 새 투수 제작에서 채택하거나 이미 알려진 영상 출처를 기록한다. **과거에 채택했거나 아래 과거 출처 표에 등록한 클립은 이후 실행에서 어떤 참고 역할로도 새로 채택하지 않는다.** 검색에서만 발견하고 채택하지 않은 후보는 사용 이력과 구별한다. 새 실행은 포수캠과 심판캠 영상을 검색하고 원칙적으로 서로 다른 미사용 클립을 하나씩 채택한다. 단일 새 클립이 두 관점을 모두 충족한다는 실제 영상 근거가 확인될 때만 하나로 대체할 수 있다.

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

현재 이 작업에서는 새 영상을 검색하거나 재생하지 않았다. 따라서 새 실행 및 새 채택 출처 항목은 아직 없다.
