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
    expect(homer.trailCap).toBe(22);
    expect(grand.trailCap).toBe(22);
    expect(homer.segmentCap).toBe(15);
    expect(homer.segmentCap).toBeGreaterThan(extra.segmentCap);
    expect(homer.coreWidth).toBeGreaterThan(extra.coreWidth);
    expect(homer.coreAlpha).toBeGreaterThan(extra.coreAlpha);
    expect(homer.homer).toBe(true);
    expect(grand.homer).toBe(true);
  });

  it('separates the short contact burst from the longer exit wake',()=>{
    const single=ballExitProfile('single');
    const extra=ballExitProfile('extra');
    const homer=ballExitProfile('homer');

    expect(homer.burstMs).toBeLessThan(homer.wakeMs);
    expect(homer.wakeMs).toBeGreaterThan(extra.wakeMs);
    expect(extra.wakeMs).toBeGreaterThan(single.wakeMs);
  });

  it('keeps dead-center power-colored without stealing the homer flare tier',()=>{
    const dead=ballExitProfile('dead-center');
    expect(dead.power).toBe(true);
    expect(dead.homer).toBe(false);
    expect(dead.trailCap).toBe(10);
  });
});
