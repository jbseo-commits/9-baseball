import {it,expect} from 'vitest';
import {landscapeBatterTimeline} from '../src/duel/landscape-batter-motion.js';
import {batterMotionV3Timeline} from '../src/duel/batterMotionV3.js';
import {LANDSCAPE_BATTER} from '../src/duel/landscape-batter.js';
import {sheetCellStyle} from '../src/duel/batter-v15.js';
import registration from '../assets/landscape-ballpark-v4/registration.json';
it('keeps contact at the same impact and gives every recovery bridge screen time',()=>{
  const shot={grade:'solid',motion:{impactAt:300,settleAt:1000,duration:1240}};
  const base=batterMotionV3Timeline(shot),wide=landscapeBatterTimeline(shot);
  expect(wide.find(k=>k.pose==='contact').at).toBe(base.find(k=>k.pose==='contact').at);
  expect(wide.at(-1)).toEqual({pose:'ready',at:1420});
  expect(wide.map(k=>k.pose)).toEqual(expect.arrayContaining(['follow-through-late','finish','settle','recover-front','recover-raise','recover-ready']));
  for(let i=1;i<wide.length;i++)expect(wide[i].at).toBeGreaterThan(wide[i-1].at);
  for(const k of wide){const page=LANDSCAPE_BATTER.poseSheets?.[k.pose]||LANDSCAPE_BATTER;expect(page.rects[page.order[k.pose]]).toBeTruthy();}
});
it('keeps the planted-stride drawing instead of resetting to the swing-row ready duplicate',()=>{
  expect(LANDSCAPE_BATTER.order['swing-start']).toBe(3);
  expect(LANDSCAPE_BATTER.order['swing-mid']).toBe(5);
});
it('carries a miss through the plate without claiming a hit, and leaves take motion alone',()=>{
  const miss=landscapeBatterTimeline({grade:'chase',motion:{impactAt:300,settleAt:1000,duration:1240}});
  expect(miss.find(k=>k.pose==='swing-through').at).toBe(300);
  expect(miss.some(k=>k.pose==='contact')).toBe(false);
  const take={grade:'ball'};expect(landscapeBatterTimeline(take)).toEqual(batterMotionV3Timeline(take));
});
it('reads canonical atlas rectangles, including the shorter preparation row and final recovery cell',()=>{
  expect(LANDSCAPE_BATTER.rects).toHaveLength(14);
  for(const r of LANDSCAPE_BATTER.rects){expect(r.x+r.w).toBeLessThanOrEqual(LANDSCAPE_BATTER.width);expect(r.y+r.h).toBeLessThanOrEqual(LANDSCAPE_BATTER.height);}
  const final=sheetCellStyle(LANDSCAPE_BATTER,'recover-ready');
  expect(final.backgroundPosition).toBe('100% 100%');expect(final['--baseline']).toBe(LANDSCAPE_BATTER.anchors['recover-ready'].baseline);
});
it('keeps the lead sole and helmet aligned across the new body drawings and the original ready tail in DOM and Pixi',()=>{
  for(const row of Object.values(registration))for(const a of Object.values(row)){
    expect((a.soleY-320*a.baseline)*a.scale).toBeCloseTo(-4,2);
    const mid=(a.sole[0]+a.sole[1])/2;
    expect((mid-192+a.x*384)*a.scale).toBeCloseTo(79.5,2);
    expect((a.soleY-a.helmetTop)*a.scale).toBeCloseTo(238,2);
  }
  for(const pose of ['recover-uncoil','recover-unwind','recover-lower','recover-drop','recover-low','recover-turn','recover-front','recover-raise']){
    const page=LANDSCAPE_BATTER.poseSheets[pose],a=LANDSCAPE_BATTER.anchors[pose],style=sheetCellStyle(LANDSCAPE_BATTER,pose);
    expect(page.rects[page.order[pose]]).toBeTruthy();expect(style['--pose-scale']).toBe(a.scale);expect(style['--pose-x']).toBe(a.x);expect(style['--baseline']).toBe(a.baseline);
  }
});
