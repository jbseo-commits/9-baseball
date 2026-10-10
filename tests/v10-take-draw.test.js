import {describe,it,expect} from 'vitest';
import {LINEUP} from '../src/duel/cards.js';
import {validateV10State} from '../src/duel/v10-storage.js';
import {createV10Duel,enterV10Node,playV10Action,advanceV10Pitch,advanceV10Batter,createDuel,startBattle,playCard,advancePitch,
  HAND_MAX,HAND_REFILL,V10_TAKE_HAND_MAX,v10TakeDrawPreview,saveV10Duel,readV10Duel,V10_SAVE_KEY,v10NormalizeHand} from '../src/duel/engine.js';

const battle=(seed=8101,handCount=5,drawCount=null)=>{
  const s=enterV10Node(createV10Duel(seed),'a1-entry'),ids=s.deck.map(c=>c.id);
  const split=drawCount??ids.length-handCount;
  s.battle.hand=ids.slice(0,handCount);
  s.battle.draw=ids.slice(handCount,handCount+split);
  s.battle.discard=ids.slice(handCount+split);
  s.battle.pending.zone=9;
  return s;
};
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
const take=(s,{walk=false}={})=>{if(walk)s.battle.balls=3;return playV10Action(s,{type:'take'});};

function distinct(hand){return new Set(hand).size===hand.length;}

