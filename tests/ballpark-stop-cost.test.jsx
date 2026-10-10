// @vitest-environment happy-dom
import React from 'react';
import {render,cleanup} from '@testing-library/react';
import {afterEach,describe,it,expect} from 'vitest';
import BallparkStop from '../src/duel/BallparkStop.jsx';
import {cardCost} from '../src/duel/cards.js';

afterEach(()=>{cleanup();});

describe('reward offer cost badges match the engine',()=>{
  it('shows cardCost, not the dead cost fallback',()=>{
    // Before: badges used def.cost (a field no card defines) with a power-based
    // fallback, so strike/rally showed 1 while the engine bills 3 and rejects
    // stacks the badges said were legal.
    const options=[{type:'add',kind:'strike'},{type:'add',kind:'rally'},{type:'add',kind:'place'}];
    render(<BallparkStop kind="reward" options={options} deck={[]} onPick={()=>{}} onSkip={()=>{}} onDeck={()=>{}} onInspect={()=>{}}/>);
    const badges=[...document.querySelectorAll('.bp-offer-cost')].map(e=>e.textContent);
    expect(badges).toEqual(options.map(o=>String(cardCost({kind:o.kind}))));
    expect(badges).toEqual(['3','3','2']);
  });
});
