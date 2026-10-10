// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect} from 'vitest';
import Duel from '../src/duel/App.jsx';
import {
  createV10Duel,enterV10Node,setAimZone,playV10Action,claimV10Reward,completeV10UtilityNode,
  saveV10Duel,readV10Duel,
} from '../src/duel/engine.js';
import {eventForNode} from '../src/duel/events.js';

beforeEach(()=>{localStorage.clear();localStorage.setItem('9zone-bp-coach-v1','done');});
afterEach(()=>{cleanup();});

// A real path to a road event: win the first battle, then take a reachable
// event node. Forced reachableIds on a fresh run fail map validation.
function winBattle(s,nodeId){
  s=enterV10Node(s,nodeId);
  if(!s.battle)return s;
  s={...s,pitcher:{...s.pitcher,hp:1,phase:'critical'}};
  s=setAimZone(s,s.battle.aimZone);
  s.battle.pending={...s.battle.pending,zone:s.battle.aimZone,roll:.5};
  s=playV10Action(s,{type:'card',id:'basic'});
  return s.phase==='reward'?claimV10Reward(s,{type:'skip'}):s;
}
function eventRun(eventId){
  for(let sd=4;sd<160;sd++){
    let s=winBattle(createV10Duel(sd),'a1-entry');
    if(s.phase!=='map')continue;
    for(let step=0;step<3;step++){
      const util=s.runMap.nodes.find(x=>s.runMap.reachableIds.includes(x.id)&&['training','locker','shop','rest'].includes(x.type));
      if(util){
        s=enterV10Node(s,util.id);
        if(!['training','locker','shop','rest'].includes(s.phase))break;
        s=completeV10UtilityNode(s,{type:'skip'});
      }else{
        const fight=s.runMap.nodes.find(x=>s.runMap.reachableIds.includes(x.id)&&['battle','elite'].includes(x.type));
        if(!fight)break;
        s=winBattle(s,fight.id);
      }
      if(s.phase!=='map')break;
      const n=s.runMap.nodes.find(x=>x.type==='event'&&s.runMap.reachableIds.includes(x.id)&&(!eventId||eventForNode(x)?.id===eventId));
      if(n)return {s,n};
    }
  }
  throw new Error('no reachable event node found');
}
function openMap(){
  const {s,n}=eventRun('dugout-cache');
  saveV10Duel(localStorage,s);
  render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
  return n;
}

describe('V10 road event screen',()=>{
  it('enters from the map, refuses the illegal pick, resolves, and returns',()=>{
    const n=openMap();
    expect(document.querySelector(`[data-node="${n.id}"]`).textContent).toContain('이벤트');
    fireEvent.click(document.querySelector(`[data-node="${n.id}"]`));
    fireEvent.click(screen.getByTestId('bp-map-go'));
    expect(screen.getAllByTestId('event-choice')).toHaveLength(3);
    const delve=screen.getByRole('button',{name:'깊이 판다'});
    expect(delve.disabled).toBe(true);
    expect(delve.textContent).toContain('얇다');
    const before=readV10Duel(localStorage).deck.length;
    fireEvent.click(screen.getByRole('button',{name:'뒤진다'}));
    expect(screen.getByTestId('event-leave')).toBeTruthy();
    const after=readV10Duel(localStorage);
    expect(after.deck).toHaveLength(before+1);
    expect(after.phase).toBe('map');
    fireEvent.click(screen.getByTestId('event-leave'));
    expect(document.querySelector('.bp-map')).not.toBeNull();
  });

  it('leaving takes nothing but completes the node',()=>{
    const n=openMap();
    const deck=readV10Duel(localStorage).deck.length;
    fireEvent.click(document.querySelector(`[data-node="${n.id}"]`));
    fireEvent.click(screen.getByTestId('bp-map-go'));
    fireEvent.click(screen.getByRole('button',{name:'떠난다'}));
    fireEvent.click(screen.getByTestId('event-leave'));
    const t=readV10Duel(localStorage);
    expect(t.deck).toHaveLength(deck);
    expect(t.phase).toBe('map');
  });
});
