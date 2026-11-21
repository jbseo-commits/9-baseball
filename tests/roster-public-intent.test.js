import {it,expect} from 'vitest';
import * as E from '../src/duel/engine.js';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';
import {publicIntentBadge,intentBadgePosition} from '../src/duel/battle-vnext/public-intent-badge.js';
import anchors from '../src/duel/battle-vnext/intent-head-anchors.json';
import roster from '../src/duel/battle-vnext/roster-registration.json';
const badge=s=>{const m=buildBattleViewModel({s});return publicIntentBadge(m.zones.cells.map(c=>c.face),'deciding',m.zones.band.confirmedOutside);};
it('has a ready head anchor for every registered identity, not just Fox',()=>{
 expect(Object.keys(anchors).sort()).toEqual(Object.keys(roster).sort());
 for(const p of Object.values(anchors)){expect(p.x).toBeGreaterThan(0);expect(p.x).toBeLessThan(256);expect(p.y).toBeGreaterThanOrEqual(0);expect(p.y).toBeLessThan(70);}
});
it('matches all ten actual targets only after legally earned scout information',()=>{
 for(const plus of [false,true])for(let zone=0;zone<10;zone++){
  const s=E.enterV10Node(E.createV10Duel(20261119),'a1-entry');
  s.battle.pending={...s.battle.pending,zone};
  // All-zone test repertoire makes each injected target a legal fixture pitch.
  s.battle.intent={...s.battle.intent,repertoire:[0,1,2,3,4,5,6,7,8]};
  expect(badge(s).certain).toBe(false);
  const id=s.battle.hand.find(id=>s.deck.find(c=>c.id===id)?.kind==='scout');
  if(plus)s.deck.find(c=>c.id===id).plus=true;
  expect(E.cardProblem(s,id)).toBeNull();
  const next=E.playV10Action(s,{type:'card',id}),b=badge(next);
  if(zone===9)expect(b).toMatchObject({outside:true,certain:true,zones:[]});
  else if(plus)expect(b).toMatchObject({certain:true,zones:[zone]});
  else {expect(b.certain).toBe(false);expect(b.zones).toEqual([0,1,2].map(x=>Math.floor(zone/3)*3+x));}
 }
});
it('never infers a hidden exact target from public probabilities',()=>{
 for(const face of ['100%','95~100%','자주','가끔'])expect(publicIntentBadge(Array(9).fill(face),'deciding')).toMatchObject({certain:false,zones:[]});
});
it('snaps stable coordinates and avoids top/right clipping without moving across face',()=>{
 expect(intentBadgePosition({x:430.2,y:110.1},{width:844,height:390})).toEqual({left:430,top:104});
 expect(intentBadgePosition({x:825,y:110},{width:844,height:390})).toEqual({left:816,top:104});
 expect(intentBadgePosition({x:840,y:110},{width:844,height:390})).toBeNull();
 expect(intentBadgePosition({x:430,y:35},{width:844,height:390})).toBeNull();
});
it('keeps public certainty aligned across every registered opponent and its legal repertoire',()=>{
 const seen=new Set();
 for(let seed=0;seed<4;seed++)for(const tutorial of [false,true]){
  const base=E.createV10Duel(seed,{tutorial});
  for(const n of base.runMap.nodes){
   if(!n.opponent?.artId||seen.has(n.opponent.artId))continue;
   seen.add(n.opponent.artId);
   const q=structuredClone(base);q.runMap.reachableIds=[n.id];
   const initial=E.enterV10Node(q,n.id);
   for(const zone of [...initial.battle.intent.repertoire,9]){
    const s=structuredClone(initial);s.battle.pending={...s.battle.pending,zone};
    expect(badge(s).certain).toBe(false);
    // Deterministic setup: put an existing upgraded scout in hand; execute the real card rule.
    const card=s.deck.find(c=>c.kind==='scout');card.plus=true;s.battle.hand[0]=card.id;
    expect(E.cardProblem(s,card.id)).toBeNull();
    const next=E.playV10Action(s,{type:'card',id:card.id});
    expect(badge(next)).toMatchObject(zone===9?{certain:true,outside:true}:{certain:true,zones:[zone]});
   }
  }
 }
 expect([...seen].sort()).toEqual(Object.keys(roster).sort());
});
