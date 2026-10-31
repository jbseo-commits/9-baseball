// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import PlayableRun,{startPlayableRun} from '../src/duel/battle-vnext/PlayableRun.jsx';
import Duel from '../src/duel/App.jsx';
import {playableStorage,PLAYABLE_PREFIX} from '../src/duel/battle-vnext/playable-storage.js';
import {createDefenseLabState,saveDefenseLabState,createV10Duel,enterV10Node,readV10Duel,V10_SAVE_KEY,saveV10Duel,setAimZone,playV10Action} from '../src/duel/engine.js';
import {rosterPitcherActor,rosterTimeline,rosterFrame} from '../src/duel/battle-vnext/roster-actor.js';
import {sceneEffectAt} from '../src/duel/battle-vnext/scene-effects.js';
import registration from '../src/duel/battle-vnext/roster-registration.json';
import {presentationFor,presentationTimeline} from '../src/duel/presentation.js';
const saved=()=>readV10Duel(playableStorage(sessionStorage));
beforeEach(()=>{vi.useFakeTimers();localStorage.clear();sessionStorage.clear();window.history.replaceState({},'','/?battleUi=vnext&battlePlay=1&seed=3');});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.useRealTimers();window.history.replaceState({},'','/');});
it('starts the actual normal starter at a reachable opponent and reloads the existing preview run without resets',()=>{
 const st=playableStorage(sessionStorage),normal=enterV10Node(createV10Duel(3),'a1-entry');expect(startPlayableRun(st,'?seed=3')).toEqual(normal);
 const aimed=setAimZone(normal,8);saveV10Duel(st,aimed);expect(startPlayableRun(st,'?seed=999')).toEqual(aimed);
 expect(localStorage.getItem(V10_SAVE_KEY)).toBeNull();expect(sessionStorage.getItem(PLAYABLE_PREFIX+V10_SAVE_KEY)).not.toBeNull();
});
it('starts an explicitly selected encounter pilot in its isolated session namespace',()=>{
 window.history.replaceState({},'','/?battleUi=vnext&battlePlay=1&encounterPilot=tyrant&seed=23');
 const v=render(<PlayableRun/>),own=playableStorage(sessionStorage,'encounter-tyrant-23'),state=readV10Duel(own);
 expect(state.v10.encounterPilot).toMatchObject({version:1,id:'tyrant',seed:23});
 expect(state.v10.opponent).toMatchObject({artId:'boss-01-emerald-tyrant',encounterPilot:{version:1,id:'tyrant'}});
 expect(screen.queryByText('시범 전투 · 본게임 저장과 분리')).toBeNull();
 expect(screen.getByTestId('bv-tell').textContent).toContain('낮은 벽');
 expect(document.querySelector('.bv-cell[data-zone="6"]').getAttribute('aria-label')).toContain('낮은 벽 벽');
 expect(localStorage.getItem(V10_SAVE_KEY)).toBeNull();
 const other=playableStorage(sessionStorage,'encounter-red-23');const red=startPlayableRun(other,'?encounterPilot=red&seed=23');
 expect(red.v10.encounterPilot.id).toBe('red');expect(readV10Duel(own).v10.encounterPilot.id).toBe('tyrant');
 expect(sessionStorage.getItem(PLAYABLE_PREFIX+'encounter-red-23:'+V10_SAVE_KEY)).not.toBeNull();
 v.unmount();
});
it('supports denied session storage in memory and never falls back to production storage',()=>{
 const st=playableStorage({getItem(){throw Error()},setItem(){throw Error()},removeItem(){throw Error()}});st.setItem('a',7);expect(st.getItem('a')).toBe('7');st.removeItem('a');expect(st.getItem('a')).toBeNull();
});
it('runs the real App with separate state, actual roster, speed clock, next pitch and reload',()=>{
 localStorage.setItem(V10_SAVE_KEY,'main-sentinel');const v=render(<PlayableRun/>);
 expect(document.querySelector('[data-roster-art]').dataset.rosterArt).toBe('regular-02-teal-mirage');expect(document.querySelector('.bv-review-notice')).toBeNull();
 const rate=screen.getByRole('combobox',{name:'애니메이션 배속'});fireEvent.change(rate,{target:{value:'0.5'}});
 const expected=playV10Action(saved(),{type:'take'}),t=rosterTimeline(presentationTimeline(presentationFor(expected)),rosterPitcherActor('regular-02-teal-mirage','actual'));
 fireEvent.click(screen.getByTestId('bp-swing'));expect(saved()).toEqual(expected);expect(rate.disabled).toBe(true);
 act(()=>vi.advanceTimersByTime(t.duration/.5-1));expect(document.querySelector('.bv-scene').dataset.fxStage).toBeTruthy();
 act(()=>vi.advanceTimersByTime(1));expect(rate.disabled).toBe(false);act(()=>vi.advanceTimersByTime(1100));expect(saved().phase).toBe('battle');expect(saved().stats.pitches).toBe(1);
 const after=saved();v.unmount();render(<PlayableRun/>);expect(saved()).toEqual(after);expect(screen.getByRole('combobox',{name:'애니메이션 배속'}).value).toBe('0.5');expect(localStorage.getItem(V10_SAVE_KEY)).toBe('main-sentinel');
});
it('normal vnext App resume also uses the actual new UI with the real production save',()=>{
 window.history.replaceState({},'','/?battleUi=vnext');saveV10Duel(localStorage,enterV10Node(createV10Duel(3),'a1-entry'));render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'이어하기',exact:true}));
 expect(document.querySelector('.battle-vnext')).not.toBeNull();expect(document.querySelector('.bp-battle')).toBeNull();fireEvent.click(document.querySelector('.bv-cell[data-zone="8"]'));expect(readV10Duel(localStorage).battle.aimZone).toBe(8);
});
it('uses different actual roster release frames and starts the ball at its registered source, never at the sample hand',()=>{
 for(const [id,f]of [['regular-05-violet-sting',79],['regular-02-teal-mirage',76],['onyx-eclipse',76]]){
  const actor=rosterPitcherActor(id,'atlas'),base={impactAt:100,freeze:60,slowmo:70,releaseAt:230,settleAt:500,duration:700},timeline=rosterTimeline(base,actor),playback={timeline,pitchReleaseAt:actor.releaseAt,action:'take'};
  expect(actor.releaseAt).toBe(Math.round(f*1000/60));expect(timeline.impactAt-actor.releaseAt).toBe(300);expect(rosterFrame(playback,actor.releaseAt)).toBe(f);
  const composition={release:actor.release,contact:{x:300,y:600}};expect(sceneEffectAt({elapsed:actor.releaseAt-1,playback,composition})).toBeNull();expect(sceneEffectAt({elapsed:actor.releaseAt,playback,composition}).ball).toEqual(actor.release);
 }
 expect(rosterPitcherActor('unknown','some-art')).toBeNull();expect(Object.keys(registration)).toHaveLength(20);
});

