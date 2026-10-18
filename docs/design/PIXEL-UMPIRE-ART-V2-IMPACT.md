# Pixel Umpire art v2 변경 영향도 분석

## 범위와 기준

렌더러는 384px 네이티브 버퍼와 atlas별 셀 메타데이터를 지원한다. 현재 v2 runtime은 `assets/production-art/pixel-umpire-v2/runtime/`에 보존한다. 새 타자 원화가 승인되면 별도 v3 runtime manifest/atlas로 전환하고 v2 원본을 덮어쓰지 않는다. 기본 로스터의 120프레임 pitcher atlas와 그 정체성은 기존 경로로 유지한다. 카드, 9존 입력, 전투 엔진, 저장 형식과 전역 화면 레이아웃은 변경하지 않는다.

필드의 기준은 home plate 원점, lateral 축, plate-to-rubber 깊이 축이다. 60ft 6in(18.44m) rubber 간격을 유지하며, 단일 perspective camera가 plate polygon, rubber, mound, batter box, 선수 발·몸 크기, contact shadow와 stadium field line을 투영한다. viewport별 camera fit은 plate 기준을 보존하고 rubber를 scene 높이 44%에 맞춘다. 짧은 scene은 기준 높이 477px에서 계산한 travel 비율로 전체 필드와 공을 함께 축소한다. tactical 9존은 실제 DOM 좌표에 계속 맞추고, scene 높이가 기준보다 낮을 때만 기존 크기로 오른쪽 12px·아래 24px gutter에 옮겨 선수 시야를 연다. 기준 390×844 scene에서는 zone 위치를 바꾸지 않는다. 타자는 authored ready 몸 높이와 runtime manifest의 world rear-foot 위치에 고정하고 균일 배율을 구한다. 오른손 타자 박스의 inner edge는 홈플레이트 옆면에서 6in 떨어진 곳에 둔다. MLB 도해상 plate half-width는 17/24ft, 박스 폭 half는 2ft이므로 box center는 lateral −(17/24 + 0.5 + 2)=−3.2083ft이다. 4×6ft batter box는 아트 발 벡터·bbox와 무관한 고정 world footprint이며, 모든 활성 포즈의 발 접점이 그 안에 드는지 검사한다. 투수 크기는 rubber depth에서 같은 camera로 투영된 6.2ft 몸 높이로 계산한다. v2 runtime 파일은 그대로 보존하고 v3 atlas는 별도 경로로 연결한다. 384×N 내부 버퍼에서 공 외곽선은 기준 장면에서 기존 240×N 렌더와 같은 CSS 크기로, 짧은 장면에서는 같은 field zoom 비율로 함께 축소한다. 따라서 5px 외곽선은 기준 장면 내부 버퍼에서 8px로 그린다.

기존 v2 타자 atlas는 `atlases.batter.poseOrder: "v2"`로 swing[2] 접촉, swing[3] extension, follow[0] rising barrel, follow[1] over-left-shoulder 순서를 보존한다. 새 atlas는 임의 길이의 impact 상대 `timelines` keyframes를 선택적으로 제공할 수 있다. `contactOnly` 프레임은 실제 contact 결과에서만 보인다. impact에서 시각 clock은 50ms만 접촉에 머문 뒤 타자와 공을 함께 진행시키며, parent가 impact stage를 확인하기 전에는 접촉/아웃고잉 공을 노출하지 않는다. 다음 playToken이 와도 이전 authored recovery track을 impact+1340ms까지 보존하고 짧은 번트 회수는 ready 포즈로 유지한 뒤 새 prep timeline에 연결한다. 엔진 판정, 결과/입력 시점, 저장값은 parent가 계속 소유한다. metadata가 없는 기존 v1/v2 atlas는 기존 재생 순서를 사용한다.

## 9축 영향

