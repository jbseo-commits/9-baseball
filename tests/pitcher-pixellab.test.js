import {describe,expect,it} from 'vitest';
import fs from 'node:fs';
import {RED_RUSH_RELEASE_FRAME,RED_RUSH_FRAME_COUNT,RED_RUSH_FPS} from '../src/duel/pitcher-sd.js';
import {pitcherAtlases} from '../src/duel/pitcher-visuals.js';

// PixelLab pitch animations (assets/pitcher-pixellab-v1): drawn from the pitcher-mobs-v1 designs,
// packed into the same 120-frame atlas the battle already plays, and measured for the runtime tables.
const root=new URL('../assets/pitcher-pixellab-v1/',import.meta.url);
const ids=fs.readdirSync(root,{withFileTypes:true}).filter(d=>d.isDirectory()&&fs.existsSync(new URL(`${d.name}/sequence.json`,root))).map(d=>d.name);
const json=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url),'utf8'));
const png=url=>{
  const data=fs.readFileSync(url);
  expect(data.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
  return [data.readUInt32BE(16),data.readUInt32BE(20),data[25]];
};

describe('PixelLab pitch animations',()=>{
  it('ships at least the Teal Mirage pilot',()=>{
    expect(ids).toContain('regular-02-teal-mirage');
  });

  it('packs every sequence into the runtime contract: 120 frames at 60fps, release on the shared frame',()=>{
    for(const id of ids){
      const m=json(`../assets/pitcher-pixellab-v1/${id}-manifest.json`);
      expect(m.character).toBe(id);
      expect(m.facing).toBe('screen-left');
      expect(m.frameCount).toBe(RED_RUSH_FRAME_COUNT);
      expect(m.fps).toBe(RED_RUSH_FPS);
      expect(m.releaseFrame).toBe(RED_RUSH_RELEASE_FRAME);
      expect(m.keyPoses.reduce((n,k)=>n+k.ticks,0)).toBe(120);
      expect(m.keyPoses.find(k=>k.pose==='release').frame).toBe(RED_RUSH_RELEASE_FRAME);
      expect(m.keyPoses[0].pose).toBe('set');
      expect(m.keyPoses.at(-1).pose).toBe('set'); // ends where the next pitch starts: no snap between pitches
      expect(png(new URL(m.atlas,root))).toEqual([2560,3072,6]);
    }
  });

  it('keeps every unique drawing as a 256x256 transparent frame, each held long enough to read',()=>{
    for(const id of ids){
      const m=json(`../assets/pitcher-pixellab-v1/${id}-manifest.json`);
      const frames=fs.readdirSync(new URL(`${id}/frames/`,root)).filter(f=>f.endsWith('.png'));
      expect(frames).toHaveLength(m.uniqueDrawingCount);
      for(const f of frames)expect(png(new URL(`${id}/frames/${f}`,root))).toEqual([256,256,6]);
      for(const k of m.keyPoses)expect(k.ticks,`${id} ${k.pose}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('replaces that pitcher\'s SD atlas in the battle, and stops shipping the SD one',()=>{
    const visuals=fs.readFileSync(new URL('../src/duel/pitcher-visuals.js',import.meta.url),'utf8');
    for(const id of ids){
      expect(String(pitcherAtlases[id])).toContain('pitcher-pixellab-v1');
      expect(visuals).toContain(`'!../../assets/pitcher-sd-v2/atlases/${id}-pitch-120-atlas.png'`);
    }
    expect(String(pitcherAtlases['regular-03-amber-sinker'])).toContain('pitcher-sd-v2');
    expect(Object.keys(pitcherAtlases)).toHaveLength(12);
  });

  it('puts her feet on the rubber, the stride dust under her front foot and the ball in her hand',()=>{
    const stance=json('../src/duel/pitcher-stance.json'),stride=json('../src/duel/pitcher-stride.json'),release=json('../src/duel/pitcher-release.json');
    for(const id of ids){
      const m=json(`../assets/pitcher-pixellab-v1/${id}-manifest.json`);
      expect(stance[id],id).toEqual(m.stance);
      expect(stride[id],id).toEqual(m.stride);
      expect(release[id],id).toEqual(m.release);
      expect(m.stride[0]).toBeLessThan(RED_RUSH_RELEASE_FRAME);
    }
  });
});
