# 엘리트·보스 투수 매력 강화 시안 v1

포수캠·심판캠 기준의 정면 가독성과 성인 여성 투수의 매력을 함께 검토하는 **투명 키포즈 후보**다. 일반 투수 타이드 베스퍼의 새 시안은 이 묶음에 포함하지 않는다. 현행 게임 이미지와 애니메이션은 교체하지 않았다.

| 캐릭터 | 파일 | 동작 | 상태 |
| --- | --- | --- | --- |
| 엘리트 코발트 임팩트 | `elite-01-cobalt-impact-power-set.png` | 정면 3/4 파워 세트, 오른손 공·왼손 글러브 | 후보 원화, 런타임 미연결 |
| 1막 보스 에메랄드 타이런트 | `boss-01-emerald-tyrant-power-set.png` | 정면 3/4 파워 세트, 오른손 공·왼손 글러브 | 후보 원화, 런타임 미연결 |

## 제작 기준

내장 `image_gen`으로 기존 캐릭터 원본을 참조해 새 포즈를 제작했다. 코발트의 짙은 피부·푸른 땋은 머리·파란 장비와 에메랄드의 녹색 모자·검은 녹빛 포니테일·금색 장식을 고정했다. 기존 긴 바지 세트 포즈보다 크롭 저지, 야구 쇼츠, 긴 운동 양말, 곡선이 읽히는 체중 이동, 자신감 있는 표정을 강조했다. 게임의 성인 캐릭터로만 표현한다.

프롬프트 핵심: `adult female elite/boss baseball pitcher; preserve original face, hair, skin, team palette and glove; bold glamorous fitted crop jersey and baseball shorts; front-facing three-quarter catcher-camera view; confident playful expression; exactly one ball in the right hand and left glove; grounded athletic pose; full-body transparent premium anime pixel-art sprite; no scenery, no extra limbs`.

## 다음 품질 관문

- 실제 알파, 네 방향 여백, 얼굴·공·글러브·발가락이 잘리지 않는지 검사한다.
- 현재 실게임 크기에서 100px 얼굴과 투구 준비 실루엣을 확인한다.
- 세트 포즈만으로는 투구 동작이 완성되지 않는다. `leg-lift → foot-plant → arm-whip → release → follow-through` 키포즈와 일관된 손·발·의상 연결이 필요하다.
- 기존 엘리트·보스 SD 아틀라스에 바로 섞지 않는다. 포즈·복장이 일치하는 애니메이션 시트와 실제 재생 QA 후에만 교체한다.
- 나머지 엘리트·보스 네 명은 각자의 얼굴·의상·실루엣을 유지한 채 별도 제작한다. 동일 포즈를 팔레트만 바꿔 복제하지 않는다.

방법과 영향도 분석은 [`docs/art/UMPIRE_CATCHER_CAMERA_PITCHER_METHOD.md`](../../../docs/art/UMPIRE_CATCHER_CAMERA_PITCHER_METHOD.md)를 따른다.
