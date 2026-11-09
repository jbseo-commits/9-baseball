import {describe,it,expect} from 'vitest';
import {createV10Duel,enterV10Node,v10UtilityOptions,completeV10UtilityNode} from '../src/duel/engine.js';
import {validateV10State,saveV10State,readV10State} from '../src/duel/v10-storage.js';

function atRest(outs=1){
  const s=createV10Duel(19),n=s.runMap.nodes.find(n=>n.type==='rest');
  return enterV10Node({...s,runOuts:outs,runMap:{...s.runMap,reachableIds:[n.id]}},n.id);
}
describe('rest: recover one out OR upgrade one card',()=>{
  it.each(['training','locker'])('rejects recovery disguised with a valid %s card ID',kind=>{
    const s=createV10Duel(kind==='training'?1:19),n=s.runMap.nodes.find(n=>n.type===kind);
    s.deck.push({id:'c9',kind:'strike'});s.nextId=10;
    const t=enterV10Node({...s,runOuts:2,runMap:{...s.runMap,reachableIds:[n.id]}},n.id);
    const id=v10UtilityOptions(t)[0].id;
    expect(completeV10UtilityNode(t,{type:'recover',id})).toBe(t);
  });
  it.each([1,2])('recovers exactly one of %i run outs without rewriting lifetime outs',outs=>{
    const s=atRest(outs),before=structuredClone(s),a=v10UtilityOptions(s).find(a=>a.type==='recover');
    expect(a).toBeTruthy();const t=completeV10UtilityNode(s,a);
    expect(t.phase).toBe('map');expect(t.runOuts).toBe(outs-1);expect(t.stats.outs).toBe(s.stats.outs);
    expect(t.deck).toEqual(s.deck);expect(t.nextId).toBe(s.nextId);expect(t.v10.nextBattleBonus).toBe(s.v10.nextBattleBonus);
    expect(s).toEqual(before);expect(completeV10UtilityNode(t,a)).toBe(t);
  });
  it('at zero outs offers only legal upgrades and rejects recovery/old +8 actions',()=>{
    const s=atRest(0);expect(v10UtilityOptions(s).some(a=>a.type==='recover')).toBe(false);
    expect(v10UtilityOptions(s).some(a=>a.type==='upgrade')).toBe(true);
    for(const a of [{type:'recover'},{type:'rest'},{type:'upgrade',id:'missing'}])expect(completeV10UtilityNode(s,a)).toBe(s);
  });
  it('upgrades a specific duplicate card once, without also recovering an out',()=>{
    const s=atRest(2),a=v10UtilityOptions(s).find(a=>a.type==='upgrade');expect(a).toBeTruthy();
    const t=completeV10UtilityNode(s,a);expect(t.phase).toBe('map');expect(t.runOuts).toBe(2);
    expect(t.deck.filter(c=>c.plus).map(c=>c.id)).toEqual([a.id]);
    expect(t.deck.filter(c=>c.id!==a.id)).toEqual(s.deck.filter(c=>c.id!==a.id));
    expect(t.deck.length).toBe(s.deck.length);expect(t.nextId).toBe(s.nextId);
    expect(completeV10UtilityNode(t,{type:'recover'})).toBe(t);
  });
  it('rejects an already-upgraded ID and keeps skip available without effects',()=>{
    const s=atRest(0);s.deck=s.deck.map(c=>({...c,plus:true}));
    expect(v10UtilityOptions(s)).toEqual([]);
    expect(completeV10UtilityNode(s,{type:'upgrade',id:s.deck[0].id})).toBe(s);
    const t=completeV10UtilityNode(s,{type:'skip'});expect(t.phase).toBe('map');expect(t.deck).toEqual(s.deck);expect(t.runOuts).toBe(0);
  });
  it.each(['rest','event'])('preserves already-earned %s bonus and legacy history through roundtrip',source=>{
    const s=atRest(2);s.v10.nextBattleBonus={technique:8,source};s.v10.utilityHistory=[{nodeId:'old-rest',kind:'rest',action:{type:'rest',technique:8}}];
    for(const a of [{type:'recover'},v10UtilityOptions(s).find(a=>a.type==='upgrade'),{type:'skip'}]){
      const t=completeV10UtilityNode(s,a);expect(t.v10.nextBattleBonus).toEqual({technique:8,source});
      expect(t.v10.utilityHistory[0]).toEqual(s.v10.utilityHistory[0]);expect(validateV10State(t)).toBe(true);
      const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};saveV10State(storage,t);expect(readV10State(storage)).toEqual(t);
    }
  });
});
