export const PIXEL_SCENE_BASE_WIDTH=240;
export const PIXEL_SCENE_WIDTH=384;
export const PIXEL_SCENE_SCALE=PIXEL_SCENE_WIDTH/PIXEL_SCENE_BASE_WIDTH;
export const FEET_PER_METER=3.280839895;
export const PLATE_TO_RUBBER_M=18.44;
export const PLATE_TO_RUBBER_FT=PLATE_TO_RUBBER_M*FEET_PER_METER;
export const BATTER_BOX_WIDTH_FT=4;
export const BATTER_BOX_LENGTH_FT=6;
export const BATTER_BOX_PLATE_GAP_FT=.5;
export const HOME_PLATE_HALF_WIDTH_FT=17/24;
export const BATTER_BOX_CENTER_LATERAL_FT=-(HOME_PLATE_HALF_WIDTH_FT+BATTER_BOX_PLATE_GAP_FT+BATTER_BOX_WIDTH_FT/2);
export const BATTER_REAR_LATERAL_FT=BATTER_BOX_CENTER_LATERAL_FT-BATTER_BOX_WIDTH_FT/2+.5;
export const VISUAL_HITSTOP_MS=50;

/** Reframe the field away from the measured tactical zone and zoom out on short scenes. */
export function responsiveFieldCameraFraming({width,height,zoneCenterX,centerRatio=.55,zoneInsetRatio=.07,referenceHeight=477,viewWidthFt=15.5}={}){
  if(![width,height,centerRatio,zoneInsetRatio,referenceHeight,viewWidthFt].every(Number.isFinite)||width<=0||height<=0||referenceHeight<=0||viewWidthFt<=0)return null;
  const preferred=width*Math.max(.1,Math.min(.9,centerRatio));
  const uiAware=Number.isFinite(zoneCenterX)?zoneCenterX-width*Math.max(0,zoneInsetRatio):preferred;
  const referenceTravel=.56*referenceHeight-.055*width,currentTravel=.56*height-.055*width;
  return {
    centerX:Math.round(Math.max(0,Math.min(preferred,uiAware))),
    viewWidthFt:viewWidthFt*Math.max(1,referenceTravel/Math.max(1,currentTravel)),
    sceneScale:Math.min(1,Math.max(.1,currentTravel/Math.max(1,referenceTravel))),
  };
}

/** Shared ball/actor clock: honor the parent's impact gate, then hold contact briefly. */
export function impactPresentationElapsed(clockElapsed,impactAt,stage,hitStopMs=VISUAL_HITSTOP_MS){
  const t=Math.max(0,Number(clockElapsed)||0),impact=Math.max(0,Number(impactAt)||0);
  const confirmed=['impact','slowmo','release','settle'].includes(stage);
  if(!confirmed)return Math.min(t,Math.max(0,impact-1));
  if(t<=impact+Math.max(0,hitStopMs))return impact;
  return impact+t-impact-Math.max(0,hitStopMs);
}

/** Preserve the previous batter track through the next prep; short tracks hold ready to 1.34s. */
export function trackRecoveryDuration(track,readyFrame=0,minimumMs=1340){
  if(!Array.isArray(track))return Math.max(0,minimumMs);
  const entries=track.filter(entry=>entry&&Number.isFinite(entry.atMs)&&Number.isInteger(entry.frame));
  const ready=entries.filter(entry=>entry.atMs>=0&&entry.frame===readyFrame&&entry.phase==='ready').at(-1);
  const end=ready?ready.atMs:entries.length?Math.max(...entries.map(entry=>entry.atMs)):0;
  return Math.max(Number.isFinite(minimumMs)?minimumMs:0,end);
}

