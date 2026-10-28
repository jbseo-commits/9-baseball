// @vitest-environment happy-dom
import React from 'react';
import {render,cleanup,screen,act,fireEvent} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {cinemaMoment} from '../src/duel/battle-vnext/cinema-director.js';
import {buildFixture} from '../src/duel/battle-vnext/fixtures.js';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';
import IntegrationPreview from '../src/duel/battle-vnext/IntegrationPreview.jsx';
import {presentationFor,presentationTimeline} from '../src/duel/presentation.js';
import {withKnockoutHold} from '../src/duel/pitcher-sd.js';
afterEach(()=>{cleanup();vi.useRealTimers();window.history.replaceState({},'','/');});
it('requires a landed actual result and waits for depletion before the mound reaction',()=>{
 const ko={kind:'hit',call:'안타',knockedOut:true};
 expect(cinemaMoment(null,'windup',true)).toBeNull();
 for(const stage of ['impact','slowmo','release'])expect(cinemaMoment(ko,stage,true)).toBeNull();
 expect(cinemaMoment(ko,'settle',true)).toBe('knockout');
 expect(cinemaMoment({...ko,knockedOut:false},'settle',true)).toBeNull();
 const hr={kind:'hit',call:'홈런'};
 expect(cinemaMoment(hr,'impact',true)).toBeNull();
 expect(cinemaMoment(hr,'release',true)).toBe('homer');
 expect(cinemaMoment({kind:'whiff',call:'홈런'},'release',true)).toBeNull();
});
it('reproduces a real home run and real final damage from explicit engine fixtures',()=>{
 const hr=buildFixture('cinema-homer'),ko=buildFixture('cinema-knockout');
 expect(hr.s.battle.revealed.label).toBe('홈런');expect(hr.execution.cards[0].name).toBeTruthy();
 expect(hr.s.pitcher.hp).toBeGreaterThan(0);
 expect(ko.s.pitcher.hp).toBe(0);expect(ko.s.phase).toBe('reward');
 const vm=buildBattleViewModel({...ko,fxStage:'impact',shot:presentationFor(ko.s)});expect(vm.result.hpBefore).toBe(1);expect(vm.result.hpAfter).toBe(0);expect(vm.result.damage).toBeGreaterThan(0);
});
it('holds terminal knockout without auto-next, and replay cancels the previous clock',()=>{
 vi.useFakeTimers({toFake:['setTimeout','clearTimeout','performance']});window.history.replaceState({},'','/?battleUi=vnext');
 const f=buildFixture('cinema-knockout'),t=withKnockoutHold(presentationTimeline(presentationFor(f.s)),true);
 render(<IntegrationPreview fixture="cinema-knockout"/>);
 expect(document.querySelector('.bv-finale-focus')).toBeNull();
 act(()=>vi.advanceTimersByTime(t.impactAt+5));
 expect(document.querySelector('.bv-finale-focus')).toBeNull();
 act(()=>vi.advanceTimersByTime(t.settleAt-t.impactAt));
 expect(document.querySelector('.f-knockout')).not.toBeNull();
 expect(document.querySelector('[data-actor=pitcher]')?.dataset.pose).toBe('fatigue');
 fireEvent.click(screen.getByRole('button',{name:'다시 시작'}));
 expect(document.querySelector('.bv-finale-focus')).toBeNull();
 act(()=>vi.advanceTimersByTime(t.duration+2000));
 expect(document.querySelector('.f-knockout')).not.toBeNull();
 expect(document.querySelector('.bv-action')).toBeNull();
 expect(screen.getByText(/HP 1 검수/,{selector:'option'})).not.toBeNull();
});
