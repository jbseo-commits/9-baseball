/* One opt-in shared by bootstrap and battle controller. Legacy landscape sidecars
   intentionally keep using landscapeMedia() and remain disabled. */
export function battleUiMode(search=globalThis.location?.search||''){
  const params=new URLSearchParams(search);
  const vnext=params.get('battleUi')==='vnext';
  return {vnext,fixture:vnext?params.get('battleFixture'):null};
}
