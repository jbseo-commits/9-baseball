// @vitest-environment happy-dom
import React from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import TidePlaytest from '../src/duel/battle-vnext/TidePlaytest.jsx';
import {TIDE_PLAYTEST_PREFIX} from '../src/duel/battle-vnext/tide-playtest.js';
import {createV10Duel,enterV10Node,V10_SAVE_KEY} from '../src/duel/engine.js';
import {publicEncounterCue} from '../src/duel/encounter-cues.js';
import {encounterPlan} from '../src/duel/pitcher-encounters.js';
import PublicIntentBadge from '../src/duel/battle-vnext/PublicIntentBadge.jsx';
afterEach(()=>{cleanup();sessionStorage.clear();localStorage.clear();window.history.replaceState({},'','/');});
it('starts a genuine map at seed4 from a landing, never writes the personal save',()=>{
 window.history.replaceState({},'','/?battleUi=vnext&tidePlaytest=1');localStorage.setItem(V10_SAVE_KEY,'personal sentinel');render(<TidePlaytest/>);
 expect(sessionStorage.getItem(TIDE_PLAYTEST_PREFIX+V10_SAVE_KEY)).toBeNull();fireEvent.click(screen.getByRole('button',{name:'새 타이드 런 시작'}));
 const s=JSON.parse(sessionStorage.getItem(TIDE_PLAYTEST_PREFIX+V10_SAVE_KEY));expect(s).toEqual(createV10Duel(4));expect(s.phase).toBe('map');expect(s.runMap.nodes.find(n=>n.id==='a1-entry').opponent.artId).toBe('tide-vesper');expect(localStorage.getItem(V10_SAVE_KEY)).toBe('personal sentinel');
});
it('reads parity and take eligibility from public history, never pending; exact+5 rule unchanged',()=>{
 for(const count of [0,1])for(const took of [false,true]){
 const s=enterV10Node(createV10Duel(4),'a1-entry');s.battle.pitchCount=count;s.battle.history=took?[{action:'take'}]:[];
 Object.defineProperty(s.battle,'pending',{get(){throw Error('private target read')}});
 const cue=publicEncounterCue(s);expect(cue.detail).toBe(count?'높은 코스 선호':'낮은 코스 선호');expect(cue.ready).toBe(took);
 expect(encounterPlan(s,{r:{kind:'hit',zone:2,aimZone:2}}).bonus).toBe(took?5:0);
 expect(encounterPlan(s,{r:{kind:'whiff',zone:2,aimZone:2}}).bonus).toBe(0);
 }
});
it('wave remains a distinct accessible style cue, never a certain downward target',()=>{
 const cue=publicEncounterCue(enterV10Node(createV10Duel(4),'a1-entry'));
 const v=render(<PublicIntentBadge faces={Array(9).fill('가끔')} phase="deciding" point={{x:430,y:110}} bounds={{width:844,height:390}} tideCue={cue}/>);
 expect(v.getByRole('img').getAttribute('aria-label')).toContain('낙차형은 궤적 표시');expect(v.getByRole('img').getAttribute('data-certain')).toBe('false');expect(v.container.querySelector('.bv-tide-wave')).not.toBeNull();
 v.rerender(<PublicIntentBadge faces={[]} phase="flight" point={{x:430,y:110}} bounds={{width:844,height:390}} tideCue={cue}/>);expect(v.container.textContent).toBe('');
});

it('does not contradict an earned exact/outside target with the independent wave cue',()=>{
 const cue=publicEncounterCue(enterV10Node(createV10Duel(4),'a1-entry'));
 for(const outside of [false,true]){
  const v=render(<PublicIntentBadge faces={['확정',...Array(8).fill('단서 밖')]} confirmedOutside={outside} phase="deciding" point={{x:430,y:110}} bounds={{width:844,height:390}} tideCue={cue}/>);
  const label=v.getByRole('img').getAttribute('aria-label');expect(label).toContain('확정');expect(label).toContain('낙차형은 궤적 표시');expect(label).not.toContain('확정 아님');v.unmount();
 }
});

import {battleUiMode} from '../src/duel/battle-ui-mode.js';
it('forces the pilot camera consistently even with conflicting legacy/desktopportrait parameters',()=>{
 const portrait={matchMedia:()=>({matches:false})};
 expect(battleUiMode('?tidePlaytest=1&battleUi=legacy',portrait).vnext).toBe(true);
 expect(battleUiMode('?tidePlaytest=1',portrait).vnext).toBe(true);
 expect(battleUiMode('?battleUi=legacy',portrait).vnext).toBe(false);
});