/** One compressed catcher-camera projection for the entire field, in feet. */
export function createFieldCamera({width,height,centerX,plateY,cameraDepthFt=PLATE_TO_RUBBER_FT,cameraHeightFt=12,viewWidthFt=15.5,pitcherDepthFt=PLATE_TO_RUBBER_FT,pitcherTargetY}={}){
  if(![width,height,centerX,plateY,cameraDepthFt,cameraHeightFt,viewWidthFt,pitcherDepthFt].every(Number.isFinite)||width<=0||height<=0||cameraDepthFt<=0||cameraHeightFt<=0||viewWidthFt<=0||cameraDepthFt+pitcherDepthFt<=0)return null;
  const focal=width/viewWidthFt*cameraDepthFt;
  const fittedHeight=Number.isFinite(pitcherTargetY)&&pitcherDepthFt>0
    ?(plateY-pitcherTargetY)*cameraDepthFt*(cameraDepthFt+pitcherDepthFt)/(focal*pitcherDepthFt)
    :cameraHeightFt;
  const selectedHeight=Math.max(.25,fittedHeight);
  const horizonY=plateY-focal*selectedHeight/cameraDepthFt;
  return {width,height,centerX,plateY,cameraDepthFt,cameraHeightFt:selectedHeight,requestedCameraHeightFt:cameraHeightFt,viewWidthFt,focalPx:focal,horizonY,pitcherDepthFt,pitcherTargetY};
}

export function projectFieldPoint(camera,{lateralFt=0,depthFt=0,heightFt=0}={}){
  if(!camera||![lateralFt,depthFt,heightFt].every(Number.isFinite))return null;
  const cameraDistance=camera.cameraDepthFt+depthFt;
  if(cameraDistance<=0)return null;
  const scale=camera.focalPx/cameraDistance;
  return {x:Math.round(camera.centerX+lateralFt*scale),y:Math.round(camera.horizonY+(camera.cameraHeightFt-heightFt)*scale),scale};
}

export function unprojectGroundPoint(camera,{x,y}={}){
  if(!camera||![x,y].every(Number.isFinite))return null;
  const vertical=y-camera.horizonY;
  if(vertical<=0)return null;
  const distance=camera.focalPx*camera.cameraHeightFt/vertical;
  const scale=camera.focalPx/distance;
  return {lateralFt:(x-camera.centerX)/scale,depthFt:distance-camera.cameraDepthFt};
}

export function projectFieldHeight(camera,depthFt,heightFt){
  if(!camera||!Number.isFinite(depthFt)||!Number.isFinite(heightFt)||heightFt<0)return 0;
  const distance=camera.cameraDepthFt+depthFt;
  return distance>0?camera.focalPx*heightFt/distance:0;
}

export function projectBatterBox(camera,{centerLateralFt=BATTER_BOX_CENTER_LATERAL_FT,nearDepthFt=-2,farDepthFt=4,widthFt=BATTER_BOX_WIDTH_FT}={}){
  if(!camera||![centerLateralFt,nearDepthFt,farDepthFt,widthFt].every(Number.isFinite)||farDepthFt<=nearDepthFt||widthFt<=0)return null;
  const half=widthFt/2;
  const points={
    leftNear:projectFieldPoint(camera,{lateralFt:centerLateralFt-half,depthFt:nearDepthFt}),
    rightNear:projectFieldPoint(camera,{lateralFt:centerLateralFt+half,depthFt:nearDepthFt}),
    rightFar:projectFieldPoint(camera,{lateralFt:centerLateralFt+half,depthFt:farDepthFt}),
    leftFar:projectFieldPoint(camera,{lateralFt:centerLateralFt-half,depthFt:farDepthFt}),
  };
  return {points,world:{centerLateralFt,nearDepthFt,farDepthFt,widthFt,lengthFt:farDepthFt-nearDepthFt}};
}

