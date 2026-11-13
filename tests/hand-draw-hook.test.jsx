// @vitest-environment happy-dom
import React,{useState} from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {it,expect,vi,afterEach} from 'vitest';
vi.mock('../src/duel/audio.js',()=>({cue:vi.fn()}));
import {cue} from '../src/duel/audio.js';
import useHandDraw from '../src/duel/battle-vnext/use-hand-draw.js';
function Host({phase='deciding',receipt=null,hand=[{id:'a',type:'place',name:'A'}],sound=true}){
 const[open,setOpen]=useState(false),d=useHandDraw({enabled:true,context:'node',phase,receipt,hand,shown:open,menuOpen:false,setHandOpen:setOpen,sound});
 return <><output data-testid="state">{JSON.stringify({open,batch:d.batch})}</output><button onClick={()=>setOpen(false)}>접기</button><button onClick={()=>d.onLand('a',d.batch?.key)}>착지</button></>;
}
afterEach(()=>{cleanup();cue.mockClear();});
it('retains the initial arrival batch when the hand starts folded, and respects manual folding',()=>{
 const r=render(<Host/>),get=()=>JSON.parse(screen.getByTestId('state').textContent);
 expect(get().open).toBe(true);expect(get().batch).toMatchObject({kind:'hand',ids:['a']});
 fireEvent.click(screen.getByText('접기'));expect(get()).toEqual({open:false,batch:null});
 r.rerender(<Host/>);expect(get().open).toBe(false);
});
it('lands actual draw sounds once, never on restored-hand display or after mute',()=>{
 const r=render(<Host/>);fireEvent.click(screen.getByText('착지'));expect(cue).not.toHaveBeenCalled();
 r.rerender(<Host receipt={Object.freeze({ids:['a']})}/>);fireEvent.click(screen.getByText('착지'));fireEvent.click(screen.getByText('착지'));expect(cue).toHaveBeenCalledTimes(1);
 expect(cue.mock.calls[0][0]).toBe('handLand');r.rerender(<Host sound={false}/>);expect(cue.mock.calls[0][1].signal.aborted).toBe(true);
});
it('cancels hidden tails and never catches them up on return; a later draw remains usable',()=>{
 const first={ids:['a']},r=render(<Host receipt={first}/>);fireEvent.click(screen.getByText('착지'));
 const signal=cue.mock.calls[0][1].signal;
 Object.defineProperty(document,'hidden',{get:()=>true,configurable:true});fireEvent(document,new Event('visibilitychange'));
 expect(signal.aborted).toBe(true);expect(JSON.parse(screen.getByTestId('state').textContent).batch).toBeNull();
 Object.defineProperty(document,'hidden',{get:()=>false,configurable:true});fireEvent(document,new Event('visibilitychange'));
 r.rerender(<Host receipt={first}/>);expect(cue).toHaveBeenCalledTimes(1);
 r.rerender(<Host receipt={{ids:['a']}}/>);fireEvent.click(screen.getByText('착지'));expect(cue).toHaveBeenCalledTimes(2);
});
