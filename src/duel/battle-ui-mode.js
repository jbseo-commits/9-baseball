/* 전투 화면 선택. 가로 화면은 새 전투 화면(vnext)이 기본, 세로는 기존 화면(작가 결정 2026-11-01).
   2026-11-04 작가 결정: 휴대폰(터치 포인터)은 세로 모드를 없애고 가로 전용. 세로로 들면 회전 안내만
   보이고(orientation-lock.css) 화면은 그대로 새 전투 화면이라 다시 눕혀도 새로고침하지 않는다.
   - ?battleUi=vnext : 방향과 상관없이 새 화면(검수·비교 도구, battleFixture는 이때만 읽는다)
   - ?battleUi=legacy: 방향과 상관없이 기존 화면(가로 창이면 예전처럼 세로 액자)
   Legacy landscape sidecars intentionally keep using landscapeMedia() and remain disabled. */
export function battleUiMode(search=globalThis.location?.search||'',win=globalThis){
  const params=new URLSearchParams(search),choice=params.get('battleUi');
  const forced=choice==='vnext';
  const mm=q=>!!win?.matchMedia?.(q)?.matches;
  const auto=choice!=='legacy'&&!forced&&(mm('(orientation: landscape)')||mm('(pointer: coarse)'));
  return {vnext:forced||auto,fixture:forced?params.get('battleFixture'):null};
}