export function projectHomePlate(camera,{widthIn=17,depthIn=17}={}){
  if(!camera||![widthIn,depthIn].every(Number.isFinite)||widthIn<=0||depthIn<=0)return null;
  const half=widthIn/24,depth=depthIn/12;
  return [
    projectFieldPoint(camera,{lateralFt:-half,depthFt:depth}),
    projectFieldPoint(camera,{lateralFt:half,depthFt:depth}),
    projectFieldPoint(camera,{lateralFt:half,depthFt:depth/2}),
    projectFieldPoint(camera,{lateralFt:0,depthFt:0}),
    projectFieldPoint(camera,{lateralFt:-half,depthFt:depth/2}),
  ];
}

export function atlasCell(manifest,atlas){
  return {...(manifest?.cell||{}),...(atlas?.cell||{})};
}

export function pixelBallRects(x,y,sceneScale=1){
  const factor=Math.max(.1,Number.isFinite(sceneScale)?sceneScale:1);
  const width=Math.max(1,Math.round(5*PIXEL_SCENE_SCALE*factor)),height=Math.max(1,Math.round(4*PIXEL_SCENE_SCALE*factor));
  const innerWidth=Math.max(1,Math.round(3*PIXEL_SCENE_SCALE*factor)),innerHeight=Math.max(1,Math.round(2*PIXEL_SCENE_SCALE*factor));
  return {
    outer:{x:Math.round(x-width/2),y:Math.round(y-height/2),width,height},
    inner:{x:Math.round(x-innerWidth/2),y:Math.round(y-innerHeight/2),width:innerWidth,height:innerHeight},
  };
}

export function coverPlacement(imageWidth,imageHeight,width,height,{fieldLineY,desiredHorizon}={}){
  const scale=Math.max(width/imageWidth,height/imageHeight);
  const drawWidth=Math.round(imageWidth*scale),drawHeight=Math.round(imageHeight*scale);
  const x=Math.round((width-drawWidth)/2);
  let y=Math.round((height-drawHeight)/2);
  if(Number.isFinite(fieldLineY)&&fieldLineY>=0&&fieldLineY<=imageHeight&&Number.isFinite(desiredHorizon)){
    const aligned=desiredHorizon-(fieldLineY/imageHeight)*drawHeight;
    y=Math.round(Math.max(height-drawHeight,Math.min(0,aligned)));
  }
  return {x,y,width:drawWidth,height:drawHeight};
}

export function contactShadowRects(frontFoot,scale){
  if(!frontFoot||!Number.isFinite(frontFoot.x)||!Number.isFinite(frontFoot.y)||!Number.isFinite(scale)||scale<=0)return null;
  const width=Math.max(2,Math.round(14*scale)),height=Math.max(1,Math.round(3*scale));
  const innerWidth=Math.max(1,Math.round(width*.56)),innerHeight=Math.max(1,Math.round(height*.5));
  const centerY=Math.round(frontFoot.y+2*scale);
  return {
    outer:{x:Math.round(frontFoot.x-width/2),y:Math.round(centerY-height/2),width,height},
    inner:{x:Math.round(frontFoot.x-innerWidth/2),y:Math.round(centerY-innerHeight/2),width:innerWidth,height:innerHeight},
  };
}

