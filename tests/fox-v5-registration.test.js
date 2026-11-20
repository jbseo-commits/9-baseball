import {it,expect} from 'vitest';
import registration from '../src/duel/battle-vnext/roster-registration.json';
import {rosterPitcherActor,rosterTimeline} from '../src/duel/battle-vnext/roster-actor.js';
it('registers the supplied V5 hand and keeps the exact approved pose holds and engine event clock',()=>{
 const r=registration['regular-07-red-fox'];expect(r.release).toEqual({x:94.54,y:119.18});expect(r.landing).toEqual({x:194,y:248});expect(r.releaseFrame).toBe(79);
 const actor=rosterPitcherActor(r.id,'fox.webp'),t=rosterTimeline({duration:2000,freeze:0},actor,false,{delivery:true});expect(t.pitchReleaseAt).toBe(950);expect(t.impactAt).toBe(1250);
 for(const [frame,start,end] of [[7,46,56],[8,57,62],[9,63,67]])expect(t.delivery.drawingAtTick.slice(start,end+1)).toEqual(Array(end-start+1).fill(frame));
});
