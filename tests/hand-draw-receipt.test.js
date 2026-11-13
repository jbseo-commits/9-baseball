import {it,expect} from 'vitest';
import {createV10Duel,enterV10Node,playV10Action,advanceV10Pitch,drawReceiptFor} from '../src/duel/engine.js';
const open=()=>enterV10Node(createV10Duel(3),'a1-entry');
it('records actual pushed card instance IDs without adding any serialized state',()=>{
 const s=open(),r=drawReceiptFor(s);
 expect(r.ids).toHaveLength(5);expect(new Set(r.ids).size).toBe(5);
 expect(r.ids.every(id=>s.deck.some(c=>c.id===id))).toBe(true);
 expect(Object.isFrozen(r)).toBe(true);expect(Object.isFrozen(r.ids)).toBe(true);
 expect(drawReceiptFor(JSON.parse(JSON.stringify(s)))).toBeNull();
 expect(JSON.stringify(s)).not.toContain('drawReceipt');
});
it('has no receipt for take itself; a full-hand take bonus records the one real next-pitch draw',()=>{
 const s=open();s.battle.pending={zone:9,roll:.1,powerRoll:.1};
 const taken=playV10Action(s,{type:'take'});expect(drawReceiptFor(taken)).toBeNull();
 const next=advanceV10Pitch(taken),r=drawReceiptFor(next);
 expect(next.battle.hand).toHaveLength(6);expect(r.ids).toHaveLength(1);expect(r.ids[0]).toBe(next.battle.hand.at(-1));
});
it('captures a consumed skill redrawn as the very same instance after recycling',()=>{
 const s=open(),id=s.battle.hand[0];s.deck.find(c=>c.id===id).kind='scout';
 s.battle.hand=[id];s.battle.draw=[];s.battle.discard=[];
 const next=playV10Action(s,{type:'card',id});
 expect(next.battle.hand).toEqual([id]);expect(drawReceiptFor(next).ids).toEqual([id]);
 expect(s.battle.hand).toEqual([id]);expect(s.battle.discard).toEqual([]);
});
it('captures drawPlay in the actual push order on a resolved action',()=>{
 const s=open(),id=s.battle.hand[0];s.deck.find(c=>c.id===id).kind='tempoSwing';
 s.battle.hand=[id];s.battle.pending={zone:4,roll:.01,powerRoll:.1};s.battle.aimZone=4;
 const next=playV10Action(s,{type:'card',id}),r=drawReceiptFor(next);
 expect(r.ids.length).toBeGreaterThan(0);expect(r.ids).toEqual(next.battle.hand);
});

it('aggregates the normal next-pitch draw and take-bonus draw in the actual push order',()=>{
 const s=open();s.battle.draw.push(...s.battle.hand.splice(1));s.battle.pending={zone:9,roll:.1,powerRoll:.1};
 const next=advanceV10Pitch(playV10Action(s,{type:'take'})),r=drawReceiptFor(next);
 expect(r.ids).toHaveLength(2);expect(r.ids).toEqual(next.battle.hand.slice(-2));
});
