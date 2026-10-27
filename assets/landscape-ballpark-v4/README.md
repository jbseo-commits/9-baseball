# 가로 복귀·지면 자산 — 2026-10-27

기존 카드 원화, 세로 타자, 투수120프레임은 유지한다. 이 폴더는 compare 가로 화면에서만 사용한다.

## 제작·선별

- GPT 구독 경로 `sprite-gen gen --provider codex`, 기존 component-row prepare → extract → compose-atlas로 제작했다. 신규 캐릭터가 아니라 기존 `landscape-ballpark-v3` 타자의 연결 자세다.
- identity: 기존 `curated/anticipation-frame-0.png`; start: `curated/recovery-frame-1.png`; 추가 end: 첫 recovery 후보의 low-front(frame2). 숫자 각도로 전체8컷을 주문한 두 번째 후보는 왕복하는 동작이라 불채택했다.
- 첫8컷 recovery 후보도 전체 동작은 불합격이다. 이 중 낮은 손→몸 앞→배트 상승에 해당하는 인덱스2,3,4,5를 **부분 상승 구간**으로만 사용한다. 인덱스0/1의 정지 유사컷과6/7의 끝 전환은 사용하지 않는다. 원래 row 전체 합격으로 주장하지 않는다.
- `batter-bridge/`: finish→low-front 구간을 별도로 생성한5컷. index0은 기존 finish와 중복되고 상단 여백도 없어 사용하지 않는다. index1~4만 연결한다. 남은 배트 회전 단절을 위해 `batter-uncoil/`의 별도1컷(등을 보이며 배트를 어깨 위로 넘김)을 추가 제작했다.
- 각 폴더의 `source.png`, `prompt.txt`, `sprite-request.json`, `manifest.json`, `atlas.png/webp`는 실제 생성 원본·요청·공식 추출 산출물이다. `gen-set`의 두 참조 외에 시작/끝/중간 자세를 전달하려고 기존 `gen` entry에 prepare의 prompt와 guide, 추가 motion references를 함께 전달했다. 추출·정렬 엔진을 대체하지 않았다.
- 원본 고해상도가 셀 cap에 맞춰 정규화됐다는 pitch/native-size 경고가 있었다. 사용하지 않는 bridge0은 edge-contact 경고도 있다. 형식 inspect를 자연스러운 움직임 판정으로 대체하지 않는다. 불합격 전체 후보·추출보고서는 작업의 외부 QA 폴더에도 보존한다.

## 런타임 정합

- 셀384×320. 실제 연결은 uncoil1 + bridge4 + recovery 부분4의 **새9개 그림**과 기존 swing/ready-tail 그림을 사용한다. 원본8컷·5컷 전체를 각각 재생하는 방식이 아니다.
- `registration.json`: 투명 PNG에서 관측한 helmet top과 화면 오른쪽 앞신발의 마지막6px sole 구간. 원본 ready의 앞신발(x271.5,y300), helmet(y62), cell baseline304를 기준으로 같은 몸 높이·앞발 접점을 등록한다. pose의 x/scale/baseline은 DOM과 Pixi가 같은 값을 쓴다. 이것은 이미지 픽셀 재도색이나 사지 트윈이 아니라 원본 셀의 공간 등록이다.
- 움직임 없는 원화의 alpha만으로 발의 실제 접촉을 입증하지 않는다. 실제 플레이 연속 캡처에서 상체·손·배트·앞발·준비 자세 끝 연결을 별도 확인한다.
- 타격 시각은 기존과 동일. 70ms 간격의 중간 그림을 넣으면서 복귀 끝이 impact+1040→1120ms가 됐다. 판정·확률·소비 규칙은 변경하지 않았다. 알파 크로스페이드·역재생을 쓰지 않는다.

## 구장

- `turf-source.png`, `clay-source.png`: GPT가 생성한 새 지면 재질 원본. 흙의 첫 사진형 후보는 불채택하고 도트 재질로 다시 생성했다. 프롬프트는 같은 폴더에 보존한다. WebP는 크기 변경 없이 포맷만 내보냈다.
- 마운드·타석·rubber는 재질에 굽지 않는다. `LandscapeField`가 기존 world camera로 투영하고 .254m plateau와 sloped radial faces를 만든다. 흙을 같은 표면에 clip해 사용한다.
- 광원은 world(-12,22,16)의 상부 좌측 조명 기준이다. 공통 SVG ground layer가 두 배우의 접촉 그림자와 방향성 cast를 그리며 wide의 기존 DOM/Pixi ellipse/drop-shadow는 껐다. 기존120프레임 투수의 움직이는 사지 전체를 추적한 물리 그림자는 아니고 고정 접점/접지 영역 기준이다.

실행 기록은 `docs/qa/landscape-refine-20261027/README.md`에 정리한다. 이 작업을 전체 로스터·실기기·상업적 완성도 검증으로 주장하지 않는다.
