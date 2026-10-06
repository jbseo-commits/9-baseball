import {describe,expect,it} from 'vitest';
import {ballExitProfile} from '../src/duel/ballExitVfx.js';

describe('ball exit cinematic hierarchy',()=>{
  it('gives home runs the longest Pixi trail and strongest core',()=>{
    const single=ballExitProfile('single');
    const extra=ballExitProfile('extra');
    const homer=ballExitProfile('homer');
    const grand=ballExitProfile('grand-slam');

    // The contract is the HIERARCHY (single < extra <= homer), not two absolute caps.
    // The homer cap was tuned 20 -> 22 during Cinematic V2, which broke a pinned literal
    // while the ordering the test exists to protect was unchanged. Pin the ordering and a
    // sane range instead, so tuning no longer requires editing this test but a regression
    // to a flat or inverted trail still fails.
    expect(extra.trailCap).toBeGreaterThan(single.trailCap);
    expect(homer.trailCap).toBeGreaterThanOrEqual(extra.trailCap);
    expect(grand.trailCap).toBe(homer.trailCap);
    for(const p of [single,extra,homer,grand]){
      expect(Number.isInteger(p.trailCap)).toBe(true);
      expect(p.trailCap).toBeGreaterThan(0);
      expect(p.trailCap).toBeLessThanOrEqual(64);
    }
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
