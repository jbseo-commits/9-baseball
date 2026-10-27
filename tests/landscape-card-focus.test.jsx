// @vitest-environment happy-dom
import React from 'react';
import {render,screen,cleanup,fireEvent,act} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import LandscapeSelection from '../src/duel/LandscapeSelection.jsx';
import LandscapeCardArt from '../src/duel/LandscapeCardArt.jsx';
import Duel from '../src/duel/App.jsx';
import * as E from '../src/duel/engine.js';

afterEach(()=>{cleanup();vi.restoreAllMocks();localStorage.clear();window.history.replaceState({},'','/');});
const props={deciding:true,name:'정타 노림',selected:true,face:{summary:'정타 HP +50%',condition:'',axis:'1존'},cost:1,energy:2};
it('places one public main effect with a conditional damage forecast',()=>{
  render(<LandscapeSelection {...props} forecast={{now:{coverage:[4],hitBounds:[.1,.2],dmgMin:12,dmgMax:18,runners:0,shaken:0}}}/>);
  expect(screen.getByTestId('wide-selection').textContent).toContain('정타 HP +50%');
  expect(screen.getByTestId('wide-selection').textContent).toContain('적중 시');
  expect(screen.getAllByTestId('bp-forecast')).toHaveLength(1);
});
it('an armed support adds coverage without advertising its printed main ability',()=>{
  render(<LandscapeSelection {...props} armedName="커트 장인" face={{summary:'단타 · 파울 +2 HP'}}/>);
  expect(screen.getByTestId('wide-selection').textContent).toContain('커트 장인');
  expect(screen.getByTestId('wide-selection').textContent).toContain('범위 추가');
  expect(screen.getByTestId('wide-selection').textContent).not.toContain('파울 +2 HP');
});
it('preparation shows real draw amount and hand limit without a basic swing forecast',()=>{
  render(<LandscapeSelection {...props} prepare face={{summary:'뽑기 0장 · 높이·볼 간파',drawNote:'손패 5장 한도'}} prepLeft={1} forecast={{now:{}}}/>);
  expect(screen.getByTestId('wide-selection').textContent).toContain('뽑기 0장');
  expect(screen.getByTestId('wide-selection').textContent).toContain('손패 5장 한도');
  expect(screen.queryByTestId('bp-forecast')).toBeNull();
});
it('keeps both the blocked reason and a lethal bunt condition',()=>{
  render(<LandscapeSelection {...props} name="희생 번트" face={{summary:'진루 +1 · 아웃 +1',condition:'희생 70% · 파울도 삼진'}} problem="에너지가 부족합니다 · 1/0 필요"/>);
  const text=screen.getByTestId('wide-selection').textContent;
  expect(text).toContain('파울도 삼진');expect(text).toContain('에너지 부족');
});
it('empty selection watches and flight hides the old ability until landed review',()=>{
  const v=render(<LandscapeSelection {...props} selected={false} takeHint="스트라이크면 삼진"/>);
  expect(screen.getByTestId('wide-selection').textContent).toContain('지켜보기');
  expect(screen.getByTestId('wide-selection').textContent).toContain('스트라이크면 삼진');
  v.rerender(<LandscapeSelection {...props} deciding={false}/>);
  expect(screen.getByTestId('wide-selection').textContent).not.toContain('+50%');
  v.rerender(<LandscapeSelection {...props} deciding={false} review="안타 · 투수 HP −12"/>);
  expect(screen.getByTestId('wide-selection').textContent).toContain('투수 HP −12');
});
it('uses an uncropped custom image and only one atlas cell as fallback',()=>{
  const v=render(<LandscapeCardArt src="/full-art.png" atlasSrc="/sheet.png"/>);
  const img=document.querySelector('img');expect(img.getAttribute('src')).toBe('/full-art.png');expect(img.getAttribute('draggable')).toBe('false');
  v.rerender(<LandscapeCardArt atlasSrc="/sheet.png" position="100% 100%"/>);
  expect(document.querySelector('img')).toBeNull();
  expect(document.querySelector('.bp-wide-atlas').getAttribute('viewBox')).toBe('678 581 678 581');
  expect(document.querySelector('.bp-wide-atlas image').getAttribute('clip-path')).toMatch(/^url\(#wide-card-/);
});
it('orientation changes only the presentation, keeping the armed support and one forecast',()=>{
  window.history.replaceState({},'','/?battleLayout=inside');let landscape=true;const listeners=[];
  vi.spyOn(window,'matchMedia').mockImplementation(q=>({get matches(){return q==='(orientation: landscape)'&&landscape;},addEventListener:(_,fn)=>listeners.push(fn),removeEventListener(){}}));
  const initial=E.createV10Duel(90211);initial.deck=Array.from({length:9},(_,i)=>({id:'a'+i,kind:'place'}));initial.nextId=9;
  const s=E.enterV10Node(initial,'a1-entry');s.battle.energy=4;s.battle.energyCap=4;E.saveV10Duel(localStorage,s);
  render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
  const cards=[...document.querySelectorAll('.bp-card:not(.basic)')],battle=document.querySelector('.bp-battle');
  fireEvent.click(cards[0]);fireEvent.click(cards[1]);expect(document.querySelector('.bp-card.armed')).toBe(cards[1]);
  expect(screen.getByTestId('wide-selection').getAttribute('data-mode')).toBe('support');expect(screen.getAllByTestId('bp-forecast')).toHaveLength(1);
  const before=JSON.stringify(E.readV10Duel(localStorage));act(()=>{landscape=false;listeners.forEach(fn=>fn());});
  expect(screen.queryByTestId('wide-selection')).toBeNull();expect(document.querySelector('.bp-compact-summary')).not.toBeNull();
  expect(document.querySelector('.bp-battle')).toBe(battle);expect(document.querySelector('.bp-card.armed')).toBe(cards[1]);
  expect(screen.getAllByTestId('bp-forecast')).toHaveLength(1);expect(JSON.stringify(E.readV10Duel(localStorage))).toBe(before);
});
it('a selected preparation reports its actual energy cost through the battle wiring',()=>{
  window.history.replaceState({},'','/?battleLayout=inside');
  vi.spyOn(window,'matchMedia').mockImplementation(q=>({matches:q==='(orientation: landscape)',addEventListener(){},removeEventListener(){}}));
  const initial=E.createV10Duel(90211);initial.deck=Array.from({length:9},(_,i)=>({id:'p'+i,kind:'scout'}));initial.nextId=9;
  const s=E.enterV10Node(initial,'a1-entry');E.saveV10Duel(localStorage,s);render(<Duel/>);
  fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));fireEvent.click(document.querySelector('.bp-card[data-card-kind="scout"]'));
  expect(screen.getByTestId('wide-selection').textContent).toContain('⚡ 1/2');
  expect(screen.queryByTestId('bp-forecast')).toBeNull();
});
