import {describe,it,expect,vi} from 'vitest';
import {classifySwipe,profileFromCrypto,judgePrototypeContact,scorePrototypeResult,SWING_LEAD_MS} from '../src/duel/battle-vnext/pitch-swing-prototype.js';
import {pitchDescriptor} from '../src/duel/battle-vnext/pitch-trajectory.js';

describe('isolated swing prototype rules',()=>{
  it('classifies measured swipe width at documented normalized boundaries',()=>{
    expect(classifySwipe(10,200)).toBeNull();
    expect(classifySwipe(20,200)).toBe('small');
    expect(classifySwipe(24,200)).toBe('medium');
    expect(classifySwipe(55,200)).toBe('medium');
    expect(classifySwipe(56,200)).toBe('large');
    expect(classifySwipe(-56,200)).toBe('large');
  });
  it('selects profiles independently with secure random words',()=>{
    const getRandomValues=vi.fn(a=>{a[0]=0xffffffff;return a;});
    expect(profileFromCrypto({getRandomValues})).toBe('curve');
    expect(getRandomValues).toHaveBeenCalledOnce();
  });
  it('requires actual sampled overlap; never turns timing alone into contact',()=>{
    const d=pitchDescriptor({profile:'fastball',release:{x:0,y:0},target:{x:100,y:100},releaseAt:0,impactAt:600});
    const exact=judgePrototypeContact({descriptor:d,contactAt:600,target:d.target,swipe:'medium'});
    expect(exact.result).toBe('contact');
    expect(exact.multiplier).toBe(1.5);
    const late=judgePrototypeContact({descriptor:d,contactAt:600+SWING_LEAD_MS,target:d.target,swipe:'large'});
    expect(late.result).toBe('miss');
    expect(late.timingErrorMs).toBe(160);
  });
  it('applies prototype score multipliers and two-strike foul protection in memory',()=>{
    expect(scorePrototypeResult({score:0,strikes:0,result:'contact',multiplier:3})).toEqual({score:300,strikes:0});
    expect(scorePrototypeResult({score:100,strikes:1,result:'cut-foul',multiplier:1})).toEqual({score:100,strikes:2});
    expect(scorePrototypeResult({score:100,strikes:2,result:'cut-foul',multiplier:1})).toEqual({score:100,strikes:2});
    expect(scorePrototypeResult({score:100,strikes:2,result:'miss'})).toEqual({score:100,strikes:3});
  });
  it('uses the small-swipe provisional cut-foul only on measured overlap',()=>{
    const d=pitchDescriptor({profile:'fastball',release:{x:0,y:0},target:{x:100,y:100},releaseAt:0,impactAt:600});
    expect(judgePrototypeContact({descriptor:d,contactAt:600,target:d.target,swipe:'small'}).result).toBe('cut-foul');
    expect(judgePrototypeContact({descriptor:d,contactAt:600,target:{x:0,y:0},swipe:'small'}).result).toBe('miss');
  });
});

it('ignores tiny gestures and treats a valid early swing as a miss, not an exception',()=>{
  expect(classifySwipe(0,300)).toBeNull();
  const d=pitchDescriptor({release:{x:0,y:0},target:{x:100,y:100},releaseAt:1317,impactAt:1617});
  expect(judgePrototypeContact({descriptor:d,contactAt:160,target:d.target,swipe:'large'}).result).toBe('miss');
  expect(()=>judgePrototypeContact({descriptor:d,contactAt:NaN,target:d.target,swipe:'large'})).toThrow();
});
