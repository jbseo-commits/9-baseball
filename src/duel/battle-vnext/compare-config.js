/* Separate opt-in only; never turns an ordinary game query into a fixture. */
export const COMPARE_SCENARIOS=Object.freeze([
  {id:'watch-read0',label:'직접 플레이'},
  {id:'prepare',label:'준비 카드'},
  {id:'support-stacked',label:'카드 겹치기'},
  {id:'cinema-exact',label:'정확 적중'},
  {id:'cinema-near',label:'한 칸 차이'},
  {id:'cinema-homer',label:'홈런'},
  {id:'cinema-knockout',label:'강판 · HP 1 검수'},
]);
export const COMPARE_VARIANTS=Object.freeze(['legacy','vnext']);
export const COMPARE_MESSAGE='9zone-battle-compare-activity';
export function comparisonMode(search=''){
  const p=new URLSearchParams(search),opt=p.get('battleUi')==='vnext';
  const child=opt&&COMPARE_VARIANTS.includes(p.get('battleCompareChild'))?p.get('battleCompareChild'):null;
  const standalone=opt&&p.get('battleFixture')&&COMPARE_VARIANTS.includes(p.get('battleCompareVariant'))?p.get('battleCompareVariant'):null;
  return {page:opt&&!child&&p.get('battleCompare')==='1',child,standalone};
}
export function comparisonScenario(id){return COMPARE_SCENARIOS.some(s=>s.id===id)?id:'watch-read0';}
export function comparisonUrl(path,variant,fixture,{embedded=true}={}){
  const p=new URLSearchParams({battleUi:'vnext',battleFixture:comparisonScenario(fixture),battleCompareVariant:variant==='legacy'?'legacy':'vnext'});
  if(embedded)p.set('battleCompareChild',variant==='legacy'?'legacy':'vnext');
  return path+'?'+p;
}
export function validComparisonActivity(event,win){
  return win.parent!==win&&event.source===win.parent&&event.origin===win.location.origin
    &&event.data?.type===COMPARE_MESSAGE&&event.data.version===1&&typeof event.data.active==='boolean';
}