it('prefers newer in-memory writes over an old readable backing after quota failure, including removal',()=>{
 const st=playableStorage({getItem(){return 'old'},setItem(){throw Error('quota')},removeItem(){throw Error('denied')}});
 expect(st.getItem('save')).toBe('old');st.setItem('save','new');expect(st.getItem('save')).toBe('new');st.removeItem('save');expect(st.getItem('save')).toBeNull();
});
it('missing real atlas keeps legacy presentation at one-times even if vnext preference is slow',()=>{
 const st=playableStorage(sessionStorage),s=enterV10Node(createV10Duel(3),'a1-entry');s.v10.opponent.artId='unmapped';s.runMap.nodes.find(n=>n.id==='a1-entry').opponent.artId='unmapped';saveV10Duel(st,s);window.history.replaceState({},'','/?battleUi=vnext&battleSpeed=0.25');render(<Duel storage={st} startInRun/>);
 expect(document.querySelector('.bv-legacy-fallback')).not.toBeNull();expect(screen.queryByRole('combobox',{name:'애니메이션 배속'})).toBeNull();fireEvent.click(screen.getByTestId('bp-swing'));const expected=playV10Action(s,{type:'take'}),t=presentationTimeline(presentationFor(expected));
 act(()=>vi.advanceTimersByTime(t.duration));expect(document.querySelector('.bp-battle').className).not.toMatch(/fx-(windup|impact|slowmo|release|settle)/);
});

it('shows the existing storage error instead of crashing when the localStorage getter is denied',()=>{
 window.history.replaceState({},'','/');vi.spyOn(window,'localStorage','get').mockImplementation(()=>{throw Error('denied')});
 expect(()=>render(<Duel/>)).not.toThrow();expect(screen.getByRole('alert').textContent).toContain('저장을 읽지 못했습니다');
});

it('defense experiment keeps its existing legacy renderer and one-times presentation',()=>{
 window.history.replaceState({},'','/?battleUi=vnext&experiment=defense&battleSpeed=0.25');const st=playableStorage(sessionStorage);saveDefenseLabState(st,createDefenseLabState(3));render(<Duel storage={st}/>);
 expect(document.querySelector('.defense-lab-battle')).not.toBeNull();expect(screen.queryByRole('combobox',{name:'애니메이션 배속'})).toBeNull();fireEvent.click(screen.getByTestId('bp-swing'));act(()=>vi.advanceTimersByTime(3000));expect(document.querySelector('.bp-battle').className).not.toMatch(/fx-(windup|impact|slowmo|release|settle)/);
});

it('Escape folds the actual App hand without clearing main, support or aims',()=>{
 render(<PlayableRun/>);const root=document.querySelector('.battle-vnext'),open=()=>{const b=screen.queryByRole('button',{name:'손패 펼치기',exact:true});if(b)fireEvent.click(b);};
 const ids=[...document.querySelectorAll('.bv-card[data-card-kind="place"]')].map(e=>e.closest('[data-card-id]').dataset.cardId),card=id=>document.querySelector(`[data-card-id="${id}"] .bv-card`);
 open();fireEvent.click(card(ids[0]));fireEvent.click(document.querySelector('.bv-cell[data-zone="0"]'));fireEvent.click(screen.getByRole('button',{name:'+ 카드 추가',exact:true}));fireEvent.click(card(ids[1]));fireEvent.click(document.querySelector('.bv-cell[data-zone="8"]'));open();
 const pieces=()=>[...document.querySelectorAll('[data-board-card-id]')].map(e=>({id:e.dataset.boardCardId,aim:e.dataset.boardAim})),before=pieces();expect(before).toHaveLength(2);expect(root.dataset.handOpen).toBe('true');fireEvent.keyDown(document.body,{key:'Escape'});
 expect(root.dataset.handOpen).toBe('false');expect(pieces()).toEqual(before);expect(card(ids[0]).classList.contains('is-main')).toBe(true);expect(saved().battle.aimZone).toBe(0);
});
