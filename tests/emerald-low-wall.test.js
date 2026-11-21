import {it,expect} from 'vitest';
import {pitchPersonality,personalityFlightAt} from '../src/duel/battle-vnext/pitch-personality.js';
import {sceneEffectAt} from '../src/duel/battle-vnext/scene-effects.js';
import {committedContact} from '../src/duel/battle-vnext/committed-flight.js';
import {encounterPlan,encounterFor} from '../src/duel/pitcher-encounters.js';
import {createV10Duel,enterV10Node,playV10Action,setAimZone} from '../src/duel/engine.js';
import {publicEncounterCue} from '../src/duel/encounter-cues.js';
import {captureExecution} from '../src/duel/presentation-snapshot.js';
const id='boss-01-emerald-tyrant',profile=pitchPersonality({id},id),R={x:827.610,y:377.214},C={x:818.75,y:450.104};
it('matching public identity only; no guaranteed low or ready prediction',()=>{
 expect(profile.ready).toBe(false);expect(profile.description).toContain('확정 코스 아님');
 for(const art of ['emerald-tempest','regular-03-amber-sinker',null])expect(pitchPersonality({id},art)).toBeNull();
 let s=createV10Duel(23),n=s.runMap.nodes.find(n=>n.opponent?.artId===id);s.runMap.reachableIds=[n.id];s=enterV10Node(s,n.id);
 const cue=publicEncounterCue(s);const changed=structuredClone(s);changed.battle.pending={zone:9,roll:0};expect(publicEncounterCue(changed)).toEqual(cue);
 const next=playV10Action(s,{type:'take'});expect(captureExecution(s,next,{selected:null}).encounterCue).toEqual(cue);
});
it('unchanged narrow exact bonus and broad low hit penalty, never bonus on miss/foul/take',()=>{
 const s={version:10,v10:{opponent:{artId:id,encounter:encounterFor(id)}},battle:{pitchCount:0,history:[]}};
 const plan=(kind,zone,exact,primary,coverage)=>encounterPlan(s,{action:{type:'card'},r:{kind,zone,aimZone:exact?zone:(zone+1)%9,primaryCoverage:primary,coverage}});
 expect(plan('hit',7,true,[7],[7])).toMatchObject({bonus:8,rate:1});
 expect(plan('hit',7,true,[6,7,8],[6,7,8])).toMatchObject({bonus:0,rate:.7});
 expect(plan('hit',7,true,[7],[7,8])).toMatchObject({bonus:0,rate:1});
 expect(plan('hit',7,false,[7],[7])).toMatchObject({bonus:0,rate:1});
 for(const kind of ['foul','whiff','called','ball'])expect(plan(kind,7,true,[7],[7]).bonus).toBe(0);
 for(const z of [0,1,2,3,4,5,9])expect(plan('hit',z,true,[z],[z]).bonus).toBe(0);
});
it('all cells share action-independent monotonic sinking path, exact crossing and smooth continuation',()=>{
 for(let z=0;z<10;z++){
  const T=committedContact(z,C),at=t=>personalityFlightAt(t,950,1250,R,T,profile),e=.001;
  expect(at(950).ball).toEqual(R);expect(at(1250).ball).toEqual(T);expect(at(1250).radius).toBe(12);
  let last=R.y;for(let t=950;t<=1250;t++){expect(at(t).ball.y).toBeGreaterThanOrEqual(last);last=at(t).ball.y;}
  for(const k of ['x','y'])expect(Math.abs((at(1250).ball[k]-at(1250-e).ball[k])/e-(at(1250+e).ball[k]-at(1250).ball[k])/e)).toBeLessThan(.001);
  const fx=(action,t,kind)=>sceneEffectAt({elapsed:t,phase:kind?'result':'flight',result:kind?{kind,actualZone:z}:null,playback:{action,pitchReleaseAt:950,timeline:{duration:2200,impactAt:1250},course:{getDestination:()=>z,getContact:()=>false}},composition:{release:R,contact:C,personality:profile,mound:{x:832,y:580}}});
  expect(fx('take',949)).toBeNull();
  for(const t of [950,967,1000,1249,1250,1267])expect(fx('take',t).ball).toEqual(fx('swing',t).ball);
  for(const kind of ['whiff','called','ball']){expect(fx('take',1250,kind).ball).toEqual(T);expect(fx('take',1267,kind).flash).toBe(0);expect(fx('take',1250,kind).radius).toBe(12);}
  for(const kind of ['hit','foul'])expect(fx('swing',1250,kind).ball).toEqual(T);
 }
});
