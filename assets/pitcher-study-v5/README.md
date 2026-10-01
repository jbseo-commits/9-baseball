# 볼칸 듀란 — 게임 투수 에셋

성인 남성 우완 정통파 거구 파이어볼러의 포수 뒤 시점(Umpire CAM) 원화와 게임용 120프레임 애니메이션이다. 옵시디언 차콜·마그마 오렌지 불꽃 유니폼, 왼손 글러브, 오른손 103마일 스플링커 투구를 유지한다.

## 게임 연결

- `source/vulcan-blaze-release.png`: 1024×1536 투명 전신 원화. 투수 도감과 지도 이미지에 사용한다.
- `source/vulcan-blaze-keys.png`, `source/vulcan-blaze-bridges.png`: 각 1536×1024의 여섯 포즈 시트.
- `atlases/vulcan-blaze-pitch-120-atlas.png`: 10열×12행, 셀당 256×256, 60fps, 120프레임. 게임의 전투 렌더러에서 사용한다.
- `vulcan-blaze-manifest.json`: 릴리스 프레임 76, 포수 시점과 손잡이 정보, 하이 쓰리쿼터 슬롯.

개발 서버에서 `http://127.0.0.1:5173/?previewPitcher=vulcan-blaze`를 열면 볼칸 듀란 전투가 바로 나온다. 이 프리뷰의 행동은 실제 메인 런 저장을 덮어쓰지 않는다.

`assets/pitcher-mobs-v1/roster.json`에 정규 투수로 등록했고, `src/duel/pitcher-visuals.js`에서 도감 원화와 전투 아틀라스를 연결했다. 마운드 기준점, 앞발 착지점, 공 시작점도 등록했다. `python scripts/build-vulcan-blaze.py`로 아틀라스를 다시 만들 수 있다.

## 참고 및 검증 범위

- [호안 듀란 / 엠마누엘 클라세 심판캠(Umpire CAM)](https://www.mlb.com/video): 103마일 스플링커(Splinker)의 돌진형 스트라이드, 폭발적 릴리스 및 감속 궤적 참고.
- 정면 포수 시점(Catcher POV): 타석에서 마운드를 정면으로 바라보는 9ZONE의 배틀 화각과 100% 일치.

## 영향 점검

| 항목 | 영향 |
| --- | --- |
| UI·레이아웃 | 도감 인원이 16명으로 늘어난다. 모바일 도감은 기존 스크롤을 쓴다. |
| 입력·제스처 | 변경 없음. |
| 전투 규칙·밸런스 | 기존 정규 투수 한 명의 그림·이름·대사가 추가된다. HP와 전투 규칙은 기존 elite 티어 공식을 따른다. |
| 세이브·호환 | roster id `vulcan-blaze`가 추가되며 기존 세이브와 호환된다. |
| 뷰포트·스크롤 | 전역 CSS 및 뷰포트 규칙 변경 없음. |
| 성능·용량 | 런타임 WebP 파생본 최적화 적용. |
