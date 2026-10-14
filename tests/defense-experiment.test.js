// @vitest-environment happy-dom
import {describe,it,expect} from 'vitest';
import {createV10Duel,enterV10Node,playV10Action,advanceV10Batter,
  swingOdds,previewV10Stack,coverage} from '../src/duel/engine.js';

/* Defense experiment A — engine integration. Forced-result states below are
   diagnostic FIXTURES (pending zone/roll pinned like scripts/qa-shots.mjs),
   not natural games. Human P/L/S observation stays NEEDS_HUMAN. */
const K9=['place','slug','scout','strike','rally','setup','watch','bunt','flow'];
function baseState({seed=90211,kinds=K9}={}){
  let s=createV10Duel(seed);
  s.deck=kinds.map((kind,i)=>({id:'e'+i,kind}));
  s.nextId=kinds.length;
  s=enterV10Node(s,'a1-entry');
  return s;
}
function setHand(s,ids){
  const pool=[...s.battle.hand,...s.battle.draw,...s.battle.discard].filter(id=>!ids.includes(id));
  s.battle.hand=[...ids];s.battle.draw=pool;s.battle.discard=[];
  s.battle.energy=10;return s;
}
/* Aim first, then pick a covered zone from the real coverage (never assume). */
function aimZone(s,id,zone){s.battle.aimZone=zone;return coverage(s,id);}
function pend(s,zone,roll,powerRoll=.9){s.battle.pending={zone,roll,powerRoll};return s;}
const DEF=depth=>({depth});
const act=(s,action,depth)=>playV10Action(s,action,depth==null?{}:{defense:DEF(depth)});
const defenseOf=s=>s.v10.lastCombat.defense;
const stripDefense=s=>{const c=structuredClone(s);if(c.v10?.lastCombat)delete c.v10.lastCombat.defense;return c;};
const row=z=>Math.floor(z/3);

describe('D1 contact adjusts by actual pitch height (A)',()=>{
  it('high moves up, mid holds, low moves down from base',()=>{
    for(const [aim,want,cause] of [[1,2,'contact-high'],[4,1,'hold'],[7,0,'contact-low']]){
      let s=setHand(baseState(),['e0']); // place
      const cov=aimZone(s,'e0',aim);
      expect(cov).toContain(aim);
      pend(s,aim,.5);
      s=act(s,{type:'card',id:'e0'},1);
      const d=defenseOf(s);
      expect(s.battle.revealed.kind).toBe('hit');
      expect(d.nextDepth).toBe(want);
      expect(d.cause).toBe(cause);
      expect(d.direct).toBe(true);
    }
  });
  it('clamps at the ceiling instead of inventing depth 3',()=>{
    let s=setHand(baseState(),['e0']);
    aimZone(s,'e0',1);pend(s,1,.5);
    s=act(s,{type:'card',id:'e0'},2);
    expect(defenseOf(s)).toEqual(expect.objectContaining({nextDepth:2,cause:'hold'}));
  });
});

describe('D2 anchor never steers; only the actual row does (A)',()=>{
  it('same column coverage moves only with the actual zone',()=>{
    const run=zone=>{
      let s=setHand(baseState(),['e3']); // strike covers the 1/4/7 column
      const cov=aimZone(s,'e3',1);
      expect(cov).toContain(zone);
      pend(s,zone,.5);
      return act(s,{type:'card',id:'e3'},1);
    };
    expect(defenseOf(run(4)).nextDepth).toBe(1); // mid actual: hold
    expect(defenseOf(run(1)).nextDepth).toBe(2); // high actual: up
  });
  it('preview never fixes a future defense (no preview leak)',()=>{
    const s=setHand(baseState(),['e3']);
    const json=JSON.stringify(previewV10Stack(s,'e3',[]));
    expect(json).not.toContain('defense');
    expect(json).not.toContain('nextDepth');
  });
});

describe('D3 runner recovery at retreat (A)',()=>{
  it('tableSetter single advances the pre-existing runner an extra base, not the new batter',()=>{
    const kinds=['tableSetter','rally','finisher','place','strike','setup','watch','scout','flow'];
    const s0=setHand(baseState({kinds}),['e0']);
    s0.battle.bases=['p5',null,null];
    const cov=aimZone(s0,'e0',4);
    const zone=cov[0];
    pend(s0,zone,.5);
    const runsBefore=s0.battle.runs;
    const s=act(s0,{type:'card',id:'e0'},2);
    const d=defenseOf(s);
    expect(s.battle.revealed.kind).toBe('hit');
    expect(d.extraAdvance).toBe(1);
    expect(s.battle.bases[2]).toBe('p5'); // base move + space base
    expect(s.battle.bases[0]).not.toBe('p5'); // new batter is not the runner
    expect(s.battle.runs).toBe(runsBefore); // no phantom score
  });
  it('rally can carry a runner home with the space base',()=>{
    const kinds=['rally','place','strike','setup','watch','scout','flow','bunt','slug'];
    const s0=setHand(baseState({kinds}),['e0']);
    s0.battle.bases=['p5',null,null];
    aimZone(s0,'e0',4);pend(s0,4,.5);
    const runsBefore=s0.battle.runs;
    const s=act(s0,{type:'card',id:'e0'},2);
    expect(defenseOf(s).extraAdvance).toBe(1);
    expect(s.battle.runs).toBe(runsBefore+1); // 1→3 base move + space → home
    expect(s.battle.bases.includes('p5')).toBe(false);
  });
});

