// @vitest-environment happy-dom
import React from 'react';
import {render,screen,cleanup} from '@testing-library/react';
import {afterEach,describe,it,expect} from 'vitest';
import OrderSheet from '../src/duel/OrderSheet.jsx';
import {CARDS,ZONES} from '../src/duel/cards.js';

afterEach(cleanup);
const planSameZone={
  steps:[{order:1,id:'c0',kind:'strike',aimZone:4,main:true},{order:2,id:'c1',kind:'place',aimZone:4,main:false}],
  links:[{fromOrder:1,toOrder:2,fromZone:4,toZone:4,connected:true}],
  cardCount:2,connectCount:1,connectBonus:.07,sameZoneConnections:1,sameZoneBonus:.05,
  baseDamageRate:.80,orderedDamageRate:.92,damageRate:.92,
};

describe('same-zone focus bonus is visible',()=>{
  it('OrderSheet states the focused bonus next to efficiency',()=>{
    render(<OrderSheet plan={planSameZone} plusOf={()=>false} onMove={()=>{}} onRecall={()=>{}} onClose={()=>{}}/>);
    const rate=screen.getByRole('status');
    expect(rate.textContent).toContain('같은 존');
    expect(rate.textContent).toMatch(/\+\s*5\s*%p/);
  });
});
