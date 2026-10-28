import {describe,it,expect} from 'vitest';
import {motionAt,PILOT_MOTION,MOTION_CONTACT,MOTION_RELEASE} from '../src/duel/battle-vnext/motion-timeline.js';
const timeline={impactAt:240,freeze:60,slowmo:70,releaseAt:370,settleAt:720,duration:1040};
describe('registered authored landscape motion',()=>{
  it('uses distinct authored drawings from preparation through return, not rotated stills',()=>{
    const seen=new Set();for(let elapsed=0;elapsed<1040;elapsed+=5)seen.add(motionAt({elapsed,timeline,action:'swing',landed:elapsed>=240}).batter);
    expect([...seen].sort((a,b)=>a-b)).toEqual(Array.from({length:14},(_,i)=>i));
    expect(PILOT_MOTION.batter.frames).toHaveLength(14);
  });
  it('holds the contact drawing through the host freeze and then follows through',()=>{
    expect(motionAt({elapsed:250,timeline,action:'swing',landed:true}).batter).toBe(8);
    expect(motionAt({elapsed:299,timeline,action:'swing',landed:true}).batter).toBe(8);
    expect(motionAt({elapsed:320,timeline,action:'swing',landed:true}).batter).toBe(9);
    expect(motionAt({elapsed:1040,timeline,action:'swing',landed:true}).batter).toBe(0);
  });
  it('never swings or throws for preparation, never swings for watch',()=>{
    for(const elapsed of [0,110,240,400,900]){
      expect(motionAt({elapsed,timeline,action:'prepare'})).toEqual({batter:0,pitcher:0});
      expect(motionAt({elapsed,timeline,action:'take',landed:elapsed>=240}).batter).toBe(0);
    }
  });
  it('only uses the fatigue drawing for landed HP0 and keeps reduced motion still',()=>{
    expect(motionAt({elapsed:800,timeline,action:'swing',knockedOut:true,landed:false}).pitcher).not.toBe(3);
    expect(motionAt({elapsed:800,timeline,action:'swing',knockedOut:true,landed:true}).pitcher).toBe(3);
    expect(motionAt({elapsed:250,timeline,action:'swing',landed:true,reduced:true}).batter).toBe(0);
  });
  it('registers every foot identically and contact/release belong to authored event poses',()=>{
    for(const who of ['batter','pitcher'])for(const f of PILOT_MOTION[who].frames){
      expect(f.foot).toEqual(Object.values(PILOT_MOTION[who].anchor));
      expect(f.alphaBounds[0]).toBeGreaterThan(0);expect(f.alphaBounds[2]).toBeLessThan(PILOT_MOTION[who].sourceWidth);
    }
    expect(PILOT_MOTION.batter.frames[8].contact).toEqual(PILOT_MOTION.batter.event);
    expect(PILOT_MOTION.pitcher.frames[1].release).toEqual(PILOT_MOTION.pitcher.event);
    expect(MOTION_RELEASE.y).toBeLessThan(MOTION_CONTACT.y);
  });
});
