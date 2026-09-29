import {describe,expect,it} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {BATTER_V15_RIG,batterRigIdle,batterRigLoad} from '../src/duel/batter-v15.js';

// V15 batter cutout rig (scripts/build-batter-rig.py): the READY pose waits and loads as moving parts.
const read=p=>fs.readFileSync(path.resolve(p),'utf8');
const png=f=>{const b=fs.readFileSync(path.resolve(f));return {w:b.readUInt32BE(16),h:b.readUInt32BE(20),bytes:b.length};};
const RIG='assets/production-art/battle-portrait-v15/rig/';

describe('V15 batter rig',()=>{
  it('has four layers at the runtime cell size, each small enough to ship as PNG',()=>{
    for(const n of ['legs','upper','arms','bat']){
      const p=png(RIG+n+'.png');
      expect([p.w,p.h]).toEqual(BATTER_V15_RIG.cell);
      expect(p.bytes).toBeLessThan(600*1024);
    }
  });

  it('keeps every pivot inside the cell',()=>{
    const [w,h]=BATTER_V15_RIG.cell;
    for(const [x,y] of Object.values(BATTER_V15_RIG.pivots)){expect(x).toBeGreaterThan(0);expect(x).toBeLessThan(w);expect(y).toBeGreaterThan(0);expect(y).toBeLessThan(h);}
  });

  it('idles in small motions only (a cut edge never opens past the inpainted underlay)',()=>{
    for(let t=0;t<20000;t+=37){
      const m=batterRigIdle(t);
      expect(Math.abs(m.ux)).toBeLessThanOrEqual(2.2);expect(m.uy).toBeLessThanOrEqual(0);expect(m.uy).toBeGreaterThanOrEqual(-2.6);
      expect(Math.abs(m.ur)).toBeLessThanOrEqual(.45);expect(Math.abs(m.ar)).toBeLessThanOrEqual(1.1);expect(Math.abs(m.br)).toBeLessThanOrEqual(3.2);
    }
  });

  it('loads from wherever the idle is into the coil',()=>{
    expect(batterRigLoad(1234,0)).toEqual(batterRigIdle(1234));
    const end=batterRigLoad(1234,1);
    for(const k in BATTER_V15_RIG.load)expect(end[k]).toBeCloseTo(BATTER_V15_RIG.load[k],6);
    expect(batterRigLoad(1234,2)).toEqual(end);
  });

  it('the actors show the rig only while waiting and loading, and never under reduced motion or hit-stop',()=>{
    const src=read('src/duel/BallparkActors.jsx');
    expect(src).toMatch(/rigOn=!!rig&&!reduced&&!inStop&&\(pose==='ready'\|\|pose==='load'\)/);
    expect(src).toMatch(/batter\.visible=!rigOn/);
    // the main run hands the rig to the actors
    expect(read('src/duel/App.jsx')).toMatch(/batterSheet=\{BATTER_V15_SHEET\} batterRig=\{BATTER_V15_RIG\}/);
  });
});
