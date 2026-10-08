// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import BallparkStop from '../src/duel/BallparkStop.jsx';

afterEach(()=>{cleanup();});

const deck=[{id:'c0',kind:'strike'},{id:'c1',kind:'strike',plus:true}];
const options=[
  {type:'remove',id:'c0',kind:'strike',name:'밀어치기'},
  {type:'remove',id:'c1',kind:'strike',name:'밀어치기'},
];
const show=(onPick)=>render(<BallparkStop kind="locker" options={options} deck={deck} deckCount={2} onPick={onPick} onSkip={()=>{}} onDeck={()=>{}} onInspect={()=>{}}/>);
const tiles=()=>[...document.querySelectorAll('.bp-offer.reward-card')];

describe('locker lists every copy',()=>{
  it('shows base and plus copies as separate, marked tiles',()=>{
    // Before: one tile per kind with a deck-count line, so the + copy could
    // never be told apart — yet removal always took the first id.
    show(()=>{});
    expect(tiles()).toHaveLength(2);
    expect(tiles()[0].querySelector('sup')).toBeNull();
    expect(tiles()[1].querySelector('sup')?.textContent).toBe('+');
  });
  it('removes the picked copy, not always the first',()=>{
    const onPick=vi.fn();
    show(onPick);
    fireEvent.click(tiles()[1]);
    expect(screen.getByTestId('bp-stop-go-sub').textContent).toBe('밀어치기+');
    fireEvent.click(screen.getByTestId('bp-stop-go'));
    expect(onPick).toHaveBeenCalledWith(options[1]);
  });
});
