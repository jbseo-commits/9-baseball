// @vitest-environment happy-dom
import React from 'react';
import fs from 'node:fs';
import {render,cleanup} from '@testing-library/react';
import {afterEach,describe,it,expect} from 'vitest';
import {EndingHero,HomeRunCut,KnockoutCut,KO_POSE_ART_ID,PHONE_ART_V18} from '../src/duel/phone-art-v18.jsx';
import BallparkEnd from '../src/duel/BallparkEnd.jsx';

/* phone asset queue A01–A09 (assets/production-art/phone-assets-v18) connected to the runtime */
afterEach(()=>cleanup());
const css=fs.readFileSync('src/duel/phone-art-v18.css','utf8');

describe('phone assets v18 in the game',()=>{
  it('imports every A01–A09 file plus the v17 knockout layers',()=>{
    const m=JSON.parse(fs.readFileSync('assets/production-art/phone-assets-v18/manifest.json','utf8'));
    const src=fs.readFileSync('src/duel/phone-art-v18.jsx','utf8');
    const title=fs.readFileSync('src/duel/TitleScreen.jsx','utf8');
    for(const a of m.assets)if(!['A04','A05'].includes(a.id))expect(src+title,a.id).toContain(a.file);
    expect(Object.values(PHONE_ART_V18).every(Boolean)).toBe(true);
  });
  it('title: the A06 plate carries the female pitcher cast (TitleScreen); A04/A05 were superseded by it',()=>{
    const t=fs.readFileSync('src/duel/TitleScreen.jsx','utf8');
    expect(t).toContain('A06-title-stadium-plate.png');
    expect(fs.readFileSync('src/duel/App.jsx','utf8')).not.toContain('<TitleHero/>');
  });
  it('ending: the won screen gets the A08 plate and the A07 batter; a loss keeps its old header',()=>{
    render(<BallparkEnd won/>);
    expect(document.querySelector('.bp-end .end-hero .eh-batter')).toBeTruthy();
    cleanup();render(<BallparkEnd won={false}/>);
    expect(document.querySelector('.end-hero')).toBeNull();
  });
  it('home run: one ball, drawn by A03 (the cut-in adds no code ball)',()=>{
    render(<HomeRunCut/>);
    expect(document.querySelectorAll('.hr-cut img')).toHaveLength(2);
    expect(document.querySelector('.hr-trail')).toBeTruthy();
    expect(document.querySelector('.hr-cut i:not(.hr-plate)')).toBeNull();
  });
  it('knockout: Red Rush plays stagger -> A09 -> kneel; other pitchers sink in their own cutout',()=>{
    render(<KnockoutCut artId={KO_POSE_ART_ID}/>);
    expect([...document.querySelectorAll('.ko-pose')].map(x=>x.classList[1])).toEqual(['ko-stagger','ko-mid','ko-kneel']);
    cleanup();render(<KnockoutCut artId="regular-02-teal-mirage" figure="/x.png"/>);
    expect(document.querySelector('.ko-pose')).toBeNull();
    expect(document.querySelector('.ko-figure').getAttribute('src')).toBe('/x.png');
    expect(css).toMatch(/prefers-reduced-motion:reduce\)\{[\s\S]*\.ko-kneel\{animation:none;opacity:1\}/);
  });
  it('the portrait splash centres with translate, which the pop animation cannot cancel',()=>{
    const bp=fs.readFileSync('src/duel/ballpark.css','utf8');
    expect(bp).toContain('.bp-verdict.splash{left:50%;top:18%;translate:-50% 0;');
    expect(bp).not.toContain('.bp-verdict.splash{left:50%;top:18%;transform:translateX(-50%)');
  });
});
