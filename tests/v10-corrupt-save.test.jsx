// @vitest-environment happy-dom
import React from 'react';
import {render,screen,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect} from 'vitest';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,saveV10Duel,V10_SAVE_KEY} from '../src/duel/engine.js';

beforeEach(()=>{localStorage.clear()});
afterEach(()=>{cleanup()});

// G-002: a corrupt main-run save must say so instead of silently dropping the run.
// Today all three states below render the identical menu (no continue, no message),
// so a player cannot tell "my run is gone" from "I never started one".
const corruptMsg=/손상되어 이어할 수 없습니다/;

describe('G-002 corrupt V10 save',()=>{
  it('a corrupt main-run save says so instead of silently dropping the run',()=>{
    saveV10Duel(localStorage,createV10Duel(7));
    localStorage.setItem(V10_SAVE_KEY,'{broken-json');
    render(<Duel/>);
    expect(screen.getByText(corruptMsg)).not.toBeNull();
    expect(screen.getByRole('button',{name:'이어하기'}).disabled).toBe(true);
  });
  it('a valid save shows no corruption message and keeps continue enabled',()=>{
    saveV10Duel(localStorage,createV10Duel(7));
    render(<Duel/>);
    expect(screen.queryByText(corruptMsg)).toBeNull();
    expect(screen.getByRole('button',{name:'이어하기'}).disabled).toBe(false);
  });
  it('with no save at all there is no corruption message',()=>{
    render(<Duel/>);
    expect(screen.queryByText(corruptMsg)).toBeNull();
  });
  it('the retry button only appears when there is something to retry',()=>{
    // Corrupt V10 and nothing else: a retry button would call persist(null) and do nothing.
    saveV10Duel(localStorage,createV10Duel(7));
    localStorage.setItem(V10_SAVE_KEY,'{broken-json');
    render(<Duel/>);
    expect(screen.getByText(corruptMsg)).not.toBeNull();
    expect(screen.queryByRole('button',{name:'저장 재시도'})).toBeNull();
  });
});