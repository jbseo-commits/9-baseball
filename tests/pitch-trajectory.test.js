import {describe,it,expect} from 'vitest';
import {pitchDescriptor,samplePitchFlight,samplePitchScene,PITCH_PROFILES} from '../src/duel/battle-vnext/pitch-trajectory.js';
const fixture=(profile='fastball')=>pitchDescriptor({profile,release:{x:800,y:350},target:{x:550,y:700},releaseAt:1317,seed:23});
describe('render-only pitch trajectory',()=>{
  it('owns immutable copies and rejects invalid descriptors/times',()=>{
    const release={x:10,y:20},d=pitchDescriptor({release,target:{x:0,y:0}});release.x=999;
    expect(d.release.x).toBe(10);expect(Object.isFrozen(d.release)).toBe(true);expect(Object.isFrozen(d)).toBe(true);
    expect(()=>pitchDescriptor({release,target:{x:NaN,y:0}})).toThrow();
    expect(()=>samplePitchFlight(d,NaN)).toThrow();
  });
  for(const profile of Object.keys(PITCH_PROFILES)){
    it(`${profile}: exact endpoints, clamping and monotonically growing depth`,()=>{
      const d=fixture(profile);expect(samplePitchFlight(d,-100).position).toEqual(d.release);
      expect(samplePitchFlight(d,d.impactAt).position).toEqual(d.target);
      expect(samplePitchFlight(d,1e9).position).toEqual(d.target);
      let last=0;for(let t=d.releaseAt;t<=d.impactAt;t+=1){const s=samplePitchFlight(d,t);expect(s.radius).toBeGreaterThanOrEqual(last);last=s.radius;expect(Number.isFinite(s.rotation)).toBe(true);}
    });
    it(`${profile}: analytic velocity agrees with independent finite differences`,()=>{
      const d=fixture(profile),h=.001;
      for(const u of [.01,.25,.55,.75,.99]){const t=d.releaseAt+300*u,s=samplePitchFlight(d,t),a=samplePitchFlight(d,t-h),b=samplePitchFlight(d,t+h);for(const axis of ['x','y'])expect(s.tangent[axis]).toBeCloseTo((b.position[axis]-a.position[axis])/(2*h),5);}
    });
    it(`${profile}: seeks/late frames and 6x use identical normalized samples`,()=>{
      const d=fixture(profile),times=[0,20,75,165,225,299,300];
      const expected=times.map(t=>samplePitchFlight(d,d.releaseAt+t));
      for(const rate of [.25,.5,.75,1,1.5,2,6])expect(times.map(t=>samplePitchFlight(d,d.releaseAt+(t/rate)*rate))).toEqual(expected);
      expect(times.slice().reverse().map(t=>samplePitchFlight(d,d.releaseAt+t)).reverse()).toEqual(expected);
    });
    it(`${profile}: result cannot change any pre-impact sample, including trail`,()=>{
      const d=fixture(profile);for(const age of [0,160,250,299.9]){const t=d.releaseAt+age;expect(samplePitchScene(d,t,{result:'hit'})).toEqual(samplePitchScene(d,t,{result:'foul'}));expect(samplePitchScene(d,t,{result:'hit'})).toEqual(samplePitchScene(d,t,{result:'take'}));}
    });
    it(`${profile}: hit/foul hand off position, size, spin; take keeps velocity`,()=>{
      const d=fixture(profile),a=samplePitchFlight(d,d.impactAt);
      for(const result of ['hit','foul','take']){const b=samplePitchScene(d,d.impactAt,{result}),c=samplePitchScene(d,d.impactAt+.0001,{result});expect(b.position).toEqual(a.position);expect(b.radius).toBe(a.radius);expect(b.rotation).toBe(a.rotation);expect(Math.hypot(c.position.x-a.position.x,c.position.y-a.position.y)).toBeLessThan(.01);expect(c.radius).toBeCloseTo(a.radius,4);expect(c.rotation).toBeCloseTo(a.rotation,4);}
      const next=samplePitchScene(d,d.impactAt+1,{result:'take'});for(const axis of ['x','y'])expect(next.position[axis]-a.position[axis]).toBeCloseTo(a.tangent[axis],8);
    });
    it(`${profile}: bounded wake samples the same curve and can be removed`,()=>{
      const d=fixture(profile),t=d.releaseAt+230,s=samplePitchScene(d,t);expect(s.wake).toHaveLength(6);expect(s.wake.at(-1)).toEqual(s.position);
      expect(s.wake[0]).toEqual(samplePitchFlight(d,t-PITCH_PROFILES[profile].wakeMs).position);
      expect(samplePitchScene(d,t,{trail:false}).wake).toEqual([]);
    });
  }
  it('shape contrast survives identical seed/time without color',()=>{
    const s=samplePitchFlight(fixture('slider'),1317+225),f=samplePitchFlight(fixture(),1317+225),c=samplePitchFlight(fixture('curve'),1317+150),m=samplePitchFlight(fixture(),1317+150);
    expect(s.position.x-f.position.x).toBeCloseTo(68);expect(c.position.y-m.position.y).toBeCloseTo(-106);
    expect(samplePitchFlight(fixture('slider'),1327).position.x-samplePitchFlight(fixture(),1327).position.x).toBeLessThan(1);
  });
});
