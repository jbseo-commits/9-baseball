import {describe,it,expect} from 'vitest';
import {PITCHER_ENCOUNTERS,encounterDistribution,encounterFor,encounterPlan,encounterLimits,encounterStatus} from '../src/duel/pitcher-encounters.js';
import {createRunMap} from '../src/duel/run-map.js';
import {applyPitcherOutcome} from '../src/duel/pitcher-hp.js';
import {baseIntent,createV10Duel,enterV10Node,redealPitch,v10DamageTerms,saveV10Duel,readV10Duel,setAimZone} from '../src/duel/engine.js';
import {trickRateFor,v10PitchDistribution,publicPitchBounds} from '../src/duel/swing-preview.js';

describe('unique pitcher encounters',()=>{
 it('covers all 20 roster slugs with distinct public signatures',()=>{
  const map=createRunMap(1234),seen=new Set();
  for(let seed=0;seed<120;seed++)for(const n of createRunMap(seed,{tutorial:true}).nodes)if(n.opponent?.artId)seen.add(n.opponent.artId);
  expect(seen.size).toBe(20);expect(Object.keys(PITCHER_ENCOUNTERS)).toHaveLength(20);
  expect(new Set(Object.values(PITCHER_ENCOUNTERS).map(x=>x.label)).size).toBe(20);
  expect(map.nodes.filter(n=>n.opponent).every(n=>n.opponent.encounter?.version===1)).toBe(true);
  expect(map.nodes.filter(n=>n.opponent).every(n=>n.opponent.style)).toBe(true);
 });
 it('keeps final advertised encounter odds normalized and outside live zones closed',()=>{
  let s=enterV10Node(createV10Duel(12),'a1-entry');
  s={...s,v10:{...s.v10,opponent:{...s.v10.opponent,artId:'jade-viper',gimmick:{id:'trick'},encounter:encounterFor('jade-viper')}}};
  for(const phase of ['steady','pressured','critical']){
   const state={...s,pitcher:{...s.pitcher,phase}},intent=baseIntent(state);
   expect(intent.probabilities.reduce((a,b)=>a+b,0)).toBeCloseTo(1,10);
   for(let z=0;z<9;z++)if(!intent.repertoire.includes(z))expect(intent.probabilities[z]).toBe(0);
   for(let seed=0;seed<200;seed++){
    const rolled=redealPitch(state,seed).battle.pending.zone;
    let r=seed>>>0;r=(Math.imul(r,1664525)+1013904223)>>>0;let x=r/4294967296,expected=9;
    for(let z=0;z<10;z++){x-=intent.probabilities[z];if(x<0){expected=z;break;}}
    expect(rolled).toBe(expected);
   }
  }
 });
 it('leaves old saves and isolated lab states opted out',()=>{
  const plain=createV10Duel(4);delete plain.runMap.nodes[0].opponent.encounter;
  expect(plain.runMap.nodes[0].opponent?.encounter).toBeUndefined();
  let s=enterV10Node(createV10Duel(9),'a1-entry');s={...s,defenseLab:{schema:1},v10:{...s.v10,opponent:{...s.v10.opponent,artId:'regular-02-teal-mirage',encounter:encounterFor('regular-02-teal-mirage')}}};
  expect(encounterDistribution(s,[1,1,1,1,1,1,1,1,1,1],[0,1,2,3,4,5,6,7,8])).toBeNull();
  expect(encounterPlan(s,{})).toEqual({rate:1,bonus:0,events:[]});
 });
 it('reports public status and enforces encounter-specific action limits across HP phases',()=>{
  let s=enterV10Node(createV10Duel(7),'a1-entry');
  s={...s,v10:{...s.v10,opponent:{...s.v10.opponent,artId:'onyx-eclipse',encounter:encounterFor('onyx-eclipse')}}};
  expect(encounterStatus(s)).toMatchObject({label:'오닉스 사각',active:true});
  s.battle.history=[{aimZone:0},{aimZone:1}];s.battle.pitchCount=2;expect(encounterLimits(s).stackMax).toBe(2);
  for(const phase of ['steady','pressured','critical']){
   const x={...s,pitcher:{...s.pitcher,phase}};
   expect(encounterPlan(x,{r:{kind:'hit',aimZone:1,zone:1}})).toEqual(expect.objectContaining({rate:1,events:expect.any(Array)}));
  }
 });
 it('adds encounter HP effects through the shared damage terms',()=>{
  let s=enterV10Node(createV10Duel(18),'a1-entry');
  s={...s,v10:{...s.v10,opponent:{...s.v10.opponent,artId:'regular-01-red-rush',encounter:encounterFor('regular-01-red-rush')}}};
  const terms=v10DamageTerms(s,{action:{type:'card'},choice:'basic',r:{kind:'hit',aimZone:4,zone:4,primaryCoverage:[4]},outcome:{kind:'hit',bases:1}});
  expect(terms.encounterPlan.bonus).toBe(2);expect(terms.damageBonus).toBeGreaterThanOrEqual(2);
 });
 it('activates a distinct signature effect for each of the 20 pitchers',()=>{
  const cases={
   'regular-01-red-rush':{r:{kind:'hit',aimZone:4,zone:4,primaryCoverage:[4]}},
   'regular-02-teal-mirage':{history:[{aimZone:0}],r:{kind:'hit',aimZone:4,zone:4}},
   'regular-03-amber-sinker':{r:{kind:'hit',aimZone:7,zone:7,primaryCoverage:[7]}},
   'regular-04-ivory-ace':{pitchCount:2,r:{kind:'hit',aimZone:4,zone:4}},
   'regular-05-violet-sting':{r:{kind:'hit',aimZone:4,zone:4,primaryCoverage:[4]}},
   'regular-06-rose-paint':{r:{kind:'hit',aimZone:0,zone:0,primaryCoverage:[0]}},
   'tide-vesper':{history:[{action:'take'}],r:{kind:'hit',aimZone:4,zone:4}},
   'sky-phantom':{r:{kind:'hit',aimZone:4,zone:4,bases:4}},
   'elite-01-cobalt-impact':{strikes:2,r:{kind:'hit',aimZone:4,zone:4}},
   'elite-02-neon-trick':{history:[{aimZone:0}],r:{kind:'hit',aimZone:4,zone:4}},
   'elite-03-wine-bluff':{action:{type:'take'},r:{kind:'ball'}},
   'gale-twister':{r:{kind:'hit',stackLinks:[{connected:true}]}},
   'vulcan-blaze':{pitchCount:2,r:{kind:'hit',aimZone:4,zone:4}},
   'jade-viper':{history:[{kind:'hit',exact:true}],r:{kind:'hit',aimZone:4,zone:4,primaryCoverage:[4]}},
   'copper-sirocco':{balls:2,r:{kind:'hit',aimZone:4,zone:4}},
   'boss-01-emerald-tyrant':{r:{kind:'hit',aimZone:7,zone:7,primaryCoverage:[7]}},
   'boss-02-platinum-halo':{stackCardCount:3,r:{kind:'hit',bases:4}},
   'boss-03-black-eclipse':{history:[{aimZone:0}],r:{kind:'hit',aimZone:4,zone:4,primaryCoverage:[4]}},
   'emerald-tempest':{pitchCount:2,r:{kind:'hit',stackLinks:[{connected:true}]}},
   'onyx-eclipse':{pitchCount:2,r:{kind:'hit',aimZone:4,zone:4,primaryCoverage:[4]}},
  };
  for(const [id,setup] of Object.entries(cases)){
   const state={version:10,v10:{opponent:{artId:id,encounter:encounterFor(id)}},battle:{history:[],pitchCount:0,balls:0,strikes:0},pitcher:{phase:'steady'},...setup};
   // Rebuild nested battle fields rather than sharing top-level fixture values.
   state.v10={opponent:{artId:id,encounter:encounterFor(id)}};
   state.battle={history:setup.history||[],pitchCount:setup.pitchCount||0,balls:setup.balls||0,strikes:setup.strikes||0};
   const p=encounterPlan(state,{action:setup.action||{type:'card'},r:setup.r,stackCardCount:setup.stackCardCount||1});
   expect(p.bonus>0||p.rate!==1,`${id} should have an active signature effect`).toBe(true);
   const off={...state,v10:{opponent:{artId:id,encounter:null}}};
   expect(encounterPlan(off,{action:setup.action||{type:'card'},r:setup.r,stackCardCount:setup.stackCardCount||1})).toEqual({rate:1,bonus:0,events:[]});
  }
 });
 it('keeps every signature live in all three HP phases without changing legacy baselines',()=>{
  let base=enterV10Node(createV10Duel(92),'a1-entry');
  for(const [id,entry] of Object.entries(PITCHER_ENCOUNTERS))for(const phase of ['steady','pressured','critical']){
   const opponent={...base.v10.opponent,artId:id,style:'rookie',zoneOpen:9,zoneMax:9,encounter:encounterFor(id)};
   const state={...base,pitcher:{...base.pitcher,phase},battle:{...base.battle,history:[{aimZone:0,kind:'take',action:'take'}],pitchCount:0},v10:{...base.v10,opponent}};
   const active=baseIntent(state),legacy=baseIntent({...state,v10:{...state.v10,opponent:{...opponent,encounter:null}}});
   expect(active.probabilities.reduce((a,b)=>a+b,0)).toBeCloseTo(1,10);
   expect(active.probabilities,`${id}/${phase}`).not.toEqual(legacy.probabilities);
   const plan=encounterPlan(state,{action:{type:'card'},r:{kind:'hit',aimZone:4,zone:4,primaryCoverage:[4]},stackCardCount:2});
   expect(plan.rate).toBeGreaterThanOrEqual(.7);expect(plan.rate).toBeLessThanOrEqual(1);expect(plan.bonus).toBeLessThanOrEqual(10);
  }
 });
 it('keeps patterns changing after the bounded history window and freezes pending pitch on aim changes',()=>{
  let s=enterV10Node(createV10Duel(62),'a1-entry');
  s={...s,v10:{...s.v10,opponent:{...s.v10.opponent,artId:'gale-twister',gimmick:{id:'trick'},encounter:encounterFor('gale-twister')}}};
  const pendingBefore=s.battle.pending,aimChanged=setAimZone(s,8);
  expect(aimChanged.battle.pending).toEqual(pendingBefore);
  expect(baseIntent({...s,battle:{...s.battle,aimZone:8}}).probabilities).toEqual(baseIntent(s).probabilities);
  const distributions=[];
  for(let pitchCount=19;pitchCount<=25;pitchCount++){
   const state={...s,battle:{...s.battle,pitchCount,history:Array.from({length:18},(_,i)=>({aimZone:i%9,action:'card'}))}};
   const intent=baseIntent(state);expect(intent.probabilities.reduce((a,b)=>a+b,0)).toBeCloseTo(1,10);distributions.push(intent.probabilities);
   const a=redealPitch(state,123).battle.pending.zone;
   expect(redealPitch(state,123).battle.pending.zone).toBe(a);
   expect(baseIntent({...state,battle:{...state.battle,aimZone:8}}).probabilities).toEqual(intent.probabilities);
  }
  expect(distributions.some((p,i)=>i>0&&p.some((v,z)=>v!==distributions[i-1][z]))).toBe(true);
 });
 it('preserves encounter metadata through save roundtrip',()=>{
  let s=enterV10Node(createV10Duel(81),'a1-entry');
  s={...s,v10:{...s.v10,opponent:{...s.v10.opponent,artId:'regular-06-rose-paint',encounter:encounterFor('regular-06-rose-paint')}}};
  const storage={value:null,setItem(_k,v){this.value=v;},getItem(){return this.value;}};
  saveV10Duel(storage,s);expect(readV10Duel(storage).v10.opponent.encounter.id).toBe('regular-06-rose-paint');
 });
 it('uses the same encounter rate for precision, runner pressure, preview terms, and applied damage',()=>{
  let s=enterV10Node(createV10Duel(24),'a1-entry');
  s={...s,battle:{...s.battle,history:[{aimZone:4}],bases:[{runner:'a'},{runner:'b'},null],bonusPressure:.5},
    v10:{...s.v10,opponent:{...s.v10.opponent,artId:'regular-02-teal-mirage',encounter:encounterFor('regular-02-teal-mirage')}}};
  const r={kind:'hit',aimZone:4,zone:4,primaryCoverage:[4]},outcome={kind:'hit',bases:1,aimZone:4,zone:4};
  const terms=v10DamageTerms(s,{action:{type:'card'},choice:'basic',r,outcome});
  expect(terms.encounterPlan.rate).toBe(.8);expect(terms.damageMultiplier).toBe(.8);
  expect(terms.precisionBonus).toBe(5);expect(terms.runnerBonus).toBe(2);
  const applied=applyPitcherOutcome(s.pitcher,outcome,{damageMultiplier:terms.damageMultiplier,damageBonus:terms.damageBonus});
  expect(applied.result.damage).toBe(Math.round(12*.8)+terms.damageBonus);
 });
 it('matches final preview odds and public bounds for 20 signatures, three HP phases, and three read levels',()=>{
  const base=enterV10Node(createV10Duel(39),'a1-entry');
  for(const id of Object.keys(PITCHER_ENCOUNTERS))for(const phase of ['steady','pressured','critical'])for(const read of [0,1,2]){
   const deck=Array.from({length:read===0?0:read===1?2:4},(_,i)=>({id:`obs${i}`,kind:'scout'}));
   let state={...base,deck,relics:[],pitcher:{...base.pitcher,phase},battle:{...base.battle,history:[{aimZone:0,kind:'take',action:'take'}],pitchCount:19}};
   state={...state,v10:{...state.v10,opponent:{...state.v10.opponent,artId:id,gimmick:{id:'trick'},encounter:encounterFor(id)}}};
   state.battle.intent=baseIntent(state);
   const actual=v10PitchDistribution(state),advertised=state.battle.intent.probabilities;
   expect(trickRateFor(state),`${id}/${phase}/${read}`).toBe(0);
   expect(actual).toEqual(advertised);
   expect(actual.reduce((a,b)=>a+b,0)).toBeCloseTo(1,10);
   const bounds=publicPitchBounds(state);
   actual.forEach((p,z)=>expect(p,`${id}/${phase}/${read}/${z}`).toBeGreaterThanOrEqual(bounds[z][0]-1e-9));
   actual.forEach((p,z)=>expect(p,`${id}/${phase}/${read}/${z}`).toBeLessThanOrEqual(bounds[z][1]+1e-9));
   const known={...state,battle:{...state.battle,pending:{zone:4},scouted:true,scoutPlus:false,scoutBall:false}};
   const conditioned=v10PitchDistribution(known),knownZones=conditioned.map((p,z)=>p>0?z:-1).filter(z=>z>=0);
   expect(conditioned.reduce((a,b)=>a+b,0)).toBeCloseTo(1,9);
   expect(knownZones.every(z=>Math.floor(z/3)===1)).toBe(true);
   const conditionedBounds=publicPitchBounds(known);
   for(let z=0;z<10;z++){expect(conditionedBounds[z][0]).toBeLessThanOrEqual(conditioned[z]+1e-9);expect(conditionedBounds[z][1]).toBeGreaterThanOrEqual(conditioned[z]-1e-9);}
  }
 });
});
