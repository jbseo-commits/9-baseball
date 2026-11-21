import {it,expect} from 'vitest';
import {HITTER_CLASSES,applyHitterClass,applyStartPack,createV10Duel,enterV10Node,playV10Action,swingOdds,hitProfile,previewV10Stack,coverage,stackSupportProblem} from '../src/duel/engine.js';
import {validateV10State} from '../src/duel/v10-storage.js';
import {previewSwing} from '../src/duel/swing-preview.js';
import {publicForecast} from '../src/duel/battle-vnext/view-model.js';
import {sceneEffectAt} from '../src/duel/battle-vnext/scene-effects.js';
const battle=(cls,seed=21)=>{const s=applyHitterClass(createV10Duel(seed),cls);return enterV10Node(s,s.runMap.nodes.find(n=>n.type==='battle').id);};
const equip=(s,kind)=>{const e=s.deck.find(c=>c.kind===kind);s.battle.hand=[e.id,...s.battle.hand.filter(id=>id!==e.id)].slice(0,5);s.battle.draw=s.battle.draw.filter(id=>id!==e.id);s.battle.discard=s.battle.discard.filter(id=>id!==e.id);return e.id;};
it('four separate stable class records, exact decks, old packs remain old and cannot be overwritten',()=>{
 for(const c of HITTER_CLASSES){const s=applyHitterClass(createV10Duel(21),c.id);expect(s.v10.hitterClass.id).toBe(c.id);expect(s.v10.startPack).toBeUndefined();expect(s.deck.map(x=>x.kind).sort()).toEqual(['place','scout',...c.kinds].sort());expect(validateV10State(JSON.parse(JSON.stringify(s)))).toBe(true);expect(applyHitterClass(s,c.id)).toBe(s);expect(applyStartPack(s,'power')).toBe(s);}
 for(const p of ['power','link','hold']){const s=applyStartPack(createV10Duel(21),p);expect(applyHitterClass(s,'slugger-v1')).toBe(s);expect(s.v10.hitterClass).toBeUndefined();}
});
it('outside bet consumes2, cannot cover an inside pitch or stack; roll thresholds and shared forecast conserve mass',()=>{
 const s=battle('bad-ball-v1'),id=equip(s,'chaseBall');expect(coverage(s,id)).toEqual([]);expect(stackSupportProblem(s,id,[{id:s.battle.hand[1],aimZone:4}])).toBeTruthy();
 for(const z of [0,4,8,9])for(const roll of [0,.449999,.45,.599999,.6,.999]){
  const a=structuredClone(s);a.battle.pending={...a.battle.pending,zone:z,roll,powerRoll:0};a.battle.aimZone=4;
  const odds=swingOdds(a,id,z),p=Array(10).fill(0);p[z]=1;const f=previewSwing(a,{id},p);expect(f.outcomes.reduce((n,o)=>n+o.p,0)).toBeCloseTo(1);
  const next=playV10Action(a,{type:'card',id}),r=next.battle.revealed;expect(r.kind).toBe(z===9?(roll<.45?'hit':roll<.6?'foul':'whiff'):'whiff');expect(next.battle.energy).toBe(a.battle.energy-2);
  expect(f.outcomes.some(o=>o.kind===r.kind&&o.damage===next.v10.lastCombat.damage)).toBe(true);
  if(r.kind==='hit'){expect(hitProfile(a,id,z)).toEqual([{label:'존 밖 빗맞은 단타',bases:1,p:1}]);expect(next.v10.lastCombat.damage).toBeLessThanOrEqual(8);}
  expect(odds.hit).toBe(z===9?.45:0);
 }
});
it('outside forecast uses only public bounds, survives hidden target mutations and no precision reward',()=>{
 const s=battle('bad-ball-v1'),id=equip(s,'chaseBall');const publicView=a=>publicForecast({now:previewSwing(a,{id})});const before=publicView(s);
 for(const zone of [0,4,9]){const a=structuredClone(s);a.battle.pending.zone=zone;a.battle.pending.roll=.123;expect(publicView(a)).toEqual(before);}
 const a=structuredClone(s);a.battle.pending.zone=9;a.battle.pending.roll=0;const n=playV10Action(a,{type:'card',id});expect(n.v10.lastCombat.precisionBonus).toBe(0);
 expect(previewV10Stack(s,id).hit).toBeCloseTo(previewSwing(s,{id},s.battle.intent.probabilities).hitChance);
});
it('spray main choice resolves distinct actual outgoing direction and existing tradeoffs',()=>{
 const s=battle('spray-v1');for(const [kind,direction] of [['sprayPull','left'],['sprayCenter','center'],['sprayPush','right']]){
  const a=structuredClone(s),id=equip(a,kind);a.battle.aimZone=4;a.battle.pending={...a.battle.pending,zone:4,roll:0,powerRoll:0};
  const n=playV10Action(a,{type:'card',id});expect(n.battle.revealed.battedDirection).toBe(direction);expect(n.battle.revealed.kind).toBe('hit');expect(validateV10State(JSON.parse(JSON.stringify(n)))).toBe(true);
  const pb={action:'swing',timeline:{duration:2000,impactAt:1000,settleAt:1600,freeze:0}},composition={contact:{x:800,y:450},release:{x:850,y:300},mound:{x:832,y:580}};
  const r={kind:'hit',battedDirection:direction,label:'단타'},start=sceneEffectAt({elapsed:1000,playback:pb,result:r,phase:'result',composition}),end=sceneEffectAt({elapsed:1560,playback:pb,result:r,phase:'result',composition});expect(start.ball).toEqual(composition.contact);expect(end.ball.x).toBe({left:460,center:832,right:1210}[direction]);
 }
});

