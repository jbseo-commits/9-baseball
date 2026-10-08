// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect} from 'vitest';
import WelcomeGuide,{WELCOME_SEEN_KEY,WELCOME_CHAPTERS} from '../src/duel/WelcomeGuide.jsx';

beforeEach(()=>{localStorage.clear();});
afterEach(()=>{cleanup();});

describe('welcome guide first-run persistence',()=>{
  it('marks the guide seen when leaving via the card dex',()=>{
    // Before: 카드 도감 bypassed done(), so even a full 9-page read-through
    // reopened the guide on every new game.
    render(<WelcomeGuide start={WELCOME_CHAPTERS.length-1} onClose={()=>{}} onCards={()=>{}}/>);
    fireEvent.click(screen.getByRole('button',{name:'카드 도감'}));
    expect(localStorage.getItem(WELCOME_SEEN_KEY)).toBe('seen');
  });
  it('still marks seen on skip',()=>{
    render(<WelcomeGuide start={0} onClose={()=>{}} onCards={()=>{}}/>);
    fireEvent.click(screen.getByRole('button',{name:'건너뛰기'}));
    expect(localStorage.getItem(WELCOME_SEEN_KEY)).toBe('seen');
  });
});
