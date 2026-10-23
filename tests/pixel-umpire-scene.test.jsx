// @vitest-environment happy-dom
import React,{createRef} from 'react';
import {act,cleanup,render} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import PixelUmpireScene from '../src/duel/PixelUmpireScene.jsx';

const makeContext=()=>({
  clearRect:vi.fn(),drawImage:vi.fn(),save:vi.fn(),restore:vi.fn(),translate:vi.fn(),scale:vi.fn(),rotate:vi.fn(),
  beginPath:vi.fn(),ellipse:vi.fn(),fill:vi.fn(),fillRect:vi.fn(),moveTo:vi.fn(),lineTo:vi.fn(),stroke:vi.fn(),closePath:vi.fn(),
});
let images,context,raf,cancelRaf,onReady;

class DeferredImage{
  constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;this.decoding='';images.push(this);}
  set src(value){this._src=value;}
  get src(){return this._src;}
  load(width=1024,height=1024){this.complete=true;this.naturalWidth=width;this.naturalHeight=height;this.onload?.();}
  fail(){this.onerror?.(new Error('image load failed'));}
}

function rect(left,top,width,height){return {left,top,width,height,right:left+width,bottom:top+height,x:left,y:top,toJSON(){return this;}};}
function harness(props={}){
  const sceneRef=createRef();
  const defaults={pitcherAtlas:'/pitcher-violet.png',artId:'regular-05-violet-sting',shot:null,fxStage:null,impactAt:200,playToken:1,pitchZone:null,revealed:null,onReady};
  const all={...defaults,...props};
  const view=render(<section ref={sceneRef} className="bp-scene">
    <div className="bp-zone"/><div className="bp-pitcher"/>
    <PixelUmpireScene sceneRef={sceneRef} {...all}/>
  </section>);
  return {...view,sceneRef};
}
async function loadAll(){
  await act(async()=>{
    for(const image of [...images]){
      const dimensions=image.src?.includes('stadium')?[480,640]:image.src?.includes('batter-atlas')?[1024,1280]:image.src?.includes('red-rush-atlas')?[1024,768]:[1000,1200];
      image.load(...dimensions);
    }
    await Promise.resolve();await Promise.resolve();
  });
}

beforeEach(()=>{
  images=[];context=makeContext();onReady=vi.fn();raf=vi.fn(()=>731);cancelRaf=vi.fn();
  vi.stubGlobal('Image',DeferredImage);
  vi.stubGlobal('requestAnimationFrame',raf);vi.stubGlobal('cancelAnimationFrame',cancelRaf);
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockImplementation(()=>context);
  vi.spyOn(Element.prototype,'getBoundingClientRect').mockImplementation(function(){
    if(this.classList?.contains('bp-zone'))return rect(171.6,285.9,140.4,168);
    if(this.classList?.contains('bp-scene'))return rect(0,0,390,484);
    return rect(0,0,0,0);
  });
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});

describe('PixelUmpireScene canvas lifecycle',()=>{
  it('loads all local art, draws a native canvas scene, then reports ready',async()=>{
    const {container}=harness();
    expect(images).toHaveLength(4);
    await loadAll();
    expect(onReady).toHaveBeenCalledWith(true);
    const canvases=container.querySelectorAll('canvas');
    expect(canvases).toHaveLength(2);
    expect(canvases[0].width).toBe(240);
    expect(canvases[0].height).toBe(298);
    expect(context.drawImage).toHaveBeenCalled();
    expect(container.querySelector('.bp-scene').style.getPropertyValue('--pixel-pitcher-x')).toMatch(/px$/);
    expect(parseFloat(container.querySelector('.bp-scene').style.getPropertyValue('--pixel-pitcher-height'))).toBeGreaterThan(0);
  });

  it('reports not-ready when either 2D context or a required image is unavailable',async()=>{
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockImplementation(()=>null);
    harness();
    await act(async()=>Promise.resolve());
    expect(onReady).toHaveBeenCalledWith(false);
    expect(images).toHaveLength(0);

    cleanup();onReady=vi.fn();images=[];
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockImplementation(()=>context);
    harness();
    images[1].fail();
    await act(async()=>{await Promise.resolve();await Promise.resolve();});
    expect(onReady).toHaveBeenCalledWith(false);
    expect(onReady).not.toHaveBeenCalledWith(true);
    expect(context.drawImage).not.toHaveBeenCalled();
  });

  it('schedules one pitch clock and cancels it on unmount',async()=>{
    const {unmount}=harness({shot:{grade:'homer',motion:{duration:1200}},fxStage:'windup',pitchZone:4,revealed:{action:'swing',kind:'hit'}});
    await loadAll();
    expect(raf).toHaveBeenCalledTimes(1);
    expect(onReady).toHaveBeenCalledWith(true);
    unmount();
    expect(cancelRaf).toHaveBeenCalledExactlyOnceWith(731);
  });

  it('ignores late image completion after unmount',async()=>{
    const {unmount}=harness();
    const lateReady=onReady.mock.calls.length,lateDraws=context.drawImage.mock.calls.length;
    unmount();
    await loadAll();
    expect(onReady.mock.calls.slice(lateReady)).not.toContainEqual([true]);
    expect(context.drawImage).toHaveBeenCalledTimes(lateDraws);
    expect(raf).not.toHaveBeenCalled();
  });

  it('hands the scene back on context loss and restores without a second pitch clock',async()=>{
    const {container}=harness();await loadAll();onReady.mockClear();
    const canvas=container.querySelector('canvas');
    act(()=>canvas.dispatchEvent(new Event('contextlost',{cancelable:true})));
    expect(onReady).toHaveBeenLastCalledWith(false);
    act(()=>canvas.dispatchEvent(new Event('contextrestored')));
    expect(onReady).toHaveBeenLastCalledWith(true);
    expect(raf).not.toHaveBeenCalled();
  });

  it('reboots the local image set and draws the Red Rush atlas when the pitcher art ID changes',async()=>{
    const view=harness();
    await loadAll();
    const firstRoster=images.find(image=>image.src==='/pitcher-violet.png');
    expect(context.drawImage.mock.calls.some(call=>call[0]===firstRoster)).toBe(true);
    const count=images.length;
    view.rerender(<section ref={view.sceneRef} className="bp-scene">
      <div className="bp-zone"/><div className="bp-pitcher"/>
      <PixelUmpireScene sceneRef={view.sceneRef} pitcherAtlas="/pitcher-violet.png" artId="regular-01-red-rush"
        shot={null} fxStage={null} impactAt={200} playToken={2} pitchZone={null} revealed={null} onReady={onReady}/>
    </section>);
    expect(images).toHaveLength(count+4);
    await loadAll();
    const redRush=images[count+2];
    expect(context.drawImage.mock.calls.some(call=>call[0]===redRush)).toBe(true);
    const redDraw=context.drawImage.mock.calls.findLast(call=>call[0]===redRush);
    expect(redDraw[7]).toBe(redDraw[8]); // square cells retain their full aspect, including transparent padding
  });
});
