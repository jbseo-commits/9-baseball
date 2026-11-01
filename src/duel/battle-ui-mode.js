/* 전투 화면 선택. 가로 화면은 새 전투 화면(vnext)이 기본, 세로는 기존 화면(작가 결정 2026-11-01).
   - ?battleUi=vnext : 방향과 상관없이 새 화면(검수·비교 도구, battleFixture는 이때만 읽는다)
   - ?battleUi=legacy: 방향과 상관없이 기존 화면(가로 창이면 예전처럼 세로 액자)
   Legacy landscape sidecars intentionally keep using landscapeMedia() and remain disabled. */
export function battleUiMode(search=globalThis.location?.search||'',win=globalThis){
  const params=new URLSearchParams(search),choice=params.get('battleUi');
  const forced=choice==='vnext';
  const landscape=choice!=='legacy'&&!forced&&!!win?.matchMedia?.('(orientation: landscape)')?.matches;
  return {vnext:forced||landscape,fixture:forced?params.get('battleFixture'):null};
}
