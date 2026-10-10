// @vitest-environment happy-dom
import React from 'react';
import {render,cleanup} from '@testing-library/react';
import {afterEach,describe,it,expect} from 'vitest';
import BallparkStop from '../src/duel/BallparkStop.jsx';
import {CARDS,cardCost} from '../src/duel/cards.js';

afterEach(()=>{cleanup();});

describe('reward offer cost badges match the engine',()=>{
  it('shows cardCost, not the dead cost fallback',()=>{
    // The badge and the engine bill the same explicit per-card cost (MAIN RUN energy pool).
    const options=[{type:'add',kind:'strike'},{type:'add',kind:'rally'},{type:'add',kind:'place'}];
    render(<BallparkStop kind="reward" options={options} deck={[]} onPick={()=>{}} onSkip={()=>{}} onDeck={()=>{}} onInspect={()=>{}}/>);
    const badges=[...document.querySelectorAll('.bp-offer-cost')].map(e=>e.textContent);
    expect(badges).toEqual(options.map(o=>String(cardCost({kind:o.kind}))));
    expect(badges).toEqual(options.map(o=>String(CARDS[o.kind].cost)));
  });
});
