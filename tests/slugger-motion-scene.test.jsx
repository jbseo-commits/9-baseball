// @vitest-environment happy-dom
import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,cleanup,fireEvent} from '@testing-library/react';
const clock=vi.hoisted(()=>({elapsed:0}));vi.mock('../src/duel/battle-vnext/use-scene-clock.js',()=>({default:()=>clock.elapsed}));
import BattleScene,{SAMPLE_ACTORS} from '../src/duel/battle-vnext/BattleScene.jsx';
import {validateSluggerMotion} from '../src/duel/battle-vnext/slugger-motion.js';
const meta=()=>validateSluggerMotion({sourceWidth:192,sourceHeight:192,columns:4,rows:4,anchor:{x:52.5,y:175},frames:Array.from({length:14},(_,id)=>({id}))});
const custom=()=>({kind:'review-slugger-atlas',classId:'slugger-v1',url:'blob:synthetic',meta:meta()});
const timeline={impactAt:1250,releaseAt:1370,freeze:120,duration:2300,settleAt:2100,delivery:{pitchReleaseAt:950}};
afterEach(cleanup);
it('explicit descriptor preserves authored layout, camera vars and14pose order at24/30/60fps',()=>{
 const layout=vi.fn(),v=render(<BattleScene size={{width:844,height:390}} framing="atbat" actors={{batter:SAMPLE_ACTORS.batter}} onLayout={layout}/>);const b=v.container.querySelector('[data-actor=batter]').getAttribute('style'),style=v.container.querySelector('.bv-scene').getAttribute('style'),reported=layout.mock.calls.at(-1)[0],actor=custom();
 v.rerender(<BattleScene size={{width:844,height:390}} framing="atbat" actors={{batter:actor}} onLayout={layout}/>);expect(v.container.querySelector('.bv-scene').dataset.motion).toBe('authored');expect(v.container.querySelector('.bv-scene').getAttribute('style')).toBe(style);expect(v.container.querySelector('[data-actor=batter]').getAttribute('style')).toBe(b);expect(layout.mock.calls.at(-1)[0]).toEqual(reported);
 for(const fps of [24,30,60])for(let n=0;n<fps*2.3;n++){
  clock.elapsed=n*1000/fps;const phase=clock.elapsed>=1250?'result':'flight',playback={timeline,action:'swing'};
  v.rerender(<BattleScene size={{width:844,height:390}} framing="atbat" actors={{batter:SAMPLE_ACTORS.batter}} playback={playback} phase={phase}/>);const pose=v.container.querySelector('[data-actor=batter]').dataset.pose;
  v.rerender(<BattleScene size={{width:844,height:390}} framing="atbat" actors={{batter:actor}} playback={playback} phase={phase}/>);expect(v.container.querySelector('[data-actor=batter]').dataset.pose).toBe(pose);
 }
});
it('render-time texture error falls completely back without losing authored classification or bounds',()=>{
 const a=custom(),v=render(<BattleScene size={{width:667,height:375}} framing="atbat" actors={{batter:a}}/>),b=v.container.querySelector('[data-actor=batter]'),style=b.getAttribute('style');fireEvent.error(b.querySelector('img'));expect(b.querySelector('img').getAttribute('src')).toBe(SAMPLE_ACTORS.batter);expect(b.dataset.batterKind).toBeUndefined();expect(b.getAttribute('style')).toBe(style);expect(v.container.querySelector('.bv-scene').dataset.motion).toBe('authored');
});