describe('D4 advance cost at front (A)',()=>{
  it('records delta −4 with min-1 final on the same judgment',()=>{
    const kinds=['rally','place','strike','setup','watch','scout','flow','bunt','slug'];
    const s0=setHand(baseState({kinds}),['e0']);
    aimZone(s0,'e0',4);pend(s0,4,.5);
    const s=act(s0,{type:'card',id:'e0'},0);
    const d=defenseOf(s);
    expect(d.delta).toBe(-4);
    expect(d.d0).toBe(12);
    expect(d.final).toBe(8);
    expect(d.final).toBe(Math.max(1,d.d0+d.delta));
    expect(s.pitcher.hp).toBe(s.v10.lastCombat.hpBefore-8);
  });
  it('plus keeps the stance (no invented power, same delta)',()=>{
    const kinds=['rally','place','strike','setup','watch','scout','flow','bunt','slug'];
    const s0=setHand(baseState({kinds}),['e0']);
    s0.deck[0]={...s0.deck[0],plus:true};
    aimZone(s0,'e0',4);pend(s0,4,.5);
    const s=act(s0,{type:'card',id:'e0'},0);
    expect(defenseOf(s).delta).toBe(-4);
  });
});

describe('D5 sacrifice surge 2→0 (A)',()=>{
  it('valid success jumps to front, advances the runner, keeps the slug',()=>{
    const kinds=['squeeze','slug','place','watch','strike','rally','setup','scout','flow'];
    const s0=setHand(baseState({kinds}),['e0']);
    s0.battle.bases=['p5',null,null];s0.battle.outs=0;s0.battle.strikes=0;
    aimZone(s0,'e0',4);pend(s0,4,.5); // squeeze: foul .18, sac .82 → .5 is sacrifice
    const s=act(s0,{type:'card',id:'e0'},2);
    expect(s.battle.revealed.kind).toBe('sacrifice');
    const d=defenseOf(s);
    expect(d.sacrificeValid).toBe(true);
    expect(d.nextDepth).toBe(0);
    expect(d.cause).toBe('sacrifice');
    expect(d.delta).toBe(0); // no space damage on sacrifices
    expect(s.battle.bases[1]).toBe('p5');
    expect(s.battle.outs).toBe(1);
    expect([...s.battle.draw,...s.battle.hand].some(id=>s.deck.find(c=>c.id===id)?.kind==='slug')).toBe(true);
  });
});

describe('D6 sacrifice decline (A)',()=>{
  it('third-out sacrifice moves nothing and records no surge',()=>{
    const kinds=['squeeze','slug','place','watch','strike','rally','setup','scout','flow'];
    const s0=setHand(baseState({kinds}),['e0']);
    s0.battle.bases=['p5',null,null];s0.battle.outs=2;s0.battle.strikes=0;
    aimZone(s0,'e0',4);pend(s0,4,.5);
    const s=act(s0,{type:'card',id:'e0'},2);
    expect(s.battle.revealed.kind).toBe('sacrifice');
    const d=defenseOf(s);
    expect(d.sacrificeValid).toBe(false);
    expect(d.nextDepth).toBe(2);
    expect(s.battle.bases[0]).toBe('p5'); // no advance at 3 outs
    expect(s.phase).toBe('lost');
  });
  it('2S bunt foul is a foul, not a sacrifice lure',()=>{
    const s0=setHand(baseState(),['e7']); // bunt
    s0.battle.strikes=2;
    aimZone(s0,'e7',4);pend(s0,4,.05); // inside the foul band
    const s=act(s0,{type:'card',id:'e7'},2);
    expect(s.battle.revealed.kind).toBe('foul');
    const d=defenseOf(s);
    expect(d.sacrificeValid).toBe(false);
    expect(d.nextDepth).toBe(2);
    expect(d.delta).toBe(0);
  });
});

