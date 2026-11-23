// @vitest-environment happy-dom
import React from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,cleanup} from '@testing-library/react';
import PersistentPublicIntent from '../src/duel/battle-vnext/PersistentPublicIntent.jsx';
import {pitcherOverheadPosition} from '../src/duel/battle-vnext/public-intent-badge.js';
afterEach(cleanup);
const props={head:{x:340,y:110},bounds:{width:667,height:375}};
const face=z=>Array.from({length:9},(_,i)=>i===z?'확정':'단서 밖');
it('shows public intent without hold and freezes last public decision through prep, flight and result',()=>{
 const r=render(<PersistentPublicIntent {...props} faces={face(0)} deciding/>);
 const active=()=>[...r.container.querySelectorAll('i')].flatMap((e,i)=>e.dataset.active?[i]:[]);
 expect(active()).toEqual([0]);expect(r.getByRole('img').textContent).toContain('!');
 for(const stage of ['prepare','flight','result']){r.rerender(<PersistentPublicIntent {...props} faces={face(8)} confirmedOutside deciding={false}/>);expect(active(),stage).toEqual([0]);expect(r.getByRole('img').textContent).not.toContain('볼');}
 r.rerender(<PersistentPublicIntent {...props} faces={face(8)} deciding/>);expect(active()).toEqual([8]);
});
it('no prior decision is honestly unknown, explicit outside is frozen, all candidates are neutral',()=>{
 const r=render(<PersistentPublicIntent {...props} faces={face(0)} confirmedOutside deciding={false}/>);expect(r.getByRole('img').getAttribute('data-knowledge')).toBe('unknown');
 r.rerender(<PersistentPublicIntent {...props} faces={[]} confirmedOutside deciding/>);expect(r.getByRole('img').textContent).toBe('볼!');
 r.rerender(<PersistentPublicIntent {...props} faces={face(3)} deciding={false}/>);expect(r.getByRole('img').textContent).toBe('볼!');
 r.rerender(<PersistentPublicIntent {...props} faces={Array(9).fill('가끔')} deciding/>);expect(r.getByRole('img').getAttribute('data-knowledge')).toBe('unknown');
});
it('bounded HP/map stack has4px gap and no read of private properties',()=>{
 const faces=face(4);Object.defineProperty(faces,'pending',{get(){throw Error('private');}});
 for(const [width,height] of [[667,375],[844,390],[1440,900]])for(const head of [{x:340,y:110},{x:10,y:25},{x:width-5,y:80}]){
 const hp=pitcherOverheadPosition(head,{width,height});const r=render(<PersistentPublicIntent head={head} bounds={{width,height}} faces={faces} deciding/>);const badge=r.getByRole('img');expect(parseFloat(badge.style.top)).toBe(hp.top-4);expect(hp.top-4-34).toBeGreaterThanOrEqual(10);expect(hp.left).toBeGreaterThanOrEqual(4);r.unmount();
 }
});
