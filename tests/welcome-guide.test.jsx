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
  it('teaches gated reading, the bunt exception, and the lure boundary',()=>{
    // Zone chapter (index 2): no exact-% norm, boundary is >= 30%.
    render(<WelcomeGuide start={2} onClose={()=>{}} onCards={()=>{}}/>);
    let text=document.querySelector('.wg-page').textContent;
    expect(text).toContain('처음엔 낱말로');
    expect(text).toContain('30% 이상이면');
    expect(text).not.toContain('30%를 넘으면');
    cleanup();
    // Cover chapter (index 3): no unconditional cover-equals-hit.
    render(<WelcomeGuide start={3} onClose={()=>{}} onCards={()=>{}}/>);
    text=document.querySelector('.wg-page').textContent + document.querySelector('.wg-sheet h2').textContent;
    expect(text).toContain('희생 번트');
    expect(text).not.toContain('무조건 안타');
    cleanup();
    // Flow chapter (index 1): numbers only as far as earned.
    render(<WelcomeGuide start={1} onClose={()=>{}} onCards={()=>{}}/>);
    text=document.querySelector('.wg-page').textContent;
    expect(text).toContain('읽은 만큼만');
    expect(text).not.toContain('%는 실제 확률');
  });
  it('teaches that outs carry over in the goal chapter',()=>{
    // Analysis §2: baseball players expect a fresh count; wins keep outs.
    render(<WelcomeGuide start={0} onClose={()=>{}} onCards={()=>{}}/>);
    const text=document.querySelector('.wg-page').textContent;
    expect(text).toContain('다음 상대로 이어집니다');
    expect(text).toContain('0으로 회복');
  });
});