export function orientedBatterBox(rearFoot,frontFoot,u,{nearU=6,farU=8,sideHalfU=3,rightLimit=Infinity,bottomLimit=Infinity}={}){
  if(!rearFoot||!frontFoot||![rearFoot.x,rearFoot.y,frontFoot.x,frontFoot.y,u].every(Number.isFinite)||u<=0)return null;
  const dx=frontFoot.x-rearFoot.x,dy=frontFoot.y-rearFoot.y,length=Math.hypot(dx,dy)||1,ax=dx/length,ay=dy/length,nx=-ay,ny=ax;
  const near={x:rearFoot.x-ax*nearU*u,y:rearFoot.y-ay*nearU*u};
  const far={x:frontFoot.x+ax*farU*u,y:frontFoot.y+ay*farU*u};
  const half=sideHalfU*u;
  const corners=[
    {x:near.x+nx*half,y:near.y+ny*half},
    {x:far.x+nx*half,y:far.y+ny*half},
    {x:far.x-nx*half,y:far.y-ny*half},
    {x:near.x-nx*half,y:near.y-ny*half},
  ];
  const xs=corners.map(p=>p.x),ys=corners.map(p=>p.y);
  let shiftX=Math.max(0,-Math.min(...xs));
  if(Math.max(...xs)+shiftX>rightLimit)shiftX+=rightLimit-(Math.max(...xs)+shiftX);
  let shiftY=Math.max(0,-Math.min(...ys));
  if(Math.max(...ys)+shiftY>bottomLimit)shiftY+=bottomLimit-(Math.max(...ys)+shiftY);
  const moved=corners.map(p=>({x:Math.round(p.x+shiftX),y:Math.round(p.y+shiftY)}));
  return {
    shift:{x:Math.round(shiftX),y:Math.round(shiftY)},
    rearFoot:{x:Math.round(rearFoot.x+shiftX),y:Math.round(rearFoot.y+shiftY)},
    frontFoot:{x:Math.round(frontFoot.x+shiftX),y:Math.round(frontFoot.y+shiftY)},
    box:{leftTop:moved[0],rightTop:moved[1],rightBottom:moved[2],leftBottom:moved[3]},
  };
}

export function safe2dContext(canvas,options={alpha:true,desynchronized:true}){
  try{return canvas?.getContext?.('2d',options)||null;}catch{return null;}
}

export function cancelAnimationFrameId(id,cancel=globalThis.cancelAnimationFrame){
  if(id&&typeof cancel==='function')cancel(id);
  return 0;
}

export function shouldAnimatePixelScene({active,contextLost=false,hidden=false,inspected=false,reducedMotion=false}={}){
  return !!active&&!contextLost&&!hidden&&!inspected&&!reducedMotion;
}

export function stageMotionElapsed(elapsed,impactAt,stage,{reducedMotion=false,duration=0}={}){
  const t=Math.max(0,Number(elapsed)||0),impact=Math.max(0,Number(impactAt)||0);
  if(reducedMotion){
    if(stage==='windup')return Math.max(0,impact-1);
    if(stage==='impact'||stage==='slowmo')return impact;
    return Math.max(impact,Number(duration)||0);
  }
  if(stage==='windup')return Math.min(t,Math.max(0,impact-1));
  if(stage==='impact'||stage==='slowmo')return impact;
  if(stage==='release'||stage==='settle')return Math.max(t,impact);
  return t;
}

const clamp01=n=>Math.min(1,Math.max(0,Number.isFinite(n)?n:0));

export function sequenceFrame(frames,progress){
  if(!Array.isArray(frames)||!frames.length)return 0;
  return frames[Math.min(frames.length-1,Math.floor(clamp01(progress)*frames.length))];
}

/** Sample authored pose keyframes whose atMs values are relative to impact. */
export function sampleMotionTrack(track,elapsedMs,{contact=false,readyFrame=0}={}){
  if(!Array.isArray(track)||!track.length)return {frame:readyFrame,phase:'ready'};
  const entries=track.filter(entry=>entry&&Number.isFinite(entry.atMs)&&Number.isInteger(entry.frame)).sort((a,b)=>a.atMs-b.atMs);
  if(!entries.length)return {frame:readyFrame,phase:'ready'};
  const usable=entries.filter(entry=>!(entry.contactOnly&&!contact));
  if(!usable.length)return {frame:readyFrame,phase:'ready'};
  const t=Number.isFinite(elapsedMs)?elapsedMs:0;
  const last=usable.at(-1),lastEndsAt=Number.isFinite(last.untilMs)?last.untilMs:Number.isFinite(last.durationMs)?last.atMs+Math.max(0,last.durationMs):Infinity;
  if(t>=lastEndsAt)return {frame:readyFrame,phase:'ready'};
  let selected=usable[0];
  for(const entry of usable){if(entry.atMs>t)break;selected=entry;}
  return {frame:selected.frame,phase:selected.phase||phaseAtOffset(selected.atMs)};
}

