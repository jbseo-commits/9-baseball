// @vitest-environment happy-dom
import React from 'react';
import {render,screen,cleanup,act} from '@testing-library/react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import CoverageInsert from '../src/duel/battle-vnext/CoverageInsert.jsx';
import {placementGeometry,placementTimeline,PLACEMENT,WIDE_PLACEMENT} from '../src/duel/battle-vnext/placement-motion.js';
import {playPlacementSound} from '../src/duel/battle-vnext/placement-audio.js';
import {haptic} from '../src/duel/haptics.js';
vi.mock('../src/duel/battle-vnext/placement-audio.js',()=>({playPlacementSound:vi.fn(()=>vi.fn())}));
vi.mock('../src/duel/haptics.js',()=>({haptic:vi.fn()}));
const rect=(x,y,w,h)=>({left:x,top:y,x,y,width:w,height:h});
const source={x:700,y:90,w:210,h:94,artSide:'right',artFraction:60/210};
function mount(zones=[2,5,8],rate=1){
 const root=document.createElement('main');document.body.append(root);root.getBoundingClientRect=()=>rect(0,0,844,390);
 for(let z=0;z<9;z++){const c=document.createElement('button');c.className='bv-cell';c.dataset.zone=z;c.getBoundingClientRect=()=>rect(350+z%3*50,220+Math.floor(z/3)*50,50,50);root.append(c);}
 const props={request:{id:'a',seq:1,name:'밀어치기',cost:2,summary:'적중하면 안타',source},pieces:[{id:'a',role:'main',coverage:zones}],rootRef:{current:root},phase:'deciding',sound:true,animationRate:rate,onFinish:vi.fn()};
 return{...render(<CoverageInsert {...props}/>),props};
}
beforeEach(()=>{vi.useFakeTimers();vi.clearAllMocks();});afterEach(()=>{cleanup();document.body.innerHTML='';vi.useRealTimers();});
it('keeps the original single-cell timing, and gives actual multi-cell shapes a readable hold before one lock',()=>{
 expect(placementTimeline(1)).toBe(PLACEMENT);expect(PLACEMENT.lockAt).toBe(460);expect(PLACEMENT.duration).toBe(1040);
 const t=placementTimeline(3);expect(t).toBe(WIDE_PLACEMENT);expect(t.travelAt-t.formAt).toBeGreaterThanOrEqual(120);expect(t.lockAt).toBe(680);expect(t.duration).toBe(1280);
});
it('registers a larger whole shape inside the visible area without changing cell positions or source fit',()=>{
 for(const zones of [[2,5,8],[6,7,8],[1,3,4,5,7],[0,1,2,3,4,5,6,7,8],[2,3]]){
  const cells=zones.map(z=>({z,x:250+z%3*46,y:210+Math.floor(z/3)*46,w:46,h:46})),view={left:8,top:52,right:659,bottom:367},g=placementGeometry(cells,{...source,x:645,y:30},view);
  expect(g.readScale*46).toBeGreaterThanOrEqual(36);expect(g.cells.map(c=>c.z)).toEqual(zones);const x=g.center.x+g.stage.x,y=g.center.y+g.stage.y;
  expect(x-g.bounds.w*g.readScale/2).toBeGreaterThanOrEqual(view.left);expect(x+g.bounds.w*g.readScale/2).toBeLessThanOrEqual(view.right+.001);expect(y-g.bounds.h*g.readScale/2).toBeGreaterThanOrEqual(view.top-.001);expect(y+g.bounds.h*g.readScale/2).toBeLessThanOrEqual(view.bottom);
 }
});
it('keeps the actual source card outside the enlarged carrier and all coverage tiles inside the same carrier',()=>{
 mount();const flight=screen.getByTestId('bv-insert-flight'),card=document.querySelector('.bv-insert-source');expect(card.contains(document.querySelector('.bv-insert-card'))).toBe(true);expect(card.style.left).toBe('700px');expect(card.style.top).toBe('90px');expect(card.style.getPropertyValue('--source-w')).toBe('210px');expect(card.style.getPropertyValue('--source-h')).toBe('94px');
 expect([...flight.querySelectorAll('[data-insert-zone]')].every(e=>e.parentElement===flight)).toBe(true);expect(flight.querySelector('.bv-insert-piece-edge')).not.toBeNull();expect(screen.getByTestId('bv-coverage-insert').dataset.lockAt).toBe('680');
 expect(playPlacementSound.mock.calls[0][0].timing).toBe(WIDE_PLACEMENT);
});
for(const rate of [.25,.5,1,2])it(`shares the wide lock/lifetime with audio and one haptic at ${rate}x`,()=>{
 const v=mount([2,5,8],rate);act(()=>vi.advanceTimersByTime(680/rate-1));expect(haptic).not.toHaveBeenCalled();act(()=>vi.advanceTimersByTime(1));expect(haptic).toHaveBeenCalledTimes(1);expect(haptic).toHaveBeenCalledWith(8);
 act(()=>vi.advanceTimersByTime((1280-680)/rate-1));expect(screen.queryByTestId('bv-coverage-insert')).not.toBeNull();act(()=>vi.advanceTimersByTime(1));expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();expect(v.props.onFinish).toHaveBeenCalledTimes(1);
});
it('a clipped actual one-cell footprint uses solo behaviour even when the card name suggests wide coverage',()=>{
 mount([2]);expect(screen.getByTestId('bv-coverage-insert').dataset.cellCount).toBe('1');expect(document.querySelector('.bv-insert-source')).toBeNull();expect(document.querySelector('.bv-insert-piece-edge')).toBeNull();expect(screen.getByTestId('bv-coverage-insert').dataset.lockAt).toBe('460');
});
it('quick execute cancels future multi-cell sound and haptic without holding up the host',()=>{
 const v=mount(),stop=playPlacementSound.mock.results[0].value;act(()=>vi.advanceTimersByTime(300));v.rerender(<CoverageInsert {...v.props} phase="flight"/>);expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();expect(stop).toHaveBeenCalled();act(()=>vi.advanceTimersByTime(5000));expect(haptic).not.toHaveBeenCalled();
});
