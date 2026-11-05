import {describe,it,expect} from 'vitest';
import {createV10Duel,enterV10Node,redealPitch,setAimZone,playV10Action,advanceV10Pitch,advanceV10Batter,saveV10Duel,readV10Duel} from '../src/duel/engine.js';
import {previewSwing} from '../src/duel/swing-preview.js';
import {validateV10State} from '../src/duel/v10-storage.js';
const fight=id=>{
 for(let seed=1;seed<120;seed++){
  const run=createV10Duel(seed),node=run.runMap.nodes.find(n=>n.opponent?.artId===id);
  if(node){run.runMap.reachableIds=[node.id];return enterV10Node(run,node.id);}
 }
 throw Error('missing actual node');
};
// Diagnostic selection of a repeatable engine seed; no replacement of pending coordinates/rolls.
const dealt=(s,test)=>{
 for(let seed=1;seed<400;seed++){
  const d=redealPitch(s,Math.imul(seed,2246822519)>>>0);
  if(test(d.battle.pending.zone))return d;
 }
 throw Error('no valid diagnostic pitch');
};
const compare=(s,action)=>{
 const p=previewSwing(s,{id:action.id,supports:action.supports||[]}),next=playV10Action(s,action),r=next.battle.revealed;
 const predicted=p.outcomes.find(o=>o.zone===r.zone&&o.kind===r.kind&&o.label===r.label);
 expect(predicted,`${s.v10.opponent.artId}: resolved outcome must occur in its actual preview`).toBeTruthy();
 expect(next.v10.lastCombat.damage).toBe(predicted.damage);
 expect(s.pitcher.hp-next.pitcher.hp).toBe(Math.min(s.pitcher.hp,predicted.damage));
 return next;
};
describe('signature preview and real action resolution agree',()=>{
 it('accepts old missing cycle counters and rejects corrupt new counters before resume',()=>{
  const s=fight('tide-vesper');expect(validateV10State(s)).toBe(true);
  for(const value of [-1,.5,Infinity,'3'])expect(validateV10State({...s,battle:{...s.battle,pitchCount:value}})).toBe(false);
  delete s.battle.pitchCount;expect(validateV10State(s)).toBe(true);
 });
 it('Jade carries a real first exact hit into the next-pitch shield and consecutive exact break',()=>{
  let s=dealt(fight('jade-viper'),z=>z<9);s=setAimZone(s,s.battle.pending.zone);
  const first=compare(s,{type:'card',id:'basic'});
  expect(first.battle.history.at(-1)).toMatchObject({kind:'hit',exact:true});
  s=dealt(first.phase==='between'?advanceV10Batter(first):advanceV10Pitch(first),z=>z<9);s=setAimZone(s,s.battle.pending.zone);
  const second=compare(s,{type:'card',id:'basic'});
  expect(second.v10.lastCombat.encounter).toMatchObject({rate:.75,bonus:8});
 });
 it('Tide rewards a real watch action before the next actual hit',()=>{
  let s=dealt(fight('tide-vesper'),z=>z===9);
  const watched=playV10Action(s,{type:'take'});
  expect(watched.battle.history.at(-1).action).toBe('take');
  s=dealt(advanceV10Pitch(watched),z=>z<9);s=setAimZone(s,s.battle.pending.zone);
  const hit=compare(s,{type:'card',id:'basic'});
  expect(hit.v10.lastCombat.encounter.bonus).toBe(5);
 });
 for(const [id,rate] of [['regular-03-amber-sinker',.8],['boss-01-emerald-tyrant',.7]])it(`${id}: total stacked low coverage pays armor even with a one-cell main`,()=>{
  let s=fight(id);s.deck=['main','left','right'].map(id=>({id,kind:'place'}));s.nextId=3;
  s.battle={...s.battle,hand:s.deck.map(c=>c.id),draw:[],discard:[],energy:3,energyCap:3,bases:['p2','p3',null],bonusDmg:3};
  s=dealt(s,z=>z===7);s=setAimZone(s,7);
  const action={type:'card',id:'main',supports:[{id:'left',aimZone:6},{id:'right',aimZone:8}]};
  const hit=compare(s,action);
  expect(hit.battle.revealed.coverage).toEqual([6,7,8]);
  expect(hit.v10.lastCombat.encounter).toMatchObject({rate,bonus:0});
  expect(hit.v10.lastCombat.precisionBonus).toBeGreaterThan(0);expect(hit.v10.lastCombat.runnerBonus).toBeGreaterThan(0);
 });
 it('replays an actual older save without silently adding new encounter behavior',()=>{
  const run=createV10Duel(61,{encounters:false}),s=enterV10Node(run,'a1-entry');
  const storage={value:null,setItem(_k,v){this.value=v},getItem(){return this.value}};
  saveV10Duel(storage,s);const resumed=readV10Duel(storage);
  expect(resumed.v10.opponent.encounter).toBeUndefined();
  expect(resumed.battle.pending).toEqual(s.battle.pending);expect(resumed.pitchSeed).toBe(s.pitchSeed);
  expect(playV10Action(resumed,{type:'take'})).toEqual(playV10Action(s,{type:'take'}));
 });
});
