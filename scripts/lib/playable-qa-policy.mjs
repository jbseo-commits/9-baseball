/* QA only: chooses from public previews; never peeks at the resolved pitch. */
import{createV10Duel,enterV10Node,setAimZone,previewCard,previewV10Stack,playV10Action,advanceV10Pitch,advanceV10Batter}from'../../src/duel/engine.js';
import{CARDS}from'../../src/duel/cards.js';
export function choose(s){
 const hand=s.battle.hand.map(id=>({id,...s.deck.find(c=>c.id===id)}));
 const prep=hand.find(c=>c.kind==='setup'&&s.battle.preparations<2);if(prep)return{type:'card',id:prep.id};
 let best=null,score=-1;
 for(const c of hand.filter(c=>CARDS[c.kind].type!=='skill'))for(let z=0;z<9;z++){
  const aimed=setAimZone(s,z),p=previewCard(aimed,c.id);if(p.cost>s.battle.energy)continue;
  const rank=p.hit*10+p.expectedBases*2;if(rank>score){score=rank;best={type:'card',id:c.id,zone:z};}
  for(const support of hand.filter(x=>x.id!==c.id&&CARDS[x.kind].type!=='skill'&&x.kind!=='bunt'))for(let aim=0;aim<9;aim++){
   const supports=[{id:support.id,aimZone:aim}],q=previewV10Stack(aimed,c.id,supports);if(q.cost>s.battle.energy)continue;
   const r=q.hit*10+q.expectedBases*2;if(r>score){score=r;best={type:'card',id:c.id,zone:z,supports};}
  }
 }
 return best||{type:'take'};
}
