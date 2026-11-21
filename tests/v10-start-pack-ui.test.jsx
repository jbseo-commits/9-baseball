// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import Duel from '../src/duel/App.jsx';
import StartPackPick from '../src/duel/StartPackPick.jsx';
import {createV10Duel,enterV10Node,applyHitterClass,saveV10Duel,readV10Duel} from '../src/duel/engine.js';
import {HITTER_CLASSES} from '../src/duel/hitter-classes.js';
beforeEach(()=>{localStorage.clear();localStorage.setItem('9zone-bp-coach-v1','done');});
afterEach(()=>{cleanup();vi.unstubAllEnvs();});
const open=()=>fireEvent.click(screen.getByRole('button',{name:'새로운 게임',exact:true}));
it('fresh UI selects Contact, visible locked silhouettes cannot change the chosen class, no card tiles',()=>{
 render(<Duel/>);open();expect(screen.getAllByRole('radio')).toHaveLength(4);expect(screen.getByRole('radio',{name:'컨택 히터'}).getAttribute('aria-checked')).toBe('true');
 for(const name of ['슬러거','배드볼 히터','스프레이 히터']){const r=screen.getByRole('radio',{name});expect(r.getAttribute('aria-disabled')).toBe('true');fireEvent.click(r);expect(r.getAttribute('aria-checked')).toBe('false');}
 expect(document.querySelectorAll('.hc-silhouette')).toHaveLength(4);expect(document.querySelectorAll('.sp-mini,.sp-cards,.sp-deck-preview')).toHaveLength(0);expect(readV10Duel(localStorage)).toBeNull();
 fireEvent.click(screen.getByTestId('start-pack-go'));const s=readV10Duel(localStorage);expect(s.phase).toBe('map');expect(s.v10.hitterClass).toMatchObject({id:'contact-v1',buildVersion:1});expect(s.deck.map(c=>c.kind).sort()).toEqual(['place','scout',...HITTER_CLASSES.find(c=>c.id==='contact-v1').kinds].sort());expect(s.v10.career.id).toBeTruthy();
});
it('unlocked class selection confirms once and exposes only fixed review portrait paths',()=>{
 vi.stubEnv('VITE_NORMAL_REVIEW','1');const pick=vi.fn(),career={version:1,runs:{r:{longHits:3,takenBalls:5,runs:3}}};render(<StartPackPick career={career} onPick={pick}/>);
 expect([...document.querySelectorAll('.hc-portrait img')].map(i=>i.getAttribute('src'))).toEqual(['slugger','contact','bad-ball','spray'].map(id=>import.meta.env.BASE_URL+'roster-v2/'+id+'.webp'));
 fireEvent.click(screen.getByRole('radio',{name:'슬러거'}));fireEvent.click(screen.getByTestId('start-pack-go'));fireEvent.click(screen.getByTestId('start-pack-go'));expect(pick).toHaveBeenCalledTimes(1);expect(pick).toHaveBeenCalledWith('slugger-v1');
});
it('production selection never attempts owner portraits even if normalRun query is present',()=>{vi.stubEnv('VITE_NORMAL_REVIEW','');render(<StartPackPick/>);expect(document.querySelectorAll('.hc-portrait img')).toHaveLength(0);});
it('locked previous class save resumes without mutation; cancelling overwrite retains it',()=>{
 const s=enterV10Node(applyHitterClass(createV10Duel(3),'slugger-v1'),'a1-entry');saveV10Duel(localStorage,s);render(<Duel/>);open();fireEvent.click(screen.getByRole('button',{name:'처음부터 시작'}));fireEvent.click(screen.getByRole('button',{name:'닫기'}));expect(readV10Duel(localStorage)).toEqual(s);fireEvent.click(screen.getByRole('button',{name:'이어하기'}));expect(readV10Duel(localStorage)).toEqual(s);
});
