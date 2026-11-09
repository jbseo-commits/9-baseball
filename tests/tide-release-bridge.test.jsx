// @vitest-environment happy-dom
import React from 'react';
import {it,expect,vi} from 'vitest';
import {render} from '@testing-library/react';
import BattleScene from '../src/duel/battle-vnext/BattleScene.jsx';
import {rosterPitcherActor,rosterTimeline} from '../src/duel/battle-vnext/roster-actor.js';

it('shows the held-ball depth bridge before the empty-hand release and first flying ball',()=>{
 const actor=rosterPitcherActor('tide-vesper','/tide.webp');
 const timeline=rosterTimeline({duration:2000,freeze:0},actor,false,{delivery:true});
 const frames=timeline.delivery.drawingAtTick,bridge=frames.lastIndexOf(8);
 expect(bridge).toBeGreaterThan(0);expect(frames[bridge+1]).toBe(9);
 const clock=vi.spyOn(performance,'now').mockReturnValue(bridge*1000/60);
 const props={size:{width:844,height:390},framing:'atbat',phase:'flight',actors:{pitcher:actor},playback:{action:'swing',startedAt:0,rate:1,timeline,pitchReleaseAt:timeline.pitchReleaseAt}};
 const view=render(<BattleScene {...props}/>);
 try{
  expect(view.container.querySelector('.bv-actor-pitcher').dataset.pose).toBe('frame-8');
  expect(view.container.querySelector('.bv-ball-sprite')).toBeNull();
  clock.mockReturnValue(timeline.pitchReleaseAt);view.rerender(<BattleScene {...props}/>);
  expect(view.container.querySelector('.bv-actor-pitcher').dataset.pose).toBe('frame-9');
  expect(view.container.querySelectorAll('.bv-ball-sprite')).toHaveLength(1);
 }finally{view.unmount();clock.mockRestore();}
});
