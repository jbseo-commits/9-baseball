// @vitest-environment happy-dom
import React,{createRef} from 'react';
import {act,cleanup,render} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import PixelUmpireScene from '../src/duel/PixelUmpireScene.jsx';
import {atlasCell,physicalPitchPoint,PIXEL_SCENE_WIDTH,sourcePointForFrame} from '../src/duel/pixel-umpire-motion.js';
import v3Manifest from '../assets/production-art/pixel-umpire-v4/runtime/manifest.json' with {type:'json'};

const makeContext=()=>({
  clearRect:vi.fn(),drawImage:vi.fn(),save:vi.fn(),restore:vi.fn(),translate:vi.fn(),scale:vi.fn(),rotate:vi.fn(),
  beginPath:vi.fn(),ellipse:vi.fn(),fill:vi.fn(),fillRect:vi.fn(),moveTo:vi.fn(),lineTo:vi.fn(),stroke:vi.fn(),closePath:vi.fn(),
});
let images,context,raf,cancelRaf,onReady,layout;
const authoredTimelines=JSON.parse(JSON.stringify(v3Manifest.atlases.batter.timelines));
const authoredFrame8Grounding=v3Manifest.atlases.batter.frames[8].grounding;

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
      const dimensions=image.src?.includes('stadium')?[384,576]:image.src?.includes('batter-atlas')?[1024,3584]:image.src?.includes('red-rush-atlas')?[1024,768]:image.src?.includes('mound')?[192,64]:[1000,1200];
      image.load(...dimensions);
    }
    await Promise.resolve();await Promise.resolve();
  });
}

beforeEach(()=>{
  images=[];context=makeContext();onReady=vi.fn();raf=vi.fn(()=>731);cancelRaf=vi.fn();layout={scene:rect(0,0,390,484),zone:rect(171.6,285.9,140.4,168)};
  vi.stubGlobal('Image',DeferredImage);
  vi.stubGlobal('requestAnimationFrame',raf);vi.stubGlobal('cancelAnimationFrame',cancelRaf);
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockImplementation(()=>context);
  vi.spyOn(Element.prototype,'getBoundingClientRect').mockImplementation(function(){
    if(this.classList?.contains('bp-zone')){
      if(this.closest?.('.bp-scene')?.getAttribute('data-pixel-umpire-short-scene')==='true'){
        const {left,top,width,height}=layout.scene;
        const zoneWidth=138,zoneHeight=Math.min(168,Math.max(126,height*.37));
        return rect(left+width-zoneWidth-12,top+height-zoneHeight-24,zoneWidth,zoneHeight);
      }
      return layout.zone;
    }
    if(this.classList?.contains('bp-scene'))return layout.scene;
    return rect(0,0,0,0);
  });
});
afterEach(()=>{cleanup();v3Manifest.atlases.batter.timelines=JSON.parse(JSON.stringify(authoredTimelines));if(authoredFrame8Grounding===undefined)delete v3Manifest.atlases.batter.frames[8].grounding;else v3Manifest.atlases.batter.frames[8].grounding=authoredFrame8Grounding;vi.restoreAllMocks();vi.unstubAllGlobals();});