const phaseAtOffset=atMs=>atMs< -150?'windup':atMs<=0?'swing':atMs<320?'follow':'reset';

export function atlasMotion({stage,elapsed=0,actorElapsed,impactAt=0,action='swing',kind='whiff',bunt=false,states={},poseOrder='v1',timelines=null}={}){
  const windup=states.windup||[0],swing=states.swing||[0],follow=states.follow||swing,reset=states.reset||[0],buntFrames=states.bunt||swing;
  const impact=Math.max(0,Number(impactAt)||0),t=Math.max(0,Number(elapsed)||0),d=t-impact;
  const attacking=action!=='take',contact=kind==='hit'||kind==='foul'||kind==='sacrifice'||kind==='out';
  const readyBatter=Number.isInteger(timelines?.readyFrame)?timelines.readyFrame:reset[reset.length-1];
  if(!stage)return {phase:'idle',batter:readyBatter,pitcher:'idle',attacking:false,contact:false};
  const authoredTrack=timelines?.[bunt?'bunt':action==='take'?'take':'swing'];
  if(authoredTrack){
    const motionTime=d<0?d:Math.max(d,Number.isFinite(actorElapsed)?actorElapsed:d);
    const sampled=sampleMotionTrack(authoredTrack,motionTime,{contact,readyFrame:readyBatter});
    if(stage==='windup'&&d>=0)return {phase:'windup',batter:sampleMotionTrack(authoredTrack,-1,{contact,readyFrame:readyBatter}).frame,pitcher:'idle',attacking,contact:false};
    return {phase:sampled.phase,batter:sampled.frame,pitcher:'idle',attacking,contact:d>=0&&contact};
  }
  if(!attacking)return {phase:'pitch',batter:readyBatter,pitcher:sequenceFrame(states.windup||[0],impact?t/impact:0),attacking:false,contact:false};

  // Contact is authored at swing index 2. Identical timing and poses apply to hits and misses;
  // only the engine's revealed contact flag can add the post-impact result cue.
  const swingFrames=bunt?buntFrames:swing,preSwing=Math.max(0,impact-150);
  if(d < -150){
    const progress=preSwing?Math.min(1,t/preSwing):1;
    return {phase:'windup',batter:sequenceFrame(windup,progress),pitcher:sequenceFrame(states.windup||[0],impact?t/impact:0),attacking,contact:false};
  }
  if(d < -75)return {phase:bunt?'bunt':'swing',batter:swingFrames[0],pitcher:sequenceFrame(states.windup||[0],1),attacking,contact:false};
  if(d<0)return {phase:bunt?'bunt':'swing',batter:swingFrames[Math.min(1,swingFrames.length-1)],pitcher:sequenceFrame(states.windup||[0],1),attacking,contact:false};
  if(bunt){
    const ix=d<70?(contact?2:3):3;
    return {phase:d<300?'bunt':'ready',batter:d<300?swingFrames[Math.min(ix,swingFrames.length-1)]:readyBatter,pitcher:sequenceFrame(states.reset||[0],d/520),attacking,contact};
  }
  // follow/0 is the rising barrel between contact and swing/3. follow/3 is a
  // ready candidate, not a follow-through: do not play it before lowering the bat.
  if(d<50)return {phase:'swing',batter:swingFrames[Math.min(contact?2:3,swingFrames.length-1)],attacking,contact};
  if(d<110)return {phase:poseOrder==='v2'?'swing':'follow',batter:poseOrder==='v2'?swingFrames.at(-1):contact?follow[0]:swingFrames.at(-1),attacking,contact};
  if(d<170)return {phase:'follow',batter:poseOrder==='v2'?follow[0]:swingFrames.at(-1),attacking,contact};
  if(d<240)return {phase:'follow',batter:follow[Math.min(1,follow.length-1)],attacking,contact};
  if(d<320)return {phase:'follow',batter:follow[Math.min(2,follow.length-1)],attacking,contact};
  if(d<520)return {phase:'reset',batter:sequenceFrame(reset,(d-320)/200),attacking,contact};
  return {phase:'ready',batter:reset[reset.length-1],pitcher:sequenceFrame(states.reset||[0],1),attacking,contact};
}

