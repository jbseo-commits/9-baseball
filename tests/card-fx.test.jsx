// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import Duel from '../src/duel/App.jsx';
import BallparkStop from '../src/duel/BallparkStop.jsx';
import * as E from '../src/duel/engine.js';
import {playAcquire,playBurn,playUse,playSpend,cardFxSuppressed,RARITY_GLOW,CARD_FX_MS} from '../src/duel/card-fx.js';

const layerKids=()=>document.getElementById('card-fx-layer')?.children.length||0;
beforeEach(()=>{localStorage.clear();document.getElementById('card-fx-layer')?.remove();delete document.documentElement.dataset.autoSim;});
afterEach(()=>{cleanup();vi.useRealTimers();});

function box(){const el=document.createElement('button');el.innerHTML='<strong>정타 노림</strong>';document.body.appendChild(el);return el;}

describe('P3 card flourishes',()=>{
  it('stays within the 0.3–0.8s budget and uses rarity glows (normal white / rare blue / strong gold)',()=>{
    for(const ms of Object.values(CARD_FX_MS)){expect(ms).toBeGreaterThanOrEqual(300);expect(ms).toBeLessThanOrEqual(800);}
    expect(RARITY_GLOW.common.color).toBe('#f4f1e8');expect(RARITY_GLOW.rare.color).toBe('#5fb8ff');expect(RARITY_GLOW.signature.color).toBe('#ffcc3a');
  });

  it('draws on a fixed layer that never takes touches itself, a tap skips a piece, and pieces clean themselves up',()=>{
    vi.useFakeTimers();
    expect(cardFxSuppressed()).toBe(false);
    expect(playAcquire(box(),box(),'signature')).toBe(true);
    const layer=document.getElementById('card-fx-layer');
    expect(layer.style.pointerEvents).toBe('none');
    expect(layerKids()).toBe(1);
    fireEvent.pointerDown(layer.firstChild);
    expect(layerKids()).toBe(0);
    playBurn(box());playUse(box(),box());playSpend([box(),box()]);
    expect(layerKids()).toBeGreaterThan(0);
    vi.advanceTimersByTime(1300);
    expect(layerKids()).toBe(0);
  });

  it('is silent during the auto-play lesson and with reduced motion',()=>{
    document.documentElement.dataset.autoSim='1';
    expect(playAcquire(box(),box())).toBe(false);expect(layerKids()).toBe(0);
    delete document.documentElement.dataset.autoSim;
    const mm=window.matchMedia;window.matchMedia=q=>({matches:/reduce/.test(q),addEventListener(){},removeEventListener(){}});
    try{expect(playUse(box(),box())).toBe(false);}finally{window.matchMedia=mm;}
  });

  it('slow preview flights outlive the normal safety deadline and abort without a trailing flash',()=>{
    vi.useFakeTimers();const signal=new AbortController();
    playUse(box(),box(),{rate:.25,signal:signal.signal,sound:false});
    const el=document.getElementById('card-fx-layer').firstChild;
    expect(el.getAnimations()[0].effect.getTiming().duration).toBe(2080);
    vi.advanceTimersByTime(1300);expect(layerKids()).toBe(1);
    signal.abort();expect(layerKids()).toBe(0);
    vi.advanceTimersByTime(5000);expect(layerKids()).toBe(0);
    expect(playUse(box(),box(),{rate:.25,signal:signal.signal})).toBe(false);
    expect(playSpend([box()],{signal:signal.signal})).toBe(false);
  });

  it('fast preview shards use scaled time and normal callers keep their original duration',()=>{
    vi.useFakeTimers();playSpend([box()],{rate:2,sound:false});
    const el=document.getElementById('card-fx-layer').firstChild;
    expect(el.getAnimations()[0].effect.getTiming().duration).toBe(210);
    vi.advanceTimersByTime(601);expect(layerKids()).toBe(0);
    playUse(box(),box());
    expect(document.getElementById('card-fx-layer').firstChild.getAnimations()[0].effect.getTiming().duration).toBe(520);
  });

  it('a reward pick plays its flight once and applies the pick at once; a second tap cannot double-pick',()=>{
    const onPick=vi.fn();
    render(<BallparkStop kind="reward" options={[{type:'add',kind:'pinpoint'},{type:'add',kind:'needle'}]} deckCount={10} onPick={onPick} onSkip={()=>{}}/>);
    fireEvent.click(document.querySelectorAll('.bp-offers .bp-offer')[1]);
    fireEvent.click(screen.getByTestId('bp-stop-go'));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick.mock.calls[0][0]).toEqual({type:'add',kind:'needle'});
    expect(layerKids()).toBe(1);
    expect(document.getElementById('card-fx-layer').firstChild.style.border).toContain('#5fb8ff'); // needle = rare
  });

  it('a locker removal burns the card instead of flying it',()=>{
    const onPick=vi.fn();
    render(<BallparkStop kind="locker" options={[{type:'remove',id:'c1',kind:'place'}]} deck={[{id:'c1',kind:'place'}]} deckCount={10} onPick={onPick} onSkip={()=>{}}/>);
    fireEvent.click(document.querySelector('.bp-offers .bp-offer'));
    fireEvent.click(screen.getByTestId('bp-stop-go'));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(document.getElementById('card-fx-layer').firstChild.style.border).toContain('#ff8a2b');
  });

  it('in battle: a preparation flies into the grid and the spent energy orb shatters, one action per press',()=>{
    let s=E.createV10Duel(1);
    s.deck=['focusBreath','pinpoint','place','place','place','place','place','place','place','place','place','place'].map((kind,i)=>({id:'c'+i,kind}));
    s.nextId=s.deck.length;s=E.enterV10Node(s,'a1-entry');
    const pool=[...s.battle.hand,...s.battle.draw,...s.battle.discard].filter(id=>!['c0','c1'].includes(id));
    s.battle.hand=['c0','c1',...pool.slice(0,3)];s.battle.draw=pool.slice(3);s.battle.discard=[];
    E.saveV10Duel(localStorage,s);
    render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
    const before=E.v10Energy(s);
    fireEvent.click(document.querySelector('.bp-hand .bp-card[data-card-kind="focusBreath"]'));
    const go=screen.getByTestId('bp-swing');
    fireEvent.click(go);fireEvent.click(go);
    const saved=E.readV10Duel(localStorage);
    expect(saved.battle.preparations).toBe(1); // the double press did not prepare twice
    expect(E.v10Energy(saved)).toBe(before-1);
    expect(layerKids()).toBeGreaterThanOrEqual(1+4); // the card's flight + four shards of one orb
  });

  it('a road event drops in like a card (CSS transform), not a modal pop',()=>{
    const css=fs.readFileSync(path.resolve('src/duel/event.css'),'utf8');
    expect(css).toMatch(/\.ev-root:not\(\.is-result\) \.ev-paper\{animation:ev-card-drop \.42s/);
    expect(css).toMatch(/prefers-reduced-motion[^}]*\.ev-root \.ev-paper\{animation:none!important\}/);
  });
});
