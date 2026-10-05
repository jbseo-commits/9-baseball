import {describe,expect,it} from 'vitest';
import {ballExitProfile} from '../src/duel/ballExitVfx.js';

describe('ball exit cinematic hierarchy',()=>{
  it('gives home runs the longest Pixi trail and strongest core',()=>{
    const single=ballExitProfile('single');
    const extra=ballExitProfile('extra');
    const homer=ballExitProfile('homer');
    const grand=ballExitProfile('grand-slam');

    expect(single.trailCap).toBe(10);
    expect(extra.trailCap).toBe(12);
    expect(homer.trailCap).toBe(16);
    expect(grand.trailCap).toBe(16);
    expect(homer.segmentCap).toBeGreaterThan(extra.segmentCap);
    expect(homer.coreWidth).toBeGreaterThan(extra.coreWidth);
    expect(homer.homer).toBe(true);
    expect(grand.homer).toBe(true);
  });

  it('keeps dead-center power-colored without stealing the homer flare tier',()=>{
    const dead=ballExitProfile('dead-center');
    expect(dead.power).toBe(true);
    expect(dead.homer).toBe(false);
    expect(dead.trailCap).toBe(10);
  });
});