describe('V10 TAKE bonus draw',()=>{
  it('draws after the normal next-pitch card and reaches six from a four-card hand',()=>{
    const result=take(battle(8101,4));
    expect(v10TakeDrawPreview(result)).toEqual({count:1,reason:null});
    const before=result.battle.hand.length,next=advanceV10Pitch(result);
    expect(next.battle.hand.length).toBe(before+2);
    expect(next.battle.hand.length).toBe(V10_TAKE_HAND_MAX);
    expect(next.last.takeDrawn).toBe(1);expect(next.last.events).toContain('지켜보기 보상 · 카드 +1');
    expect(distinct(next.battle.hand)).toBe(true);
  });

  it('keeps the ordinary five-card limit, then permits only the extra TAKE card',()=>{
    const result=take(battle(8102,5));
    const next=advanceV10Pitch(result);
    expect(next.battle.hand.length).toBe(6);expect(next.last.takeDrawn).toBe(1);
    const normalState=battle(8103,5);normalState.phase='pitch';normalState.battle.takeEnergyBonus=0;
    const normal=advanceV10Pitch(normalState);
    expect(normal.battle.hand).toHaveLength(HAND_MAX);
  });

  it('does not discard or replace cards when six are already held',()=>{
    const s=battle(8104,6),before={hand:[...s.battle.hand],seed:s.seed,pitchSeed:s.pitchSeed,draw:[...s.battle.draw],discard:[...s.battle.discard]};
    const result=take(s);
    expect(v10TakeDrawPreview(result)).toEqual({count:0,reason:'full'});
    expect(result.v10.lastCombat.takeDrawBonus).toBe(0);expect(result.v10.lastCombat.takeDrawReason).toBe('full');
    const noBonus=structuredClone(result);noBonus.battle.takeEnergyBonus=0;
    const next=advanceV10Pitch(result),withoutBonus=advanceV10Pitch(noBonus);
    expect(next.battle.hand).toEqual(before.hand);expect(next.last.takeDrawn).toBe(0);
    expect(next.seed).toBe(before.seed);expect(distinct(next.battle.hand)).toBe(true);
    expect(next.pitchSeed).toBe(withoutBonus.pitchSeed);expect(next.battle.pending).toEqual(withoutBonus.battle.pending);
    const resumed=v10NormalizeHand(structuredClone(next));
    expect(resumed.battle.hand).toEqual(next.battle.hand);
  });

  it('applies the next-batter refill before the extra card for hand sizes 0, 3, 4, and 5',()=>{
    const cases=[[0,5],[3,5],[4,5],[5,6]];
    for(const [handCount,expected] of cases){
      const result=take(battle(8110+handCount,handCount),{walk:true});
      expect(result.phase).toBe('between');expect(v10TakeDrawPreview(result)).toEqual({count:1,reason:null});
      const next=advanceV10Batter(result);
      expect(next.battle.hand.length).toBe(expected);expect(next.last.takeDrawn).toBe(1);
      expect(next.last.kind).toBe('entry');
      expect(next.last.events).toContain('지켜보기 보상 · 카드 +1');expect(distinct(next.battle.hand)).toBe(true);
    }
  });

  it('keeps TAKE reservation untouched when the next batter is still on base',()=>{
    const result=take(battle(8119,4),{walk:true}),next=(result.battle.batterIndex+1)%9;
    result.battle.bases[1]=LINEUP[next].id;
    const before=JSON.stringify(result);
    expect(advanceV10Batter(result)).toBe(result);expect(JSON.stringify(result)).toBe(before);
  });

  it('reports an empty stock, but can recycle a discard pile without changing the next pitch',()=>{
    const depleted=battle(8121,0,0);depleted.battle.draw=[];depleted.battle.discard=[];
    const empty=take(depleted);
    expect(v10TakeDrawPreview(empty)).toEqual({count:0,reason:'empty'});
    expect(empty.v10.lastCombat.takeDrawReason).toBe('empty');
    expect(advanceV10Pitch(empty).last.takeDrawn).toBe(0);

    const recycled=battle(8122,5,0);recycled.battle.discard=recycled.deck.slice(5,9).map(c=>c.id);
    recycled.battle.draw=[];
    const result=take(recycled),noBonus=structuredClone(result);noBonus.battle.takeEnergyBonus=0;
    expect(v10TakeDrawPreview(result)).toEqual({count:1,reason:null});
    const withDraw=advanceV10Pitch(result),withoutDraw=advanceV10Pitch(noBonus);
    expect(withDraw.battle.hand).toHaveLength(6);expect(withDraw.last.takeDrawn).toBe(1);
    expect(withDraw.seed).not.toBe(withoutDraw.seed);
    expect(withDraw.pitchSeed).toBe(withoutDraw.pitchSeed);
    expect(withDraw.battle.pending).toEqual(withoutDraw.battle.pending);
    expect(distinct(withDraw.battle.hand)).toBe(true);
  });

  it('does not bank a bonus when the basic draw consumes the last available card',()=>{
    for(const walk of [false,true]){
      const s=battle(8123+Number(walk),3,1);s.battle.discard=[];
      const result=take(s,{walk});
      expect(v10TakeDrawPreview(result)).toEqual({count:0,reason:'empty'});
      const next=walk?advanceV10Batter(result):advanceV10Pitch(result);
      expect(next.battle.hand).toHaveLength(4);expect(next.last.takeDrawn).toBe(0);
      expect(next.battle.takeEnergyBonus).toBe(0);
      next.battle.draw=[s.deck[4].id];next.battle.pending.zone=9;
      const swung=playV10Action(next,{type:'card',id:'basic'});
      const afterSwing=advanceV10Pitch(swung);
      expect(afterSwing.battle.hand).toHaveLength(5);expect(afterSwing.last.takeDrawn).toBeUndefined();
    }
  });

  it('keeps non-TAKE draws at five and leaves V9 state and draws unchanged',()=>{
    expect(HAND_MAX).toBe(5);expect(HAND_REFILL).toBe(4);expect(V10_TAKE_HAND_MAX).toBe(6);
    const v10=battle(8131,5);v10.battle.takeEnergyBonus=0;v10.phase='pitch';
    expect(advanceV10Pitch(v10).battle.hand).toHaveLength(5);

    let v9=startBattle(createDuel(8132,'away'));
    const skill={id:'watch-test',kind:'watch'};v9.deck.push(skill);v9.battle.hand=[...v9.battle.hand.slice(0,4),skill.id];
    const afterPrep=playCard(v9,skill.id);
    expect(afterPrep.battle.hand.length).toBeLessThanOrEqual(HAND_MAX);
    const afterNext=advancePitch({...afterPrep,phase:'pitch'});
    expect(afterNext.battle.hand.length).toBeLessThanOrEqual(HAND_MAX);
    expect(afterNext.battle.energy).toBeUndefined();expect(afterNext.battle.takeEnergyBonus).toBeUndefined();

    const full=battle(8133,6),watchId='watch-limit';full.deck.push({id:watchId,kind:'watch'});full.battle.hand[5]=watchId;
    const prepared=playV10Action(full,{type:'card',id:watchId});
    expect(prepared.battle.hand).toHaveLength(HAND_MAX);
  });

  it('saves pending draw metadata and consumes the old energy reservation once on resume',()=>{
    const result=take(battle(8141,5));
    expect(result.v10.lastCombat.takeEnergyBonus).toBe(1);expect(result.v10.lastCombat.takeDrawBonus).toBe(1);
    const store=memory();saveV10Duel(store,result);
    const restored=readV10Duel(store),next=advanceV10Pitch(restored);
    expect(next.battle.hand).toHaveLength(6);expect(next.last.takeDrawn).toBe(1);
    expect(advanceV10Pitch(next)).toBe(next);

    const legacy=structuredClone(result);delete legacy.v10.lastCombat.takeDrawBonus;delete legacy.v10.lastCombat.takeDrawReason;
    const legacyStore=memory();legacyStore.setItem(V10_SAVE_KEY,JSON.stringify(legacy));
    const old=readV10Duel(legacyStore);
    expect(old.battle.takeEnergyBonus).toBe(1);
    expect(advanceV10Pitch(old).battle.hand).toHaveLength(6);
  });

  it('validates optional historical draw metadata without rejecting old saves',()=>{
    const result=take(battle(8151,5));
    expect(validateV10State(result)).toBe(true);
    const legacy=structuredClone(result);delete legacy.v10.lastCombat.takeDrawBonus;delete legacy.v10.lastCombat.takeDrawReason;
    expect(validateV10State(legacy)).toBe(true);
    for(const bad of [-1,2,1.5,'1']){
      const malformed=structuredClone(result);malformed.v10.lastCombat.takeDrawBonus=bad;
      expect(validateV10State(malformed)).toBe(false);
    }
    for(const bad of ['full-ish',1]){
      const malformed=structuredClone(result);malformed.v10.lastCombat.takeDrawReason=bad;
      expect(validateV10State(malformed)).toBe(false);
    }
  });
});
