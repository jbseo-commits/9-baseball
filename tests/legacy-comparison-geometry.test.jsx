// @vitest-environment happy-dom
import React from 'react';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {render,cleanup} from '@testing-library/react';
import {it,expect,afterEach,vi} from 'vitest';
import {LEGACY_FIELD,legacySceneGeometry,comparisonFrameSize} from '../src/duel/battle-vnext/legacy-scene-geometry.js';
import LegacyCompareHost from '../src/duel/battle-vnext/LegacyCompareHost.jsx';
import alpha from '../docs/qa/comparison-alignment/batter-alpha.json';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('gives A its native portrait width while preserving B landscape sizing',()=>{
 expect(comparisonFrameSize('legacy',700,740)).toEqual({w:440,h:740});
 expect(comparisonFrameSize('vnext',700,740)).toEqual({w:700,h:393});
 expect(comparisonFrameSize('legacy',390,600)).toEqual({w:390,h:600});
});
it('keeps ready/load/contact/follow painted silhouettes inside the field rather than just their boxes',()=>{
 const raw=readFileSync(new URL('../'+alpha.source,import.meta.url));expect(createHash('sha256').update(raw).digest('hex')).toBe(alpha.sha256);
 for(const width of [320,360,390,440]){
  const g=legacySceneGeometry(width),ratio=g.batter.height/768,frameLeft=g.batter.x+(g.batter.width-g.batter.frameWidth)/2;
  for(const {bounds:[x0,y0,x1,y1]}of alpha.frames){
   expect(frameLeft+x0*ratio).toBeGreaterThan(3);expect(frameLeft+x1*ratio).toBeLessThan(width-3);
   expect(g.batter.y+y0*ratio).toBeGreaterThan(0);expect(g.batter.y+y1*ratio+ratio*5).toBeLessThan(g.height-5);
  }
 }
});
it('registers actual rear-foot and mound anchors to the same painted world',()=>{
 for(const width of [320,390,440]){
  const g=legacySceneGeometry(width),b=g.batter;
  const actualX=b.x+(b.width-b.frameWidth)/2+LEGACY_FIELD.batter.anchorX*b.height/768;
  expect(actualX).toBeCloseTo(g.foot.x);expect(b.y+b.height).toBeCloseTo(g.height-12);
  expect(g.pitcher.x+g.pitcher.width/2).toBeCloseTo(g.rubber.x);expect(g.pitcher.y+g.pitcher.height).toBeCloseTo(g.rubber.y);
  expect(g.background.y+844*g.scale).toBeCloseTo(g.rubber.y);expect(g.zone.x).toBeGreaterThan(actualX+50);
 }
});
it('keeps registration explicitly scoped to the comparison host and distinguishes actual atlas/fallback sources',()=>{
 const v=render(<LegacyCompareHost hasAtlas><span>legacy</span></LegacyCompareHost>);
 expect(document.querySelector('.bc-legacy-host').dataset.pitcherSource).toBe('atlas');
 expect(document.querySelector('.bc-legacy-host').style.getPropertyValue('--lc-scene-h')).toBe('458px');
 v.rerender(<LegacyCompareHost><span>legacy</span></LegacyCompareHost>);expect(document.querySelector('.bc-legacy-host').dataset.pitcherSource).toBe('fallback');
});

it('uses the real 440px battle width when a standalone comparison wrapper spans desktop',()=>{
 vi.spyOn(HTMLElement.prototype,'clientWidth','get').mockImplementation(function(){return this.classList.contains('bp-scene')?440:this.classList.contains('bc-legacy-host')?1440:0;});
 render(<LegacyCompareHost hasAtlas><div className="bp-scene"/></LegacyCompareHost>);
 expect(document.querySelector('.bc-legacy-host').style.getPropertyValue('--lc-scene-h')).toBe('458px');
 expect(document.querySelector('.bc-legacy-host').style.getPropertyValue('--lc-bg-w')).toBe('440px');
});
