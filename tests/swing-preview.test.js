import {describe,it,expect} from 'vitest';
import * as E from '../src/duel/engine.js';
import {CARDS} from '../src/duel/cards.js';
import {previewSwing,v10PitchDistribution,previewAfterSkill,formatHitChance} from '../src/duel/swing-preview.js';

function pinHand(s,ids=['c0','c1','c2','c3','c4']){const b=s.battle,pool=[...b.hand,...b.draw,...b.discard].filter(id=>!ids.includes(id));b.hand=[...ids];b.draw=pool;b.discard=[];return s;}
function battle(seed=2201){return pinHand(E.enterV10Node(E.createV10Duel(seed),'a1-entry'));}
function withKinds(s,kinds){kinds.forEach((k,i)=>{s.deck.find(c=>c.id==='c'+i).kind=k;});return s;}

/* force the dealt pitch so the real resolution lands on one chosen preview outcome */
function forced(s,o,id,supports){
  const t=structuredClone(s),b=t.battle;
  const odds=E.swingOdds(t,id,o.zone);
  let roll=.5,powerRoll=.5;
  if(o.kind==='hit'&&o.label!=='겹친 카드 단타'){
    const types=E.hitProfile(t,id,o.zone,previewSwing(t,{id,supports}).coverage.length);let acc=0;
    for(const ty of types){if(ty.label===o.label){powerRoll=acc+ty.p/2;break;}acc+=ty.p;}
  }else if(o.kind==='foul')roll=odds.foul/2;
  else if(o.kind==='sacrifice')roll=odds.foul+odds.sacrifice/2;
  else if(o.kind==='whiff')roll=odds.foul+(odds.sacrifice||0)+(odds.out||0)+odds.whiff/2;
  b.pending={zone:o.zone,roll,powerRoll};b.scouted=false;
  return t;
}

const PLANS=[
  {name:'기본 스윙',kinds:[],id:'basic',supports:[]},
  {name:'정밀 1존',kinds:['pinpoint','rally','slug','strike','eyeLevel'],id:'c0',supports:[]},
  {name:'장타',kinds:['slug','rally','pinpoint','strike','eyeLevel'],id:'c0',supports:[]},
  {name:'2장 스택',kinds:['strike','pinpoint','slug','rally','eyeLevel'],id:'c0',supports:[{id:'c1',aimZone:8}]},
  {name:'흔들림 카드',kinds:['pressureBat','pinpoint','slug','rally','eyeLevel'],id:'c0',supports:[]},
];

function scenario(seed,plan,tweak){
  let s=withKinds(battle(seed),plan.kinds);
  s.battle.energy=4;s.battle.energyCap=4;
  if(tweak)tweak(s);
  return s;
}
const TWEAKS=[
  ['빈 베이스',null],
  ['주자 2명 · 기세 2 · 흔들림 1',s=>{s.battle.bases=['p2',null,'p3'];s.battle.momentum=2;s.battle.shaken=1;}],
  ['2스트라이크 · 파울 연속',s=>{s.battle.strikes=2;s.pitcher.foulStreak=1;s.battle.bases=[null,'p2',null];}],
];

