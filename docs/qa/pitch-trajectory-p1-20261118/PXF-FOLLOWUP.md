# PXF 실제 PNG 적용 — PR #123 후속

사용자가 제공한 실제 Foundry Hit spark PNG를 기존4조각 표식 대신 사용한다. **실전 연결·9존·아트 승인 범위는 확대하지 않는다.** main 병합·배포 없음.

## 반입과 권리 범위

- [PNG](../../../assets/production-art/pxf-hit-spark/hit-spark.png), [원문 라이선스](../../../assets/production-art/pxf-hit-spark/FOUNDRY-LICENSE.txt), [원본 URL·상세 출처](../../../assets/production-art/pxf-hit-spark/README.md).
- 원본: https://suile-21173.web.app/pxf/library/sheets/hero-foundry-impacts-hit-spark-strict-cdcb250098457459.png
- SHA256 `41798938d05224cc3af7c104e009fa5e51467b66cad9580e380121131cee4015`,1927bytes. 제공된 값과 **정확히 일치**.
- 이 환경 직접 다운로드는403이었다. 사용자가 전달한 원본 base64 바이트를 복원해 해시·PNG chunk CRC·Pillow 디코드·실제 픽셀로 검증했다. 복사 과정의 오기는 기대 SHA에 정확히 일치하는 원본으로 교정했으며 이미지를 새로 만들거나 픽셀을 변경하지 않았다.
-288×288 RGBA,96px 셀,3×3행 우선.0-based frame1이 밝은 코어, 이후 금색 링. frame7은 투명 종료 프레임, frame8은 미사용 패딩. 제공된8프레임 그대로 사용한다.
- 제공된 FOUNDRY-LICENSE의 CC0 범위에 해당하는 sprite PNG만 runtime import. 그래프/효과 프로그램 소스·툴킷·소프트웨어는 반입하지 않았다. 라이선스 전문과 원본·라이선스 URL을 함께 보존한다.

## 적용

`PitchContactSpark.jsx`가 기존 동일 elapsed의 impact 상대 age로200ms/8프레임(25ms 간격)을 계산한다. 타이머·CSS animation·추가 RAF 없음. 접촉 이전,200ms 이후, 지켜보기/헛스윙,off,reduced-motion은 null.

안타/파울의 동일 등록 접점에80 world px 셀, normal blend,50% opacity, nearest/pixelated, 중앙 pivot을 사용한다. 투명 여백을 포함한 셀 크기이며 실제 잉크는 훨씬 작다. SVG를 공 **뒤**에 그려 흰 코어가 공 중심을 덮지 않는다. 기존4조각 표식은 제거했다. 반경·궤적·결과·RNG·저장·공개 경계는 변경하지 않는다.

첫48px 셀에서는 초기 효과가 거의 가려졌다. [이전 on/off](pxf/history/48px-core-on.png)를 보존하고80px 셀로 한 번 조정했다. 최종1000×460 장면에서 on/off 차이는25ms코어23pixels,50ms링62pixels,100ms50pixels로 접점 부근에 제한된다. 이 수치는 효과 적용 확인이지 미감 점수가 아니다.

## 검증 및 근거

- 신규4테스트: PNG SHA/크기/RGBA, 접촉/시간/off/reduced/result 게이트,8셀 절대시각·seek·6× 결정성,3×3 row-major crop/공통 접점.
- 기존 궤적/프리뷰와 함께26테스트 PASS. 최종 전체 테스트·build·dist는 `pxf/verification.txt` 기록 참조.
- smoke10시드: 초기 main 기준선과 바이트 동일.
- [브라우저 원자료](pxf/browser-report.json): 기존8뷰포트 + touch세로/가로/회전 유지,1×/6×, 200ms8프레임, 공이 효과 위에 그려짐,off/reduced에서 없음. 오류0,저장 변경0. 각뷰포트50ms on/off 캡처를 재수행.
- [흰 코어 on](pxf/white-core-on.png) / [off](pxf/white-core-off.png), [링 on](pxf/ring-on.png) / [off](pxf/ring-off.png), [세로 on](pxf/portrait-on.png) / [off](pxf/portrait-off.png).
- 독립 코드/시각 검토: CC0 범위·PNG-only·동일 시계·교체·접점 가독성에 차단 문제 없음. 작은 접촉 표식이 보이고 공/배트는 읽힌다.

기존 #121 NOT_IMPROVED / NOT BAR_MET, G-020 실패 이력 유지. 새 블라인드8축,물리기기,청취,사람 선호 개선은 미검증. PXF 적용 사실과 접점 확인을 강한 게임 감각/품질 개선 주장으로 확대하지 않는다. 초기 P0/P1 영상/검증은52f88cb의 독자4조각 버전이고 이 문서의 비교 캡처가 PXF 후속 근거다.
