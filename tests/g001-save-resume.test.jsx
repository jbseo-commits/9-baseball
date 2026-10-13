// @vitest-environment happy-dom
import React from 'react';
import {render,screen,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect} from 'vitest';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,startBattle,saveV10Duel,readV10Duel} from '../src/duel/engine.js';
import {PORTRAIT_ONLY} from '../src/duel/layout-mode.js';

beforeEach(()=>{localStorage.clear()});
afterEach(()=>{cleanup()});

/* G-001: switching between the portrait frame and the PC iframe remounts the app.
   What has to survive a remount is the save itself; this covers that contract only.
   A real rotation on a device is still a manual check. */
describe('G-001 save survives an app remount',()=>{
  it('a mid-battle run reads back with the same deck and still offers continue after a remount',()=>{
    const s=startBattle(createV10Duel(7));
    saveV10Duel(localStorage,s);
    const back=readV10Duel(localStorage);
    expect(back.version).toBe(10);
    expect(back.deck.map(c=>c.kind)).toEqual(s.deck.map(c=>c.kind));
    const first=render(<Duel/>);
    expect(screen.getByRole('button',{name:'이어하기'}).disabled).toBe(false);
    first.unmount();
    render(<Duel/>);
    expect(screen.getByRole('button',{name:'이어하기'}).disabled).toBe(false);
  });
  it('the layout stays portrait-only, so a remount never lands on an untested landscape layout',()=>{
    expect(PORTRAIT_ONLY).toBe(true);
  });
});
