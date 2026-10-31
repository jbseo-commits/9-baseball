import {describe,it,expect} from 'vitest';
import * as E from '../src/duel/engine.js';
import {previewSwing,previewAfterSkill,v10HitBounds} from '../src/duel/swing-preview.js';
import {pitcherIntentIcon} from '../src/duel/intent-icon.js';
import {probabilityBounds} from '../src/duel/information.js';

function battle(kind='pinpoint'){
  let s=E.enterV10Node(E.createV10Duel(1),'a1-entry');
  s.deck[0].kind=kind;s.deck[1].kind='focusBreath';s.deck[2].kind='taunt';
  s.battle.hand=['c0','c1','c2'];s.battle.draw=s.deck.slice(3).map(c=>c.id);s.battle.discard=[];
  s.battle.energy=4;s.battle.energyCap=4;s.battle.aimZone=4;
  return s;
}

describe('today forecast review regressions',()=>{
  it('a covered bunt predicts sacrifice and foul, never a hit',()=>{
    const s=battle('bunt'),p=previewSwing(s,{id:'c0'});
    expect(p.hitChance).toBe(0);expect(p.hitBounds).toEqual([0,0]);
    expect(p.outcomes.some(o=>o.kind==='sacrifice')).toBe(true);
    expect(p.outcomes.some(o=>o.kind==='hit')).toBe(false);
  });
  it.each(['moonshot','gapHunter','sinkerBuster'])('includes real extra-base HP for %s',kind=>{
    const s=battle(kind),p=previewSwing(s,{id:'c0'});
    for(const o of p.outcomes.filter(o=>o.kind==='hit'&&o.zone===4)){
      const t=structuredClone(s),types=E.hitProfile(t,'c0',4,p.coverage.length);
      let acc=0;for(const ty of types){if(ty.label===o.label){t.battle.pending={zone:4,roll:0,powerRoll:acc+ty.p/2};break;}acc+=ty.p;}
      const n=E.playV10Action(t,{type:'card',id:'c0'});
      expect(n.v10.lastCombat.damage,o.label).toBe(o.damage);
    }
  });
  it('keeps already-earned scouting through an unrelated preparation',()=>{
    const s=battle();s.battle.scouted=true;s.battle.scoutPlus=true;s.battle.pending.zone=4;
    const raw=JSON.stringify(s),next=previewAfterSkill(s,'c1');
    expect(next.battle.scouted).toBe(true);expect(next.battle.scoutPlus).toBe(true);
    expect(previewSwing(next,{id:'c0'}).hitChance).toBeCloseTo(1);
    expect(JSON.stringify(s)).toBe(raw);
  });
  it('a fully scouted trick pitch is already at its final zone',()=>{
    const s=battle();s.v10.opponent.gimmick={id:'trick'};s.battle.scouted=true;s.battle.scoutPlus=true;s.battle.pending.zone=4;
    expect(v10HitBounds(s,[4])).toEqual([1,1]);
    expect(v10HitBounds(s,[0])).toEqual([0,0]);
  });
  it('identical public cells cannot yield different low-read intent labels',()=>{
    const a=battle(),b=structuredClone(a);
    a.battle.intent.probabilities=[...Array(9).fill(.71/9),.29];
    b.battle.intent.probabilities=[...Array(9).fill(.69/9),.31];
    expect(E.readLevel(a)).toBe(0);expect(probabilityBounds(a)).toEqual(probabilityBounds(b));
    expect(pitcherIntentIcon(a)).toEqual(pitcherIntentIcon(b));
  });
  it('damage endpoints do not reveal hidden zeroes inside the same coarse public bucket',()=>{
    const a=battle('moonshot'),b=structuredClone(a);
    a.battle.intent.probabilities=[.1,.1,.1,.1,0,.1,.1,.1,.1,.2];
    b.battle.intent.probabilities=[.1,.1,.1,.1,.01,.1,.1,.1,.1,.19];
    expect(probabilityBounds(a)).toEqual(probabilityBounds(b));
    const p=previewSwing(a,{id:'c0'}),q=previewSwing(b,{id:'c0'});
    expect(p.hitChance).not.toBe(q.hitChance);
    expect(p.hitBounds).toEqual(q.hitBounds);
    expect([p.dmgMin,p.dmgMax]).toEqual([q.dmgMin,q.dmgMax]);
  });
  it('coarse partial scouting on trick pitchers conditions the centralized final landing distribution',()=>{
    const s=battle();s.v10.opponent.gimmick={id:'trick'};s.battle.scouted=true;s.battle.pending.zone=4;
    expect(v10HitBounds(s,[3,4,5])).toEqual([1,1]);
    expect(v10HitBounds(s,[0,1,2])).toEqual([0,0]);
    const [low,high]=v10HitBounds(s,[4]);
    expect(low).toBeGreaterThan(0);expect(high).toBeLessThan(1);expect(low).toBeLessThan(high);
  });
});
