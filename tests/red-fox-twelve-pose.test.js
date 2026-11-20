import {it,expect} from 'vitest';
import fs from 'node:fs';
import crypto from 'node:crypto';
import registration from '../src/duel/battle-vnext/roster-registration.json';
import {rosterPitcherActor,rosterTimeline,rosterFrame} from '../src/duel/battle-vnext/roster-actor.js';
import packing from '../docs/qa/fox-twelve-pose-20261120/packing.json';
it('keeps the approved source bytes and both sole registrations without scaling poses differently',()=>{
 const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 expect(hash('assets/red-fox-twelve-pose-v1/red-fox-pitch-sprite-sheet.png')).toBe('4a5ecae4981f0dc99e4349dc211d099c4032f6fe0bcbb28be0f677442de6aeb3');
 expect(hash('assets/red-fox-twelve-pose-v1/metadata.json')).toBe('b3b6aee38ee1f810b7823667edc61a7f048675f48362e42719fb5f92db7fcd45');
 for(const p of packing){expect(p.sourceAnchor.map((v,i)=>v*3+p.cellOrigin[i])).toEqual(p.cellFoot);expect(p.bounds.every(v=>v>=0&&v<=256)).toBe(true)}
 expect(new Set(packing.slice(5).map(p=>JSON.stringify(p.cellFoot))).size).toBe(1);
 const p=packing[8];expect([94*3+p.cellOrigin[0],33*3+p.cellOrigin[1]]).toEqual([230,59]);
});
it('never releases early, holds the planted sole through recovery, and keeps reduced motion unchanged',()=>{
 const actor=rosterPitcherActor('regular-07-red-fox','fox.webp'),base={duration:60,impactAt:0,freeze:0,slowmo:0};
 const t=rosterTimeline(base,actor,false,{delivery:true}),frames=t.delivery.drawingAtTick;
 expect(frames.slice(0,57).every(f=>f<8)).toBe(true);expect(frames[57]).toBe(8);expect(t.pitchReleaseAt).toBe(950);expect(t.impactAt).toBe(1250);
 expect(new Set(frames).size).toBe(12);expect(frames.slice(57).every(f=>f>=8&&f<=11)).toBe(true);
 expect(rosterFrame({timeline:t,action:'swing'},t.duration-1,actor)).toBe(11);
 expect(rosterTimeline(base,actor,true,{delivery:true})).toBe(base);
 expect(rosterFrame({timeline:base,action:'swing'},30,actor)).toBe(0);
 expect(registration[actor.artId].visibleWorldHeight).toBe(201.17548405430654);
});
