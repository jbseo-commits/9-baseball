import {CARDS} from '../cards.js';
import {previewV10Stack,stackSupportProblem} from '../engine.js';

/* Explicit drop intent. Selection/stack state still belongs to BallparkBattle;
   all legality and costs come from the same engine preview as execution. */
export function cardDropIntent(s,selected,stack,id,zone){
  if(s?.phase!=='battle'||!Number.isInteger(zone)||zone<0||zone>8)return {ok:false,reason:'지금은 카드를 놓을 수 없습니다.'};
  const entry=s.deck?.find(c=>c.id===id),def=CARDS[entry?.kind];
  if(!entry||!s.battle.hand.includes(id)||def?.type!=='attack')return {ok:false,reason:'타격 카드를 코스에 놓으세요.'};
  if(selected&&selected!==id){
    const main=s.deck.find(c=>c.id===selected);
    if(selected==='basic'||CARDS[main?.kind]?.type==='attack'){
      const next=stack.some(c=>c.id===id)?stack.map(c=>c.id===id?{...c,aimZone:zone}:c):[...stack,{id,aimZone:zone}];
      const problem=stackSupportProblem(s,selected,next);
      return problem?{ok:false,reason:problem}:{ok:true,kind:'support',stack:next};
    }
  }
  const next=selected===id?stack:[],aimed={...s,battle:{...s.battle,aimZone:zone}};
  const problem=previewV10Stack(aimed,id,next)?.problem;
  return problem?{ok:false,reason:problem}:{ok:true,kind:'main',id,zone,stack:next};
}

/* Read-only candidate for the exact same drop intent; no engine action/save. */
export function cardDropPreview(s,selected,stack,id,zone){
 const intent=cardDropIntent(s,selected,stack,id,zone);if(!intent.ok)return {...intent,zone,coverage:[]};
 const main=intent.kind==='main'?id:selected,aimed=intent.kind==='main'?{...s,battle:{...s.battle,aimZone:zone}}:s;
 const preview=previewV10Stack(aimed,main,intent.stack);
 const coverage=intent.kind==='main'?preview.primaryCoverage:preview.supportCoverages?.find(c=>c.id===id)?.coverage;
 return {ok:true,zone,role:intent.kind,coverage:coverage||[]};
}
