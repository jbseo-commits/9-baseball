// @vitest-environment happy-dom
import React from 'react';
import {it,expect,afterEach,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import NormalReview from '../src/duel/NormalReview.jsx';
import WelcomeGuide,{WELCOME_SEEN_KEY} from '../src/duel/WelcomeGuide.jsx';
import ErrorBoundary from '../src/duel/ErrorBoundary.jsx';
import {NORMAL_REVIEW_PREFIX,normalReviewEnabled} from '../src/duel/normal-review.js';
import {V10_SAVE_KEY} from '../src/duel/engine.js';
import {battleUiMode} from '../src/duel/battle-ui-mode.js';
afterEach(()=>{cleanup();localStorage.clear();sessionStorage.clear();vi.unstubAllEnvs();vi.restoreAllMocks();window.history.replaceState({},'','/');});
it('opens canonical title, creates a variable normal map only after pack confirmation, and isolates progress/intro',()=>{
 window.history.replaceState({},'','/?normalRun=1&tidePlaytest=1&seed=4');localStorage.setItem(V10_SAVE_KEY,'personal');localStorage.setItem(WELCOME_SEEN_KEY,'personal');
 let n=120;vi.spyOn(globalThis.crypto,'getRandomValues').mockImplementation(a=>{a[0]=n++;return a;});
 render(<NormalReview/>);expect(screen.getByRole('button',{name:'새로운 게임'}).className).toContain('lead');expect(screen.queryByRole('button',{name:'새 타이드 런 시작'})).toBeNull();expect(localStorage.getItem(NORMAL_REVIEW_PREFIX+V10_SAVE_KEY)).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'새로운 게임'}));fireEvent.click(screen.getByRole('radio',{name:'컨택 히터'}));fireEvent.click(screen.getByTestId('start-pack-go'));
 const first=JSON.parse(localStorage.getItem(NORMAL_REVIEW_PREFIX+V10_SAVE_KEY));expect(first.initialSeed).toBe(120);expect(first.phase).toBe('map');expect(screen.getByRole('dialog',{name:'게임 방법'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'건너뛰기'}));
 expect(localStorage.getItem(NORMAL_REVIEW_PREFIX+WELCOME_SEEN_KEY)).toBe('seen');expect(localStorage.getItem(WELCOME_SEEN_KEY)).toBe('personal');expect(localStorage.getItem(V10_SAVE_KEY)).toBe('personal');
 cleanup();render(<NormalReview/>);fireEvent.click(screen.getByRole('button',{name:'새로운 게임'}));fireEvent.click(screen.getByRole('button',{name:'처음부터 시작'}));fireEvent.click(screen.getByRole('radio',{name:'컨택 히터'}));fireEvent.click(screen.getByTestId('start-pack-go'));
 expect(JSON.parse(localStorage.getItem(NORMAL_REVIEW_PREFIX+V10_SAVE_KEY)).initialSeed).toBe(121);expect(screen.queryByRole('dialog',{name:'게임 방법'})).toBeNull();
});
it('keeps customer settings free of alternate rules and legacy/debug entry',()=>{
 window.history.replaceState({},'','/?normalRun=1');render(<NormalReview/>);fireEvent.click(screen.getByRole('button',{name:'설정'}));expect(screen.getByRole('button',{name:'게임 방법'})).toBeTruthy();expect(screen.queryByTestId('shot-mode-toggle')).toBeNull();expect(screen.queryByLabelText('비교용 시드')).toBeNull();expect(screen.queryByText('전략 → 자동전투 체험')).toBeNull();
});
it('forces reviewed renderer on desktop portrait, and production routing stays unchanged without gate',()=>{
 const win={matchMedia:()=>({matches:false})};expect(battleUiMode('?normalRun=1&battleUi=legacy',win).vnext).toBe(true);expect(battleUiMode('',win).vnext).toBe(false);vi.stubEnv('VITE_NORMAL_REVIEW','1');expect(normalReviewEnabled('')).toBe(true);expect(battleUiMode('',win).vnext).toBe(true);
});
it('failure reset removes only injected review keys, never personal saves',()=>{
 localStorage.setItem(V10_SAVE_KEY,'personal');const removed=[];const boundary=new ErrorBoundary({storage:{removeItem:k=>removed.push(k)}});boundary.clearRun();expect(removed).toContain(V10_SAVE_KEY);expect(localStorage.getItem(V10_SAVE_KEY)).toBe('personal');
});

import {recentResultText} from '../src/duel/battle-vnext/ResultReadout.jsx';
it('puts settled outcome and actual HP loss before the long course explanation at phone size',()=>{
 expect(recentResultText({kind:'hit',exact:true,damage:25,hpBefore:8,hpAfter:0,explanation:'몸쪽 낮게 노림 → 실제 몸쪽 낮게'})).toBe('정확 적중 · HP −8 · 몸쪽 낮게 노림 → 실제 몸쪽 낮게');
 expect(recentResultText({kind:'ball',call:'볼',explanation:'지켜본 공은 존 밖'})).toBe('볼 · 지켜본 공은 존 밖');
});
import {DecisionSummary} from '../src/duel/battle-vnext/DecisionPanel.jsx';
it('gives a concise first-decision instruction only in review and yields to the real last result',()=>{
 window.history.replaceState({},'','/?normalRun=1');const v=render(<DecisionSummary compact input={{actionKind:'watch'}}/>);expect(v.container.textContent).toContain('손패 펼치기 → 카드 → 노릴 칸');v.rerender(<DecisionSummary compact input={{actionKind:'watch'}} recent="파울 · HP −4"/>);expect(v.container.textContent).not.toContain('손패 펼치기');expect(v.container.textContent).toContain('파울');
});
