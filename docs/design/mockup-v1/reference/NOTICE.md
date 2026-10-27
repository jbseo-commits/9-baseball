# 동봉 자료의 출처와 권리

이 폴더는 구현 계획의 참조 자료다. 별도 목업의 실행 앱·엔진 사본·폰트 파일은 동봉하지 않았다. 본편 구현은 저장소의 기존 엔진과 자체 호스팅 폰트를 재사용한다.

## 선정 원화

2026-10-27 image_gen으로 제작한 구장·인물·카드 그림이다. 현재 파일과 해시는 [PACKAGE-MANIFEST](../PACKAGE-MANIFEST.json), 생성 출처 식별자는 [art/manifest.json](art/manifest.json)에 있다.

- 구장: `art/stadium-wide.png`
- 우타자: `art/batter-catcher.png` — 정지 준비 자세 1포즈
- 투수: `art/pitcher-home.png` — 정지 자세 1포즈
- 카드: `art/cards.png` — 3×2 샘플 원화

인물 그림은 실존 인물의 사진이 아니다. 원화는 실제 투구·스윙 모션 또는 전체 로스터·151종 카드의 완성본을 뜻하지 않는다. 참조 JS/CSS와 캡처는 기존 목업의 구도와 UI를 설명하기 위한 자료다.

## 외부 참고 사진

`baseball/catcher-view-field.jpg`: Tdorante10, CC BY-SA 4.0.
`baseball/real-batter-box.jpg`: Counselman Collection, CC BY-SA 2.0.
출처 URL·라이선스·관찰 기록은 [baseball/README.md](baseball/README.md)에 있다. 변경하지 않은 공개 미리보기를 참조용으로 동봉했으며 런타임에서 사용하지 않는다.

본편 [LICENSE](LICENSE)의 독점 권리 문구는 이 외부 사진의 Creative Commons 라이선스를 대체하거나 제한하지 않는다. 각 사진은 원저작자와 해당 라이선스의 적용을 받는다.

MLB 규칙집의 원문과 도면 페이지는 이 패키지에 재배포하지 않는다. 공식 링크와 직접 작성한 원근 가이드로 참고한다. 가이드는 최종 원화의 모든 픽셀이 규격과 일치함을 보증하지 않는다.

## 폰트

목업 화면은 본편의 Noto Sans KR을 사용했다. Noto Sans KR 등 본편 폰트의 원래 라이선스를 유지한다. 이 참조 폴더에는 폰트 바이너리를 추가하지 않았다.
