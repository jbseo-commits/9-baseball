// @vitest-environment happy-dom
import React from 'react';
import {render,fireEvent,screen,cleanup,act} from '@testing-library/react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import JourneyArrival,{useMenuFeedback} from '../src/duel/JourneyJuice.jsx';
import BallparkMap from '../src/duel/BallparkMap.jsx';
import StartPackPick from '../src/duel/StartPackPick.jsx';
import {cue} from '../src/duel/audio.js';
vi.mock('../src/duel/audio.js',()=>({cue:vi.fn()}));
const arrival={token:1,type:'battle',title:'청록 미라주',eyebrow:'PLAY BALL'};
beforeEach(()=>{vi.useFakeTimers();vi.clearAllMocks();});
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();});

it('an arrival is a removable visual receipt and has no engine callback',()=>{
  const done=vi.fn();render(<JourneyArrival arrival={arrival} onDone={done}/>);
  expect(screen.getByTestId('journey-arrival').getAttribute('aria-hidden')).toBe('true');
  fireEvent.pointerDown(window);expect(done).toHaveBeenCalledTimes(1);
});
it('arrival timers and listeners are cleaned when the destination is left',()=>{
  const done=vi.fn(),v=render(<JourneyArrival arrival={arrival} onDone={done}/>);
  v.unmount();vi.advanceTimersByTime(1000);fireEvent.keyDown(window,{key:'Enter'});expect(done).not.toHaveBeenCalled();
});
it('reduced motion receives a short receipt without waiting for animationend',()=>{
  vi.spyOn(window,'matchMedia').mockReturnValue({matches:true});
  const done=vi.fn();render(<JourneyArrival arrival={arrival} onDone={done}/>);
  vi.advanceTimersByTime(100);expect(done).toHaveBeenCalledTimes(1);
});
function Feedback({sound}){const play=useMenuFeedback(sound);return <button onClick={()=>play('lock')}>cue</button>;}
it('menu audio respects mute, cancels previous cues, and stops on unmount',()=>{
  const v=render(<Feedback sound={false}/>);fireEvent.click(screen.getByText('cue'));expect(cue).not.toHaveBeenCalled();
  v.rerender(<Feedback sound/>);fireEvent.click(screen.getByText('cue'));const first=cue.mock.calls[0][1].signal;
  fireEvent.click(screen.getByText('cue'));expect(first.aborted).toBe(true);const last=cue.mock.calls[1][1].signal;
  v.unmount();expect(last.aborted).toBe(true);
});
it('muting a mounted menu cancels its ongoing cue',()=>{
  const v=render(<Feedback sound/>);fireEvent.click(screen.getByText('cue'));const signal=cue.mock.calls[0][1].signal;
  v.rerender(<Feedback sound={false}/>);expect(signal.aborted).toBe(true);
});
it('a background tab cancels pending menu notes and does not start a new cue',()=>{
  const hidden=vi.spyOn(document,'hidden','get').mockReturnValue(false);
  render(<Feedback sound/>);fireEvent.click(screen.getByText('cue'));const signal=cue.mock.calls[0][1].signal;
  hidden.mockReturnValue(true);fireEvent(document,new Event('visibilitychange'));expect(signal.aborted).toBe(true);
  fireEvent.click(screen.getByText('cue'));expect(cue).toHaveBeenCalledTimes(1);
});
it('arrival disappears on backgrounding without leaving a stale timer receipt',()=>{
  vi.spyOn(document,'hidden','get').mockReturnValue(true);const done=vi.fn();render(<JourneyArrival arrival={arrival} onDone={done}/>);
  fireEvent(document,new Event('visibilitychange'));vi.advanceTimersByTime(1000);expect(done).toHaveBeenCalledTimes(1);
});
const nodes=[{id:'a',act:1,row:0,lane:0,type:'battle',opponent:{name:'A',maxHp:60}},{id:'b',act:1,row:1,lane:0,type:'rest',name:'휴식일'}];
it('map previews never enter, and accepted confirmation cannot execute twice',()=>{
  const enter=vi.fn();render(<BallparkMap nodes={nodes} edges={[{from:'a',to:'b'}]} reachableIds={['a']} onEnter={enter}/>);
  fireEvent.click(document.querySelector('[data-node="b"]'));expect(enter).not.toHaveBeenCalled();expect(screen.getByTestId('bp-map-go').disabled).toBe(true);
  fireEvent.click(document.querySelector('[data-node="a"]'));const go=screen.getByTestId('bp-map-go');fireEvent.click(go);fireEvent.click(go);expect(enter).toHaveBeenCalledTimes(1);
});
it('an engine-rejected entry leaves the confirmation usable for a retry',()=>{
  const enter=vi.fn(()=>false);render(<BallparkMap nodes={nodes} reachableIds={['a']} onEnter={enter}/>);
  fireEvent.click(screen.getByTestId('bp-map-go'));fireEvent.click(screen.getByTestId('bp-map-go'));expect(enter).toHaveBeenCalledTimes(2);
});
it('pack inspection is unsaved and a repeated confirmation starts only one run',()=>{
  const pick=vi.fn();render(<StartPackPick seed={3} onPick={pick}/>);
  fireEvent.click(screen.getAllByTestId('start-pack')[0]);expect(pick).not.toHaveBeenCalled();
  fireEvent.click(screen.getByTestId('start-pack-go'));fireEvent.click(screen.getByTestId('start-pack-go'));expect(pick).toHaveBeenCalledTimes(1);
});
it('only the vnext map follows rotation; legacy sidecars remain portrait',()=>{
  const original=window.location.href,listeners=new Set();
  const media={matches:true,addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)};
  vi.spyOn(window,'matchMedia').mockImplementation(q=>q==='(orientation: landscape)'?media:{matches:false});
  window.history.replaceState(null,'','/?battleUi=vnext');
  const v=render(<BallparkMap nodes={nodes} reachableIds={['a']}/>);
  expect(document.querySelector('.bp-map.wide')).not.toBeNull();
  act(()=>{media.matches=false;listeners.forEach(fn=>fn());});expect(document.querySelector('.bp-map.wide')).toBeNull();
  act(()=>{media.matches=true;listeners.forEach(fn=>fn());});expect(document.querySelector('.bp-map.wide')).not.toBeNull();
  v.unmount();expect(listeners.size).toBe(0);
  window.history.replaceState(null,'','/?battleUi=legacy');render(<BallparkMap nodes={nodes} reachableIds={['a']}/>);
  expect(document.querySelector('.bp-map.wide')).toBeNull();window.history.replaceState(null,'',original);
});
