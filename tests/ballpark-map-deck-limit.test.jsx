// @vitest-environment happy-dom
import React from 'react';
import {afterEach,describe,it,expect} from 'vitest';
import {cleanup,render} from '@testing-library/react';
import BallparkMap from '../src/duel/BallparkMap.jsx';
import {DECK_MAX} from '../src/duel/cards.js';
import {createV10Duel,enterV10Node,playV10Action,v10RewardOptions,claimV10Reward,v10UtilityOptions,completeV10UtilityNode} from '../src/duel/engine.js';
import {V10_ALL_RELICS} from '../src/duel/v10-relics.js';

afterEach(()=>cleanup());

function mapNode(type,act=1){
  const id=`a${act}-${type}`;
  return {id,act,row:0,lane:0,type,name:type==='shop'?'장비 상점':type==='boss'?'막 보스':type,
    opponent:type==='shop'?null:{name:`${type} ${act}`,maxHp:80,artId:'regular-01-red-rush',archetypeKey:'outside'}};
}
function show(type,act,deckCount){
  const node=mapNode(type,act);
  const view=render(<BallparkMap nodes={[node]} edges={[]} reachableIds={[node.id]} completedIds={[]} deckCount={deckCount} onEnter={()=>{}}/>);
  return view.container;
}
function addToSize(state,size){
  while(state.deck.length<size)state.deck.push({id:`map-limit-pad-${state.deck.length}`,kind:'strike'});
  return state;
}
function combatReward(type,act,deckCount,{allRelicsOwned=false,seed=0}={}){
  const state=createV10Duel(seed),node=state.runMap.nodes.find(n=>n.act===act&&n.type===type);
  expect(node,`${type} act${act} fixture node`).toBeTruthy();
  state.runMap.reachableIds=[node.id];
  let run=enterV10Node(state,node.id);addToSize(run,deckCount);
  if(allRelicsOwned)run.relics=Object.keys(V10_ALL_RELICS);
  run.pitcher={...run.pitcher,hp:1,phase:'critical'};
  run.battle.pending={...run.battle.pending,zone:run.battle.aimZone,roll:0,powerRoll:.99};
  return playV10Action(run,{type:'card',id:'basic'});
}
function shopAt(deckCount,{allRelicsOwned=false,seed=0}={}){
  const state=createV10Duel(seed),node=state.runMap.nodes.find(n=>n.type==='shop');
  expect(node,'shop fixture node').toBeTruthy();state.runMap.reachableIds=[node.id];
  const shop=addToSize(enterV10Node(state,node.id),deckCount);
  if(allRelicsOwned)shop.relics=Object.keys(V10_ALL_RELICS);
  return shop;
}

describe('map reward copy follows the shared deck limit',()=>{
  it.each([
    ['battle',1,DECK_MAX-1,'이기면 카드 3장 중 1장'],
    ['elite',1,DECK_MAX-1,'이기면 카드 4장 중 1장 · 시그니처'],
    ['boss',1,DECK_MAX-1,'이기면 다음 막 · 시그니처'],
    ['boss',2,DECK_MAX-1,'이기면 다음 막 · 시그니처'],
    ['boss',3,DECK_MAX-1,'이기면 런 완주'],
  ])('keeps the existing %s act %i copy at %i cards', (type,act,count,copy)=>{
    const container=show(type,act,count);
    expect(container.querySelector('.bp-mrw')?.textContent).toBe(copy);
  });

  it('keeps the shop card copy at 17 cards',()=>{
    expect(show('shop',1,DECK_MAX-1).querySelector('.bp-mline')?.textContent).toBe('새 카드를 들인다.');
  });

  it.each([
    ['battle',1,DECK_MAX,'덱이 가득 차 카드 추가 불가'],['elite',1,DECK_MAX,'덱이 가득 차 카드 추가 불가'],
    ['boss',1,DECK_MAX,'이기면 다음 막 · 카드 추가 불가'],['boss',2,DECK_MAX,'이기면 다음 막 · 카드 추가 불가'],
    ['shop',1,DECK_MAX,'덱이 가득 차 카드 추가 불가'],
    ['battle',1,DECK_MAX+1,'덱이 가득 차 카드 추가 불가'],['elite',1,DECK_MAX+1,'덱이 가득 차 카드 추가 불가'],
    ['boss',1,DECK_MAX+1,'이기면 다음 막 · 카드 추가 불가'],['boss',2,DECK_MAX+1,'이기면 다음 막 · 카드 추가 불가'],
    ['shop',1,DECK_MAX+1,'덱이 가득 차 카드 추가 불가'],
  ])('replaces unavailable card copy at %s act %i with %i cards', (type,act,count,copy)=>{
    const container=show(type,act,count);
    const line=container.querySelector(type==='shop'?'.bp-mline':'.bp-mrw')?.textContent||'';
    expect(line).toBe(copy);
    expect(line).not.toContain('카드 3장');
    expect(line).not.toContain('카드 4장');
    expect(line).not.toContain('시그니처');
    expect(line).not.toContain('유물 확정');
  });

  it.each([DECK_MAX-1,DECK_MAX,DECK_MAX+1])('keeps final-boss completion copy with %i cards',count=>{
    expect(show('boss',3,count).querySelector('.bp-mrw')?.textContent).toBe('이기면 런 완주');
  });
});

