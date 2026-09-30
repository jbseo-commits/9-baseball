// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,saveV10Duel} from '../src/duel/engine.js';

/* 2026-09-30: on 412x743 / 375x667 the map's "이 구장으로 간다" sat below the fold (you had to
   scroll to find it). The detail sheet is now pinned to the bottom in the portrait map. */
const css=fs.readFileSync('src/duel/ballpark.css','utf8');

describe('map go button stays on screen',()=>{
  it('the portrait map sheet is pinned to the bottom, above the route, with its height kept free',()=>{
    const rule=css.match(/\.bp-map:not\(\.wide\) \.bp-msheet\{([^}]*)\}/);
    expect(rule).not.toBeNull();
    expect(rule[1]).toContain('position:fixed');
    expect(rule[1]).toContain('bottom:0');
    expect(rule[1]).toMatch(/z-index:\d/);
    expect(css).toMatch(/\.bp-map:not\(\.wide\) \.bp-mbody\{padding-bottom:var\(--bp-msheet-h/);
  });
  it('the map measures the sheet into --bp-msheet-h',()=>{
    const s=createV10Duel(7);saveV10Duel(localStorage,s);
    render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
    expect(document.querySelector('.bp-map').style.getPropertyValue('--bp-msheet-h')).toMatch(/^\d+px$/);
    cleanup();localStorage.clear();
  });
});
