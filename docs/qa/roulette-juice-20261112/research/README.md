# 룰렛 회전 → 잠금 레퍼런스 조사

조회: 2026-11-11 UTC / 2026-11-12 KST. 일곱 게임의 공식 Steam appdetails를 실시간 조회하고 각 공식 첫 스크린샷을 내려받아 확인했다. 기존 캐시 영상은 Balatro와 Vampire Survivors에 한해 구분 표기했다. 신규 공식 트레일러는 Luck be a Landlord(100.104초), Balatro(38.667초), Vampire Survivors(60초)를 확인하고 그중 짧은 무음 발췌를 저장해 연속 프레임을 살폈다. 소리는 듣지 않았다. 실제 관찰, 한계, 제안은 `references.json`에 별도 필드로 기록했다.

| 게임·공식 출처 | 직접 관찰한 근거 | 9존 적용 제안 | 한계 |
|---|---|---|---|
| [Luck be a Landlord](https://store.steampowered.com/app/1404850/) | 공식 트레일러 18–23초 발췌: 심볼 추가 패널 → 5열 보드와 SPIN 버튼 → 바뀐 고정 보드 컷 → 심볼 위 동전표시/카운터 | 회전 단계와 결과 공개를 짧고 분명하게 구분 | 편집 컷이 있어 연속 릴 회전·정지·속도·정지 순서를 입증하지 못함 |
| [Balatro](https://store.steampowered.com/app/2379780/) | 공식 트레일러 4–10초 발췌: 같은 5장 패와 Straight 표기가 남은 동안 점수 배율 표시가 변하고 Balanced 결과 라벨이 보임 | 선택 모양을 유지한 채 실제 결과 라벨과 점수를 안정적으로 표시 | 홍보 컷 전환이 섞여 있어 프레임 단위 정확한 타이밍/연속 입력 인과는 미확인. 룰렛 게임 아님 |
| [Dicey Dungeons](https://store.steampowered.com/app/861540/) | 공식 첫 스크린샷의 주사위와 행동 카드, 공식 설명의 불확실한 주사위 결과와 전략 선택 | 결과 전 선택과 결과 후 상태를 서로 다르게 읽히게 함 | 스틸/설명만 확인; 굴림 동작·정지 타이밍 미확인 |
| [Peggle Deluxe](https://store.steampowered.com/app/3480/) | 공식 첫 스크린샷의 공/페그 배치와 점수 호출, 공식 설명의 조준·발사·주황 페그 제거 | 결과 직전 짧은 기대와 실제 적중 위치에 붙는 작은 피드백 | 공의 연속 궤적·마지막 페그 타이밍은 스틸로 입증되지 않음 |
| [Vampire Survivors](https://store.steampowered.com/app/1794680/) | 공식 트레일러 시작 3초 발췌: 캐릭터는 거의 고정되고 투사체/효과가 주변을 이동 | 보드 전체를 덮는 효과 대신 마커와 정지 신호를 두드러지게 유지 | 상자·룰렛 공개 근거 아님. 해당 시퀀스는 전투 효과만 보여줌 |
| [Tetris Effect: Connected](https://store.steampowered.com/app/1003590/) | 공식 페이지 설명이 플레이에 맞춘 음악·배경·효과 동기화를 말하고, 첫 스크린샷은 중앙 플레이필드를 보여줌 | 실제 잠금 순간에만 짧은 시각 펄스를 결합하는 방향 | 오디오 미청취, 잠금 시점·효과 길이 측정 안 함 |
| [Hades](https://store.steampowered.com/app/1145360/) | 공식 첫 스크린샷에 비교적 정돈된 전투장 위 국소적인 밝은 타격 효과 | 접점 강조만 보조 참고로 사용 | 룰렛/잠금과 직접 관련 없는 인접 시각 참고 |

**영상 근거 범위:** 실제 짧은 발췌는 3개(Balatro, Luck be a Landlord, Vampire Survivors)다. 이미지 자료와 공식 소개만 확인한 나머지 4개를 영상 관찰로 표현하지 않는다. Luck의 짧은 스토어 내장 루프는 심볼 배경 위 타이틀 프로모션이며 게임플레이 회전을 보여주지 않는다. Mario Kart 8 Deluxe 공식 스토어 페이지 응답은 확인했으나 룰렛 플레이 시퀀스를 보거나 검증하지 않아 게임별 주장을 추가하지 않았다.

Contact sheet와 짧은 영상 발췌는 이 디렉터리에 있다. 기존 영상 프레임 캐시는 `/workspace/9zone-juice100-implementation/docs/research/game-juice-100/video-evidence.json`에 보존돼 있다.