it('malformed supports are rejected without throwing for legacy or class saves',()=>{const s=battle('slugger-v1');expect(()=>stackSupportProblem(s,s.battle.hand[0],[null])).not.toThrow();expect(stackSupportProblem(s,s.battle.hand[0],[null])).toBeTruthy();});
import {resultSequence} from '../src/duel/presentation-snapshot.js';
import {resultTone} from '../src/duel/battle-vnext/ResultReadout.jsx';
import {cardDetailOf} from '../src/duel/CardDetailSheet.jsx';
it('outside result is never labelled exact/main coverage and detail says solo',()=>{
 const result={kind:'hit',actualZone:9,outsideBet:true,primaryCoverage:[],supportCoverages:[]};
 expect(resultTone(result).label).toBe('존 밖 베팅 성공');expect(resultSequence(result,{cards:[{role:'main',name:'존 밖 베팅'}]})[0].text).toContain('존 밖 베팅 성공');expect(cardDetailOf('chaseBall').stack).toContain('지원 불가');
});
it('confirmed outside still only45percent; boosts cannot exceed8 damage',()=>{
 const s=battle('bad-ball-v1'),id=equip(s,'chaseBall');s.battle.pending.zone=9;s.battle.pending.roll=0;s.battle.scouted=true;s.battle.scoutPlus=true;s.battle.momentum=9;s.battle.bonusPressure=5;s.battle.bonusHit=50;s.battle.bases=['p2','p3','p4'];
 const f=previewSwing(s,{id});expect(f.hitBounds).toEqual([.45,.45]);expect(f.outcomes.reduce((a,x)=>a+x.p,0)).toBeCloseTo(1);expect(f.dmgMax).toBe(8);expect(playV10Action(s,{type:'card',id}).v10.lastCombat.damage).toBe(8);
});
it('confirmed outside solo stack preview conserves100percent and rejects supports honestly',()=>{
 const s=battle('bad-ball-v1'),id=equip(s,'chaseBall');s.battle.pending.zone=9;s.battle.scouted=true;s.battle.scoutPlus=true;
 const f=previewV10Stack(s,id);expect(f.hit).toBeCloseTo(.45);expect(f.hit+f.foul+f.whiff+f.out).toBeCloseTo(1);
 const supports=[{id:s.battle.hand.find(x=>x!==id),aimZone:4}];expect(previewV10Stack(s,id,supports).problem).toContain('단독');expect(previewSwing(s,{id,supports})).toBeNull();expect(playV10Action(s,{type:'card',id,supports})).toBe(s);
});

it('legacy malformed state remains a graceful support rejection',()=>{expect(()=>stackSupportProblem(null,'basic',[{id:'x'}])).not.toThrow();expect(stackSupportProblem(null,'basic',[{id:'x'}])).toContain('MAIN RUN');});
