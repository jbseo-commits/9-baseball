// @vitest-environment happy-dom
import React from 'react';
import {describe,it,expect,afterEach} from 'vitest';
import {render,cleanup} from '@testing-library/react';
import {publicIntentBadge} from '../src/duel/battle-vnext/public-intent-badge.js';
import PublicIntentBadge from '../src/duel/battle-vnext/PublicIntentBadge.jsx';
afterEach(cleanup);
describe('actual game overhead public intent',()=>{
 it('shows the whole disclosed group, never guesses a likely single target',()=>{
  expect(publicIntentBadge(['안 던짐','가끔','자주','안 던짐','단서 밖','가끔','','안 던짐','안 던짐'],'deciding').zones).toEqual([1,2,5]);
  expect(publicIntentBadge(['자주',...Array(8).fill('안 던짐')],'deciding')).toMatchObject({zones:[],certain:false});
  expect(publicIntentBadge(['확정',...Array(8).fill('단서 밖')],'deciding')).toMatchObject({zones:[0],certain:true});
 });
 it('reads face strings only and hides outside decision phase',()=>{
  const faces=Array(9).fill('가끔');Object.defineProperty(faces,'pending',{get(){throw Error('private access')}});
  expect(publicIntentBadge(faces,'deciding').zones).toHaveLength(9);
  for(const phase of ['committing','flight','result','between'])expect(publicIntentBadge(faces,phase)).toBeNull();
 });
 it('provides noncolor certainty and unknown cues without clipping the top edge',()=>{
  const {container,rerender}=render(<PublicIntentBadge faces={Array(9).fill('가끔')} phase="deciding" point={{x:430,y:110}}/>);
  expect(container.querySelector('[role=img]').getAttribute('aria-label')).toContain('범위');expect(container.textContent).toBe('?');
  rerender(<PublicIntentBadge faces={Array(9).fill('가끔')} phase="deciding" point={{x:430,y:35}}/>);expect(container.textContent).toBe('');
 });
});

it('uses only explicit public outside confirmation, never percentages or outside-column hints',()=>{
 const faces=Array(9).fill('단서 밖');
 expect(publicIntentBadge(faces,'deciding',true)).toMatchObject({zones:[],certain:true,outside:true});
 for(const value of [false,undefined,'100%','95~100%','바깥쪽 공략'])expect(publicIntentBadge(faces,'deciding',value).certain).toBe(false);
 expect(publicIntentBadge(faces,'flight',true)).toBeNull();
 const v=render(<PublicIntentBadge faces={faces} phase="deciding" confirmedOutside point={{x:430,y:110}}/>);
 expect(v.container.textContent).toBe('볼!');expect(v.getByRole('img').getAttribute('aria-label')).toContain('존 밖 볼 확정');
});