describe('D7 assist-only never moves or pays (A)',()=>{
  it('support-only contact keeps support singles with no stance effects',()=>{
    const kinds=['place','rally','strike','setup','watch','scout','flow','bunt','slug'];
    const s0=setHand(baseState({kinds}),['e0','e1']);
    s0.battle.aimZone=0; // main place covers only zone 0
    expect(coverage(s0,'e0')).toEqual([0]);
    pend(s0,4,.5); // support rally covers the row
    const s=act(s0,{type:'card',id:'e0',supports:[{id:'e1',aimZone:4}]},1);
    expect(s.battle.revealed.kind).toBe('hit');
    expect(s.battle.revealed.assistOnly).toBe(true);
    const d=defenseOf(s);
    expect(d.direct).toBe(false);
    expect(d.nextDepth).toBe(1);
    expect(d.delta).toBe(0);
    expect(d.extraAdvance).toBe(0);
    expect(s.battle.revealed.label).toBe('겹친 카드 단타');
  });
});

describe('D8 already knocked out (A)',()=>{
  it('homer is space-immune, damage counts once, no next-PA input',()=>{
    const kinds=['slug','place','strike','setup','watch','scout','flow','rally','bunt'];
    const s0=setHand(baseState({kinds}),['e0']);
    s0.pitcher.hp=1;
    aimZone(s0,'e0',4);pend(s0,4,.5,.05); // powerRoll .05 < hr floor .07 → homer
    const s=act(s0,{type:'card',id:'e0'},0);
    const d=defenseOf(s);
    expect(d.homer).toBe(true);
    expect(d.delta).toBe(0);
    expect(d.final).toBe(d.d0);
    expect(s.pitcher.hp).toBe(0);
    expect(['reward','won']).toContain(s.phase);
    expect(advanceV10Batter(s)).toBe(s); // no next-PA input after the end
  });
});

describe('flag OFF parity (main-line regression proof)',()=>{
  const seq=(withDefense)=>{
    const s0=setHand(baseState(),['e0','e3','e5']);
    // 1. contact mid direct hit at a no-op depth
    s0.battle.aimZone=4;s0.battle.pending={zone:4,roll:.5,powerRoll:.9};
    let s=playV10Action(s0,{type:'card',id:'e0'},withDefense?{defense:{depth:1}}:{});
    const out=[s];
    // 2. take
    s.battle.pending={zone:4,roll:.5,powerRoll:.5};
    s=playV10Action(s,{type:'take'},withDefense?{defense:{depth:1}}:{});
    out.push(s);
    return out;
  };
  const strip=s=>{const c=structuredClone(s);if(c.v10?.lastCombat)delete c.v10.lastCombat.defense;return c;};
  it('depth-1 holds leave states identical except the defense record',()=>{
    const [on1,on2]=seq(true),[off1,off2]=seq(false);
    expect(strip(on1)).toEqual(off1);
    expect(strip(on2)).toEqual(off2);
    expect(on1.v10.lastCombat.defense).toEqual(expect.objectContaining({depthBefore:1,nextDepth:1,cause:'hold',delta:0}));
    expect(off1.v10.lastCombat.defense).toBeUndefined();
    expect(off2.v10.lastCombat.defense).toBeUndefined();
  });
  it('take never records defense',()=>{
    const s0=setHand(baseState(),['e0']);
    s0.battle.pending={zone:4,roll:.5,powerRoll:.5};
    const s=playV10Action(s0,{type:'take'},{defense:{depth:2}});
    expect(s.v10.lastCombat.defense).toBeUndefined();
  });
  it('prep touches neither the record nor the depth',()=>{
    const s0=setHand(baseState(),['e0','e5']);
    s0.battle.aimZone=4;s0.battle.pending={zone:4,roll:.5,powerRoll:.9};
    const afterHit=playV10Action(s0,{type:'card',id:'e0'},{defense:{depth:0}});
    expect(afterHit.phase).toBe('between'); // the single ended the plate appearance
    const recBefore=JSON.stringify(afterHit.v10.lastCombat.defense);
    const nextPA=advanceV10Batter(afterHit); // next batter, same defense reservation
    const afterPrep=playV10Action(nextPA,{type:'card',id:'e5'},{defense:{depth:0}});
    expect(JSON.stringify(afterPrep.v10.lastCombat.defense)).toBe(recBefore);
    expect(afterPrep.battle.preparations).toBe(1); // the prep itself still works
  });
});