export function pixelPitcherFrame(elapsed,releaseAt,impactAt,states,active=true){
  const ready=states.reset.at(-1);
  if(!active)return ready;
  const stride=Math.max(0,releaseAt-240),cock=Math.max(stride,releaseAt-110);
  if(elapsed<stride)return sequenceFrame(states.windup,elapsed/Math.max(1,stride));
  if(elapsed<cock)return states.drive[0];
  if(elapsed<releaseAt)return states.drive[1];
  if(elapsed<releaseAt+70)return states.drive[2];
  if(elapsed<impactAt+45)return states.drive[3];
  return sequenceFrame(states.reset,(elapsed-impactAt-45)/475);
}

export function outgoingPitchPoint(progress,target,{width,height,kind,grade='',sceneScale=1}={}){
  const p=clamp01(progress),e=1-Math.pow(1-p,1.35);
  const zoom=Math.max(.1,Number.isFinite(sceneScale)?sceneScale:1),w=width*zoom,h=height*zoom;
  if(kind==='foul')return {x:Math.round(target.x-e*w*.65),y:Math.round(target.y+e*h*.2)};
  if(kind==='out'||kind==='sacrifice')return {x:Math.round(target.x+e*w*.36),y:Math.round(target.y-e*h*.1-Math.sin(e*Math.PI)*h*.025)};
  return {x:Math.round(target.x+e*w*.82),y:Math.round(target.y-e*h*(/homer|grand/.test(grade)?.72:.35)-Math.sin(e*Math.PI)*h*.1)};
}

export function transformedPoint(framePoint,transform){
  if(!framePoint||!transform)return null;
  const dx=(framePoint.x-transform.anchor.x)*transform.scale,dy=(framePoint.y-transform.anchor.y)*transform.scale;
  const c=Math.cos(transform.rotation||0),s=Math.sin(transform.rotation||0);
  return {x:Math.round(transform.x+dx*c-dy*s),y:Math.round(transform.y+dx*s+dy*c)};
}

export function sourceFeetForFrame(frame,cell){
  const feet=point(frame?.anchors?.feet);
  if(!feet||!cell?.width||!cell?.height)return null;
  const source=pointInCell(feet,cell);
  return {rear:source,lead:null};
}

export function sourcePointForFrame(frame,anchor,cell){
  const normalized=point(frame?.anchors?.[anchor]);
  return normalized&&cell?.width&&cell?.height?pointInCell(normalized,cell):null;
}

/** Authored opaque sole endpoints, separated from the elevated foot/ankle anchors. */
export function sourceSoleGroundline(frame,side,cell){
  const endpoints=frame?.soleGroundline?.[side]?.endpoints;
  if(!Array.isArray(endpoints)||endpoints.length<2||!cell?.width||!cell?.height)return null;
  const points=endpoints.slice(0,2).map(point).filter(Boolean);
  return points.length===2?points.map(value=>pointInCell(value,cell)):null;
}

export function sourceSoleCenter(frame,side,cell){
  const line=sourceSoleGroundline(frame,side,cell);
  return line?{x:(line[0].x+line[1].x)/2,y:(line[0].y+line[1].y)/2}:null;
}

/** Small LRU for per-frame derived canvas assets such as actor shadow masks. */
export function createFrameMaskCache(limit=16){
  const capacity=Math.max(1,Number.isInteger(limit)?limit:16),entries=new Map();
  return {
    get(key,create){
      if(entries.has(key)){const value=entries.get(key);entries.delete(key);entries.set(key,value);return value;}
      const value=create?.();if(value==null)return null;
      entries.set(key,value);
      while(entries.size>capacity)entries.delete(entries.keys().next().value);
      return value;
    },
    clear(){entries.clear();},
    get size(){return entries.size;},
  };
}

