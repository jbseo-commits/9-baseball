# 카드 아트·배포 용량 정리 — 2026-11-08

기준 main ee6437e. 실제 게임은 compact `pitcher-inbetweens-v1` 20개를 쓰지만 옛 `?showcase=cinematic-v2`가 120프레임 원본6개를정적import해배포에동반했다. 검수화면은DEV-only React.lazy/Suspense로보존,production옛query는정상게임으로진입한다.사용되지않던App의Red원본import도제거했다.원화/source/검수컴포넌트삭제없음.다른preview/비교/홈런QAroute는변경하지않음.

## 실측

- 전62172498bytes→후55286551bytes,6885947bytes(약6.57MiB)절감. 표시는59.3→52.7MiB/60MiB. 60MiB실제byte예산불변·단위표기정정.
- 이미지6개만배포제외,나머지289개SHA256동일,현재compact투수20개유지.재압축·해상도·팔레트·움직임변경없음.
- 6개legacy basename이재유입하면check:dist실패.수정전6개FAIL,DEV분리후에도unusedRed1개가남아gateFAIL하여사용되지않는Appimport를제거했다.최종budgetPASS.이것은배포패키지절감이며첫진입에서6.57MiB를다운로드하던것이라는주장은아니다.
- 이전main의main.jsx/App.jsx를읽기전용loadoverride로별도production빌드하여4viewport667×375/844×390/844×300/1440×900비교:RGBA변경0pixel.현재소스·dist를기준빌드로덮지않았다.

## 실제 검수

전체238파일1620검사PASS,zone10seed/build/budgetPASS. 줄인production에서20명2×투구token/로딩/HP/ready검사PASS(19자연node+RedQAoverride범위유지),6조건2/3카드engineEqualPASS.정상7pitchKO/reward/resume/event,training/reload/회전guard/휴식/reloadPASS.원래favicon404콘솔은게임리소스실패와구분.

`qa-cinematic-scope.cjs`로DEV6명선택+실제canvas렌더유지,production옛query에서legacyatlas요청0·저장전체동일·정상이어하기PASS. 수동코드모양검사가아닌실제route계약검수다.

## 카드 제작 기준 재정리

`npm run report:art`는실제SSR cardArtFor를통해151장전부의그림/derivative/source를추적한다.신규135장중own파일70·미제작65,전체151그림연결오류0.다음은C163takeSign.오래된C138기록은과거기록으로남기고현재감사표를우선하게했다.100px미감/카드창crop/목업합격을기계적연결검사로대체하지않는다.65개그림을새로만들었다고주장하지않는다.

현재확보여유약7.3MiB는후속카드아트제작·실측배포를위한여유이며모든미제작그림이자동으로예산에맞는다는보장은아니다.

공개배포후확인은PR기록으로이어간다.6회차실행체크포인트의다음작업은HELD결과해설/타자통합아트및C163한장제작검수,사람반복플레이이다.