describe('PixelUmpireScene canvas lifecycle',()=>{
  it('keeps recovery through its authored ready and hands back without skipping that pose',async()=>{
    let now=0;
    vi.spyOn(performance,'now').mockImplementation(()=>now);
    const view=harness({fxStage:'impact',shot:{grade:'single',motion:{duration:1600}},impactAt:630,playToken:31,pitchZone:4,revealed:{action:'swing',kind:'hit'}});
    await loadAll();
    const atlas=images.find(image=>image.src?.includes('batter-atlas'));
    const lastFrame=()=>{
      const call=context.drawImage.mock.calls.filter(entry=>entry[0]===atlas).at(-1);
      return Math.round(call[2]/256)*4+Math.round(call[1]/256);
    };
    const nextFrame=async time=>{
      now=time;
      const callback=raf.mock.calls.at(-1)?.[0];
      await act(async()=>callback?.(time));
    };
    const contactFrame=raf.mock.calls.at(-1)?.[0];
    await act(async()=>contactFrame?.(630));
    expect(lastFrame()).toBe(8);
    view.rerender(<section ref={view.sceneRef} className="bp-scene"><div className="bp-zone"/><div className="bp-pitcher"/><PixelUmpireScene sceneRef={view.sceneRef} pitcherAtlas="/pitcher-violet.png" artId="regular-05-violet-sting" shot={{grade:'single',motion:{duration:1600}}} fxStage="windup" impactAt={1200} playToken={32} pitchZone={4} revealed={{action:'swing',kind:'hit'}} onReady={onReady}/></section>);
    const readyAt=authoredTimelines.swing.at(-1).atMs;
    await nextFrame(630+50+readyAt-20); // shared post-impact clock preserves its visual hold
    expect(lastFrame()).toBe(authoredTimelines.swing.at(-2).frame);
    await nextFrame(630+50+readyAt);
    expect(lastFrame()).toBe(0);
  });

  it('hands a previous recovery to the new gather, then gives the new contact priority',async()=>{
    let now=0;
    vi.spyOn(performance,'now').mockImplementation(()=>now);
    v3Manifest.atlases.batter.timelines={readyFrame:0,swing:[
      {atMs:-1500,frame:0,phase:'windup'},
      {atMs:-1000,frame:1,phase:'windup'},
      {atMs:-700,frame:3,phase:'gather'},
      {atMs:0,frame:5},
      {atMs:0,frame:4,contactOnly:true},
      {atMs:100,frame:6,phase:'follow'},
      {atMs:700,frame:7,phase:'ready'},
    ]};
    const view=harness({fxStage:'impact',shot:{grade:'single',motion:{duration:1500}},impactAt:630,playToken:1,pitchZone:4,revealed:{action:'swing',kind:'hit'}});
    await loadAll();
    const atlas=images.find(image=>image.src?.includes('batter-atlas'));
    const lastFrame=()=>{
      const call=context.drawImage.mock.calls.filter(entry=>entry[0]===atlas).at(-1);
      return Math.round(call[2]/256)*4+Math.round(call[1]/256);
    };
    const nextFrame=async time=>{
      now=time;
      const callback=raf.mock.calls.at(-1)?.[0];
      await act(async()=>callback?.(time));
    };
    expect(lastFrame()).toBe(4);

    view.rerender(<section ref={view.sceneRef} className="bp-scene"><div className="bp-zone"/><div className="bp-pitcher"/><PixelUmpireScene sceneRef={view.sceneRef} pitcherAtlas="/pitcher-violet.png" artId="regular-05-violet-sting" shot={{grade:'single',motion:{duration:1500}}} fxStage="windup" impactAt={1200} playToken={2} pitchZone={4} revealed={{action:'swing',kind:'hit'}} onReady={onReady}/></section>);
    await nextFrame(1030);
    expect(lastFrame()).toBe(6); // prior recovery is preserved during the new play's early windup

    await nextFrame(1530);
    expect(lastFrame()).toBe(3); // new -700ms gather takes over while the old recovery window is still open

    view.rerender(<section ref={view.sceneRef} className="bp-scene"><div className="bp-zone"/><div className="bp-pitcher"/><PixelUmpireScene sceneRef={view.sceneRef} pitcherAtlas="/pitcher-violet.png" artId="regular-05-violet-sting" shot={{grade:'single',motion:{duration:1500}}} fxStage="impact" impactAt={1200} playToken={2} pitchZone={4} revealed={{action:'swing',kind:'hit'}} onReady={onReady}/></section>);
    await nextFrame(2230);
    expect(lastFrame()).toBe(4); // contactOnly frame from the new play is never masked by recovery

    vi.stubGlobal('matchMedia',()=>({matches:true}));
    view.rerender(<section ref={view.sceneRef} className="bp-scene"><div className="bp-zone"/><div className="bp-pitcher"/><PixelUmpireScene sceneRef={view.sceneRef} pitcherAtlas="/pitcher-violet.png" artId="regular-05-violet-sting" shot={{grade:'single',motion:{duration:1500}}} fxStage="windup" impactAt={1200} playToken={3} pitchZone={4} revealed={{action:'swing',kind:'hit'}} onReady={onReady}/></section>);
    await nextFrame(2600);
    expect(lastFrame()).toBe(3); // reduced motion samples the current play's fixed windup pose
  });

  it('keeps the previous action plant context when a swing recovery overlaps a new bunt',async()=>{
    let now=0;vi.spyOn(performance,'now').mockImplementation(()=>now);
    v3Manifest.atlases.batter.timelines={readyFrame:0,swing:[
      {atMs:-1500,frame:0,phase:'windup'},
      {atMs:0,frame:6,phase:'follow'},
      {atMs:700,frame:0,phase:'ready'},
    ],bunt:authoredTimelines.bunt,take:authoredTimelines.take};
    const view=harness();
    const atlas=images.find(image=>image.src?.includes('batter-atlas')),draws=[];let lastTranslate=null;
    context.translate.mockImplementation((...args)=>{lastTranslate=args;});
    context.drawImage.mockImplementation((image,...args)=>{
      if(image===atlas){const index=Math.round(args[1]/256)*4+Math.round(args[0]/256);draws.push({index,translate:lastTranslate});}
    });
    await loadAll();
    await act(async()=>raf.mock.calls.at(-1)?.[0]?.(0));
    const readyTranslate=draws.find(entry=>entry.index===0)?.translate;
    expect(readyTranslate).toBeDefined();
    view.rerender(<section ref={view.sceneRef} className="bp-scene"><div className="bp-zone"/><div className="bp-pitcher"/><PixelUmpireScene sceneRef={view.sceneRef} pitcherAtlas="/pitcher-violet.png" artId="regular-05-violet-sting" shot={{grade:'single',motion:{duration:1500}}} fxStage="impact" impactAt={0} playToken={1} pitchZone={4} revealed={{action:'swing',kind:'hit'}} onReady={onReady}/></section>);
    await act(async()=>raf.mock.calls.at(-1)?.[0]?.(0));
    const swingTranslate=draws.filter(entry=>entry.index===6).at(-1)?.translate;
    expect(swingTranslate).toBeDefined();
    view.rerender(<section ref={view.sceneRef} className="bp-scene"><div className="bp-zone"/><div className="bp-pitcher"/><PixelUmpireScene sceneRef={view.sceneRef} pitcherAtlas="/pitcher-violet.png" artId="regular-05-violet-sting" shot={{grade:'single',motion:{duration:1500}}} fxStage="windup" impactAt={1200} playToken={2} pitchZone={4} revealed={{action:'bunt',kind:'hit'}} onReady={onReady}/></section>);
    now=100;const callback=raf.mock.calls.at(-1)?.[0];await act(async()=>callback?.(now));
    const recoveryTranslate=draws.filter(entry=>entry.index===6).at(-1)?.translate;
    expect(recoveryTranslate).toBeDefined();
    expect(recoveryTranslate).toEqual(swingTranslate); // It must retain its old swing transform through the next bunt windup.
  });

  it('uses the contact frame grounding reference to place the contact point on the visible bat',async()=>{
    vi.spyOn(performance,'now').mockReturnValue(0);
    const art=v3Manifest.atlases.batter,frame=art.frames[8];
    frame.grounding={support:'rear',targetFrame:3,targetSupport:'front'};
    const contactPointRef=createRef(),view=harness({fxStage:'impact',shot:{grade:'single',motion:{duration:1200}},impactAt:0,playToken:1,pitchZone:4,revealed:{action:'swing',kind:'hit'},contactPointRef});
    const atlas=images.find(image=>image.src?.includes('batter-atlas'));let translate=null,scale=null,contactSprite=null;
    context.translate.mockImplementation((...args)=>{translate=args;});
    context.scale.mockImplementation((...args)=>{scale=args;});
    context.drawImage.mockImplementation((image,...args)=>{
      if(image!==atlas)return;
      const index=Math.round(args[1]/256)*4+Math.round(args[0]/256);
      if(index===8)contactSprite={translate,scale,offset:{x:args[4],y:args[5]}};
    });
    await loadAll();await act(async()=>raf.mock.calls.at(-1)?.[0]?.(0));
    expect(contactSprite).toBeDefined();
    const cell=atlasCell(v3Manifest,art),barrelSource=sourcePointForFrame(frame,'barrel',cell),barrel={
      x:contactSprite.translate[0]+(barrelSource.x+contactSprite.offset.x)*contactSprite.scale[0],
      y:contactSprite.translate[1]+(barrelSource.y+contactSprite.offset.y)*contactSprite.scale[1],
    };
    const axis={x:frame.anchors.batAxis[0],y:frame.anchors.batAxis[1],unitScale:contactSprite.scale[0]*(cell.scale||1)};
    const expected=physicalPitchPoint(4,barrel,axis);
    expect(contactPointRef.current.x*PIXEL_SCENE_WIDTH/390).toBeCloseTo(expected.x,6);
    expect(contactPointRef.current.y*477/484).toBeCloseTo(expected.y,6);
  });

  it('loads all local art, draws a native canvas scene, then reports ready',async()=>{
    const view=harness();
    const {container}=view;
    expect(images).toHaveLength(5);
    await loadAll();
    expect(onReady).toHaveBeenCalledWith(true);
    const canvases=container.querySelectorAll('canvas');
    expect(canvases).toHaveLength(2);
    expect(canvases[0].width).toBe(PIXEL_SCENE_WIDTH);
    expect(canvases[0].height).toBe(Math.round(PIXEL_SCENE_WIDTH*484/390));
    expect(context.drawImage).toHaveBeenCalled();
    const mound=images.find(image=>image.src?.includes('mound'));
    const moundDraw=context.drawImage.mock.calls.find(call=>call[0]===mound);
    expect(moundDraw).toBeDefined();
    expect(moundDraw[3]).toBeGreaterThan(190);
    expect(moundDraw[1]+v3Manifest.mound.rubber[0]*moundDraw[3]).toBeCloseTo(211,0);
    expect(v3Manifest.field.cameraCenterRatio).toBe(0.55);
    // The tactical zone remains at its existing DOM center (~238px); only the field camera is reframed.
    expect((171.6+140.4/2)*384/390).toBeCloseTo(238,0);
    expect(moundDraw[2]+v3Manifest.mound.rubber[1]*moundDraw[4]).toBeCloseTo(210,0);
    expect(container.querySelector('.bp-scene').style.getPropertyValue('--pixel-pitcher-x')).toMatch(/px$/);
    expect(parseFloat(container.querySelector('.bp-scene').style.getPropertyValue('--pixel-pitcher-height'))).toBeGreaterThan(0);
  });

  it('moves the unchanged tactical zone into the short-scene gutter and keeps the field framed behind it',async()=>{
    layout={scene:rect(0,44,405,360),zone:rect(131.875,253.265625,138,133.1875)};
    const view=harness(),{container}=view;
    await loadAll();
    const scene=container.querySelector('.bp-scene'),zone=scene.querySelector('.bp-zone');
    const mound=images.find(image=>image.src?.includes('mound'));
    const moundDraw=context.drawImage.mock.calls.find(call=>call[0]===mound);
    const centerX=moundDraw[1]+v3Manifest.mound.rubber[0]*moundDraw[3];
    const centerY=moundDraw[2]+v3Manifest.mound.rubber[1]*moundDraw[4];
    expect(container.querySelector('canvas').height).toBe(341);
    expect(scene.getAttribute('data-pixel-umpire-short-scene')).toBe('true');
    expect(zone.getBoundingClientRect().left).toBe(255);
    expect(zone.getBoundingClientRect().bottom).toBeCloseTo(380,5);
    expect(centerX).toBeCloseTo(211,0);
    expect(centerY).toBeCloseTo(150,0);
    expect(moundDraw[3]).toBeLessThan(160); // field parts share the responsive zoom
    view.rerender(<section ref={view.sceneRef} className="bp-scene pixel-umpire-ready"><div className="bp-zone"/><div className="bp-pitcher"/><PixelUmpireScene sceneRef={view.sceneRef} pitcherAtlas="/pitcher-violet.png" artId="regular-05-violet-sting" shot={null} fxStage={null} impactAt={200} playToken={1} pitchZone={null} revealed={null} onReady={onReady}/></section>);
    expect(scene.getAttribute('data-pixel-umpire-short-scene')).toBe('true');
    expect(zone.getBoundingClientRect().left).toBe(255);
  });

  it('uses the same short-scene treatment in a compact phone frame',async()=>{
    layout={scene:rect(0,44,360,280),zone:rect(109.546875,187.28125,138,126)};
    const {container}=harness();
    await loadAll();
    const scene=container.querySelector('.bp-scene'),zone=scene.querySelector('.bp-zone');
    const mound=images.find(image=>image.src?.includes('mound'));
    const moundDraw=context.drawImage.mock.calls.find(call=>call[0]===mound);
    expect(container.querySelector('canvas').height).toBe(299);
    expect(scene.getAttribute('data-pixel-umpire-short-scene')).toBe('true');
    expect(zone.getBoundingClientRect().left).toBe(210);
    expect(zone.getBoundingClientRect().top).toBe(174);
    expect(moundDraw[1]+v3Manifest.mound.rubber[0]*moundDraw[3]).toBeCloseTo(211,0);
    expect(moundDraw[2]+v3Manifest.mound.rubber[1]*moundDraw[4]).toBeCloseTo(132,0);
    expect(moundDraw[3]).toBeLessThan(135);
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
    expect(images).toHaveLength(count+5);
    await loadAll();
    const redRush=images[count+2];
    expect(context.drawImage.mock.calls.some(call=>call[0]===redRush)).toBe(true);
    const redDraw=context.drawImage.mock.calls.findLast(call=>call[0]===redRush);
    expect(redDraw[7]).toBe(redDraw[8]); // square cells retain their full aspect, including transparent padding
  });
});
