// @vitest-environment happy-dom
import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,cleanup} from '@testing-library/react';
const clock=vi.hoisted(()=>({elapsed:0}));
vi.mock('../src/duel/battle-vnext/use-scene-clock.js',()=>({default:()=>clock.elapsed}));
import BattleScene from '../src/duel/battle-vnext/BattleScene.jsx';
import {ATBAT_COMPOSITION as comp} from '../src/duel/battle-vnext/atbat-composition.js';
import {rosterPitcherActor,rosterTimeline} from '../src/duel/battle-vnext/roster-actor.js';
import {committedContact} from '../src/duel/battle-vnext/committed-flight.js';
afterEach(cleanup);
it('no target-dependent DOM before release; actual flash/light/pixel burst share extreme arrival, static anchors stay fixed',()=>{
 const actor=rosterPitcherActor('onyx-eclipse','onyx.webp'),timeline=rosterTimeline({duration:2000},actor,false,{delivery:true});
 const p={action:'swing',timeline,pitchReleaseAt:timeline.pitchReleaseAt,course:{getDestination:vi.fn(()=>0)}};
 clock.elapsed=timeline.pitchReleaseAt-1;
 const props={actors:{pitcher:actor},framing:'atbat',size:{width:844,height:390},playback:p,phase:'flight',scene:{shotGrade:'dead-center',playToken:1}};
 const {container,rerender}=render(<BattleScene {...props}/>);const before=container.innerHTML;
 p.course.getDestination=vi.fn(()=>8);rerender(<BattleScene {...props}/>);expect(container.innerHTML).toBe(before);expect(p.course.getDestination).not.toHaveBeenCalled();
 const el=container.querySelector('.bv-scene'),scale=Number(el.style.getPropertyValue('--bv-world-scale')),cx=parseFloat(el.style.getPropertyValue('--bv-contact-x')),cy=parseFloat(el.style.getPropertyValue('--bv-contact-y'));
 for(const z of [0,8,9]){
  clock.elapsed=timeline.impactAt;p.course.getDestination=()=>z;
  rerender(<BattleScene {...props} phase="result" result={{kind:'hit',exact:true,actualZone:z}}/>);
  const T=committedContact(z,comp.contact),x=cx+(T.x-comp.contact.x)*scale,y=cy+(T.y-comp.contact.y)*scale;
  const focus=container.querySelector('.bv-contact-focus');expect(parseFloat(focus.style.getPropertyValue('--bv-contact-x'))).toBeCloseTo(x);expect(parseFloat(focus.style.getPropertyValue('--bv-contact-y'))).toBeCloseTo(y);
  const light=container.querySelector('.bv-contact-light');expect(Number(light.getAttribute('cx'))).toBe(T.x);expect(Number(light.getAttribute('cy'))).toBe(T.y);
  const sprite=container.querySelector('.bv-contact-pixelfx .fx-critical'),pivot=sprite.style.transformOrigin.split(' ').map(parseFloat);expect(parseFloat(sprite.style.left)+pivot[0]).toBeCloseTo(x);expect(parseFloat(sprite.style.top)+pivot[1]).toBeCloseTo(y);
  expect(parseFloat(el.style.getPropertyValue('--bv-contact-x'))).toBe(cx); // layout anchor untouched
 }
});
