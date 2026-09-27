import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import runtimeArt from '../scripts/lib/vite-runtime-art.mjs';

const dir=path.resolve('assets/runtime-opt');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const sha1=b=>crypto.createHash('sha1').update(b).digest('hex');

function run(bundle){
  const plugin=runtimeArt(),emitted=[];
  plugin.generateBundle.call({emitFile:f=>{emitted.push(f);bundle[f.fileName]={type:'asset',fileName:f.fileName,source:f.source};}},{},bundle);
  return emitted;
}

describe('runtime art derivatives',()=>{
  it('every manifest entry points at an existing master and WebP, keyed by the master bytes',()=>{
    const entries=Object.entries(manifest);
    expect(entries.length).toBeGreaterThan(40);
    for(const [h,m] of entries){
      const src=path.resolve('assets',m.src);
      expect(fs.existsSync(src),m.src).toBe(true);
      expect(sha1(fs.readFileSync(src)),m.src+' changed: re-run scripts/optimize-runtime-art.py').toBe(h);
      const webp=path.join(dir,m.file);
      expect(fs.existsSync(webp),m.file).toBe(true);
      expect(fs.statSync(webp).size).toBeLessThan(fs.statSync(src).size);
    }
  });

  it('swaps a matching PNG for its WebP and rewrites JS and CSS references',()=>{
    const [h,m]=Object.entries(manifest).find(([,m])=>/dex-red-rush/.test(m.src));
    const master=fs.readFileSync(path.resolve('assets',m.src));
    expect(sha1(master)).toBe(h);
    const bundle={
      'assets/dex-red-rush-AbCd1234.png':{type:'asset',fileName:'assets/dex-red-rush-AbCd1234.png',source:master},
      'assets/other-XyZ98765.png':{type:'asset',fileName:'assets/other-XyZ98765.png',source:Buffer.from('not art')},
      'assets/index.js':{type:'chunk',fileName:'assets/index.js',code:'const a="/assets/dex-red-rush-AbCd1234.png",b="/assets/other-XyZ98765.png";'},
      'assets/index.css':{type:'asset',fileName:'assets/index.css',source:'.x{background:url(/assets/dex-red-rush-AbCd1234.png)}'},
    };
    const emitted=run(bundle);
    expect(emitted.map(f=>f.fileName)).toEqual(['assets/dex-red-rush-AbCd1234.webp']);
    expect(bundle['assets/dex-red-rush-AbCd1234.png']).toBeUndefined();
    expect(bundle['assets/other-XyZ98765.png']).toBeDefined();
    expect(bundle['assets/index.js'].code).toBe('const a="/assets/dex-red-rush-AbCd1234.webp",b="/assets/other-XyZ98765.png";');
    expect(bundle['assets/index.css'].source).toContain('dex-red-rush-AbCd1234.webp');
  });

  it('ships a changed master as its PNG rather than stale art',()=>{
    const bundle={'assets/card-bunt-Q1w2E3r4.png':{type:'asset',fileName:'assets/card-bunt-Q1w2E3r4.png',source:Buffer.from('edited master')}};
    expect(run(bundle)).toEqual([]);
    expect(bundle['assets/card-bunt-Q1w2E3r4.png']).toBeDefined();
  });

  it('map nodes (~60px) and hand cards (<=180px) are sized down, sprite atlases keep their frames',()=>{
    const by=re=>Object.values(manifest).filter(m=>re.test(m.src));
    for(const m of by(/map-node-/))expect(Math.max(...m.size)).toBeLessThanOrEqual(256);
    for(const m of by(/^cards-v15\/card-/))expect(Math.max(...m.size)).toBeLessThanOrEqual(768);
    for(const m of by(/-atlas\.png$|master-sheet|-60\.png$/)){
      const src=fs.readFileSync(path.resolve('assets',m.src));
      expect(m.size,m.src).toEqual([src.readUInt32BE(16),src.readUInt32BE(20)]);
    }
  });
});
