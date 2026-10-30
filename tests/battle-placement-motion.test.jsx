// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {placementGeometry,PLACEMENT,WIDE_PLACEMENT} from '../src/duel/battle-vnext/placement-motion.js';
import CoverageInsert from '../src/duel/battle-vnext/CoverageInsert.jsx';
import IntegrationPreview from '../src/duel/battle-vnext/IntegrationPreview.jsx';
import {playPlacementSound} from '../src/duel/battle-vnext/placement-audio.js';
vi.mock('../src/duel/battle-vnext/placement-audio.js',()=>({playPlacementSound:vi.fn()}));
const rect=(x,y,w,h)=>({left:x,top:y,width:w,height:h,right:x+w,bottom:y+h});
const cells=zs=>zs.map(z=>({z,x:300+z%3*60,y:160+Math.floor(z/3)*60,w:60,h:60}));
const request={seq:1,id:'a',name:'밀어치기',cost:2,summary:'적중하면 안타',source:{x:700,y:200,w:230,h:80}};
function setup({coverage=[2,5,8],sound=true}={}){
 const el=document.createElement('div');document.body.append(el);el.getBoundingClientRect=()=>rect(10,20,844,390);
 for(const c of cells(coverage)){const node=document.createElement('button');node.className='bv-cell';node.dataset.zone=c.z;node.getBoundingClientRect=()=>rect(c.x+10,c.y+20,c.w,c.h);el.append(node);}
 const ref={current:el},props={request,pieces:[{id:'a',role:'main',coverage}],rootRef:ref,phase:'deciding',sound};
 return {...render(<CoverageInsert {...props}/>),props};
}
beforeEach(()=>{vi.useFakeTimers();playPlacementSound.mockReset().mockImplementation(()=>vi.fn());window.history.replaceState({},'','/?battleUi=vnext');});
afterEach(()=>{cleanup();document.body.innerHTML='';vi.restoreAllMocks();vi.useRealTimers();window.history.replaceState({},'','/');});
it('preserves 1/3/5/9 and clipped/disconnected actual footprints without filling gaps or wrapping rows',()=>{
 for(const zs of [[4],[2,5,8],[1,3,4,5,7],[0,1,2,3,4,5,6,7,8],[0,1,3],[2,3]]){
  const g=placementGeometry(cells(zs),request.source);
  expect(g.cells.map(c=>c.z)).toEqual(zs);
  for(const c of g.cells){const original=cells(zs).find(o=>o.z===c.z);expect(c.x+g.bounds.x).toBe(original.x);expect(c.y+g.bounds.y).toBe(original.y);}
  expect(new Set(g.cells.map(c=>c.rank)).size).toBe(zs.length);
 }
 expect(placementGeometry(cells([2,5,8]),request.source).outline.split('M')).toHaveLength(9); // eight external edges, no internal seams
 expect(placementGeometry(cells([2,3]),request.source).outline.split('M')).toHaveLength(9); // row-edge neighbours are disconnected
});
it('moves the whole footprint on one carrier; the local cell geometry stays intact',()=>{
 setup();const carrier=screen.getByTestId('bv-insert-flight'),blocks=[...document.querySelectorAll('[data-insert-zone]')];
 expect(blocks.every(b=>b.parentElement===carrier)).toBe(true);
 expect(blocks.map(b=>b.style.top)).toEqual(['0px','60px','120px']);
 expect(blocks.every(b=>!b.style.getPropertyValue('--insert-x'))).toBe(true);
 expect(screen.getByTestId('bv-coverage-insert').style.getPropertyValue('--place-lock')).toBe(WIDE_PLACEMENT.lockAt+'ms');
 expect(document.querySelector('.bv-insert-card').textContent).toContain('2밀어치기적중하면 안타');
});
it('cancels both sources and the carrier on a pitch, without waiting for its decorative deadline',()=>{
 const view=setup(),stop=playPlacementSound.mock.results[0].value;
 view.rerender(<CoverageInsert {...view.props} phase="flight"/>);
 expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();expect(stop).toHaveBeenCalledTimes(1);
});
it('replacement cancels old sound; mute cancels future audio while the current visual continues',()=>{
 const view=setup(),stop=playPlacementSound.mock.results[0].value;
 const next={...view.props,request:{...request,seq:2}};view.rerender(<CoverageInsert {...next}/>);
 expect(stop).toHaveBeenCalledTimes(1);expect(playPlacementSound).toHaveBeenCalledTimes(2);
 const secondStop=playPlacementSound.mock.results[1].value;view.rerender(<CoverageInsert {...next} sound={false}/>);
 expect(secondStop).toHaveBeenCalledTimes(1);expect(screen.queryByTestId('bv-coverage-insert')).not.toBeNull();
});
it('resize, tab hiding, and unmount stop pending audio; becoming visible never replays the old lock',()=>{
 const view=setup(),stop=playPlacementSound.mock.results[0].value;
 fireEvent(window,new Event('resize'));expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();expect(stop).toHaveBeenCalled();
 view.rerender(<CoverageInsert {...view.props} request={{...request,seq:3}}/>);
 const stopHidden=playPlacementSound.mock.results.at(-1).value;fireEvent(document,new Event('visibilitychange'));
 expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();expect(stopHidden).toHaveBeenCalled();
 fireEvent(document,new Event('visibilitychange'));expect(playPlacementSound).toHaveBeenCalledTimes(2);
 view.rerender(<CoverageInsert {...view.props} request={{...request,seq:4}}/>);
 const finalStop=playPlacementSound.mock.results.at(-1).value;view.unmount();expect(finalStop).toHaveBeenCalled();
});
it('muted placements create no sound and reduced motion uses only the short lock cue',()=>{
 const view=setup({sound:false});expect(playPlacementSound).not.toHaveBeenCalled();
 vi.spyOn(window,'matchMedia').mockReturnValue({matches:true});view.rerender(<CoverageInsert {...view.props} sound/>);
 expect(playPlacementSound.mock.calls[0][0].reduced).toBe(true);
});
it('re-measures a scrolled card at the moment of the tap placement, and closing the inspector never replays it',()=>{
 render(<IntegrationPreview fixture="watch-read0"/>);fireEvent.click(screen.getByRole('button',{name:'손패 펼치기',exact:true}));
 const card=document.querySelector('.bv-card[data-card-kind=strike]');card.getBoundingClientRect=()=>rect(600,120,200,80);fireEvent.click(card);
 card.getBoundingClientRect=()=>rect(580,210,200,80);fireEvent.click(document.querySelector('.bv-cell[data-zone="2"]'));
 expect(screen.getByTestId('bv-coverage-insert').style.getPropertyValue('--from-y')).toBe('250px');
 fireEvent.click(screen.getByRole('button',{name:'경기 정보 및 메뉴'}));expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();
 fireEvent.click(screen.getByTestId('bp-inspect-back'));expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();
});
it('fast real execution consumes exactly one pitch and cancels placement before its animation is done',()=>{
 render(<IntegrationPreview fixture="watch-read0"/>);fireEvent.click(screen.getByRole('button',{name:'손패 펼치기',exact:true}));
 fireEvent.click(document.querySelector('.bv-card[data-card-kind=strike]'));fireEvent.click(document.querySelector('.bv-cell[data-zone="2"]'));
 fireEvent.click(screen.getByTestId('bp-swing'));act(()=>vi.advanceTimersByTime(90));
 expect(document.querySelector('.bv-scene').dataset.playToken).toBe('1');expect(screen.queryByTestId('bv-coverage-insert')).toBeNull();
});
