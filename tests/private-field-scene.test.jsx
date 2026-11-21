// @vitest-environment happy-dom
import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,cleanup,fireEvent} from '@testing-library/react';
const clock=vi.hoisted(()=>({elapsed:0}));vi.mock('../src/duel/battle-vnext/use-scene-clock.js',()=>({default:()=>clock.elapsed}));
import BattleScene,{SAMPLE_ACTORS} from '../src/duel/battle-vnext/BattleScene.jsx';
import {validateContactMotion} from '../src/duel/battle-vnext/private-field-art.js';
import {rosterPitcherActor,rosterTimeline} from '../src/duel/battle-vnext/roster-actor.js';
const meta=validateContactMotion({sourceWidth:192,sourceHeight:192,columns:4,rows:4,anchor:{x:65,y:175},frames:Array.from({length:14},(_,id)=>({id}))});
afterEach(()=>{cleanup();clock.elapsed=0;});
it('Contact keeps authored camera/contact, normal14 slots across24/30/60fps and full render fallback',()=>{
 const actor={kind:'review-contact-atlas',classId:'contact-v1',url:'blob:contact',meta},v=render(<BattleScene size={{width:667,height:375}} framing="atbat" actors={{batter:SAMPLE_ACTORS.batter}}/>),style=v.container.querySelector('.bv-scene').getAttribute('style');
 const timeline={impactAt:1250,releaseAt:1370,freeze:120,duration:2300,settleAt:2100,delivery:{pitchReleaseAt:950}};
 for(const fps of [24,30,60])for(let n=0;n<fps*2.3;n++){clock.elapsed=n*1000/fps;const props={size:{width:667,height:375},framing:'atbat',playback:{timeline,action:'swing'},phase:clock.elapsed>=1250?'result':'flight'};v.rerender(<BattleScene {...props} actors={{batter:SAMPLE_ACTORS.batter}}/>);const frame=v.container.querySelector('[data-actor=batter]').dataset.frame;v.rerender(<BattleScene {...props} actors={{batter:actor}}/>);expect(v.container.querySelector('[data-actor=batter]').dataset.frame).toBe(frame);expect(v.container.querySelector('.bv-scene').getAttribute('style')).toBe(style);}
 fireEvent.error(v.container.querySelector('[data-actor=batter] img'));expect(v.container.querySelector('[data-actor=batter] img').getAttribute('src')).toBe(SAMPLE_ACTORS.batter);
});
it('Emerald replaces only decision drawing0, never overlaps atlas, same registration and release; error reverts',()=>{
 const pitcher=rosterPitcherActor('boss-01-emerald-tyrant','/atlas.webp'),ready={kind:'review-emerald-ready',artId:pitcher.artId,url:'blob:ready'},props={size:{width:844,height:390},framing:'atbat',onPitcherInfo:()=>{},actors:{pitcher,pitcherReady:ready,batter:SAMPLE_ACTORS.batter}},v=render(<BattleScene {...props}/>);const box=v.container.querySelector('[data-actor=pitcher]').getAttribute('style');expect(v.container.querySelectorAll('[data-actor=pitcher] img')).toHaveLength(1);expect(v.container.querySelector('.bv-private-ready')).not.toBeNull();expect(v.container.querySelector('.bv-intent-badge')).toBeNull();
 const timeline=rosterTimeline({duration:2300},pitcher,false,{delivery:true});expect(timeline.delivery.pitchReleaseAt).toBe(950);expect(timeline.impactAt).toBe(1250);
 for(const action of ['swing','take'])for(const duration of [60,2300]){v.rerender(<BattleScene {...props} phase="flight" playback={{action,timeline:{...timeline,duration}}}/>);expect(v.container.querySelector('.bv-private-ready')).toBeNull();expect(v.container.querySelector('[data-actor=pitcher]').getAttribute('style')).toBe(box);}
 v.rerender(<BattleScene {...props} phase="result"/>);expect(v.container.querySelector('.bv-private-ready')).toBeNull();v.rerender(<BattleScene {...props}/>);fireEvent.error(v.container.querySelector('.bv-private-ready'));expect(v.container.querySelector('.bv-private-ready')).toBeNull();expect(v.container.querySelector('[data-actor=pitcher] img').getAttribute('src')).toBe('/atlas.webp');
});

it('already adopted Emerald ready persists during no-throw prepare, never KO or real delivery',()=>{
 const pitcher=rosterPitcherActor('boss-01-emerald-tyrant','/atlas.webp'),ready={kind:'review-emerald-ready',artId:pitcher.artId,url:'blob:ready'},props={size:{width:667,height:375},framing:'atbat',onPitcherInfo:()=>{},actors:{pitcher,pitcherReady:ready,batter:SAMPLE_ACTORS.batter}},v=render(<BattleScene {...props}/>);
 const timeline=rosterTimeline({duration:2300},pitcher,false,{delivery:true}),release={...pitcher.release};
 for(const duration of [60,500])for(const phase of ['committing','flight','result','deciding']){clock.elapsed=30;v.rerender(<BattleScene {...props} phase={phase} playback={{action:'prepare',timeline:{...timeline,duration}}}/>);expect(v.container.querySelector('.bv-private-ready')).not.toBeNull();expect(v.container.querySelectorAll('[data-actor=pitcher] img')).toHaveLength(1);expect(v.container.querySelector('[data-actor=pitcher]').dataset.frame).toBe('0');}
 for(const extra of [{result:{knockedOut:true}},{finale:'knockout'}]){v.rerender(<BattleScene {...props} {...extra} phase="result" playback={{action:'prepare',timeline}}/>);expect(v.container.querySelector('.bv-private-ready')).toBeNull();v.rerender(<BattleScene {...props} {...extra}/>);expect(v.container.querySelector('.bv-private-ready')).toBeNull();}
 for(const action of ['swing','take'])for(const elapsed of [0,950,1250,1800]){clock.elapsed=elapsed;v.rerender(<BattleScene {...props} phase={elapsed>=1250?'result':'flight'} playback={{action,timeline}}/>);expect(v.container.querySelector('.bv-private-ready')).toBeNull();}
 expect(pitcher.release).toEqual(release);expect(timeline.delivery.pitchReleaseAt).toBe(950);expect(timeline.impactAt).toBe(1250);
 v.rerender(<BattleScene {...props}/>);fireEvent.error(v.container.querySelector('.bv-private-ready'));v.rerender(<BattleScene {...props} phase="flight" playback={{action:'prepare',timeline}}/>);expect(v.container.querySelector('.bv-private-ready')).toBeNull();
});
