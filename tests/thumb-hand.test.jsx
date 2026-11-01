// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {it,expect,beforeEach,afterEach,vi} from 'vitest';
import IntegrationPreview from '../src/duel/battle-vnext/IntegrationPreview.jsx';
import {dragPreviewBox} from '../src/duel/battle-vnext/drag-preview.js';
import {cardDropPreview} from '../src/duel/battle-vnext/placement-intent.js';
import {buildFixture} from '../src/duel/battle-vnext/fixtures.js';
import {previewV10Stack} from '../src/duel/engine.js';
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
beforeEach(()=>window.history.replaceState({},'','/?battleUi=vnext'));
afterEach(()=>{cleanup();vi.restoreAllMocks();window.history.replaceState({},'','/');});
it('keeps the readable drag face inside six viewports and clear of finger and central target',()=>{
 for(const[width,height]of[[667,375],[740,360],[844,390],[1024,768],[1440,900],[1920,1080]]){
  const z={x:width/2-75,y:height-170,w:150,h:150};
  for(const p of[{x:width-55,y:100},{x:z.x+75,y:z.y+75},{x:z.x+125,y:z.y+125},{x:12,y:12}]){
   const r=dragPreviewBox(p,{width,height},z);expect(r.x).toBeGreaterThanOrEqual(8);expect(r.y).toBeGreaterThanOrEqual(8);expect(r.x+r.w).toBeLessThanOrEqual(width-8);expect(r.y+r.h).toBeLessThanOrEqual(height-8);
   expect(overlap(r,{x:p.x-24,y:p.y-24,w:48,h:48})).toBe(false);expect(overlap(r,z)).toBe(false);
  }
 }
});
it('previews only the dragged support coverage, validates cost, and never mutates real aim/hand/energy',()=>{
 const f=buildFixture('stack-three-ready'),s=f.s,ids=f.hand.filter(c=>c.entry.kind==='place').map(c=>c.id),before=JSON.stringify(s);
 expect(cardDropPreview(s,null,[],ids[0],0)).toMatchObject({ok:true,role:'main',coverage:[0]});
 const hover=cardDropPreview(s,ids[0],[{id:ids[1],aimZone:4}],ids[2],8);expect(hover).toMatchObject({ok:true,role:'support',coverage:[8]});
 const p=previewV10Stack(s,ids[0],[{id:ids[1],aimZone:4},{id:ids[2],aimZone:8}]);expect(hover.coverage).toEqual(p.supportCoverages.find(c=>c.id===ids[2]).coverage);expect(hover.coverage).not.toEqual(p.coverage);
 const strike=f.hand.find(c=>c.entry.kind==='strike').id;expect(cardDropPreview(s,ids[0],[{id:ids[1],aimZone:4},{id:ids[2],aimZone:8}],strike,2)).toMatchObject({ok:false,coverage:[]});expect(JSON.stringify(s)).toBe(before);
});
function drag(unfold=true){
 render(<IntegrationPreview fixture="watch-read0"/>);if(unfold)fireEvent.click(screen.getByRole('button',{name:'손패 펼치기',exact:true}));
 const area=document.querySelector('.bv-hand-area'),card=document.querySelector('.bv-card[data-card-kind=strike]'),zone=document.querySelector('.bv-cell[data-zone="2"]');vi.spyOn(document,'elementFromPoint').mockReturnValue(zone);
 fireEvent.pointerDown(card,{pointerId:8,pointerType:'touch',clientX:700,clientY:140});fireEvent.pointerMove(area,{pointerId:8,pointerType:'touch',clientX:440,clientY:260});return{area,zone};
}
it('shows read-only actual coverage while dragging and clears it on pointer cancel without selecting or spending',()=>{
 const{area}=drag();expect([...document.querySelectorAll('.is-drop-cover')].map(e=>+e.dataset.zone)).toEqual([2,5,8]);expect(document.querySelector('.bv-drag-face').textContent).toContain('2밀어치기적중하면 안타');
 expect(document.querySelectorAll('.bv-card.is-main')).toHaveLength(0);expect(screen.getByTestId('bv-energy').dataset.energy).toBe('2');expect(document.querySelector('.bv-scene').dataset.playToken).toBe('0');fireEvent.pointerCancel(area,{pointerId:8});expect(document.querySelector('.bv-drag-face')).toBeNull();expect(document.querySelector('.is-drop-cover')).toBeNull();
});
for(const event of['escape','fold','lostCapture','scroll','resize','menu'])it(`clears transient reading/coverage on ${event}, never committing a drag`,()=>{
 const{area}=drag();
 if(event==='escape')fireEvent.keyDown(document.body,{key:'Escape'});
 if(event==='fold')fireEvent.click(screen.getByRole('button',{name:'손패 접기',exact:true}));
 if(event==='lostCapture')fireEvent.lostPointerCapture(area,{pointerId:8});
 if(event==='scroll')fireEvent.scroll(screen.getByTestId('bv-hand'));
 if(event==='resize')fireEvent(window,new Event('resize'));
 if(event==='menu')fireEvent.click(screen.getByRole('button',{name:'경기 정보 및 메뉴'}));
 expect(document.querySelector('.bv-drag-face')).toBeNull();expect(document.querySelector('.is-drop-cover')).toBeNull();expect(document.querySelectorAll('.bv-card.is-main')).toHaveLength(0);expect(document.querySelector('.bv-scene').dataset.playToken).toBe('0');
});
it('the dropped receipt starts at the actual offset face and preserves its right-side art',()=>{
 const{area}=drag();document.querySelector('.bv-drag-face').getBoundingClientRect=()=>({x:120,y:90,width:210,height:94,left:120,top:90});fireEvent.pointerUp(area,{pointerId:8,pointerType:'touch',clientX:440,clientY:260});
 const receipt=screen.getByTestId('bv-coverage-insert');expect(receipt.dataset.artSide).toBe('right');expect(receipt.style.getPropertyValue('--from-x')).toBe('225px');expect(receipt.style.getPropertyValue('--from-y')).toBe('137px');expect([...receipt.querySelectorAll('[data-insert-zone]')].map(e=>+e.dataset.insertZone)).toEqual([2,5,8]);
});

it('portrait Escape cancels a drag even though the visible hand was never unfolded',()=>{
 const w=window.innerWidth,h=window.innerHeight;window.innerWidth=390;window.innerHeight=844;
 try{drag(false);expect(document.querySelector('.bv-drag-face')).not.toBeNull();fireEvent.keyDown(document.body,{key:'Escape'});expect(document.querySelector('.bv-drag-face')).toBeNull();expect(document.querySelector('.is-drop-cover')).toBeNull();expect(document.querySelector('.bv-hand-area').getAttribute('aria-hidden')).toBe('false');}finally{window.innerWidth=w;window.innerHeight=h;}
});

it('keeps the drag when native implicit capture transfers from the card to the hand area',()=>{
 drag();fireEvent.lostPointerCapture(document.querySelector('.bv-card[data-card-kind=strike]'),{pointerId:8});expect(document.querySelector('.bv-drag-face')).not.toBeNull();expect([...document.querySelectorAll('.is-drop-cover')].map(e=>+e.dataset.zone)).toEqual([2,5,8]);
});
