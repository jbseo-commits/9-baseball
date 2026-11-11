import {CARDS,cardCost} from './cards.js';
import {coverage,v10PrepMax} from './engine.js';
import {cardFaceOf} from './card-face.js';
import {preparationDrawPreview} from './preparation-feedback.js';
import {publicEncounterCue} from './encounter-cues.js';
import {capturePublicCourseSnapshot} from './battle-vnext/course-public-snapshot.js';

function capturePublicHand(state){
  const b=state?.battle;if(!b)return null;
  const prepLeft=Math.max(0,v10PrepMax(state)-(b.preparations||0));
  const cards=(b.hand||[]).flatMap(id=>{
    const entry=state.deck?.find(x=>x.id===id),def=CARDS[entry?.kind];
    if(!entry||!def)return [];
    const face=cardFaceOf(entry,{strikes:b.strikes,drawPreview:preparationDrawPreview(state,id)});
    return [{id,kind:entry.kind,plus:!!entry.plus,face:{summary:face.summary,condition:face.condition,
      axis:face.axis,drawNote:face.drawNote||''},coverage:def.type==='skill'?null:coverage(state,id),
      warning:def.type==='skill'&&!prepLeft?'준비 횟수 소진':''}];
  });
  if(cards.length!==(b.hand||[]).length)return null;
  return {cards,prepLeft,basicCoverage:b.aimZone==null?[]:[b.aimZone],piles:{draw:b.draw?.length??null,discard:b.discard?.length??null}};
}

/* Only the player's accepted plan. No destination, outcome or engine roll is
   retained here, so clearing selection cannot erase the committed card order. */
function captureCommittedPlan(before,r,selected,action){
  if(action==='prepare'||!r)return null;
  if(action==='swing'&&!selected)return null;
  const placements=action==='take'?[]:[
    {id:selected,aimZone:r.aimZone,coverage:r.primaryCoverage||r.coverage||[]},
    ...(r.supportCoverages||[]),
  ];
  const cards=placements.map((p,i)=>{
    const entry=before.deck?.find(c=>c.id===p.id);
    return Object.freeze({id:p.id,kind:p.id==='basic'?'basic':entry?.kind,role:i?'support':'main',order:i+1,
      aimZone:p.aimZone,coverage:Object.freeze([...(p.coverage||[])]),cost:p.id==='basic'?0:cardCost(entry)});
  });
  return Object.freeze({action,cards:Object.freeze(cards),cost:cards.reduce((n,c)=>n+c.cost,0),
    coverage:Object.freeze([...new Set(cards.flatMap(c=>c.coverage))].sort((a,b)=>a-b))});
}

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
    committedPlan:captureCommittedPlan(before,r,selected,action),
    courseSnapshot:capturePublicCourseSnapshot(before,next),
    encounterCue:publicEncounterCue(before),
    handSnapshot:action==='prepare'?null:capturePublicHand(before),
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
  const encounter=result.encounterCue===undefined?result.encounterEvents?.[0]:result.encounterCue?`${result.encounterCue.label} · ${result.encounterCue.text}`:null;
  if(encounter){
    if(steps.length>=2)steps[steps.length-1]={...steps.at(-1),text:steps.at(-1).text+' · '+encounter};
    else steps.push({kind:'encounter',text:encounter});
  }
  const loss=actualHpLoss(result);
  if(loss>0)steps.push({kind:'hp',text:`${hit?'투수 HP':'압박'} −${loss}`});
  return steps.slice(0,3);
}