describe('boundary and non-hit holds (A)',()=>{
  it('clamps at the floor instead of inventing depth −1',()=>{
    const s0=setHand(baseState(),['e0']); // place
    aimZone(s0,'e0',7);pend(s0,7,.5); // low row at depth 0
    const s=act(s0,{type:'card',id:'e0'},0);
    expect(s.battle.revealed.kind).toBe('hit');
    expect(defenseOf(s)).toEqual(expect.objectContaining({nextDepth:0,cause:'hold'}));
  });
  it('retreat D1: high holds at the ceiling, low steps down',()=>{
    for(const [aim,want] of [[1,2],[7,1]]){
      const s0=setHand(baseState(),['e0']);
      aimZone(s0,'e0',aim);pend(s0,aim,.5);
      const s=act(s0,{type:'card',id:'e0'},2);
      expect(s.battle.revealed.kind).toBe('hit');
      expect(defenseOf(s).nextDepth).toBe(want);
    }
  });
  it('empty-base bunt is a sacrifice with no lure',()=>{
    const kinds=['squeeze','slug','place','watch','strike','rally','setup','scout','flow'];
    const s0=setHand(baseState({kinds}),['e0']);
    s0.battle.outs=0;s0.battle.strikes=0; // no runners at all
    aimZone(s0,'e0',4);pend(s0,4,.5);
    const s=act(s0,{type:'card',id:'e0'},1);
    expect(s.battle.revealed.kind).toBe('sacrifice');
    const d=defenseOf(s);
    expect(d.sacrificeValid).toBe(false);
    expect(d.nextDepth).toBe(1);
    expect(s.battle.outs).toBe(1);
  });
  it('foul and whiff move nothing and pay nothing',()=>{
    const mk=(roll)=>{
      const s0=setHand(baseState(),['e0']); // place
      s0.battle.aimZone=0; // covers only zone 0
      pend(s0,8,roll); // uncovered zone 8
      return act(s0,{type:'card',id:'e0'},2);
    };
    const o=swingOdds(setHand(baseState(),['e0']),'e0',8);
    if(o.foul>0){
      const f=mk(o.foul/2);
      expect(f.battle.revealed.kind).toBe('foul');
      expect(defenseOf(f)).toEqual(expect.objectContaining({nextDepth:2,delta:0}));
    }
    const w=mk(.99);
    expect(w.battle.revealed.kind).toBe('whiff');
    expect(defenseOf(w)).toEqual(expect.objectContaining({nextDepth:2,delta:0}));
  });
  it('basic has no stance, no space, no move',()=>{
    const s0=setHand(baseState(),['e0']);
    s0.battle.aimZone=4;pend(s0,4,.5);
    const s=act(s0,{type:'card',id:'basic'},1);
    const d=defenseOf(s);
    expect(d.stance).toBe('none');
    expect(d.nextDepth).toBe(1);
    expect(d.delta).toBe(0);
    expect(d.extraAdvance).toBe(0);
  });
  it('loaded bases score exactly once each, no duplicates',()=>{
    const kinds=['rally','place','strike','setup','watch','scout','flow','bunt','slug'];
    const s0=setHand(baseState({kinds}),['e0']);
    s0.battle.bases=['p5','p6','p7'];
    aimZone(s0,'e0',4);pend(s0,4,.9);
    const runsBefore=s0.battle.runs;
    const s=act(s0,{type:'card',id:'e0'},2);
    expect(s.battle.revealed.kind).toBe('hit');
    // rally advance 2 + space 1 = 3 steps: all three score, batter takes 1st
    expect(s.battle.runs-runsBefore).toBe(3);
    const onBase=s.battle.bases.filter(Boolean);
    expect(new Set(onBase).size).toBe(onBase.length); // no duplicates
    expect(onBase).toHaveLength(1); // only the new batter stays on
    expect(s.battle.bases.includes('p5')).toBe(false);
    expect(s.battle.bases.includes('p6')).toBe(false);
    expect(s.battle.bases.includes('p7')).toBe(false);
  });
  it('runner pressure math is untouched by defense (uses pre-pitch count)',()=>{
    const mk=(withDefense)=>{
      const kinds=['rally','place','strike','setup','watch','scout','flow','bunt','slug'];
      const s0=setHand(baseState({kinds}),['e0']);
      s0.battle.bases=['p5',null,null];
      aimZone(s0,'e0',4);pend(s0,4,.9);
      return playV10Action(s0,{type:'card',id:'e0'},withDefense?{defense:{depth:1}}:{});
    };
    const on=mk(true),off=mk(false);
    expect(on.v10.lastCombat.runnerRate).toBe(off.v10.lastCombat.runnerRate);
    expect(on.v10.lastCombat.runnerBonus).toBe(off.v10.lastCombat.runnerBonus);
    expect(on.v10.lastCombat.totalDamageBonus).toBe(off.v10.lastCombat.totalDamageBonus);
  });
});
describe('shot clock: same pitchId never double-applies',()=>{
  it('replaying the same resolution keeps damage identical',()=>{
    const s0=setHand(baseState(),['e1']); // slug
    s0.battle.aimZone=4;s0.battle.pending={zone:4,roll:.5,powerRoll:.9};
    const hpBefore=s0.pitcher.hp;
    const a=playV10Action(s0,{type:'card',id:'e1'},{defense:{depth:0}});
    const d=defenseOf(a);
    expect(d.delta).toBe(8);
    expect(a.pitcher.hp).toBe(hpBefore-d.final);
    expect(d.final).toBe(d.d0+8);
  });
});
