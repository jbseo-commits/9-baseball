// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import fs from 'node:fs';
import {comparisonMode,comparisonViewport,validLayoutMessage,useBattleLayoutSignal,pitchTargetElements} from '../src/duel/battle-layout.js';
import BattleLayoutCompare from '../src/duel/BattleLayoutCompare.jsx';
import Duel from '../src/duel/App.jsx';
import * as E from '../src/duel/engine.js';
import {watchLayoutMode,layoutMode} from '../src/duel/layout-mode.js';

afterEach(()=>{cleanup();vi.restoreAllMocks();localStorage.clear();window.history.replaceState({},'','/');});
it('gates host and inside modes by an explicit query without changing normal routes',()=>{
  for(const [search,expected] of [['',null],['?battleLayout=compare','compare'],['?battleLayout=inside','inside'],['?battleLayout=other',null]]){
    expect(comparisonMode({location:{search}})).toBe(expected);
  }
  const reload=vi.fn(),add=vi.fn();const w={location:{search:'?battleLayout=compare',reload},matchMedia:()=>({matches:true,addEventListener:add})};w.self=w;w.top=w;
  expect(layoutMode(w)).toBe('app');watchLayoutMode(w);expect(add).not.toHaveBeenCalled();expect(reload).not.toHaveBeenCalled();
});
it('fits minimum landscape including the comparison bar and keeps nonbattle portrait',()=>{
  expect(comparisonViewport({width:568,height:320,wide:true,battle:true})).toEqual({width:568,height:288,scale:1});
  const portrait=comparisonViewport({width:844,height:390,wide:false,battle:true});
  expect(portrait.width).toBe(360);expect(portrait.height).toBe(640);expect(portrait.scale).toBeCloseTo(358/640);
  expect(comparisonViewport({width:844,height:390,wide:true,battle:false})).toEqual(portrait);
  const small=comparisonViewport({width:320,height:568,wide:true,battle:true});
  expect(small.width*small.scale).toBeLessThanOrEqual(320);expect(small.height*small.scale).toBeLessThanOrEqual(536);
});
it('accepts only exact same-origin child messages from its one iframe',()=>{
  const source={};const event={origin:'https://game.test',source,data:{type:'9zone-layout-stage',battle:true,busy:false}};
  expect(validLayoutMessage(event,source,'https://game.test')).toBe(true);
  for(const e of [{...event,source:{}},{...event,origin:'https://bad.test'},{...event,data:{type:'other'}},{...event,data:{...event.data,busy:'false'}}]){
    expect(validLayoutMessage(e,source,'https://game.test')).toBe(false);
  }
});
it('switches only after child acknowledgement and preserves iframe identity and src',()=>{
  // A small same-origin child isolates the host transport test from network IO.
  const create=document.createElement.bind(document);
  vi.spyOn(document,'createElement').mockImplementation((tag,...args)=>{const node=create(tag,...args);if(tag==='iframe')node.srcdoc='<!doctype html><title>Frame boundary</title>';return node;});
  window.history.replaceState({},'','/?battleLayout=compare&experiment=defense&qa=1');
  render(<BattleLayoutCompare/>);const frame=document.querySelector('iframe'),source=frame.contentWindow,src=frame.getAttribute('src');
  const send=vi.spyOn(source,'postMessage').mockImplementation(()=>{});
  const origin=window.location.origin;
  expect(src).toContain('battleLayout=inside');expect(src).toContain('experiment=defense');
  act(()=>window.dispatchEvent(new MessageEvent('message',{origin,source,data:{type:'9zone-layout-stage',battle:true,busy:false}})));
  const portrait=screen.getByRole('button',{name:'기존 세로 화면'}),wide=screen.getByRole('button',{name:'새 가로 화면'});
  const next=portrait.getAttribute('aria-pressed')==='true'?wide:portrait;
  const before=document.querySelector('.battle-layout-compare').getAttribute('data-view');
  fireEvent.click(next);
  expect(send).toHaveBeenCalledWith({type:'9zone-layout-request',requestId:1},origin);
  expect(document.querySelector('.battle-layout-compare').getAttribute('data-view')).toBe(before);
  act(()=>window.dispatchEvent(new MessageEvent('message',{origin,source,data:{type:'9zone-layout-ack',requestId:1,accepted:true}})));
  expect(document.querySelector('.battle-layout-compare').getAttribute('data-view')).not.toBe(before);
  expect(document.querySelectorAll('iframe')).toHaveLength(1);expect(document.querySelector('iframe')).toBe(frame);expect(frame.getAttribute('src')).toBe(src);
  act(()=>window.dispatchEvent(new MessageEvent('message',{origin,source,data:{type:'9zone-layout-stage',battle:true,busy:true}})));
  expect(portrait.disabled).toBe(true);expect(wide.disabled).toBe(true);
});
it('the child refuses a busy request and never emits engine or save contents',()=>{
  window.history.replaceState({},'','/?battleLayout=inside');
  function Probe({busy}){useBattleLayoutSignal(busy);return <div/>;}
  const send=vi.spyOn(window,'postMessage').mockImplementation(()=>{});
  const view=render(<Probe busy={true}/>);
  const count=send.mock.calls.length;
  act(()=>window.dispatchEvent(new MessageEvent('message',{origin:'https://foreign.test',source:window.parent,data:{type:'9zone-layout-request',requestId:9}})));
  expect(send.mock.calls.length).toBe(count);
  const request=()=>act(()=>window.dispatchEvent(new MessageEvent('message',{origin:window.location.origin,source:window.parent,data:{type:'9zone-layout-request',requestId:9}})));
  request();expect(send).toHaveBeenLastCalledWith({type:'9zone-layout-ack',requestId:9,accepted:false},window.location.origin);
  view.rerender(<Probe busy={false}/>);request();expect(send).toHaveBeenLastCalledWith({type:'9zone-layout-ack',requestId:9,accepted:true},window.location.origin);
  for(const [data] of send.mock.calls)expect(Object.keys(data).every(k=>['type','requestId','accepted','battle','busy'].includes(k))).toBe(true);
});
it('uses visible on-field visual targets and falls back to the original portrait grid',()=>{
  const host=document.createElement('section');host.innerHTML='<div class="bp-field-target"><i></i><i></i></div><div class="bp-zone"><button class="bp-cell"></button></div>';
  const field=host.querySelector('.bp-field-target'),board=host.querySelector('.bp-zone');
  expect(pitchTargetElements(host).zone).toBe(board);
  Object.defineProperty(field,'offsetWidth',{value:42});
  expect(pitchTargetElements(host).zone).toBe(field);expect(pitchTargetElements(host).cells).toHaveLength(2);
});
it('removes the coarse-phone overlay only for BOTH opt-in surfaces and leaves the original rule intact',()=>{
  const css=fs.readFileSync('src/duel/landscape-battle-compare.css','utf8'),old=fs.readFileSync('src/duel/portrait-lock.css','utf8');
  expect(css).toContain('html[data-battle-layout="inside"] body::after,html:has(.battle-layout-compare) body::after{content:none;display:none}');
  expect(old).toContain('(pointer:coarse)');expect(old).toContain('9ZONE은 세로 화면 전용입니다');
});
it('a layout request keeps an armed support, selected card, aim, RNG and stored run intact',()=>{
  window.history.replaceState({},'','/?battleLayout=inside');
  const initial=E.createV10Duel(90211);initial.deck=Array.from({length:9},(_,i)=>({id:'c'+i,kind:'place'}));initial.nextId=9;
  const s=E.enterV10Node(initial,'a1-entry');s.battle.energy=4;s.battle.energyCap=4;E.saveV10Duel(localStorage,s);
  const send=vi.spyOn(window,'postMessage').mockImplementation(()=>{});
  render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
  const cards=[...document.querySelectorAll('.bp-card:not(.basic)')],battle=document.querySelector('.bp-battle'),actor=document.querySelector('.bp-batter');
  fireEvent.click(cards[0]);fireEvent.click(cards[1]);expect(cards[1].classList.contains('armed')).toBe(true);
  const saved=JSON.stringify(E.readV10Duel(localStorage)),plan=document.querySelector('.bp-plan').textContent;
  act(()=>window.dispatchEvent(new MessageEvent('message',{origin:window.location.origin,source:window.parent,data:{type:'9zone-layout-request',requestId:42}})));
  expect(send).toHaveBeenLastCalledWith({type:'9zone-layout-ack',requestId:42,accepted:true},window.location.origin);
  expect(document.querySelector('.bp-battle')).toBe(battle);expect(document.querySelector('.bp-batter')).toBe(actor);
  expect(cards[0].classList.contains('main')).toBe(true);expect(cards[1].classList.contains('armed')).toBe(true);
  expect(document.querySelector('.bp-plan').textContent).toBe(plan);expect(JSON.stringify(E.readV10Duel(localStorage))).toBe(saved);
});