export function actorShadowProjection({target,scale,anchor}={}){
  if(!target||!anchor||![target.x,target.y,anchor.x,anchor.y,scale].every(Number.isFinite)||scale<=0)return null;
  return {
    target:{x:target.x,y:target.y},
    matrix:{a:scale,b:0,c:.3*scale,d:-.1*scale,e:0,f:0},
    anchor:{x:anchor.x,y:anchor.y},
  };
}

export function stadiumLitPixel(r,g,b,a){
  const luma=(.2126*r+.7152*g+.0722*b)/255;
  const ramp=Math.max(-1,Math.min(1,(luma-.48)/.52));
  let amount=Math.abs(ramp)*.12;
  const redDominant=r>g*1.28&&r>b*1.28&&r>96;
  if(redDominant)amount*=.2;
  const light=ramp>=0?[248,222,182]:[20,37,56];
  return [Math.round(r+(light[0]-r)*amount),Math.round(g+(light[1]-g)*amount),Math.round(b+(light[2]-b)*amount),a];
}

/** Fit the body to its ready-pose height, pinning the authored front sole while planted. */
export function batterPlantTransform({frame,frameIndex,readyFrame,plantFrame,plantFrames,frames,cell,targetRear,targetHeight,referenceBodyHeight}){
  if(!frame||!cell?.width||!cell?.height||!targetRear)return null;
  const rear=sourcePointForFrame(frame,'feet',cell)||{x:Math.round(cell.width*.5),y:Math.round(cell.height*.94)};
  const bodyHeight=Number(referenceBodyHeight)>0?Number(referenceBodyHeight):cell.height*.78;
  const anatomyScale=Number.isFinite(frame.anatomyScale)&&frame.anatomyScale>0?frame.anatomyScale:1;
  const scale=(Number(targetHeight)>0?Number(targetHeight):cell.height*.7)/bodyHeight*anatomyScale;
  const plantRear=sourcePointForFrame(plantFrame,'feet',cell)||sourcePointForFrame(readyFrame,'feet',cell)||rear;
  const legacyPlantFront=sourceSoleCenter(plantFrame,'front',cell)||sourcePointForFrame(plantFrame,'frontFoot',cell);
  const legacyFrontTarget=legacyPlantFront?transformedPoint(legacyPlantFront,{x:targetRear.x,y:targetRear.y,scale,rotation:0,anchor:plantRear}):null;
  const index=Number.isInteger(frameIndex)?frameIndex:-1;
  const inPlantWindow=Array.isArray(plantFrames)?plantFrames.includes(index):false;
  const authored=frame.grounding;
  const support=['front','rear'].includes(authored?.support)&&['front','rear'].includes(authored?.targetSupport)&&Number.isInteger(authored?.targetFrame)?authored.support:null;
  const targetSide=support?authored.targetSupport:'front';
  const targetFrame=Number.isInteger(authored?.targetFrame)?authored.targetFrame:null;
  const resolvedReference=targetFrame!=null?(Array.isArray(frames)?frames[targetFrame]:null)||(targetFrame===0?readyFrame:null):null;
  const customTarget= support&&resolvedReference
    ?sourceSoleCenter(resolvedReference,targetSide,cell)
    :null;
  const customTargetWorld=customTarget?transformedPoint(customTarget,{x:targetRear.x,y:targetRear.y,scale,rotation:0,anchor:sourcePointForFrame(resolvedReference,'feet',cell)||plantRear}):null;
  const supportCenter=support?sourceSoleCenter(frame,support,cell):null;
  const authoredPlanted=!!(support&&customTargetWorld&&supportCenter&&frame.footContact?.[support]!==false);
  const legacyCenter=sourceSoleCenter(frame,'front',cell)||sourcePointForFrame(frame,'frontFoot',cell);
  const legacyPlanted=!support&&inPlantWindow&&frame.footContact?.front===true&&legacyCenter&&legacyFrontTarget;
  const planted=authoredPlanted||legacyPlanted;
  const activeCenter=authoredPlanted?supportCenter:legacyCenter;
  const activeTarget=authoredPlanted?customTargetWorld:legacyFrontTarget;
  const grounding=planted?{support:authoredPlanted?support:'front',source:activeCenter,target:activeTarget}:null;
  return {
    x:planted?activeTarget.x:targetRear.x,
    y:planted?activeTarget.y:targetRear.y,
    scale,rotation:0,anchor:planted?activeCenter:rear,
    frontPlantTarget:legacyFrontTarget,frontPlanted:!!(legacyPlanted||authoredPlanted&&support==='front'),
    grounding,
  };
}

