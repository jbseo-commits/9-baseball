// @vitest-environment happy-dom
import React from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,cleanup} from '@testing-library/react';
import {createV10Duel,enterV10Node,playV10Action,advanceV10Pitch,advanceV10Batter,redealPitch,setAimZone} from '../src/duel/engine.js';
import {PITCHER_ENCOUNTERS} from '../src/duel/pitcher-encounters.js';
import {publicEncounterCue,landedEncounterCue} from '../src/duel/encounter-cues.js';
import {captureExecution,resultSequence} from '../src/duel/presentation-snapshot.js';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';
import BattleHud from '../src/duel/battle-vnext/BattleHud.jsx';
afterEach(cleanup);
const fight=id=>{
 for(let seed=1;seed<120;seed++){
  const r=createV10Duel(seed,{tutorial:id==='regular-01-red-rush'}),n=r.runMap.nodes.find(n=>n.opponent?.artId===id);
  if(n){r.runMap.reachableIds=[n.id];return enterV10Node(r,n.id);}
 }throw Error('missing '+id);
};
const next=s=>s.phase==='between'?advanceV10Batter(s):advanceV10Pitch(s);
const inside=s=>{for(let seed=1;seed<400;seed++){const d=redealPitch(s,Math.imul(seed,2246822519)>>>0);if(d.battle.pending.zone<9)return setAimZone(d,d.battle.pending.zone);}throw Error('no diagnostic pitch');};

it('carries all20 real roster public cues without reading secrets or mutating state',()=>{
 for(const id of Object.keys(PITCHER_ENCOUNTERS)){
  const s=fight(id),json=JSON.stringify(s),cue=publicEncounterCue(s);
  expect(cue).toMatchObject({id,label:PITCHER_ENCOUNTERS[id].label});expect(cue.text).toBeTruthy();
  const hidden=structuredClone(s);hidden.battle.pending={zone:9,roll:.999,hitRoll:0};
  expect(publicEncounterCue(hidden)).toEqual(cue);expect(JSON.stringify(s)).toBe(json);
  const renderCue=state=>{const vm=buildBattleViewModel({s:state}),v=render(<BattleHud hud={vm.hud} refined onPitcherInfo={()=>{}}/>);const text=v.container.innerHTML;v.unmount();return text;};
  expect(renderCue(hidden)).toEqual(renderCue(s));
  const vm=buildBattleViewModel({s}),v=render(<BattleHud hud={vm.hud} refined onPitcherInfo={()=>{}}/>);
  expect(v.container.querySelector('.bv-hud-opponent').getAttribute('aria-label')).toContain(cue.text);v.unmount();
 }
});
it('freezes Jade public BEFORE shield cue through an actual consecutive exact hit and shows both landed terms',()=>{
 let s=inside(fight('jade-viper'));s=next(playV10Action(s,{type:'card',id:'basic'}));s=inside(s);
 const before=publicEncounterCue(s);expect(before.text).toContain('×0.75');
 const after=playV10Action(s,{type:'card',id:'basic'}),execution=captureExecution(s,after,{selected:'basic'});
 const flight=buildBattleViewModel({s:after,execution,fxStage:'windup'}),landed=buildBattleViewModel({s:after,execution,fxStage:'impact'});
 expect(flight.hud.encounterCue).toEqual(before);expect(flight.result).toBeNull();
 expect(landed.result.encounterCue).toMatchObject({guarded:true,rate:.75,bonus:8});
 const v=render(<BattleHud hud={flight.hud} phase="flight" result={flight.result} refined/>);expect(v.queryByTestId('bv-encounter-applied')).toBeNull();
 v.rerender(<BattleHud hud={landed.hud} phase="result" result={landed.result} refined/>);
 expect(v.getByTestId('bv-encounter-applied').textContent).toContain('×0.75');expect(v.getByTestId('bv-encounter-applied').textContent).toContain('+8');
 expect(resultSequence(landed.result,execution).at(-1).text).toContain('HP −');
});
it('only arms Tide immediately after watching, and never claims a guaranteed course',()=>{
 const s=fight('tide-vesper'),watched=next(playV10Action(s,{type:'take'}));
 expect(publicEncounterCue(s)).toMatchObject({ready:false});expect(publicEncounterCue(watched)).toMatchObject({ready:true,text:'이번 안타 +5'});
 let failed=structuredClone(watched);failed.battle.history.push({action:'card',kind:'whiff'});
 expect(publicEncounterCue(failed).ready).toBe(false);expect(publicEncounterCue(failed).detail).toContain('선호');
});
it('shows actual composed limits and third-pitch conditions without promising a hit',()=>{
 for(const id of ['vulcan-blaze','onyx-eclipse']){
  let s=fight(id);for(let i=0;i<2;i++)s=next(playV10Action(s,{type:'take'}));
  const cue=publicEncounterCue(s);expect(cue.ready).toBe(true);expect(cue.steps).toEqual({count:3,current:2});
  expect(cue.text).toContain(id==='onyx-eclipse'?'2장':'안타');
 }
});
it('does not animate a zero-base guard, parse event strings or confuse bonus with overkill HP loss',()=>{
 const s=fight('jade-viper');
 expect(landedEncounterCue(s,{baseDamage:0,encounterPlan:{rate:.75,bonus:0,events:['추가 피해 +999']}})).toBeNull();
 expect(landedEncounterCue(s,{baseDamage:0,encounterPlan:{rate:.75,bonus:8}})).toMatchObject({guarded:false,rate:1,bonus:8});
 expect(resultSequence({kind:'hit',hpBefore:1,hpAfter:0,encounterCue:{label:'방패',text:'추가 피해 +8 HP'}}).at(-1).text).toBe('투수 HP −1');
 expect(resultSequence({kind:'whiff',damage:0,encounterCue:null,encounterEvents:['기본 피해 ×0.75']})).toEqual([]);
});
it('supports missing snapshots/older saves and suppresses disabled modes',()=>{
 const s=fight('jade-viper');
 for(const disabled of [{...s,version:11},{...s,defenseLab:{schema:1}},{...s,v10:{...s.v10,zoneFirst:true}},{...s,v10:{...s.v10,opponent:{...s.v10.opponent,encounter:undefined}}},{...s,battle:{...s.battle,intent:{...s.battle.intent,encounter:{...s.battle.intent.encounter,appliedDistribution:false}}}}]){
  expect(publicEncounterCue(disabled)).toBeNull();expect(landedEncounterCue(disabled,{baseDamage:10,encounterPlan:{rate:.75,bonus:8}})).toBeNull();
 }
 const after=playV10Action(s,{type:'take'}),vm=buildBattleViewModel({s:after,fxStage:'windup'});
 expect(vm.hud.encounterCue).toBeNull();expect(vm.hud.encounter).toBeTruthy();expect(vm.result).toBeNull();
});
