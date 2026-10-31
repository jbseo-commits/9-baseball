import {describe,it,expect} from 'vitest';
import {CARDS} from '../src/duel/cards.js';
import {createV10Duel,enterV10Node,v10PrepMax,publicLandingZones,advanceV10Pitch,advanceV10Batter,playV10Action} from '../src/duel/engine.js';
import {pitcherDamageFor} from '../src/duel/pitcher-hp.js';
import {previewAfterSkill,previewSwing} from '../src/duel/swing-preview.js';
import {validateV10State,saveV10State,readV10State,V10_SAVE_KEY} from '../src/duel/v10-storage.js';
import {playableRequest,startPlayableRun} from '../src/duel/battle-vnext/PlayableRun.jsx';
import {playableStorage,PLAYABLE_PREFIX} from '../src/duel/battle-vnext/playable-storage.js';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';
import {encounterDamageRule,encounterGuardZones,encounterPitchPlan,encounterIntentLine,commitEncounterPitch,snapshotEncounterPitch} from '../src/duel/encounter-pilot-v1.js';

const pilotBattle=(id,seed=101)=>enterV10Node(createV10Duel(seed,{encounterPilot:id}),'a1-entry');

describe('versioned encounter pilot v1',()=>{
  it('is explicit opt-in, loads real tiered opponents, and leaves art ids alone by default',()=>{
    const legacy=createV10Duel(101);
    expect(legacy.v10.encounterPilot).toBeUndefined();
    expect(legacy.runMap.nodes.some(n=>n.opponent?.encounterPilot)).toBe(false);
    for(const [id,type] of [['red','battle'],['teal','battle'],['cobalt','elite'],['tyrant','boss']]){
      const run=pilotBattle(id);
      expect(run.phase).toBe('battle');expect(run.runMap.nodes.find(n=>n.id==='a1-entry').type).toBe(type);
      expect(run.v10.opponent).toMatchObject({encounterPilot:{version:1,id},artId:expect.any(String)});
      expect(run.v10.opponent.maxHp).toBe(run.pitcher.maxHp);
      expect(run.battle.encounter).toMatchObject({version:1,id,committedPitches:0,currentPitch:{pitchNumber:1}});
      expect(validateV10State(run)).toBe(true);
      if(id==='tyrant')expect(run.battle.pending.encounter.guardZones).toEqual([6,7,8]);
      if(id==='red'||id==='cobalt')expect(run.battle.intent.kind).toBe('fastball');
      if(['red','teal','cobalt'].includes(id)){
        const mapPitcher=run.runMap.nodes.find(n=>n.id==='a1-entry').opponent;
        expect(mapPitcher.openingZones).toEqual(run.battle.intent.repertoire);
        expect(mapPitcher.zoneOpen).toBe(run.battle.intent.repertoire.length);
        expect(mapPitcher.zoneMax).toBe(id==='red'?3:id==='teal'?3:6);
      }
    }
    const legacyRed=enterV10Node(legacy,'a1-entry');legacyRed.v10.opponent.artId='regular-01-red-rush';
    expect(legacyRed.v10.encounterPilot).toBeUndefined();
    expect(v10PrepMax(pilotBattle('cobalt'))).toBe(2);
    const legacyPressure=enterV10Node(createV10Duel(102),'a1-entry');
    legacyPressure.v10.opponent.gimmick={id:'pressure'};legacyPressure.pitcher.hp=Math.floor(legacyPressure.pitcher.maxHp*.5);legacyPressure.pitcher.phase='pressured';
    expect(legacyPressure.battle.encounter).toBeUndefined();expect(v10PrepMax(legacyPressure)).toBe(1);
  });

  it('uses actual-pitch counters for the pitch plans and preserves the snapshot after prep preview clears pending',()=>{
    const red=pilotBattle('red');
    expect(encounterPitchPlan(red).zones).toEqual([5]);
    const pilot=red.battle.encounter,snap=red.battle.pending.encounter;
    commitEncounterPitch(pilot,snap,{kind:'called',zone:5},null,[]);
    expect(encounterPitchPlan({...red,battle:{...red.battle,encounter:{...pilot,committedPitches:1}}}).zones).toEqual([5]);
    expect(encounterPitchPlan({...red,battle:{...red.battle,encounter:{...pilot,committedPitches:2}}}).zones).toEqual([2,5]);
    const teal=pilotBattle('teal');
    expect(encounterPitchPlan(teal).zones).toEqual([2,5,8]);
    expect(encounterPitchPlan({...teal,battle:{...teal.battle,encounter:{...teal.battle.encounter,committedPitches:2}}}).zones).toEqual([1,4,7]);
    const cobalt=pilotBattle('cobalt');
    expect(encounterPitchPlan(cobalt).ballChance).toBe(.08);
    cobalt.battle.strikes=2;
    expect(encounterPitchPlan(cobalt)).toMatchObject({zones:[0,1,3,4,6,7],ballChance:.04});

    const skill=red.battle.hand.find(id=>CARDS[red.deck.find(c=>c.id===id)?.kind]?.type==='skill');
    if(skill){
      const prepared=previewAfterSkill(red,skill);
      expect(prepared.battle.pending).toBeNull();
      expect(prepared.battle.encounter.currentPitch).toEqual(red.battle.pending.encounter);
      expect(encounterDamageRule(prepared,{kind:'hit',aimZone:4,primaryCoverage:[4]},{kind:'hit',zone:7})).toMatchObject({efficiency:1,reason:null});
    }
  });

  it('marks legacy trick destinations as live using final landings without exposing a scouted location',()=>{
    const s=enterV10Node(createV10Duel(119),'a1-entry');
    s.v10.opponent.gimmick={id:'trick'};
    const source=new Set(s.battle.intent.repertoire),landings=publicLandingZones(s),added=landings.filter(z=>!source.has(z));
    expect(added.length).toBeGreaterThan(0);
    const vm=buildBattleViewModel({s,hand:[]});
    expect(added.every(z=>vm.zones.cells[z].live&&vm.zones.cells[z].face!=='안 던짐')).toBe(true);
    const scouted={...s,battle:{...s.battle,scouted:true,scoutPlus:true}};
    expect(publicLandingZones(scouted)).toEqual(landings);
    expect(buildBattleViewModel({s:scouted,hand:[]}).zones.cells.some(c=>c.face==='단서 밖')).toBe(true);
  });

  it('keeps the committed intent locked through result flight and advances it only on the next deal',()=>{
    let teal=pilotBattle('teal');
    teal.battle.pending.zone=5;teal=playV10Action(teal,{type:'take'});teal=advanceV10Pitch(teal);
    teal.battle.pending.zone=5;teal=playV10Action(teal,{type:'take'});
    expect(teal.battle.encounter.currentPitch.intent).toBe('바깥쪽 고집');
    expect(encounterPitchPlan(teal).name).toBe('가운데로 돌아온다');
    expect(encounterIntentLine(teal,{locked:true})).toBe('바깥쪽 고집');
    teal=advanceV10Pitch(teal);
    expect(encounterIntentLine(teal,{locked:true})).toBe('가운데로 돌아온다');

    let cobalt=pilotBattle('cobalt');
    cobalt.battle.pending.zone=0;cobalt=playV10Action(cobalt,{type:'take'});cobalt=advanceV10Pitch(cobalt);
    cobalt.battle.pending.zone=0;cobalt=playV10Action(cobalt,{type:'take'});
    expect(cobalt.battle.strikes).toBe(2);
    expect(cobalt.battle.encounter.currentPitch.intent).toContain('안쪽 3존');
    expect(encounterIntentLine(cobalt,{locked:true})).toContain('안쪽 3존');
    cobalt=advanceV10Pitch(cobalt);
    expect(encounterIntentLine(cobalt,{locked:true})).toContain('6존');
  });

  it('keeps Teal on its own third-pitch candidates after two real hits and batter advances',()=>{
    let teal=pilotBattle('teal',902);
    for(let i=0;i<2;i++){
      teal.battle.pending.zone=5;teal.battle.pending.roll=0;teal.battle.pending.powerRoll=0;teal.battle.aimZone=5;
      teal=playV10Action(teal,{type:'card',id:'basic'});
      expect(teal.battle.revealed.kind).toBe('hit');
      expect(teal.phase).toBe('between');
      teal=advanceV10Batter(teal);
    }
    expect(teal.battle.batterIndex).toBe(2);
    expect(teal.battle.encounter.committedPitches).toBe(2);
    expect(teal.battle.intent.repertoire).toEqual([1,4,7]);
    expect(teal.battle.intent.name).toBe('가운데로 돌아온다');
    expect(teal.battle.intent.detail).not.toContain('타석마다 넓어집니다');
    expect(teal.last.events.some(x=>x.includes('레퍼토리 확장'))).toBe(false);
  });

  it('snapshots the Tyrant wall at deal, opens only on an exact main hit, and consumes two committed pitches',()=>{
    const s=pilotBattle('tyrant');
    expect(encounterGuardZones(s)).toEqual([6,7,8]);
    s.pitcher.hp=Math.floor(s.pitcher.maxHp*.6);
    expect(encounterGuardZones(s)).toEqual([4,6,7,8]);
    const closed=s.battle.pending.encounter;
    expect(encounterDamageRule(s,{kind:'hit',aimZone:4,primaryCoverage:[4]},{kind:'hit',zone:6})).toMatchObject({efficiency:.75});
    const encounter=commitEncounterPitch(s.battle.encounter,{encounter:closed},{kind:'hit',assistOnly:false,zone:6},6,[6]);
    expect(encounter.guardOpenPitchesRemaining).toBe(2);
    const openState={...s,battle:{...s.battle,encounter, pending:{encounter:snapshotEncounterPitch({...s,battle:{...s.battle,encounter}})}}};
    expect(encounterDamageRule(openState,{kind:'hit',aimZone:7,primaryCoverage:[7]},{kind:'hit',zone:7})).toMatchObject({efficiency:1.25});
    const one=commitEncounterPitch(encounter,openState.battle.pending,{kind:'ball',zone:9},null,[]);
    expect(one.guardOpenPitchesRemaining).toBe(1);
    const secondSnap=snapshotEncounterPitch({...s,battle:{...s.battle,encounter:one}});
    const zero=commitEncounterPitch(one,{encounter:secondSnap},{kind:'called',zone:7},7,[7]);
    expect(zero.guardOpenPitchesRemaining).toBe(0);
    expect(zero.committedPitches).toBe(3);
  });

  it('matches forecast damage to real HP and consumes the live two-pitch window through gameplay and save',()=>{
    let s=pilotBattle('tyrant',707);
    const makeExactHit=(state,zone)=>{
      state.battle.pending.zone=zone;state.battle.pending.roll=0;state.battle.pending.powerRoll=0;
      state.battle.aimZone=zone;state.battle.scouted=true;state.battle.scoutPlus=true;
      const forecast=previewSwing(state,{id:'basic'}),expected=forecast.outcomes.find(o=>o.kind==='hit'&&o.zone===zone);
      expect(expected).toBeTruthy();
      const next=playV10Action(state,{type:'card',id:'basic'});
      expect(next.battle.revealed.kind).toBe('hit');
      expect(next.v10.lastCombat.damage).toBe(expected.damage);
      return next;
    };
    const wall=s.battle.pending.encounter.guardZones.find(z=>s.battle.intent.probabilities[z]>0);
    expect(wall).toBeDefined();
    s=makeExactHit(s,wall);
    expect(s.battle.encounter.guardOpenPitchesRemaining).toBe(2);
    expect(s.battle.revealed.encounterMessage).toContain('빈틈');
    expect(s.v10.lastCombat.damageEfficiency).toBe(1);
    expect(validateV10State(s)).toBe(true);
    let next=s.phase==='between'?advanceV10Batter(s):advanceV10Pitch(s);
    expect(next.battle.pending.encounter.guardOpen).toBe(true);
    expect(validateV10State(next)).toBe(true);
    const openZone=next.battle.pending.encounter.guardZones.find(z=>next.battle.intent.probabilities[z]>0);
    next=makeExactHit(next,openZone);
    expect(next.v10.lastCombat.damageEfficiency).toBe(1.25);
    expect(next.battle.encounter.guardOpenPitchesRemaining).toBe(1);
    const one=next.phase==='between'?advanceV10Batter(next):advanceV10Pitch(next);
    const watched=playV10Action(one,{type:'take'});
    expect(watched.battle.encounter.guardOpenPitchesRemaining).toBe(0);
  });

  it('applies the separate HP efficiency after existing multiplier and flat bonuses with one shared rounding step',()=>{
    const outcome={kind:'hit',label:'단타',bases:1};
    const normal=pitcherDamageFor(outcome,0,{damageMultiplier:1.5,damageBonus:3});
    const weak=pitcherDamageFor(outcome,0,{damageMultiplier:1.5,damageBonus:3,damageEfficiency:.75});
    expect(weak.beforeEfficiency).toBe(normal.damage);
    expect(weak.damage).toBe(Math.max(1,Math.round(normal.damage*.75)));
  });

  it('validates pilot saves and keeps preview storage namespaced without changing normal resume',()=>{
    const run=pilotBattle('teal',17),memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
    saveV10State(storage,run);expect(readV10State(storage)).toEqual(run);
    expect(storage.getItem(V10_SAVE_KEY)).not.toBeNull();
    const bad=structuredClone(run);bad.v10.encounterPilot.id='not-a-pilot';expect(validateV10State(bad)).toBe(false);
    const badActiveTag=structuredClone(run);badActiveTag.v10.opponent.encounterPilot.version=2;expect(validateV10State(badActiveTag)).toBe(false);
    const badSnapshot=structuredClone(run);badSnapshot.battle.encounter.currentPitch.version=2;expect(validateV10State(badSnapshot)).toBe(false);
    expect(playableRequest('?encounterPilot=teal&seed=17').namespace).toBe('encounter-teal-17');
    expect(playableRequest('?encounterPilot=teal').seed).toBe(1);
    const isolated=playableStorage({getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},'encounter-teal-17');
    saveV10State(isolated,run);expect(memory.has(PLAYABLE_PREFIX+'encounter-teal-17:'+V10_SAVE_KEY)).toBe(true);
    const normalStore=playableStorage();
    const oldNormal=enterV10Node(createV10Duel(3),'a1-entry');saveV10State(normalStore,oldNormal);
    expect(startPlayableRun(normalStore,'?seed=999')).toEqual(oldNormal);
  });
});
