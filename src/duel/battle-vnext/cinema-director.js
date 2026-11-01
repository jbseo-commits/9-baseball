/* Finale is a presentation of accepted results, never a second game state. */
export function cinemaMoment(result,stage,active=false){
  if(!result)return null;
  // HP depletion must be seen before the mound reaction; no early KO title.
  if(result.knockedOut&&(!active||stage==='settle'))return 'knockout';
  if(result.kind==='hit'&&/홈런/.test(result.call||result.label||'')&&(!active||['release','settle'].includes(stage)))return 'homer';
  return null;
}
