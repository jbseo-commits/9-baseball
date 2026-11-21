// @vitest-environment happy-dom
import React from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,cleanup} from '@testing-library/react';
import VulcanBrace from '../src/duel/battle-vnext/VulcanBrace.jsx';
import {pitchPersonality,personalityFlightAt} from '../src/duel/battle-vnext/pitch-personality.js';
import {publicEncounterCue} from '../src/duel/encounter-cues.js';
import {createV10Duel,enterV10Node,playV10Action,advanceV10Pitch,advanceV10Batter} from '../src/duel/engine.js';
import {sceneEffectAt} from '../src/duel/battle-vnext/scene-effects.js';
import {encounterPlan,encounterFor} from '../src/duel/pitcher-encounters.js';
import {captureExecution} from '../src/duel/presentation-snapshot.js';
const profile=i=>pitchPersonality({id:'vulcan-blaze',steps:{count:3,current:i}},'vulcan-blaze');
afterEach(cleanup);
it('only a valid matching public three-step cue selects the equipment and flight',()=>{
 for(const cue of [null,{id:'vulcan-blaze'},{id:'vulcan-blaze',steps:{count:3,current:3}}])expect(pitchPersonality(cue,'vulcan-blaze')).toBeNull();
 expect(pitchPersonality({id:'vulcan-blaze',steps:{count:3,current:2}},'other')).toBeNull();
 expect(profile(0).id).toBe('vulcan-brace');expect(profile(1).id).toBe('vulcan-brace');expect(profile(2)).toMatchObject({id:'vulcan-vent',label:'3구 · 빈틈'});expect(profile(2).description).toContain('안타에만');
});
it('equipment changes real outline only on ready drawing, never hand/feet/camera or moving poses',()=>{
 const v=render(<VulcanBrace profile={profile(0)} frame={0} phase="deciding"/>),closed=v.container.querySelector('path').getAttribute('d');
 v.rerender(<VulcanBrace profile={profile(2)} frame={0} phase="deciding"/>);expect(v.container.querySelector('path').getAttribute('d')).not.toBe(closed);
 for(const props of [{frame:1,phase:'deciding'},{frame:0,phase:'flight'},{frame:0,phase:'result'}]){v.rerender(<VulcanBrace profile={profile(2)} {...props}/>);expect(v.container.children.length).toBe(0);}
 v.rerender(<VulcanBrace profile={profile(2)} frame={0} phase="flight" action="prepare"/>);expect(v.container.querySelector('svg')).toBeTruthy();
});
it('cycle survives actual takes, plate appearance change and JSON resume; locked cue remains before-state',()=>{
 let s;for(let seed=1;seed<100&&!s;seed++){let r=createV10Duel(seed),n=r.runMap.nodes.find(n=>n.opponent?.artId==='vulcan-blaze');if(n){r.runMap.reachableIds=[n.id];s=enterV10Node(r,n.id);}}
 expect(s).toBeTruthy();let between=false;
 for(let i=0;i<8;i++){
  s=JSON.parse(JSON.stringify(s));const cue=publicEncounterCue(s);expect(cue.steps.current).toBe(i%3);
  const a=playV10Action(s,{type:'take'}),ex=captureExecution(s,a,{selected:null});expect(ex.encounterCue).toEqual(cue);expect(a.v10.lastCombat?.encounterPlan?.bonus||0).toBe(0);
  between ||= a.phase==='between';s=a.phase==='between'?advanceV10Batter(a):advanceV10Pitch(a);
 }
 expect(between).toBe(true);
});
it('compression and vent have a different mobile-readable silhouette but exact endpoints and smooth pass',()=>{
 const R={x:900,y:250},C={x:810,y:460},r=917,a=1217;
 for(const p of [profile(0),profile(2)]){
  const at=t=>personalityFlightAt(t,r,a,R,C,p),e=.001;
  expect(at(r).ball).toEqual(R);expect(at(a).ball).toEqual(C);expect(at(a).radius).toBe(12);
  for(const k of ['x','y'])expect(Math.abs((at(a).ball[k]-at(a-e).ball[k])/e-(at(a+e).ball[k]-at(a).ball[k])/e)).toBeLessThan(.001);
  expect(Math.abs(at(a-e).radius-at(a+e).radius)).toBeLessThan(.001);
 }
 expect(Math.abs(personalityFlightAt(1117,r,a,R,C,profile(0)).ball.x-personalityFlightAt(1117,r,a,R,C,profile(2)).ball.x)).toBeGreaterThan(20);
});
it('preparation cannot advance/skip the public cycle and hidden pitch cannot alter it',()=>{
 let s=enterV10Node(createV10Duel(481),'a1-entry');s.v10.opponent={...s.v10.opponent,artId:'vulcan-blaze',encounter:{version:1}};s.battle.intent.encounter={active:true,appliedDistribution:true};s.battle.pitchCount=2;
 s.deck[0]={...s.deck[0],kind:'watch'};s.battle.hand=['c0'];const hidden=structuredClone(s);hidden.battle.pending={zone:9,roll:.1};
 expect(publicEncounterCue(hidden)).toEqual(publicEncounterCue(s));const prepared=playV10Action(s,{type:'card',id:'c0'});expect(prepared.battle.pitchCount).toBe(2);expect(publicEncounterCue(prepared).steps.current).toBe(2);
});

it('third bonus is earned only by real hit; waiting at two strikes carries the normal risk',()=>{
 const s={version:10,v10:{opponent:{artId:'vulcan-blaze',encounter:encounterFor('vulcan-blaze')}},battle:{pitchCount:2,history:[],strikes:2}};
 for(const kind of ['hit','whiff','called','ball','foul']){const p=encounterPlan(s,{action:{type:kind==='called'||kind==='ball'?'take':'card'},r:{kind}});expect(p.bonus).toBe(kind==='hit'?8:0);}
});
it('all committed cells have one shared incoming center across hit/take/whiff and continuous pass',()=>{
 for(const i of [0,2])for(let z=0;z<10;z++){
  const composition={release:{x:900,y:250},contact:{x:820,y:460},personality:profile(i)},timeline={impactAt:1217,duration:2200};
  const at=(action,t,landed=false)=>sceneEffectAt({elapsed:t,phase:landed?'result':'flight',result:landed?{kind:action==='take'?'called':'whiff',actualZone:z}:null,playback:{timeline,pitchReleaseAt:917,action,course:{getDestination:()=>z,getContact:()=>false}},composition});
  for(const t of [917,934,967,1000,1216,1217,1234])expect(at('take',t).ball).toEqual(at('swing',t).ball);
  expect(at('take',1217,true).ball).toEqual(at('take',1217).ball);expect(at('swing',1217,true).radius).toEqual(at('swing',1217).radius);expect(at('swing',1234,true).flash).toBe(0);
 }
});
