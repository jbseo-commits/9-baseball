// @vitest-environment happy-dom
import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,fireEvent,screen,cleanup} from '@testing-library/react';
import {canStartHitter,defaultNewHitter} from '../src/duel/new-run-selection.js';
import Duel from '../src/duel/App.jsx';
import StartPackPick from '../src/duel/StartPackPick.jsx';
import {createV10Duel,applyHitterClass,enterV10Node,saveV10Duel,readV10Duel} from '../src/duel/engine.js';
import {HITTER_CLASSES} from '../src/duel/hitter-classes.js';
import {classRewardPool} from '../src/duel/hitter-builds.js';
afterEach(()=>{cleanup();localStorage.clear();vi.unstubAllEnvs();});
it('both compile flag and actual normal review required; no permanent unlock write',()=>{
 const empty={version:1,runs:{}},earned={version:1,runs:{x:{longHits:3,takenBalls:5,runs:3}}};
 for(const flag of ['', '1'])for(const review of [false,true])for(const profile of [empty,earned]){
  vi.stubEnv('VITE_NORMAL_REVIEW',flag);const active=flag==='1'&&review;
  expect(defaultNewHitter(review)).toBe(active?'slugger-v1':'contact-v1');
  for(const c of HITTER_CLASSES)expect(canStartHitter(profile,c.id,review)).toBe(active?c.id==='slugger-v1':profile===earned||c.id==='contact-v1');
  expect(canStartHitter(profile,'power',review)).toBe(false);
 }
});
it('visible earned characters stay temporarily locked even after DOM aria tampering',()=>{
 vi.stubEnv('VITE_NORMAL_REVIEW','1');const pick=vi.fn();render(<StartPackPick reviewRun career={{runs:{x:{longHits:3,takenBalls:5,runs:3}}}} onPick={pick}/>);
 expect(screen.getAllByText('이번 검수 잠김')).toHaveLength(3);
 for(const name of ['컨택 히터','배드볼 히터','스프레이 히터']){const radio=screen.getByRole('radio',{name});radio.setAttribute('aria-disabled','false');fireEvent.click(radio);expect(radio.getAttribute('aria-checked')).toBe('false');}
 fireEvent.click(screen.getByTestId('start-pack-go'));expect(pick).toHaveBeenCalledWith('slugger-v1');expect(localStorage.length).toBe(0);
});
it('real action creates nine-card Slugger without awarding its achievement, with both reward branches',()=>{
 vi.stubEnv('VITE_NORMAL_REVIEW','1');render(<Duel reviewRun/>);fireEvent.click(screen.getByRole('button',{name:'새로운 게임',exact:true}));fireEvent.click(screen.getByTestId('start-pack-go'));
 const s=readV10Duel(localStorage);expect(s.v10.hitterClass).toMatchObject({id:'slugger-v1',buildVersion:1});expect(s.deck.map(c=>c.kind).sort()).toEqual(['place','scout',...HITTER_CLASSES[0].kinds].sort());expect(s.deck).toHaveLength(9);
 const profile=JSON.parse(localStorage.getItem('9zone-hitter-career-v1'));expect(Object.values(profile.runs).every(r=>r.longHits===0&&r.takenBalls===0&&r.runs===0)).toBe(true);
 for(let n=0;n<3;n++){s.rewards=Array(n).fill({});const pool=classRewardPool(s,['place','scout','slug']);expect(pool).toContain(['loadPower','calledShot','onePatience'][n]);expect(pool).toContain(['tableSetter','basesLoaded','walkOff'][n]);}
});
for(const c of HITTER_CLASSES)it('existing '+c.id+' resumes unchanged, cancellation never writes career',()=>{
 vi.stubEnv('VITE_NORMAL_REVIEW','1');const s=enterV10Node(applyHitterClass(createV10Duel(13),c.id,{buildVersion:1}),'a1-entry');saveV10Duel(localStorage,s);localStorage.setItem('9zone-hitter-career-v1','{"version":1,"runs":{}}');const before=localStorage.getItem('9zone-hitter-career-v1');render(<Duel reviewRun/>);
 fireEvent.click(screen.getByRole('button',{name:'새로운 게임',exact:true}));fireEvent.click(screen.getByRole('button',{name:'처음부터 시작'}));fireEvent.click(screen.getByRole('button',{name:'닫기'}));fireEvent.click(screen.getByRole('button',{name:'이어하기'}));expect(readV10Duel(localStorage)).toEqual(s);expect(localStorage.getItem('9zone-hitter-career-v1')).toBe(before);
});
