import {describe,it,expect} from 'vitest';
import * as E from '../src/duel/engine.js';
import {CARDS} from '../src/duel/cards.js';
import {previewSwing,v10PitchDistribution,publicPitchBounds} from '../src/duel/swing-preview.js';

const start=(seed=1,shot=true)=>{const s=E.enterV10Node(E.createV10Duel(seed),'a1-entry');s.v10={...s.v10,shotMode:shot};return s;};
const missAim=s=>[0,1,2,3,4,5,6,7,8].find(z=>z!==s.battle.pending.zone&&s.battle.intent.probabilities[z]>0)??[0,1,2,3,4,5,6,7,8].find(z=>z!==s.battle.pending.zone);
const inZone=seed=>{for(let i=seed;i<seed+200;i++){const s=start(i);if(s.battle.pending.zone<9)return s;}throw new Error('no strike-zone pitch');};

describe('사격 모드 (시범)',()=>{
  it('a miss keeps the same pitch, costs one strike, crosses the cell out and raises the rest',()=>{
    let s=inZone(1);const zone=s.battle.pending.zone,before=E.publicProbabilities(s);
    s=E.setAimZone(s,missAim(s));const aim=s.battle.aimZone;
    const n=E.playV10Action(s,{type:'card',id:'basic'});
    expect(n.phase).toBe('battle');
    expect(n.battle.pending.zone).toBe(zone);
    expect(n.battle.strikes).toBe(1);
    expect(n.stats.pitches).toBe(s.stats.pitches);
    expect(n.battle.shot).toEqual({n:1,missed:[aim]});
    expect(n.last.kind).toBe('shot');
    const after=E.publicProbabilities(n);
    expect(after[aim]).toBe(0);
    expect(after.reduce((a,x)=>a+x,0)).toBeCloseTo(1,9);
    for(let z=0;z<10;z++)if(z!==aim&&before[z]>0)expect(after[z]).toBeGreaterThan(before[z]);
    for(const [lo,hi] of [publicPitchBounds(n)[aim]])expect([lo,hi]).toEqual([0,0]);
  });

  it('a card shot spends the card and its energy like a swing',()=>{
    let s=inZone(3);
    const id=s.battle.hand.find(x=>CARDS[s.deck.find(c=>c.id===x).kind].type==='attack'&&!E.cardProblem(s,x)&&!CARDS[s.deck.find(c=>c.id===x).kind].bunt);
    expect(id).toBeTruthy();
    const aim=[0,1,2,3,4,5,6,7,8].find(z=>!E.coverageAt(s,id,z).includes(s.battle.pending.zone));
    s=E.setAimZone(s,aim);
    const n=E.playV10Action(s,{type:'card',id});
    expect(n.battle.hand).not.toContain(id);expect(n.battle.discard).toContain(id);
    expect(E.v10Energy(n)).toBe(E.v10Energy(s)-E.v10ActionCost(s,id));
    expect(n.battle.shot.missed).toEqual(E.coverageAt(s,id,aim));
  });

  it('the hit after a miss lands with the later-shot rate (×1.2 first, ×1.0 second)',()=>{
    const s0=inZone(5);
    const first=E.playV10Action(E.setAimZone(s0,s0.battle.pending.zone),{type:'card',id:'basic'});
    expect(first.battle.revealed.kind).toBe('hit');
    const missed=E.playV10Action(E.setAimZone(s0,missAim(s0)),{type:'card',id:'basic'});
    const second=E.playV10Action(E.setAimZone(missed,s0.battle.pending.zone),{type:'card',id:'basic'});
    expect(second.battle.revealed.kind).toBe('hit');
    expect(first.v10.lastCombat.damageRate/second.v10.lastCombat.damageRate).toBeCloseTo(1.2,6);
    expect(second.battle.shot).toBeUndefined();
  });

  it('at two strikes a miss goes to the normal judgement (strikeout, or a card foul)',()=>{
    let s=inZone(7);s.battle.strikes=2;
    const n=E.playV10Action(E.setAimZone(s,missAim(s)),{type:'card',id:'basic'});
    expect(n.stats.pitches).toBe(s.stats.pitches+1);
    expect(['헛스윙 삼진','파울']).toContain(n.battle.revealed.label);
  });

  it('is off unless the run turns it on; the old swing still resolves the pitch',()=>{
    const s=start(9,false);
    const n=E.playV10Action(E.setAimZone(s,missAim(s)),{type:'card',id:'basic'});
    expect(n.stats.pitches).toBe(s.stats.pitches+1);
    expect(n.battle.shot).toBeUndefined();
  });

  it('the forecast matches the narrowed pitch and shows no damage for a miss before two strikes',()=>{
    let s=inZone(11);s=E.playV10Action(E.setAimZone(s,missAim(s)),{type:'card',id:'basic'});
    const aim=[0,1,2,3,4,5,6,7,8].find(z=>!s.battle.shot.missed.includes(z)&&E.publicProbabilities(s)[z]>0);
    s=E.setAimZone(s,aim);
    const p=previewSwing(s,{id:'basic'});
    expect(p.hitChance).toBeCloseTo(v10PitchDistribution(s)[aim],9);
    expect([p.missMin,p.missMax]).toEqual([0,0]);
    expect(p.reasons.some(r=>r.key==='shot'&&r.label==='2발째 ×1')).toBe(true);
  });

  it('simulates one battle per seed in both modes (report)',()=>{
    const ZONES=[0,1,2,3,4,5,6,7,8];
    const choose=s=>{
      const dist=v10PitchDistribution(s);let best={p:0,id:'basic',z:s.battle.aimZone};
      const ids=['basic',...s.battle.hand.filter(x=>{const k=s.deck.find(c=>c.id===x)?.kind;return CARDS[k]?.type==='attack'&&!CARDS[k].bunt&&!E.cardProblem(s,x);})];
      for(const id of ids)for(const z of ZONES){const p=E.coverageAt(s,id,z).reduce((a,y)=>a+dist[y],0);if(p>best.p+1e-9||(p>best.p-1e-9&&id==='basic'&&best.id!=='basic'))best={p,id,z};}
      return dist[9]>best.p?null:best;
    };
    const run=(seed,shot)=>{
      let s=start(seed,shot),steps=0;const hp0=s.pitcher.hp,outs0=s.battle.outs;
      while(steps++<600){
        if(s.phase==='pitch')s=E.advanceV10Pitch(s);
        else if(s.phase==='between')s=E.advanceV10Batter(s);
        else if(s.phase==='battle'){const c=choose(s);s=c?E.playV10Action(E.setAimZone(s,c.z),{type:'card',id:c.id}):E.playV10Action(s,{type:'take'});}
        else break;
      }
      return {won:s.pitcher.hp<=0,pitches:s.stats.pitches,shots:s.stats.cards,outs:(s.battle?.outs??0)-outs0,hp0};
    };
    const rows=[];
    for(const shot of [false,true]){
      let won=0,pitches=0,outs=0;const N=200;
      for(let seed=1;seed<=N;seed++){const r=run(seed,shot);won+=r.won;pitches+=r.pitches;outs+=r.outs;}
      rows.push(`${shot?'사격':'기존'}: 강판 ${(won/N*100).toFixed(1)}% · 평균 투구 ${(pitches/N).toFixed(1)} · 평균 아웃 ${(outs/N).toFixed(2)}`);
    }
    console.log('[사격 모드 시뮬레이션 · 1막 첫 전투 · 200시드]\n'+rows.join('\n'));
    expect(rows.length).toBe(2);
  },120000);
});