| 축 | 판단 | 예상 영향과 대응 |
| --- | --- | --- |
| UI / 레이아웃 | 영향 있음 | 내부 캔버스 폭 384와 CSS 박스·카드·9존 크기·HUD 위치는 유지한다. 짧은 scene에서만 9존 overlay의 위치를 오른쪽 12px·아래 24px로 옮긴다. 필드 표시만 단일 카메라로 재투영한다. batter box 선을 2px chalk로 가독성 보강한다. 9존은 physical plate/mound 좌표로 사용하지 않는 tactical overlay다. 공 외곽선은 scene zoom과 함께 축소한다. |
| 입력 / 제스처 | 영향 없음 | 새 hit target, 포인터 처리, 탭·드래그는 추가하지 않는다. 9존 좌표는 기존 DOM 레이아웃의 측정값을 계속 사용한다. |
| 게임 로직 / 밸런스 | 영향 없음 | 투구, 실제 존, 판정, 피해, 카드 소비, 아웃 및 타이밍 계약을 건드리지 않는다. 시각 투사만 기존 엔진 결과를 읽는다. |
| 저장 / 불러오기 | 영향 없음 | 저장 스키마와 런 상태를 변경하지 않는다. 현재 artId와 atlas 선택 계약을 유지한다. |
| 모바일 뷰포트 | 영향 있음 | 반응형 CSS 박스는 유지한다. camera fit은 plate y를 기존 anchor에 두고 rubber y를 0.44×scene height에 둔다. 짧은 scene에서 view width를 넓혀 pitcher·batter·box·공을 같은 비율로 축소한다. 390×844, 360×640, 405×720 PC frame에서 active sole, body bounds, overlay 간격을 확인한다. Stadium field line은 manifest의 world depth를 같은 camera로 투영해 이미지 crop에서 clamp한다. |
| 스크롤 / 오버플로 | 영향 없음 | 전역 높이·overflow·스크롤 컨테이너를 바꾸지 않는다. 장면 캔버스의 기존 클리핑 경계 안에서 그린다. |
| 기존 사용자 플로우 | 영향 없음 | 타이틀부터 보상·다음 경로까지 전환 흐름은 그대로 둔다. 첫 전투와 일반/레드 러시 투수 분기를 회귀 확인한다. |
| 테스트 / 회귀 | 영향 있음 | 240 고정값 단언은 기준 폭·배율에서 파생한다. 384 버퍼, CSS 크기 환산, atlas별 셀 우선/전역 셀 폴백, 18.44m camera axis, 4×6ft 고정 box, portrait/landscape fit, 전체 활성 pose 발 접점, optional variable timelines와 기존 timeline fallback을 검증한다. |
| 빌드 / 배포 | 영향 있음 | Pages preview assembly 및 기존 v5/v6/v1 preservation routing은 유지한다. v3 runtime art는 같은 branch preview에서만 사용하고 runtime PNG·manifest import/파일 용량을 확인한다. base path와 공개 preview route는 변경하지 않는다. |

## 기존 화면과 대응

- 세로 모바일 전투: 장면 CSS 박스와 기준 높이의 9존 DOM을 유지한다. 기준 캔버스에서 plate=(211,456), rubber=(211,210)이며 9존 UI 중심은 약238px이다. 짧은 PC/phone frame은 9존을 오른쪽 12px·아래 24px로 옮기고 필드 zoom은 scene travel에 맞춰 줄인다. 실제 v3 art의 모든 활성 발선이 box 안에, body bounds가 canvas 안에 있는지 확인한다.
- 저높이 가로 전투: 공통 월드 단위와 발 핀을 유지해 몸이 캔버스 위·아래로 잘리지 않는지 확인한다.
- 기본 로스터 투수와 Red Rush: atlas별 cell 메타데이터가 있으면 이를 우선하고, 없으면 현재 manifest 공용 cell을 사용한다. 기존 로스터 120프레임 atlas는 별도 셀 좌표 계약을 유지한다.
- 카드 선택·9존 조작·결과 화면: DOM 입력 계층과 z-index는 변경하지 않고 직접 관련된 회귀 테스트를 실행한다.

## 연결과 에셋 근거

v2 runtime asset provenance는 기존 [manifest](../../assets/production-art/pixel-umpire-v2/runtime/manifest.json)에 남긴다. 이 작업은 그 파일이나 원화 PNG를 수정하지 않는다. V3 runtime manifest는 별도 camera calibration, field-line depth, batter world placement와 optional pose tracks를 기록한다. V3 normal contact barrel anchor는 source pixel (191,78), bunt contact는 (197,82)다. 최종3규격에서60개 접촉 중심은 실제 목재에 닿는다. 사전 목재 겹침은390×844에서0, 짧은PC2,360×640에서12건이며 작은화면 한 사례는 흰 중심3native px도 공유한다. 상세 범위와 한계는 [V3 진단](pixel-umpire-v3/motion-qa/README.md)을 따른다. normal precontact frame7(-40ms)은 유지하며 결과별 투구 궤도를 비틀지 않았다. 이 변경은 renderer/presentation와 관련 tests에 한정된다. 엔진, save, 9-zone event handling과 Pages workflow는 수정하지 않는다. 승인된 branch preview와 draft PR에서만 검증하며 main 병합/게시 권한은 포함하지 않는다.

최종 검증: 전체174파일1067테스트 통과, 네 smoke 종료코드0, production build 통과, dist59.0MB/60MB. 실제390×844 타격/헛스윙과360×640 번트/지켜보기 및PC1280×720의405×720 내부화면을 확인했다. 공개 배포 후 확인은 PR/최종 안내에 기록한다. DEV-only 번트 fixture는 테스트 손패만 메모리상 변경하고 기존 저장값을 보존한다. [V3 기록](pixel-umpire-v3/README.md) 참조.
