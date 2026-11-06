// @vitest-environment happy-dom
import React from 'react';
import {describe,it,expect,afterEach,vi} from 'vitest';
import {render,cleanup} from '@testing-library/react';
import ContactPixelFx,{fxFrameAt,FxSprite} from '../src/duel/battle-vnext/ContactPixelFx.jsx';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
const ref=()=>({current:document.createElement('section')});
describe('contact PixelFX follows the pitch presentation clock',()=>{
 it('samples host age instead of creating another animation clock, and clears on cancel',()=>{
  const raf=vi.spyOn(globalThis,'requestAnimationFrame'),sceneRef=ref();
  const props={sceneRef,active:true,grade:'solid',token:1,contact:{x:100,y:80},freeze:72};
  const view=render(<ContactPixelFx {...props} age={0}/>);
  expect(view.container.querySelector('[data-fx-frame="0"]')).not.toBeNull();
  expect(sceneRef.current.classList.contains('bv-hitstop')).toBe(true);
  view.rerender(<ContactPixelFx {...props} age={100}/>);
  expect(view.container.querySelector('[data-fx-frame="3"]')).not.toBeNull();
  expect(sceneRef.current.classList.contains('bv-hitstop')).toBe(false);
  view.rerender(<ContactPixelFx {...props} age={1200}/>);
  expect(view.container.querySelector('[data-fx-kind]')).toBeNull();
  view.rerender(<ContactPixelFx {...props} token={2} age={0}/>);
  expect(view.container.querySelector('[data-fx-frame="0"]')).not.toBeNull();
  view.rerender(<ContactPixelFx {...props} token={2} age={0} active={false}/>);
  expect(view.container.querySelector('[data-fx-kind]')).toBeNull();
  expect(sceneRef.current.classList.contains('bv-hitstop')).toBe(false);
  expect(raf).not.toHaveBeenCalled();
 });
 it('uses native loop sampling for the spinning ball and suppresses effects under reduced motion',()=>{
  expect(fxFrameAt('ball',300).frame).toBe(6);
  expect(fxFrameAt('ball',700).frame).toBe(6);
  expect(fxFrameAt('spark',700)).toBeNull();
  vi.spyOn(globalThis,'matchMedia').mockReturnValue({matches:true});
  const sceneRef=ref(),view=render(<ContactPixelFx sceneRef={sceneRef} active grade="homer" age={20} freeze={150} contact={{x:50,y:50}}/>);
  expect(view.container.querySelector('[data-fx-kind]')).toBeNull();
  expect(sceneRef.current.classList.contains('bv-hitstop')).toBe(false);
 });
 it('centres a full-field homer cut on the actual barrel contact while covering every scene edge',()=>{
  const view=render(<FxSprite kind="impact" age={0} point={{x:120,y:200}} full bounds={{width:600,height:300}}/>);
  const box=view.container.firstChild;
  expect(box.style.left).toBe('-360px');expect(box.style.top).toBe('-70px');
  expect(box.style.width).toBe('960px');expect(box.style.height).toBe('540px');
 });
 it('never adds a contact flash for a whiff, preparation, or unlanded action',()=>{
  const props={sceneRef:ref(),contact:{x:50,y:50},age:50};
  const view=render(<ContactPixelFx {...props} active grade="near-miss"/>);
  expect(view.container.querySelector('[data-fx-kind]')).toBeNull();
  view.rerender(<ContactPixelFx {...props} active grade="read"/>);
  expect(view.container.querySelector('[data-fx-kind]')).toBeNull();
  view.rerender(<ContactPixelFx {...props} active={false} grade="homer"/>);
  expect(view.container.querySelector('[data-fx-kind]')).toBeNull();
 });
 it('keeps a strong homer cut distinct from ordinary contact and removes hold on unmount',()=>{
  const sceneRef=ref();const view=render(<ContactPixelFx sceneRef={sceneRef} active grade="homer" age={10} freeze={150} contact={{x:80,y:60}}/>);
  expect(view.container.querySelector('.fx-impact')).not.toBeNull();
  expect(view.container.querySelector('.fx-critical')).toBeNull();
  view.rerender(<ContactPixelFx sceneRef={sceneRef} active grade="homer" age={130} freeze={150} contact={{x:80,y:60}}/>);
  expect(view.container.querySelector('.fx-critical')).not.toBeNull();
  view.unmount();expect(sceneRef.current.classList.contains('bv-hitstop')).toBe(false);
 });
});
