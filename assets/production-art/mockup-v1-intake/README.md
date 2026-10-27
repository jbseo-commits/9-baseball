# 선정 목업 원화 — 배포용 후보

Codex A01 담당 경로. 생성 원화 재제작 없이 PR #63의 선정 PNG를 같은 해상도·투명 여백으로 WebP로 변환한다. 원본 PNG를 중복 복사하지 않는다.

- 재생성: `python tools/art/mockup-v1-intake/prepare.py`
- 읽기 전용 검증: `python tools/art/mockup-v1-intake/prepare.py --check`
- 원본·결과 해시/크기/변환기 버전/압축 설정: `manifest.json`
- 카메라·발 접점·그림자·샘플 카드 atlas: `scene-layout.json`
- 실제 로스터 매핑 여부: `actor-coverage.json`

WebP는 손실 압축이다. 알파와 크기는 정확히 보존하며 그림 내용은 재생성/크롭/리사이즈/반전하지 않는다. RGB 차이는 밝고 어두운 배경에서 수치와 실제 브라우저 비교로 검수한다. 지표가 시각 품질을 대체하지 않는다.

현재 actor는 각각 **1개 정지 포즈**, 카드는 **6셀 샘플**이다. 승인된 기존 artId 매핑은 아직 없다. C02의 시각 fixture에서 사용할 수 있고, 실제 상대 연결은 별도 승인/검수 뒤에 한다.

런타임 연결은 Claude의 C02/C03/C05가 담당한다. 신규 컴포넌트에서 이 폴더의 WebP를 Vite import하면 되고 원본 PNG나 docs 파일을 게임에서 import할 필요가 없다. 기존 `assets/runtime-opt/manifest.json`과 최적화 스크립트는 이 작업에서 변경하지 않는다. WebP는 이미 파생본이므로 기존 PNG 최적화 manifest에 이중 등록하지 않는다.

출처: `docs/design/mockup-v1/reference/art/manifest.json`, 권리: `docs/design/mockup-v1/reference/NOTICE.md`. 제3자 참고 사진은 이 폴더에 포함하지 않는다.
