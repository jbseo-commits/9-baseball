# 카드 → 커버 장착의 연속성과 타격 VFX 개선

2026-10-29 사용자 요청: 블록이 되어 꽂히는 자연스러움/쾌감과 전체 이펙트 부족 개선. 구현 전 분석이며, 기존 목업 구도와 엔진/저장은 유지한다.

| 영향 축 | 판정 | 대응 |
| --- | --- | --- |
| UI/레이아웃 | 영향 있음 | 실제 카드 rect/각도/그림에서 실제 coverage 동형 그룹으로 변형. 그룹 단위 이동 후 국소 압축·테두리 결합·짧은 충격파. 전체 HUD를 흔들거나 가리지 않는다. |
| 입력/제스처 | 영향 있음 | 실제 탭/드래그/스크롤 유지. tap은 배치 직전 live rect 재측정, drag는 release 좌표 유지. 장착 중 실행 가능, 스윙 시 즉시 취소. |
| 로직/밸런스 | 영향 없음 | model.zones.pieces 공개 coverage만 사용. 모서리 잘림/지원 개별 aim 보존. 배치로 카드/에너지 소모하거나 자동투구하지 않음. |
| 저장/불러오기 | 영향 없음 | 신규 저장 필드 없음. 효과음 상태는 기존 sound prop을 전달, fixture는 생산 저장 접근 없음. |
| 모바일 뷰포트 | 영향 있음 | measured local px와 실제 셀 크기. 작은 가로에서도 카드·존·실행을 가리지 않음. rotation/resize 취소. |
| 스크롤/오버플로 | 영향 있음 | 효과는 현재 전투 root만 pointer-events:none. 전역overflow 변경 없음. 손패 scroll 위치의 낡은 source 방지. |
| 기존 플로우 | 확인 필요 | 본편 기본/vnext fallback의 준비·투구·다음 공·Inspector·save/resume와 경로/보상/시설 확인. preview sound 제어는 clean에서도 접근 가능하게 전달. |
| 테스트/회귀 | 영향 있음 | coverage topology/공유 transform/타임라인·빠른 실행/취소·소리 mute/숨김/재선택·reduced-motion·실제 터치6크기/오디오 캡처. |
| 빌드/배포 | 영향 있음 | 추가 대형 래스터 없이 실제 좌표의 벡터/DOM VFX. 60MiB 예산/Pages 경로/실제 공개 프리뷰 확인. |

## 연출 계약

- 실제 카드 → 같은 원화/비용/이름의 복제 → 실제 커버 형상으로 연결한다. 카드/블록의 시작과 끝이 동시에 겹치는 변형 구간을 둔다.
- 이동 중 상대 셀 위치는 하나의 부모 transform 아래 고정한다. 도착 뒤에만 작은 셀별 lock stagger. 지상 그림자·타깃 소켓·외곽선 결합으로 무게감을 준다.
- 한 placement timeline이 CSS와 취소 가능한 Web Audio의 lift / lock을 구동한다. 진짜 배트 타격 crack과 구분하고 셀 수에 비례해 음량을 쌓지 않는다.
- 재선택·해제·스윙·resize·rotation·menu·document hidden·unmount에서 이전 그림과 예약 오디오를 취소한다. mute는 즉시 끈다. reduced-motion은 정지 outline, 소리는 짧은 단일 lock.
- 실제 타격은 기존 host clock/확정 결과/접촉 좌표를 유지하고 배트 궤적·접촉 섬광·국소 속도선·공 잔상을 강화한다. 실패에는 접촉광/성공 소리를 만들지 않는다. 과한 전체 화면 flash나 새 engine 지연 없음.
- 원본 배우/카드와 목업 구도는 유지한다. 상업적 완성/재미를 테스트 수나 화려함으로 판정하지 않는다.

접촉광은 결과 명암 레이어 위의 별도 light pass로 그린다. 배우와 같은 projection matrix와 같은 국소 camera jitter를 재사용하며 별도 카메라 계산/위치 보정은 하지 않는다. 결과 명암에 의해 접촉광까지 흐려지는 문제를 막는다.
