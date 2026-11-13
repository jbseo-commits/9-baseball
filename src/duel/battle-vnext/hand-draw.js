// Public, in-memory presentation bookkeeping. No future draw pile, probability,
// persistent state or RNG is consulted. Result draws wait until deciding.
export function createHandDrawTracker(){
 let context=null,phase=null,first=true,sequence=0,pending=[];
 let seen=new WeakSet();
 return {update(input={}){
  if(!input.enabled)return null;
  if(context!==input.context){context=input.context;phase=null;first=true;pending=[];seen=new WeakSet();}
  const before=phase;phase=input.phase;
  if(['flight','committing'].includes(phase))return null;
  const receipt=input.receipt;
  if(receipt&&typeof receipt==='object'&&!seen.has(receipt)){
   seen.add(receipt);if(Array.isArray(receipt.ids))pending.push(...receipt.ids);
  }
  if(phase!=='deciding')return null;
  const hand=new Set(input.ids||[]),ids=[...new Set(pending)].filter(id=>hand.has(id));pending=[];
  const entering=before!=='deciding';
  if(!entering&&!ids.length)return null;
  const kind=ids.length?'draw':'hand',shown=ids.length?ids:first?[...hand]:[];
  first=false;
  return {open:true,batch:shown.length?{key:++sequence,ids:shown,kind}:null};
 }};
}
export const DRAW_STEP_MS=110;
export const DRAW_LAND_MS=340;
