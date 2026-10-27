# 가로 전투 결과 공개·복귀·접지 검증

기준 `7c8f85f`, 2026-10-27. PR #62의 compare 가로 프리뷰 갱신이며 main 병합이 아니다. 구현 전 [9축 영향도](../../design/LANDSCAPE-RECOVERY-LIGHT-20261027.md), [신규 자산 제작·선별 기록](../../../assets/landscape-ballpark-v4/README.md)을 함께 본다.

## 수정과 실제 확인

| 항목 | 결과와 근거 |
|---|---|
| 착탄 전 버튼 | hit/between·miss/pitch·KO/won 모두 같은 `투구 중` text/ARIA/class/disabled. KO 분기 fallback 결함도 실패하는 테스트로 재현 후 수정했다. 실제 HP1 fixture의 [버튼 관측](ko-pending.json)과 [568 화면](ko-pending-568.png). 정상 HP·카운트·결과 공개 시점은 유지 |
| 작은 결과 문구 | 중복 경로·결과명 제거, 조준판 아래 한 곳에 경로와 원인을 표시. 전체 설명은 ARIA에 유지. 내부568×288에서 안타2행 y192~218, 실행 y239(21px 간격). 삼진은 y192~205. [실측](strikeout-rects.json), [삼진](strikeout-568.png) |
| 전체 손패 | 568×320 host의 비교 바32px를 제외한568×288에서도 실제6장+기본1장의 그림·이름·코스트·9존·실행이 보인다. 손패 client/scroll400×107 동일. [최대 손패](max-hand-568.png). 번트2S 조건·준비 뽑기0·유지 효과도 별도 확인 |
| 복귀 | 새9개 연결 그림과 기존 tail을 사용. 앞신발/헬멧 기준 pose별 scale/x/baseline을 DOM/Pixi에 동일 적용. 실제 적중 HP60→48의 [연속 관측](registered-log.json), DOM 미스48→46의 [pose 관측](dom-miss-log.json)에서20개 이름과 최종 ready를 확인. 캡처 도구의 표본이며 native60fps 녹화로 주장하지 않는다 |
| 지면·마운드·빛 | 새 도트 잔디/흙 원본, world 좌표의 .254m 정상·16경사면·rubber, 두 배우의 공통 접지/방향성 그림자. wide의 기존 중복 DOM/Pixi 그림자는 제거. [844 선택 화면](selected-844.png) |
| 세로·PC·A/B·resume | 기존320×568 [세로](portrait-320.png)는 V15 원화와 기존 배치 유지, client/scroll 동일. [PC1440×900](pc-1440.png)의 내부1440×868도 client/scroll 동일. [A/B](same-battle-ab.json)는 선택·지원 대기·조준6·HP46 보존. [이어하기](resume.json)는 HP/아웃/에너지/손패 동일 |
| 기존 흐름 | 실제 로컬 KO→보상→그냥 간다→지도→다음 Teal 전투 진행. 별도 로컬 훈련장 fixture에서 타이밍 맞추기 강화→지도 복귀. 지도 HTML scrollTop260/client640/scroll900으로 스크롤 가능. fixture는 자연 런·밸런스 검증이 아니다 |

`fixtures.html`은 localhost에서만 동작하고 해당 origin의 테스트 저장을 교체한다. 공개 프리뷰는 기존 `battlePreview=1`의 저장 없는 전투를 사용한다. 실기기 터치·주소창·safe area·롱프레스 전체 조합은 미검증이다. 회전 검증은 데스크톱 viewport 변경과 A/B이며 실제 휴대폰 회전 검증은 아니다.

마지막 PC 캡처에서 cast 사각형의 모서리가 검은 판처럼 보이는 문제를 추가 보완했다. 같은 world 접점·광원·영역을 유지하고48점 타원과 방사 감쇠로 바꿨다. 최종844·1440 캡처는 보정 이후이며, 전체1,272테스트와 build도 그 뒤 재실행한 로그다. 독립 reviewer가 이 추가 변경의 격리 범위도 다시 확인했다.

## 명령 결과

- 전체 **200파일 / 1,272테스트** 통과, exit0: [최종 로그](tests-final.txt).
- 독립 reviewer가 관련4파일34테스트 재실행하여 전부 통과. 버튼 공개 경계·DOM 대체·등록값을 읽기 전용 검토했고 새 기능 차단 결함은 발견하지 못했다.
- smoke zone10 / v9 30 / growth2 / deck1 전부 exit0: [zone](zones.txt), [v9](v9.txt), [growth](growth.txt), [deck](deck.txt).
- production build 성공. dist **59.5MB / 60MB**, WebP45.8·font5.2·PNG5.0·JS1.7·CSS1.3MB. [빌드](build-final.txt). 번들 크기 경고는 남아 있다.
- `git diff --check` 통과. 엔진·RNG·저장 스키마·카드 원화 수정 없음.

## 남은 한계

마지막 shoulder→ready에서 손·상체의 한 컷 이동은 아직 보인다. 이를 위한 추가 regrip 후보는 ready와 너무 비슷해 반입하지 않았다. 전체8컷/숫자각도 후보가 자연스럽다는 판정을 내린 것도 아니다. 실제 채택9컷과 불채택은 자산 README에 구분했다.

작은 화면에서 마운드의 돔은 약하게 읽힌다. .254m 투영·경사는 구현했지만 실제 야구장 같은 공간감을 완전히 달성했다고 평가하지 않는다. 그림자는 고정 접점의 footprint/cast이며120프레임 사지 전체의 동적 물리 그림자가 아니다. 이 프리뷰를 딤래스·홀스틴급 완성도나 상업적 재미의 입증으로 사용하지 않는다.

## 게시 후 확인

정확한 게시 커밋·CI run과 공개 주소에서의 플레이 결과는 [PR #62](https://github.com/jbseo-commits/9-baseball/pull/62) 본문의 게시 후 확인에 기록한다. 위 로컬 검증과 공개 배포 검증을 구분한다.
