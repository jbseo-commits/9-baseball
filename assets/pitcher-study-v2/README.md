# 타이드 베스퍼 — 게임 투수 에셋

성인 여성 우완 투수의 포수 뒤 시점 원화와 게임용 애니메이션이다. 남색·청록·금색 유니폼, 왼손 글러브, 오른손 투구를 유지한다.

## 게임 연결

- `source/tide-vesper-release.png`: 1024×1536 투명 전신 원화. 투수 도감과 지도 이미지에 사용한다.
- `source/tide-vesper-keys.png`, `source/tide-vesper-bridges.png`: 각 1536×1024의 여섯 포즈 시트.
- `atlases/tide-vesper-pitch-120-atlas.png`: 10열×12행, 셀당 256×256, 60fps, 120프레임. 게임의 전투 렌더러에서 사용한다.
- `tide-vesper-manifest.json`: 릴리스 프레임 76, 포수 시점과 손잡이 정보.
- `previews/tide-vesper-game-portrait.png`: 412×915 실제 모바일 전투 화면 캡처.
- `previews/tide-vesper-live-game.png`: 개발 서버의 바로 가기 프리뷰 화면 캡처.

개발 서버에서 `http://127.0.0.1:5173/?previewPitcher=tide-vesper`를 열면 타이드 베스퍼 전투가 바로 나온다. 이 프리뷰의 행동은 실제 메인 런 저장을 덮어쓰지 않는다.

`assets/pitcher-mobs-v1/roster.json`에 정규 투수로 등록했고, `src/duel/pitcher-visuals.js`에서 도감 원화와 전투 아틀라스를 연결했다. 마운드 기준점, 앞발 착지점, 공 시작점도 등록했다. `python scripts/build-tide-vesper.py`로 아틀라스를 다시 만들 수 있다.

## 참고 및 검증 범위

- [MLB 딜런 시즈 포수 뒤 시점](https://www.mlb.com/video/behind-the-plate-view-of-cease): 화면 구도 참고.
- [소니 그레이 투구 동작 설명](https://dt5602vnjxv0c.cloudfront.net/portals/24146/docs/2023/kid%20pitch%20coach%20training%20cmpressed_part4.pdf): 준비·디딤·릴리스 순서 참고.

페이지의 설명을 확인했으며 실제 영상 프레임을 직접 분석한 모션 캡처는 아니다. 생성 시트에서 포즈 12개를 뽑아 게임 타임라인에 배치했기 때문에 120개 이미지가 모두 다르더라도 팔다리 동작은 포즈 사이에서 점프할 수 있다. 모바일 전투 화면에서 정지 자세의 위치와 크기, 투수 이름과 대사, 콘솔 오류 없음을 확인했다. 릴리스 중간 화면과 실제 동작의 부드러움은 추가 육안 검증이 필요하다.

## 영향 점검

| 항목 | 영향 |
| --- | --- |
| UI·레이아웃 | 도감 인원이 13명으로 늘어난다. 모바일 도감은 기존 스크롤을 쓴다. |
| 입력·제스처 | 변경 없음. |
| 전투 규칙·밸런스 | 기존 정규 투수 한 명의 그림·이름·대사가 추가된다. HP와 전투 규칙은 기존 정규 난이도를 따른다. |
| 저장·불러오기 | 새 ID `tide-vesper`가 일반 런 노드에 들어간다. 기존 저장 형식은 그대로다. |
| 모바일 화면 | 412×915 화면 캡처로 정지 자세 배치 확인. |
| 스크롤·넘침 | 도감 스크롤 항목 하나 추가. |
| 사용자 흐름 | 정규 전투와 도감에 등장한다. |
| 테스트 | 아틀라스 규격·로스터·대사 테스트 통과. |
| 빌드 | Vite 프로덕션 빌드 통과. |
