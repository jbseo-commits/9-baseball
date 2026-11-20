import {describe,it,expect} from 'vitest';
import roster from '../assets/pitcher-mobs-v1/roster.json';
import registration from '../src/duel/battle-vnext/roster-registration.json';
import {createV10Duel,enterV10Node,playV10Action} from '../src/duel/engine.js';
import {rosterPitcherActor,rosterTimeline} from '../src/duel/battle-vnext/roster-actor.js';
import {encounterFor} from '../src/duel/pitcher-encounters.js';
describe('new Red Fox uses existing ordinary contracts',()=>{
 it('is an additional named ordinary opponent reachable by existing seed flow',()=>{expect(roster.filter(x=>x.id==='regular-07-red-fox')).toHaveLength(1);expect(roster.find(x=>x.id==='regular-01-red-rush').name).toBe('레드 러시');const s=createV10Duel(20261119),n=s.runMap.nodes.find(n=>n.id==='a1-entry');expect(n.opponent.name).toBe('붉은 여우');expect(n.opponent.style).toBe('rookie');expect(encounterFor(n.opponent.artId)).toBeNull();const battle=enterV10Node(s,n.id),next=playV10Action(battle,{type:'take'});expect(next.stats.pitches).toBe(1);expect(next.battle.revealed).toBeTruthy()});
 it('holds twelve authored drawings on existing timing without new mechanics',()=>{const r=registration['regular-07-red-fox'];expect(r.releaseFrame).toBe(79);expect(r.drawingAtTick).toHaveLength(120);expect(new Set(r.drawingAtTick).size).toBe(12);expect(r.drawingAtTick[78]).toBe(7);expect(r.drawingAtTick[79]).toBe(8);const actor=rosterPitcherActor(r.id,'test.webp'),base={duration:1000,impactAt:200,freeze:0,slowmo:0};const t=rosterTimeline(base,actor,false,{delivery:true});expect(t.pitchReleaseAt).toBe(950);expect(t.impactAt).toBe(1250);expect(t.delivery.drawingAtTick[57]).toBe(8)});
});
