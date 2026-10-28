import {CARDS} from './cards.js';

/* Called only after the engine accepts an action, with the still-intact BEFORE
   hand. UI selection is cleared after this. No saved data or engine mutation. */
export function captureExecution(before,next,{selected=null}={}){
  const r=next.battle?.revealed,prep=next.last?.kind==='skill',action=prep?'prepare':r?.action==='take'?'take':'swing';
  const ids=action==='take'?[]:[selected,...(prep?[]:(r?.supportCoverages||[]).map(x=>x.id))].filter(Boolean);
  const cards=ids.flatMap((id,i)=>{
    if(id==='basic')return [{id,kind:'basic',name:'기본 스윙',role:'main'}];
    const entry=before.deck?.find(x=>x.id===id);
    if(!entry||!before.battle?.hand?.includes(id))return [];
    return [{id,kind:entry.kind,name:(CARDS[entry.kind]?.name||'카드')+(entry.plus?'+':''),role:id===selected?'main':'support'}];
  });
  return {pitch:next.stats?.pitches||0,nodeId:next.runMap?.currentNodeId,action,cards,
    preparation:prep?{name:cards[0]?.name||'준비',detail:next.last.events?.[0]||next.last.text||'준비 효과 적용'}:null};
}

/* Damage can overkill; HP feedback names the amount the meter actually lost. */
export function actualHpLoss(result){
  return Number.isInteger(result?.hpBefore)&&Number.isInteger(result?.hpAfter)
    ?Math.max(0,result.hpBefore-result.hpAfter):Math.max(0,result?.damage||0);
}

export function resultSequence(result,execution){
  if(!result)return [];
  const steps=[],hit=['hit','sacrifice'].includes(result.kind);
  if(hit){
    const support=!(result.primaryCoverage||[]).includes(result.actualZone)
      ?(result.supportCoverages||[]).find(x=>x.coverage.includes(result.actualZone)):null;
    const card=execution?.cards?.find(c=>support?c.id===support.id:c.role==='main');
    if(card)steps.push({kind:support?'support':'main',text:card.name+' · '+(support?'지원 커버 적중':'메인 커버 적중')});
    if(result.precisionBonus>0)steps.push({kind:'precision',text:`정확 적중 +${result.precisionBonus} HP`});
    else if(result.relicBonus>0&&result.relicEvents?.length)steps.push({kind:'relic',text:result.relicEvents[0]});
  }
  const loss=actualHpLoss(result);
  if(loss>0)steps.push({kind:'hp',text:`${hit?'투수 HP':'압박'} −${loss}`});
  return steps.slice(0,3);
}
