// @vitest-environment happy-dom
import React,{StrictMode,useRef} from 'react';
import {render,screen,act,cleanup,fireEvent} from '@testing-library/react';
import {it,expect,vi,beforeEach,afterEach} from 'vitest';
import HandFlow,{useHandFlow} from '../src/duel/battle-vnext/HandFlow.jsx';
import {cue} from '../src/duel/audio.js';
vi.mock('../src/duel/audio.js',()=>({cue:vi.fn()}));
const cards={a:{kind:'strike',name:'공개 카드'},b:{kind:'slug',name:'아직 모르는 카드'}};
const deal=[{seq:1,events:[{type:'deal',ids:['a','b'],hand:2,draw:3,discard:0}],cards}];
function Harness({receipts=deal,phase='deciding',shown=true,sound=true}){
  const ref=useRef(null),flow=useHandFlow({receipts,phase,shown,sound,rootRef:ref});
  return <div ref={ref}><button onClick={flow.clear}>manual fold</button><ol className="bv-hand-row"><li className="bv-card-slot" data-card-id="a"/>{phase==='deciding'&&<li className="bv-card-slot" data-card-id="b"/>}</ol><span data-testid="counts">{flow.counts?JSON.stringify(flow.counts):'actual'}</span><HandFlow flow={flow}/></div>;
}
beforeEach(()=>{
  vi.useFakeTimers();vi.clearAllMocks();
  vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockReturnValue({x:0,y:0,left:0,top:0,right:800,bottom:400,width:800,height:400});
  vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener(){},removeEventListener(){}}));
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});
it('StrictMode plays the opening exactly once with truthful pile counts',()=>{
  render(<StrictMode><Harness/></StrictMode>);
  expect(JSON.parse(screen.getByTestId('counts').textContent)).toEqual({hand:0,draw:5,discard:0});
  act(()=>vi.advanceTimersByTime(700));
  expect(JSON.parse(screen.getByTestId('counts').textContent)).toEqual({hand:2,draw:3,discard:0});
  expect(cue.mock.calls.map(x=>x[0])).toEqual(['cardGet','cardGet']);
  expect(document.querySelector('[data-flow-hidden]')).toBeNull();
});
it('flight exposes only public discards, never conditional draw/shuffle/count/sound',()=>{
  const receipt=[{seq:2,cards,zones:{a:4},events:[{type:'discard',id:'a',hand:0,draw:0,discard:1},{type:'shuffle',count:1,hand:0,draw:1,discard:0},{type:'draw',id:'b',hand:1,draw:0,discard:0}]}];
  const view=render(<Harness receipts={receipt} phase="flight"/>);
  act(()=>vi.advanceTimersByTime(80));expect(document.querySelector('[data-hand-flow=discard]')).not.toBeNull();
  expect(document.body.textContent).not.toContain(cards.b.name);expect(screen.getByTestId('counts').textContent).toBe('actual');
  act(()=>vi.advanceTimersByTime(2000));expect(cue.mock.calls.map(x=>x[0])).toEqual(['cardSpend']);
  view.rerender(<Harness receipts={receipt} phase="deciding" shown={false}/>);
  view.rerender(<Harness receipts={receipt} phase="deciding"/>);act(()=>vi.advanceTimersByTime(1800));
  expect(cue.mock.calls.map(x=>x[0])).toEqual(['cardSpend','cardSpend','cardGet']);
});
it('mute aborts existing audio nodes and prevents later deal cues',()=>{
  const view=render(<Harness/>);act(()=>vi.advanceTimersByTime(600));
  const signal=cue.mock.calls[0][1].signal;expect(signal.aborted).toBe(false);
  view.rerender(<Harness sound={false}/>);expect(signal.aborted).toBe(true);
  act(()=>vi.advanceTimersByTime(1600));expect(cue).toHaveBeenCalledTimes(1);
});
it('manual folding flushes pending deal without replay on reopening',()=>{
  const view=render(<Harness/>);fireEvent.click(screen.getByRole('button',{name:'manual fold'}));view.rerender(<Harness shown={false}/>);view.rerender(<Harness/>);
  act(()=>vi.advanceTimersByTime(2000));expect(cue).not.toHaveBeenCalled();expect(document.querySelector('[data-flow-hidden]')).toBeNull();
});
