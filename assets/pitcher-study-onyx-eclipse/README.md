# Onyx Eclipse / 오닉스 이클립스 — LHP 후보

26세 성인 여성 좌완(LHP) 스리쿼터 투수. 왼손 투구(바이올렛 슬리브)·오른손 글러브, 포수·심판 뒤 정면 카메라 기준이다. 사용자가 채팅에서 만든 번들을 그대로 반입한 **브랜치 검수 후보**다.

**게임에 연결되지 않았다.** 로스터, HP/밸런스, 저장 데이터, 입력/CSS, 런타임은 변경 범위 밖이다.

## 파일

- `onyx-eclipse-master-lhp.jpg`: 전신 원화 896×1200.
- `onyx-eclipse-5pose-gate-lhp.jpg`: 5포즈 카메라 검수판.
- `onyx-eclipse-12poses-verified-lhp.png`, `poses/pose_01~12_*.png`: 12포즈, 각 256×256 RGBA.
- `onyx-eclipse-atlas-256x256-10x12-120f.png`: 2560×3072 RGBA, 10열×12행, 120셀, 60fps·2초.
- `onyx-eclipse-rig-and-timeline.json`: 파츠·12키포즈·120프레임 관절 좌표·자체 QA 값.
- `../../preview/onyx_eclipse_standalone_preview.html`: 독립 재생 미리보기.
- `../../scripts/build-pitcher-onyx-eclipse.py`: 빌더 원본.
- 참고영상 기록: `docs/art/PITCHER_VIDEO_REFERENCE_LOG.md` 끝의 Onyx Eclipse 항목. 4개 클립 ID는 반입 시점 기존 로그·에셋과 중복 없음을 대조했다.

## 반입 시 확인한 한계

- 아틀라스 120셀 중 **픽셀이 서로 다른 셀은 36개**다(반입 시 셀 해시 계산). 나머지는 유지 반복이다. JSON의 매 프레임 관절 좌표와 `smooth_60fps_pass`는 좌표 계산값이며 실제 그림 수를 뜻하지 않는다.
- 빌더는 외부 생성 환경의 절대 경로(`/working_dir/...`)를 쓴다. 이 저장소에서 그대로 재실행할 수 없다.
- 12포즈 컷아웃의 검은 바지·다리가 어두운 배경에서 점선 외곽선만 남아 축소 판독성이 약하다. 게임 배경 합성 확인이 필요하다.
- 참고영상 관찰 메모는 번들 기록이다. 반입 중 영상을 다시 재생해 확인하지 않았다.
- 손잡이: 원화·5포즈·12포즈에서 공은 캐릭터 왼손(화면 오른쪽), 글러브는 오른손(화면 왼쪽)으로 눈 검수상 일관된다.
- 프리미엄 픽셀 마감, 경기장/VFX 통합, 모바일 가로·PC 실제 배치 합격을 주장하지 않는다.
