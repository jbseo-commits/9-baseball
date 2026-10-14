# Emerald Tempest / 에메랄드 템페스트 — RHP 후보

27세 성인 여성 우완(RHP) 하이 오버핸드 파워 투수, 등번호 #77. 오른손 투구·왼손 글러브, 포수·심판 뒤 정면 카메라 기준이다. 사용자가 Google 드라이브에 올린 번들(`emerald_tempest_rhp_github_bundle.zip`)을 그대로 반입한 **브랜치 검수 후보**다.

**게임에 연결되지 않았다.** 로스터, HP/밸런스, 저장 데이터, 입력/CSS, 런타임은 변경 범위 밖이다.

## 파일

- `emerald-tempest-master-rhp.jpg`: 전신 원화.
- `emerald-tempest-5pose-gate-rhp.jpg`: 5포즈 카메라 검수판.
- `emerald-tempest-12poses-verified-rhp.png`, `poses/pose_01~12_*.png`: 12포즈, 각 256×256 RGBA.
- `emerald-tempest-atlas-256x256-10x12-120f.png`: 2560×3072 RGBA, 10열×12행, 120셀, 60fps·2초.
- `emerald-tempest-rig-and-timeline.json`: 파츠·12키포즈·120프레임 관절 좌표·자체 QA 값.
- `../../preview/emerald_tempest_standalone_preview.html`: 독립 재생 미리보기.
- `../../scripts/build-pitcher-emerald-tempest.py`: 빌더 원본.
- 참고영상 기록: `docs/art/PITCHER_VIDEO_REFERENCE_LOG.md`의 Emerald Tempest 항목. 4개 클립 ID는 반입 시점 기존 로그·에셋과 중복 없음을 대조했다.

## 반입 시 확인한 한계

- 아틀라스 120셀 중 **픽셀이 서로 다른 셀은 36개**다(반입 시 셀 해시 계산). 나머지는 유지 반복이다. JSON의 매 프레임 관절 좌표와 QA 통과값은 좌표 계산값이며 실제 그림 수를 뜻하지 않는다.
- 빌더는 외부 생성 환경의 절대 경로(`/working_dir/...`)를 쓴다. 이 저장소에서 그대로 재실행할 수 없다.
- 손잡이: 5포즈·12포즈에서 공은 오른손(화면 왼쪽), 글러브는 왼손(화면 오른쪽)으로 눈 검수상 일관된다. 밝은 핀스트라이프 바지라 어두운 배경에서도 다리가 읽힌다.
- 참고영상 관찰 메모는 번들 기록이다. 반입 중 영상을 다시 재생해 확인하지 않았다.
- 프리미엄 픽셀 마감, 경기장/VFX 통합, 모바일 가로·PC 실제 배치 합격을 주장하지 않는다.