describe('map deck limit matches actual reward and shop eligibility',()=>{
  it.each([['battle',1],['elite',1],['boss',1],['boss',2]])('rewards cards at 17 and refuses adds at 18 for %s act %i', (type,act)=>{
    const at17=combatReward(type,act,DECK_MAX-1);
    expect(at17.phase).toBe('reward');expect(v10RewardOptions(at17).length).toBeGreaterThan(0);
    const kind=v10RewardOptions(at17)[0],added=claimV10Reward(at17,{type:'add',kind});
    expect(added.deck).toHaveLength(DECK_MAX);

    const at18=combatReward(type,act,DECK_MAX);
    expect(at18.phase).toBe('reward');expect(v10RewardOptions(at18)).toEqual([]);
    expect(claimV10Reward(at18,{type:'add',kind:at18.v10.rewardChoices[0]})).toBe(at18);
  });

  it('allows an eligible shop card at 17, but no card or guaranteed relic when full and all tier relics are owned',()=>{
    const at17=shopAt(DECK_MAX-1);
    const cards17=v10UtilityOptions(at17).filter(x=>x.type==='add');expect(cards17.length).toBeGreaterThan(0);
    expect(completeV10UtilityNode(at17,cards17[0]).deck).toHaveLength(DECK_MAX);

    const full=shopAt(DECK_MAX,{allRelicsOwned:true});
    expect(v10UtilityOptions(full).filter(x=>x.type==='add')).toEqual([]);
    expect(v10UtilityOptions(full).filter(x=>x.type==='relic')).toEqual([]);
    expect(completeV10UtilityNode(full,{type:'add',kind:cards17[0].kind})).toBe(full);
  });

  it('does not guarantee an elite or boss relic when every relic is owned',()=>{
    for(const [type,act] of [['elite',1],['boss',1],['boss',2]]){
      const reward=combatReward(type,act,DECK_MAX,{allRelicsOwned:true});
      expect(reward.phase).toBe('reward');
      expect(reward.v10.relicChoices).toEqual([]);
      expect(v10RewardOptions(reward)).toEqual([]);
    }
  });

  it('keeps the act-three engine victory and offers no post-run card reward at 18 cards',()=>{
    let run=createV10Duel(0);run.runMap.reachableIds=['a3-boss'];
    run=enterV10Node(run,'a3-boss');addToSize(run,DECK_MAX);
    run.pitcher={...run.pitcher,hp:1,phase:'critical'};
    run.battle.pending={...run.battle.pending,zone:run.battle.aimZone,roll:0,powerRoll:.99};
    run=playV10Action(run,{type:'card',id:'basic'});
    expect(run.phase).toBe('won');expect(run.v10.runComplete).toBe(true);
    expect(run.v10.rewardChoices).toEqual([]);expect(v10RewardOptions(run)).toEqual([]);
  });
});
