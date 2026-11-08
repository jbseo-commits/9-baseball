# 동작 연속성 후보 — HELD / DRAFT

기준 main373d770. 기존2dimg2motion스킬의전신작화방식으로타자9→10사이에2그림을동일batch image_gen으로제작. 공통scale.8/translation(-22,53),캐릭터전체원형/그립보존,사지warp없음. 원본14키와기존swingbridge1장은그대로이며총17고유타자그림후보.120독립작화로쓰지않는다.

연결은원래early-follow일부와최대다음hold의절반을사용하며contact8/freeze·공·host완료·engine/save불변.준비/watch/reduced/ready에는사용하지않는다.

첫barestrip은읽힘·동작·연속성3축개선이나NOT_IMPROVED. 후속검수에서준비자세의고정앞발shadow가stride후에도남는문제를원화sole측정으로고정:pose별앞/뒤sole에배우동일worldtransform의shadow등록,load2들린발은지면y687에투영해흐리게처리.이미심어진발에새착지dust를추가하지않았다.

둘째freshblind는동일strip+실제BattleView고정clock2장면총3시트:합산+.25이나개선축3/8이므로다시NOT_IMPROVED.첫실패를숨기지않고함께보존한다.그림·기능이좋아졌다는근거와저장소Ready게이트를구분해전체변경을DRAFT로보존하고main에넣지않는다.

최종전체238파일1621검사PASS,독립직접13검사PASS,build/dist59.6/60MiB. 접지보강후실제0.5×엔진행동trace에서follow1/2각7RAF관찰/로딩/HP/원본투수모든drawings/ready0PASS. 접지전두연결작화단계에서는정상1×7pitchKO→reward→resume/event와2×2/3cardengineequal도확인했다.후자의플로우를접지후검증으로바꾸어기록하지않는다. 고정clockScene비교는시각fixture이며정상플레이가아니다.

남은한계:상체/하체체중연결·그립판독·구장내접지효과가상업품질목표에미달.후속은실제구장영상에서이문제가사라지는작화/구도통합패스다.
