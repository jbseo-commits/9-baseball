import {it,expect} from 'vitest';
import fs from 'node:fs';
import crypto from 'node:crypto';
import reg from '../src/duel/battle-vnext/roster-registration.json';
import old from '../assets/pitcher-inbetweens-v1/base-registration.json';
import selection from '../assets/pitcher-inbetweens-v1/selection.json';
import pack from '../assets/pitcher-inbetweens-v1/manifest.json';
import legacyRelease from '../src/duel/pitcher-release.json';
import legacyStride from '../src/duel/pitcher-stride.json';
import {rosterPitcherActor,rosterTimeline,rosterFrame} from '../src/duel/battle-vnext/roster-actor.js';
import {sceneEffectAt} from '../src/duel/battle-vnext/scene-effects.js';
const ids=['regular-03-amber-sinker','regular-05-violet-sting','tide-vesper'];
const expected={
 'regular-03-amber-sinker':{slot:'submarine',release:{x:160,y:195},keys:[3,4,5,6,7,8]},
 'regular-05-violet-sting':{slot:'sidearm',release:{x:129,y:91},keys:[3,4,5,6,7]},
 'tide-vesper':{slot:'low-three-quarter',release:{x:159,y:130},keys:[3,4,5,6,7]},
};
it('changes only the three diagnosed delivery chains with traceable whole-character sources',()=>{
 expect(Object.keys(selection.characters).filter(id=>selection.characters[id].keyReplacements)).toEqual(ids);
 for(const c of pack.characters){
  const replacements=c.drawings.filter(d=>d.kind==='authored-key-replacement');
  if(!ids.includes(c.id)){expect(replacements).toEqual([]);expect(c.preservedOriginalDrawings).toBe(12);continue;}
  expect(replacements.map(d=>d.originalIndex)).toEqual(expected[c.id].keys);
  for(const d of replacements){expect(d.previousPixelSHA256).not.toBe(d.pixelSHA256);expect(d.drawingAnchorOffset).toEqual([0,0]);expect(fs.existsSync(d.sourceSheet)).toBe(true);}
  const ready=c.drawings[c.keyDrawings[0]];expect(ready.kind).toBe('original-key');
  expect(c.drawings[c.keyDrawings[2]].kind).toBe('original-key');
  const source=selection.characters[c.id].keyReplacements[0].sourceSheet;
  const hash=crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');expect(hash).toHaveLength(64);
 }
});
it('hands the ball off at the corrected slot in both scene helper and legacy coordinate table without changing release/impact times',()=>{
 for(const id of ids){
  const r=reg[id];expect(r.armSlot).toBe(expected[id].slot);expect(r.release).toEqual(expected[id].release);
  expect(r.releaseFrame).toBe(old[id].releaseFrame);expect(r.landingFrame).toBe(old[id].landingFrame);
  expect(legacyRelease[id]).toEqual([r.release.x/256,r.release.y/256]);expect(legacyStride[id].slice(1)).toEqual([r.landing.x/256,r.landing.y/256]);
  const actor=rosterPitcherActor(id,'/test.webp'),timeline=rosterTimeline({duration:2000,freeze:0},actor,false,{delivery:true});
  expect(r.postReleaseWeights).toHaveLength(6);expect(r.postReleaseWeights.every(n=>n>0)).toBe(true);expect(r.postReleaseWeights.reduce((a,b)=>a+b,0)).toBe(54);
  const c=pack.characters.find(c=>c.id===id),step=c.drawings.map((d,i)=>({d,i})).filter(({d})=>d.sourceSheet?.endsWith('-step-g024.webp'));
  expect(step).toHaveLength(2);
  for(const {i} of step)expect(timeline.delivery.drawingAtTick.filter(n=>n===i).length).toBeGreaterThanOrEqual(3);
  const play={timeline,action:'swing',pitchReleaseAt:timeline.pitchReleaseAt};
  const before=sceneEffectAt({elapsed:timeline.pitchReleaseAt-1,playback:play,composition:{release:actor.release,contact:{x:550,y:700}}});expect(before).toBeNull();
  expect(rosterFrame(play,timeline.pitchReleaseAt,actor)).toBe(r.releaseDrawing);
  const effect=sceneEffectAt({elapsed:timeline.pitchReleaseAt,playback:play,composition:{release:actor.release,contact:{x:550,y:700}}});
  expect(effect.ball).toEqual(actor.release);expect(timeline.impactAt-timeline.pitchReleaseAt).toBe(300);
  expect(rosterFrame(play,timeline.duration-1,actor)).toBe(0);
 }
 expect(reg[ids[0]].release.y-old[ids[0]].release.y).toBeGreaterThan(70);
 expect(reg[ids[2]].release.y-old[ids[2]].release.y).toBeGreaterThan(25);
});