describe('swing preview = real judgement',()=>{
  it('every previewed outcome deals exactly the HP the real resolution deals',()=>{
    let checked=0;
    for(const plan of PLANS)for(const [,tweak] of TWEAKS)for(const aim of [0,4,8]){
      const s=scenario(2201,plan,tweak);s.battle.aimZone=aim;
      const pv=previewSwing(s,{id:plan.id,supports:plan.supports});
      expect(pv,plan.name).toBeTruthy();
      for(const o of pv.outcomes){
        const t=forced(s,o,plan.id,plan.supports);
        const next=E.playV10Action(t,{type:'card',id:plan.id,supports:plan.supports});
        expect(next,plan.name+' '+o.label).not.toBe(t);
        expect(next.v10.lastCombat.damage,plan.name+' · '+o.label+' · zone '+o.zone).toBe(o.damage);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('10,000 real pitches land within ±2%p of the previewed hit chance and match the expected HP',()=>{
    const report=[];
    for(const plan of PLANS.slice(0,4)){
      const tweaked=scenario(2201,plan,TWEAKS[1][1]);tweaked.battle.aimZone=4;
      const s=E.redealPitch(tweaked); // the tweak (흔들림) changes the pitcher's intent: deal under it
      const pv=previewSwing(s,{id:plan.id,supports:plan.supports});
      let hits=0,hp=0;const N=10000;
      for(let i=0;i<N;i++){
        const dealt=E.redealPitch(s,(i*2654435761+12345)>>>0);
        const next=E.playV10Action(dealt,{type:'card',id:plan.id,supports:plan.supports});
        if(next.battle.revealed.kind==='hit')hits++;
        hp+=next.v10.lastCombat.damage;
      }
      report.push(`${plan.name}: 표시 ${(pv.hitChance*100).toFixed(1)}% · 실제 ${(hits/N*100).toFixed(1)}% · 기대 HP ${pv.expected.toFixed(2)} / 실제 ${(hp/N).toFixed(2)}`);
      expect(Math.abs(hits/N-pv.hitChance),plan.name).toBeLessThan(.02);
      expect(Math.abs(hp/N-pv.expected),plan.name).toBeLessThan(Math.max(.35,pv.expected*.05));
    }
    console.log('[P1 10k sim]\n'+report.join('\n'));
  },120000);

  it('a trick pitcher previews the neighbour shift that dealPitch really applies',()=>{
    const s=scenario(2201,PLANS[1],null);
    s.v10.opponent={...(s.v10.opponent||{}),gimmick:{id:'trick'}};
    s.battle.aimZone=4;s.battle.balls=0;s.battle.strikes=0;
    const shifted=E.redealPitch(s);
    const pv=previewSwing(shifted,{id:'c0',supports:[]});
    const plain=E.publicProbabilities(shifted).slice(0,9).reduce((a,v,z)=>a+(z===4?v:0),0);
    if(E.v10GimmickRules(shifted).trickRate>0)expect(pv.hitChance).not.toBeCloseTo(plain,3);
    let hits=0;const N=10000;
    for(let i=0;i<N;i++){const d=E.redealPitch(shifted,(i*2246822519+7)>>>0);if(E.playV10Action(d,{type:'card',id:'c0'}).battle.revealed.kind==='hit')hits++;}
    expect(Math.abs(hits/N-pv.hitChance)).toBeLessThan(.02);
    expect(v10PitchDistribution(shifted).reduce((a,v)=>a+v,0)).toBeCloseTo(1,9);
  },60000);

  it('never reads the hidden pitch: two deals of the same state preview identically',()=>{
    const s=scenario(2201,PLANS[3],TWEAKS[1][1]);
    const a=previewSwing(E.redealPitch(s,1),{id:'c0',supports:[{id:'c1',aimZone:8}]});
    const b=previewSwing(E.redealPitch(s,999),{id:'c0',supports:[{id:'c1',aimZone:8}]});
    expect(a.hitChance).toBe(b.hitChance);expect(a.dmgMin).toBe(b.dmgMin);expect(a.dmgMax).toBe(b.dmgMax);expect(a.expected).toBe(b.expected);
  });

  it('names the runner multiplier and hides it with empty bases; a wider stack lowers HP per hit',()=>{
    const solo=scenario(2201,PLANS[1],null);solo.battle.aimZone=4;
    const pv=previewSwing(solo,{id:'c0'});
    expect(pv.reasons.some(r=>r.key==='runners')).toBe(false);
    const loaded=scenario(2201,PLANS[1],s=>{s.battle.bases=['p2','p3',null];});loaded.battle.aimZone=4;
    const lv=previewSwing(loaded,{id:'c0'});
    expect(lv.multiplierReason).toContain('+20% (주자 2명)');
    expect(lv.dmgMax).toBeGreaterThan(pv.dmgMax);
    const stack=scenario(2201,PLANS[3],null);stack.battle.aimZone=4;
    const one=previewSwing(stack,{id:'c0'}),two=previewSwing(stack,{id:'c0',supports:[{id:'c1',aimZone:0}]});
    expect(two.hitChance).toBeGreaterThanOrEqual(one.hitChance);
    expect(two.multiplier).toBeLessThan(one.multiplier);
  });

  it('a preparation preview applies the real card effect without revealing a scout',()=>{
    let s=withKinds(battle(2201),['pinpoint','focusBreath','coldRead','rally','slug']);s.battle.energy=4;s.battle.energyCap=4;s.battle.aimZone=4;
    const before=previewSwing(s,{id:'c0'});
    const after=previewSwing(previewAfterSkill(s,'c1'),{id:'c0'});
    expect(after.dmgMax).toBeGreaterThan(before.dmgMax); // 집중 호흡: 정확 적중 +40%
    const scout=previewAfterSkill(s,'c2');
    expect(scout.battle.scouted).toBe(true); // the deterministic scouted damage bonus is active
    expect(scout.battle.pending).toBeNull(); // its newly earned clue is unavailable until played
    expect(previewSwing(scout,{id:'c0'}).hitChance).toBe(before.hitChance);
    expect(previewAfterSkill(s,'c0')).toBeNull();
    expect(CARDS.focusBreath.type).toBe('skill');
  });

  it('formats exact and public-range chances without inventing digits',()=>{
    expect(formatHitChance([.724,.724])).toBe('72%');
    expect(formatHitChance([.30,.45])).toBe('30–45%');
    expect(formatHitChance([0,0])).toBe('0%');
    expect(formatHitChance([1,1])).toBe('100%');
  });
});
