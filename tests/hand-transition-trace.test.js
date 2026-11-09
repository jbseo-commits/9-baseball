import {describe,it,expect} from 'vitest';
import {createV10Duel,enterV10Node,applyStartPack,playV10Action,advanceV10Pitch,captureHandTransition,setAimZone,coverageAt,cardProblem} from '../src/duel/engine.js';
import {CARDS} from '../src/duel/cards.js';

const open=seed=>enterV10Node(createV10Duel(seed),'a1-entry');
describe('non-persistent ordered hand receipts',()=>{
  it('a shot-mode miss discards the actual string ID and keeps every other hand card',()=>{
    const s=open(3);s.v10.shotMode=true;
    const id=s.battle.hand.find(id=>CARDS[s.deck.find(c=>c.id===id).kind].type==='attack'&&!cardProblem(s,id));
    const aim=Array.from({length:9},(_,i)=>i).find(z=>!coverageAt(s,id,z).includes(s.battle.pending.zone));
    const before=setAimZone(s,aim),out=captureHandTransition(before,x=>playV10Action(x,{type:'card',id}));
    expect(out.state.battle.hand).not.toContain(id);expect(out.state.battle.discard).toContain(id);
    expect(out.state.battle.hand).toEqual(before.battle.hand.filter(x=>x!==id));
    expect(out.state.battle.discard).not.toContain(undefined);expect(out.events.filter(e=>e.type==='discard').map(e=>e.id)).toEqual([id]);
  });
  it('captures final opening hand after pack role swaps without changing state or RNG',()=>{
    for(let seed=1;seed<=20;seed++){
      const s=applyStartPack(createV10Duel(seed),'power'),snapshot=JSON.stringify(s);
      const traced=captureHandTransition(s,x=>enterV10Node(x,'a1-entry'));
      expect(traced.state).toEqual(enterV10Node(s,'a1-entry'));expect(JSON.stringify(s)).toBe(snapshot);
      expect(traced.events.map(e=>e.type)).toEqual(['deal']);expect(traced.events[0].ids).toEqual(traced.state.battle.hand);
      expect(JSON.stringify(traced.state)).not.toContain('handEvents');expect(Object.isFrozen(traced.events)).toBe(true);
    }
  });
  it('records same-ID discard → actual shuffle → draw instead of inferring a set difference',()=>{
    const s=open(3),id=s.deck.find(c=>c.kind==='watch').id;
    s.battle.hand=[id];s.battle.draw=[];s.battle.discard=[];
    const action=x=>playV10Action(x,{type:'card',id}),traced=captureHandTransition(s,action);
    expect(traced.state).toEqual(action(s));expect(traced.state.battle.hand).toEqual([id]);
    expect(traced.events.map(e=>e.type)).toEqual(['discard','shuffle','draw']);
    expect(traced.events[0].id).toBe(id);expect(traced.events[1].count).toBe(1);expect(traced.events[2].id).toBe(id);
    expect(traced.events[0].discard).toBe(1);expect(traced.events[2].discard).toBe(0);
  });
  it('take/basic invent no discard and next-pitch refill preserves the complete engine state',()=>{
    const s=open(3),take=captureHandTransition(s,x=>playV10Action(x,{type:'take'}));
    expect(take.events.filter(e=>e.type==='discard')).toEqual([]);expect(take.state).toEqual(playV10Action(s,{type:'take'}));
    if(take.state.phase==='pitch'){
      const next=captureHandTransition(take.state,advanceV10Pitch);expect(next.state).toEqual(advanceV10Pitch(take.state));
      expect(next.events.every(e=>['shuffle','draw'].includes(e.type))).toBe(true);
    }
    const basic=captureHandTransition(s,x=>playV10Action(x,{type:'card',id:'basic'}));
    expect(basic.events.some(e=>e.type==='discard')).toBe(false);
  });
  it('invalid/throw/nested capture leaves no context or events for later transitions',()=>{
    const s=open(3),fn=x=>playV10Action(x,{type:'take'});
    expect(captureHandTransition(s,x=>playV10Action(x,{type:'card',id:'missing'})).events).toEqual([]);
    expect(()=>captureHandTransition(s,x=>{fn(x);throw Error('abort');})).toThrow('abort');
    expect(()=>captureHandTransition(s,x=>captureHandTransition(x,fn))).toThrow('nested');
    expect(captureHandTransition(s,fn)).toEqual(captureHandTransition(s,fn));
  });
});
