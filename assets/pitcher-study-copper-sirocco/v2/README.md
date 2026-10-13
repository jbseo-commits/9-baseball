# 코퍼 시로코 V2 — 재제작 아트 후보

사용자가 V1의 손 바뀜과 부족한 매력을 지적해 재제작했다. 29세 성인 여성 우완 설정은 유지한다. 아이보리 에이스·로즈 페인트의 풍만한 상체, 잘록한 허리, 부드러운 얼굴과 매끄러운 다리를 기준으로 원화와 모든 포즈를 새로 그렸다. 원화 비교용 기준 캐릭터는 수정하지 않았다.

공은 오른손(화면 왼쪽, 구릿빛 손목 밴드), 글러브는 왼손(화면 오른쪽, 흰 커프). 왼무릎이 화면 오른쪽으로 올라가고 왼발로 디딘다. 머리 위 와인드업을 명시하며 릴리스 이후 오른손은 비어 있다. 잘못 교차된 손과 뒤집힌 앞다리 출력은 `source/originals/`에 보존한다.

## 검토 파일

- [전신 원화](source/copper-sirocco-portrait.png)
- [24포즈 모음](previews/copper-sirocco-poses.png), [128/192/256px 비교](previews/copper-sirocco-scale-comparison.png)
- [2초 GIF](previews/copper-sirocco-pitch.gif), [60fps MP4](previews/copper-sirocco-pitch.mp4)
- `source/copper-sirocco-{keys,bridges,inbetweens-a,inbetweens-b}.png`: 투명 1536×1024 시트 4개, 각 6개 직접 그린 포즈.
- `source/poses/`, `poses256/`: 원화 해상도와 256px 개별 포즈 각 24개.
- `atlases/copper-sirocco-pitch-120-atlas.png`: 256×256 셀, 10×12, 120셀, 60fps, 2초, 릴리스 76프레임(0부터 시작).
- `copper-sirocco-manifest.json`, `landmarks.json`, `validation.json`: 실제 고유 그림 수, 타임라인, 발 측정·패킹 검사.
- `PROMPTS.json`, `references.json`: 실제 생성 프롬프트·영상 출처·관찰 상태.

빌드: `python scripts/build-copper-sirocco-v2.py`; 회귀 검사: `python scripts/test-copper-sirocco-v2.py`. Pillow·NumPy·ffmpeg/ffprobe가 필요하다. 다른 캐릭터 빌더는 수정하지 않았다.

## 모션과 접지 검수 범위

실제 고유 그림은 24개다. 120셀은 포즈별 유지 시간을 패킹한 규격이며, 120개 서로 다른 관절 그림이나 매끈한 완성 애니메이션으로 표시하지 않는다. 전체 몸 회전·미러링·교차 페이드로 고유 그림 수를 부풀리지 않았다. GIF는 25fps 표본으로 총2초이며 MP4는 120프레임/60fps/2초다.

각 그림에서 해부학적 발을 직접 고른 뒤 불투명한 신발 밑면을 측정한다. 착지 전 오른발 축점 `[65,240]`, 착지부터 회복까지 왼발 축점 `[210,240]`을 공유한다. 외곽선 중앙 정렬을 사용하지 않는다. 같은 축소율, 접지 좌표·발 종류, 릴리스 상태, 여백, 착지 시 앵커 전환 거리도 검사한다. 영상에서 측정한 관절 좌표는 아니다. 회복→준비 전환과 직접 그린 포즈 사이에는 자세 점프가 남는다.

실제 게임의 마운드·공 시작 위치·VFX·모바일 UI 검수는 후보 연결 전에 필요하다. 게임 로스터·HP·규칙·저장·main 배포는 이번 후보 범위에 포함하지 않았다. 최종 상업 아트나 완성 모션 합격으로 표시하지 않는다.

## 새 영상과 실제 관찰

새 심판캠은 [2024 All-Star Ump Cam](https://www.mlb.com/video/ump-cam-views-from-the-2024-all-star-game)이다. 공식 공개 MP4 전체를 디코딩하고 시간별 정지 프레임을 확인했다. 0초부터 이미 디딤 단계, 0.5초 팔 가속, 1~1.5초 앞발 지지와 팔로스루를 관찰했다. 브라우저 연속 재생이나 전체 와인드업 측정은 하지 않았다. 구도·팔로스루 참고까지만 확인된 자료다.

새 포수캠은 [South Carolina catcher helmet cam](https://www.mlb.com/cut4/south-carolinas-catcher-wore-a-helmet-cam-during-a-game-heres-the-footage/c-47144888), 확인된 임베드 ID `Ag0l7h182Zs`다. YouTube가 LOGIN_REQUIRED를 반환해 관찰하지 못했다. 대체 Vimeo 후보도 HTTP403으로 미채택했다. 따라서 전체 와인드업은 **reference_unverified**이며 직접 설계한 후보 동작이다. 두 채택 클립은 다음 새 제작에서 재사용하지 않도록 참고 로그에 예약했다. 외부 영상과 프레임은 게시하지 않는다.

## 구현 전 영향도 분석

[V2 수정 계약](../REVISION-V2.md)의 9개 축을 구현 전에 확인했다. 영향 범위는 미사용 후보 폴더·전용 빌더·회귀 검사·참고 로그다. 런타임·공용 빌더·기존 캐릭터 자산을 변경하지 않았다. 실제 검사 결과는 `validation.json`과 PR에 기록한다.
