import {describe,it,expect} from 'vitest';
import {PACKS,COMMON,startMatch,entryFor,defaultCard,resolveAction,continueMatch,actionPreview,pitchMilestones,visibleForecast,coverageInterval,fallbackBall} from '../src/hybrid/model.js';
import {cardProblem,setAimZone,publicProbabilities} from '../src/duel/engine.js';
import {batterMotionV3Timeline} from '../src/duel/batterMotionV3.js';

describe('hybrid real-engine openings',()=>{
  for(const pack of Object.keys(PACKS))it(`${pack}: starts an ordinary PA with conserved deck instances and its first decision`,()=>{
    for(let seed=1;seed<=40;seed++){
      const s=startMatch(pack,seed),b=s.battle;
      expect(s.phase).toBe('battle');expect(b.bases).toEqual([null,null,null]);
      expect([b.balls,b.strikes,b.outs,b.batterIndex,s.stats.pitches]).toEqual([0,0,0,0,0]);
      expect(b.hand).toHaveLength(5);expect(b.draw).toHaveLength(4);expect(b.discard).toHaveLength(0);
      expect(new Set([...b.hand,...b.draw])).toEqual(new Set(s.deck.map(c=>c.id)));
      expect(b.hand.some(id=>entryFor(s,id).kind===PACKS[pack].core)).toBe(true);
      expect(s.deck.map(c=>c.kind)).toEqual([...COMMON,...PACKS[pack].pack]);
      expect(cardProblem(s,defaultCard(s))).toBeNull();
    }
  });
  it('keeps seeded runs reproducible while new seeds change the opening hand',()=>{
    expect(startMatch('precision',91)).toEqual(startMatch('precision',91));
    expect(new Set(Array.from({length:12},(_,i)=>startMatch('precision',i+1).battle.hand.join(','))).size).toBeGreaterThan(5);
  });
  it('preparation consumes its actual instance but no pitch, HP or runner',()=>{
    for(const pack of ['precision','grind']){
      const s=startMatch(pack,90210),id=s.battle.hand.find(id=>entryFor(s,id).kind===PACKS[pack].core);
      const r=resolveAction(s,{type:'card',id});
      expect(r.pitch).toBe(false);expect(r.next.stats.pitches).toBe(0);expect(r.next.pitcher.hp).toBe(s.pitcher.hp);
      expect(r.next.battle.discard).toContain(id);expect(r.next.battle.hand).not.toContain(id);
      expect(r.next.battle.preparations).toBe(1);expect(r.next.battle.bases).toEqual(s.battle.bases);
    }
  });
  it('uses the real stack consumption, result, HP and next-batter transition',()=>{
    let s=startMatch('precision',90210);
    const scout=s.battle.hand.find(id=>entryFor(s,id).kind==='scout');
    s=resolveAction(s,{type:'card',id:scout}).next;
    const main=s.battle.hand.find(id=>entryFor(s,id).kind==='strike'),support=s.battle.hand.find(id=>entryFor(s,id).kind==='defend');
    s=setAimZone(s,7);const supports=[{id:support,aimZone:7}],preview=actionPreview(s,main,supports);
    expect(preview.hit).toBeCloseTo(1);expect(preview.damageRate).toBeCloseTo(.87);
    const {next,shot,pitch}=resolveAction(s,{type:'card',id:main,supports});
    expect(pitch).toBe(true);expect(next.stats.pitches).toBe(1);expect(next.v10.lastCombat.verdict).toContain('단타');
    expect(next.pitcher.hp).toBe(50);expect(next.v10.lastCombat.damage).toBe(10);
    expect(next.battle.discard).toEqual(expect.arrayContaining([scout,main,support]));
    expect(next.battle.hand).not.toEqual(expect.arrayContaining([main,support]));
    expect(next.phase).toBe('between');expect(next.battle.bases.filter(Boolean)).toHaveLength(1);
    const continued=continueMatch(next);expect(continued.phase).toBe('battle');expect(continued.battle.batterIndex).toBe(1);
    expect(continued.stats.pitches).toBe(1);expect(continued.battle.bases).toEqual(next.battle.bases);
    expect(shot.motion.impactAt).toBe(1567);expect(pitchMilestones(shot.motion)[2]).toEqual(['impact',1567]);
  });
  it('taking preserves cards and leaves the bat still while the pitch resolves',()=>{
    const s=startMatch('relay',90210),r=resolveAction(s,{type:'take'});
    expect(r.next.stats.pitches).toBe(1);expect(r.next.battle.hand).toEqual(s.battle.hand);
    expect(r.shot.motion.swing).toBe(false);expect(batterMotionV3Timeline(r.shot).some(k=>k.pose==='swing-start')).toBe(false);
    if(r.next.phase==='pitch')expect(continueMatch(r.next).phase).toBe('battle');
  });
  it('foul and in-play-out swings use authored follow-through while take remains still',()=>{
    for(const grade of ['foul','battle-foul','sacrifice','out']){
      const keys=batterMotionV3Timeline({grade,motion:{impactAt:1567,duration:2237,settleAt:2067,syncToPitcher:true,swing:true}});
      expect(keys.some(k=>k.pose==='swing-mid')).toBe(true);expect(keys.some(k=>k.pose==='follow-through-early')).toBe(true);
    }
  });
  it('public previews do not inspect the hidden pitch location or rolls',()=>{
    const s=startMatch('precision',90210),id=defaultCard(s),p=actionPreview(s,id);
    const altered={...s,battle:{...s.battle,pending:new Proxy({}, {get(){throw new Error('hidden pitch leaked')}})}};
    expect(publicProbabilities(altered)).toEqual(publicProbabilities(s));
    expect(actionPreview(altered,id)).toEqual(p);
  });
  it('retains the original deck reading policy and derives coverage only from visible bounds',()=>{
    const precision=visibleForecast(startMatch('precision',90210)),relay=visibleForecast(startMatch('relay',90210));
    expect(precision.level).toBe(1);expect(precision.labels[7]).toBe('20–25%');
    expect(relay.level).toBe(0);expect(relay.labels[7]).toBe('가끔');expect(relay.labels.join('')).not.toContain('%');
    const s=startMatch('relay',90210);expect(coverageInterval(s,[6,7,8])[0]).toBeLessThan(coverageInterval(s,[6,7,8])[1]);
  });
  it('fallback ball reaches the same contact point at impact and honors reduced motion',()=>{
    const shot={grade:'solid',motion:{impactAt:1567}},boxes={b:{x:40,y:100,w:200,h:300},p:{x:600,y:40,w:150,h:150}};
    expect(fallbackBall(shot,1266,4,boxes)).toBeNull();
    const ball=fallbackBall(shot,1567,4,boxes);expect(ball.x).toBeCloseTo(257);expect(ball.y).toBeCloseTo(262);
    expect(fallbackBall(shot,1667,4,boxes).x).toBeGreaterThan(ball.x);
    expect(fallbackBall(shot,1567,4,boxes,true)).toBeNull();
  });
});
