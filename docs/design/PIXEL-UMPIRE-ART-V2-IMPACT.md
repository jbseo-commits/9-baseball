# Pixel Umpire art v2 변경 영향도 분석

## 범위와 기준

렌더러는 384px 네이티브 버퍼와 atlas별 셀 메타데이터를 지원한다. 타자, Red Rush 투수와 구장 v2 runtime PNG는 `assets/production-art/pixel-umpire-v2/runtime/`에 둔다. v2 manifest는 기존 v1 공용 셀(128 logical / 256 storage)의 scale 2와 별개로 새 batter/redRush atlas 셀(256 logical / 256 storage, scale 1)을 선언한다. 기본 로스터의 120프레임 pitcher atlas와 그 정체성은 기존 경로로 유지한다. 카드, 9존 입력, 전투 엔진, 저장 형식과 전역 화면 레이아웃은 변경하지 않는다.

타자 크기는 ready 포즈의 단일 기준 몸 높이로 계산하고, 실제 ready rear-foot anchor를 고정해 포즈마다 몸이 커졌다 작아지지 않게 한다. v2 chalk box는 같은 ready 포즈에 기록된 rear/front foot 두 점을 따라 만든 뒤 plate와 canvas 경계 안으로 평행 이동한다. 프레임별 몸 전체 bounding box를 기준으로 재조정하지 않는다. 개별 프레임은 명시적 anatomy scale이 있을 때만 예외로 둔다. 투수 패킷은 지원발 anchor만 제공하므로 v2 Red Rush 바닥 그림자도 그 authored support point를 기준으로 한다. 384×N 내부 버퍼에서 공의 외곽선과 크기는 기존 240×N 렌더 결과와 같은 CSS 크기로 보정한다. 따라서 기존 CSS 크기의 native 배율 환산값은 `384 / 240 = 1.6`이며, 예를 들어 5px 외곽선은 내부 버퍼에서 8px로 그린다.

v2 타자 atlas는 `atlases.batter.poseOrder: "v2"`를 명시해 swing[2] 접촉, swing[3] extension, follow[0] rising barrel, follow[1] over-left-shoulder, follow[2] balanced finish 순서를 사용한다. 필드가 없는 기존 v1 manifest는 기존 재생 순서를 유지한다. 두 구간의 길이는 기존 시간 계약을 유지한다.

## 9축 영향

| 축 | 판단 | 예상 영향과 대응 |
| --- | --- | --- |
| UI / 레이아웃 | 영향 있음 | 내부 캔버스 폭을 240에서 384로 올려 디테일을 늘린다. CSS 박스·카드·9존·HUD의 크기와 위치는 유지한다. 공과 픽셀 외곽선의 내부 픽셀 크기는 1.6배 환산해 기존 CSS 크기를 유지한다. 새 구장은 field-line 높이를 pitcher 발 위치에 맞춰 수평선을 배치하고 v1처럼 metadata가 없으면 중앙 cover를 유지한다. |
| 입력 / 제스처 | 영향 없음 | 새 hit target, 포인터 처리, 탭·드래그는 추가하지 않는다. 9존 좌표는 기존 DOM 레이아웃의 측정값을 계속 사용한다. |
| 게임 로직 / 밸런스 | 영향 없음 | 투구, 실제 존, 판정, 피해, 카드 소비, 아웃 및 타이밍 계약을 건드리지 않는다. 시각 투사만 기존 엔진 결과를 읽는다. |
| 저장 / 불러오기 | 영향 없음 | 저장 스키마와 런 상태를 변경하지 않는다. 현재 artId와 atlas 선택 계약을 유지한다. |
| 모바일 뷰포트 | 영향 있음 | 내부 픽셀 수만 증가하며 반응형 CSS 박스는 유지한다. 390×844, 568×320 가로 저높이, 데스크톱에서 발·머리·구장 및 HUD와의 간격을 확인한다. field line의 목표는 pitcher 지면 anchor보다 `12u` 위이며 이미지 crop 범위에서 벗어나면 위/아래 경계로 제한한다. |
| 스크롤 / 오버플로 | 영향 없음 | 전역 높이·overflow·스크롤 컨테이너를 바꾸지 않는다. 장면 캔버스의 기존 클리핑 경계 안에서 그린다. |
| 기존 사용자 플로우 | 영향 없음 | 타이틀부터 보상·다음 경로까지 전환 흐름은 그대로 둔다. 첫 전투와 일반/레드 러시 투수 분기를 회귀 확인한다. |
| 테스트 / 회귀 | 영향 있음 | 240 고정값 단언은 제거하지 않고 기준 폭·배율로 파생시킨다. 384 버퍼, CSS 크기 환산, atlas별 셀 우선/전역 셀 폴백, 발 고정과 ready 기준 몸 높이를 테스트한다. |
| 빌드 / 배포 | 영향 있음 | Pages 프리뷰 조립은 main production root와 branch preview 흐름을 유지한다. 기존 v5/v6 프리뷰에 더해 pinned v1 ref `eb22ab6d15cedf08e0c7a717fbb8f47d1883f7bd`를 별도 checkout·frozen install·preview-base build해 `previews/codex-pixel-umpire-original`에 보존 복사한다. 이후 현재 branch preview가 같은 경로를 갱신하게 두어 공개 링크를 유지한다. v2 에셋을 받을 때 manifest 호환과 파일 용량은 별도 확인한다. |

