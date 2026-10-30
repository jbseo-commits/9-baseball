import {describe,expect,it} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import registration from '../src/duel/battle-vnext/roster-registration.json';
import {pitcherAtlases} from '../src/duel/pitcher-visuals.js';
import {rosterPitcherActor,rosterTimeline} from '../src/duel/battle-vnext/roster-actor.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'src/duel',name),'utf8'));
const round=n=>Math.round(n*1e6)/1e6;

describe('full roster articulated pitcher runtime registration',()=>{
  it('registers all 20 compact atlases with rig scale, projected frame-76 socket and one shared release',()=>{
    const stance=read('pitcher-stance.json'),release=read('pitcher-release.json'),stride=read('pitcher-stride.json');
    const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/pitcher-rig-v1/manifest.json'),'utf8'));
    const delivered=new Map(manifest.characters.map(c=>[c.id,c]));
    expect(Object.keys(registration)).toHaveLength(20);
    expect(Object.keys(pitcherAtlases)).toEqual(expect.arrayContaining(Object.keys(registration)));
    expect(new Set(Object.values(pitcherAtlases)).size).toBe(20);
    for(const [id,r] of Object.entries(registration)){
      const source=delivered.get(id);
      expect(source,id).toBeTruthy();expect(source.frames).toBe(120);expect(source.fps).toBe(60);expect(source.releaseFrame).toBe(76);
      expect(fs.existsSync(path.join(root,source.file))).toBe(true);
      expect(String(pitcherAtlases[id])).toContain(`${id}.avif`);
      expect(r.id).toBe(id);expect(r.releaseFrame).toBe(76);expect(r.hand).toMatch(/^(left|right)$/);
      expect(r.style).toBeTruthy();expect(r.styleStatus).toBeTruthy();expect(r.status).toBe(source.status);
      expect(r.provenance.runtimeSha256).toBe(source.runtimeSha256);expect(r.provenance.rigSha256).toBe(source.source.rigSha256);
      expect(r.artAcceptance).toBe(false);expect(r.knownVisualLimitations.length).toBeGreaterThan(0);
      expect(r.visibleHeight).toBeGreaterThan(0);expect(r.anchor.x).toBeGreaterThanOrEqual(0);expect(r.anchor.x).toBeLessThanOrEqual(256);
      expect(r.release.x).toBeCloseTo(r.anchor.x+r.release3D.x*r.visibleHeight,3);
      expect(r.release.y).toBeCloseTo(r.anchor.y+(r.release3D.y+.24*r.release3D.z-1)*r.visibleHeight,3);
      expect(stance[id]).toEqual([round(r.anchor.x/256),round(r.anchor.y/256)]);
      expect(release[id]).toEqual([round(r.release.x/256),round(r.release.y/256)]);
      expect(stride[id]).toEqual([55,round(r.stride.x/256),round(r.stride.y/256)]);
      expect(r.anchor.x).toBeCloseTo(source.anchor.x,3);expect(r.anchor.y).toBeCloseTo(source.anchor.y,3);
      expect(r.release.x).toBeCloseTo(source.release.x,3);expect(r.release.y).toBeCloseTo(source.release.y,3);
      const actor=rosterPitcherActor(id,pitcherAtlases[id]);
      expect(actor.releaseAt).toBe(Math.round(76*1000/60));
      expect(actor.meta.worldHeight).toBeCloseTo(300*256/r.visibleHeight,5);
      expect(actor.release).toEqual({
        x:actor.meta.worldFoot.x+(r.release.x-r.anchor.x)*actor.meta.worldHeight/256,
        y:actor.meta.worldFoot.y+(r.release.y-r.anchor.y)*actor.meta.worldHeight/256,
      });
      const timeline=rosterTimeline({impactAt:100,freeze:0,slowmo:0,releaseAt:200,settleAt:500,duration:700},actor);
      expect(timeline.impactAt-actor.releaseAt).toBe(300);
    }
    expect(rosterPitcherActor('unknown','some-atlas')).toBeNull();
  });
});