export function physicalPitchPoint(actualZone,barrelAnchor,batAxis={x:1,y:0}){
  if(!Number.isInteger(actualZone)||actualZone<0||actualZone>9||!barrelAnchor)return null;
  const axisValue=Array.isArray(batAxis)?{x:batAxis[0],y:batAxis[1]}:batAxis||{x:1,y:0};
  const vx=Number.isFinite(axisValue.x)?axisValue.x:1,vy=Number.isFinite(axisValue.y)?axisValue.y:0;
  const length=Math.hypot(vx,vy)||1,ax=(length===1&&vx===0&&vy===0?1:vx)/length,ay=(length===1&&vx===0&&vy===0?0:vy)/length;
  const native=Number.isFinite(axisValue.unitScale)&&axisValue.unitScale>0?axisValue.unitScale:1;
  const col=actualZone<9?actualZone%3:2,row=actualZone<9?Math.floor(actualZone/3):2;
  // The outside band remains a foul/contact possibility, so project it beyond the tight
  // strike box but along the authored barrel's long wood, never beyond the cap.
  const along=actualZone===9?5*native:(col-1)*3*native,across=actualZone===9?0:(1-row)*native;
  const nx=ay,ny=-ax;
  return {x:Math.round(barrelAnchor.x+ax*along+nx*across),y:Math.round(barrelAnchor.y+ay*along+ny*across)};
}

export function incomingPitchPoint(elapsed,flightStart,impactAt,releasePoint,target){
  if(!releasePoint||!target)return null;
  const span=Math.max(1,impactAt-flightStart),u=Math.min(1,Math.max(0,(elapsed-flightStart)/span));
  return {x:Math.round(releasePoint.x+(target.x-releasePoint.x)*u),y:Math.round(releasePoint.y+(target.y-releasePoint.y)*u)};
}

export function passedPitchPoint(elapsed,impactAt,releasePoint,target,sceneScale=1){
  if(!releasePoint||!target)return null;
  const length=Math.hypot(target.x-releasePoint.x,target.y-releasePoint.y)||1;
  const zoom=Math.max(.1,Number.isFinite(sceneScale)?sceneScale:1),distance=Math.min(18*zoom,Math.max(0,elapsed-impactAt)*.07*zoom);
  return {x:Math.round(target.x+(target.x-releasePoint.x)/length*distance),y:Math.round(target.y+(target.y-releasePoint.y)/length*distance)};
}

function point(value){
  return Array.isArray(value)&&value.length>=2&&Number.isFinite(value[0])&&Number.isFinite(value[1])
    ?{x:value[0],y:value[1]}:null;
}
function pointInCell(value,cell){return {x:Math.round(value.x*cell.width),y:Math.round(value.y*cell.height)}}

export function normalizedActorFrame({frameIndex=0,columns=1,cellWidth=1,cellHeight=1}={}){
  const i=Math.max(0,frameIndex|0),col=i%Math.max(1,columns|0),row=Math.floor(i/Math.max(1,columns|0));
  return {sx:col*cellWidth,sy:row*cellHeight,sw:cellWidth,sh:cellHeight};
}