## 기존 화면과 대응

- 세로 모바일 전투: 장면 CSS 박스와 9존 DOM을 유지하고 공·배트·선수의 렌더 좌표가 기존 박스 안에 남는지 확인한다.
- 저높이 가로 전투: 공통 월드 단위와 발 핀을 유지해 몸이 캔버스 위·아래로 잘리지 않는지 확인한다.
- 기본 로스터 투수와 Red Rush: atlas별 cell 메타데이터가 있으면 이를 우선하고, 없으면 현재 manifest 공용 cell을 사용한다. 기존 로스터 120프레임 atlas는 별도 셀 좌표 계약을 유지한다.
- 카드 선택·9존 조작·결과 화면: DOM 입력 계층과 z-index는 변경하지 않고 직접 관련된 회귀 테스트를 실행한다.

## 연결과 에셋 근거

v2 import 전환은 art layer 안에서만 이뤄진다. batter manifest의 authored frame anchors, Red Rush `qa/feet-anchors.json`의 실제 support-foot 좌표, drive[2]의 opaque release fingertip `[69,72]`, stadium의 `fieldLineY:229`를 별도 v2 manifest에 정리했다. 새 mound prop의 rubber anchor는 `[95,21]`(opaque alpha 255)이며 48u 표시 폭으로 투수 발 아래에 고정한다. 이 prop이 로드되면 기존 세 톤 타원/임시 rubber는 그리지 않고, 누락 시 기존 primitive fallback을 사용한다. source art packet은 작업 artifact `pixel-original-v2-art`에 보존돼 있으며 runtime files의 SHA-256은 다음과 같다: batter atlas `CBBF44F36EC63FB1C9DE070C890FFF8D42EE536A703A82F2FD6F2560EC699D32`, Red Rush atlas `479621FC6097583C05B48EA1FF6343083B4CFE4EF238662C7AD6A8241B62B9D3`, stadium `6AB69E9B4091ED90EE61B4A54EB84E6DFA9C31620B6DC60F19ADEEA91EF931F3`, mound `2D9F2E07F0345E164EE041D822B39242990C98B34D8A8AE29ECAD884A147F7FA`. 규칙과 저장 형식은 변경하지 않는다. 승인된 브랜치 프리뷰와 draft PR로 게시하며 main 병합은 하지 않는다. 실제 캡처·전체 검증과 남은 사람 검수는 pixel-umpire-v2/README.md에 기록한다.
