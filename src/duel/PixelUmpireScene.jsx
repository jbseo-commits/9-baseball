import React,{useEffect,useRef} from 'react';
import manifest from '../../assets/production-art/pixel-umpire-v3/runtime/manifest.json' with {type:'json'};
import stadiumUrl from '../../assets/production-art/pixel-umpire-v2/runtime/stadium.png';
import batterAtlasUrl from '../../assets/production-art/pixel-umpire-v3/runtime/batter-atlas.png';
import redRushAtlasUrl from '../../assets/production-art/pixel-umpire-v2/runtime/red-rush-atlas.png';
import moundUrl from '../../assets/production-art/pixel-umpire-v2/runtime/mound.png';
import {PITCH_FLIGHT_MS,RED_RUSH_ASSET_ID,hasPitchVisual,redRushFrameAt,redRushTimeline,withKnockoutHold} from './pitcher-sd.js';
import RELEASE from './pitcher-release.json';
import STANCE from './pitcher-stance.json';
import {atlasCell,atlasMotion,BATTER_BOX_CENTER_LATERAL_FT,BATTER_REAR_LATERAL_FT,batterPlantTransform,cancelAnimationFrameId,contactShadowRects,coverPlacement,createFieldCamera,impactPresentationElapsed,incomingPitchPoint,normalizedActorFrame,outgoingPitchPoint,passedPitchPoint,physicalPitchPoint,pixelBallRects,pixelPitcherFrame,projectBatterBox,projectFieldHeight,projectFieldPoint,projectHomePlate,PLATE_TO_RUBBER_FT,PIXEL_SCENE_WIDTH,responsiveFieldCameraFraming,safe2dContext,shouldAnimatePixelScene,sourceFeetForFrame,sourcePointForFrame,sourceSoleGroundline,stageMotionElapsed,trackRecoveryDuration,sampleMotionTrack,transformedPoint} from './pixel-umpire-motion.js';
import './pixel-umpire-scene.css';

const loadImage=src=>new Promise((resolve,reject)=>{
  const image=new Image();image.decoding='async';image.onload=()=>resolve(image);image.onerror=reject;image.src=src;
  if(image.complete&&image.naturalWidth)resolve(image);
});
const round=Math.round;
const authoredBodyHeight=(bounds,cellHeight)=>{
  const height=Array.isArray(bounds)?Number(bounds[3]):Number(bounds?.height??bounds?.h);
  if(!(height>0))return cellHeight*.78;
  return height<=1?height*cellHeight:height;
};
const drawSprite=(ctx,image,rect,w,h,transform)=>{
  ctx.save();ctx.translate(round(transform.x),round(transform.y));
  if(transform.rotation)ctx.rotate(transform.rotation);
  ctx.scale(transform.scale,transform.scale);
  ctx.drawImage(image,rect.sx,rect.sy,rect.sw,rect.sh,-round(transform.anchor.x),-round(transform.anchor.y),rect.sw,rect.sh);
  ctx.restore();
};
const cover=(ctx,image,w,h,fieldLineY,desiredHorizon)=>{
  const placement=coverPlacement(image.naturalWidth,image.naturalHeight,w,h,{fieldLineY,desiredHorizon});
  ctx.drawImage(image,placement.x,placement.y,placement.width,placement.height);
};
const drawContactShadow=(ctx,frontFoot,scale)=>{
  const shadow=contactShadowRects(frontFoot,scale);if(!shadow)return;
  ctx.save();ctx.fillStyle='#352d28';ctx.fillRect(shadow.outer.x,shadow.outer.y,shadow.outer.width,shadow.outer.height);
  ctx.fillStyle='#6b513d';ctx.fillRect(shadow.inner.x,shadow.inner.y,shadow.inner.width,shadow.inner.height);ctx.restore();
};
const soleCenter=(frame,side,cell)=>{
  const line=sourceSoleGroundline(frame,side,cell);
  return line?{x:(line[0].x+line[1].x)/2,y:(line[0].y+line[1].y)/2}:null;
};
const atlasFrame=(image,columns,rows,index)=>normalizedActorFrame({frameIndex:index,columns,cellWidth:image.naturalWidth/columns,cellHeight:image.naturalHeight/rows});
const cellPoint=(el,scene,canvas)=>{
  if(!el)return null;const r=el.getBoundingClientRect(),s=scene.getBoundingClientRect();
  return {x:round(((r.left+r.width/2)-s.left)*canvas.width/s.width),y:round(((r.top+r.height/2)-s.top)*canvas.height/s.height)};
};
const localPoint=(x,y,scene,canvas)=>{
  const sr=scene.getBoundingClientRect();
  return {x:round((x-sr.left)*canvas.width/sr.width),y:round((y-sr.top)*canvas.height/sr.height)};
};
const groundGeometry=(scene,canvas)=>{
  const zone=scene.querySelector('.bp-zone'),pitcher=scene.querySelector('.bp-pitcher');
  if(!zone||!pitcher)return null;
  const zr=zone.getBoundingClientRect();
  const center=localPoint(zr.left+zr.width/2,zr.top+zr.height/2,scene,canvas);
  const field=manifest.field||{},cameraDepthFt=field.cameraDepthFt||PLATE_TO_RUBBER_FT,rubberDepthFt=field.rubberDepthFt||PLATE_TO_RUBBER_FT;
  const framing=responsiveFieldCameraFraming({width:canvas.width,height:canvas.height,zoneCenterX:center.x,centerRatio:field.cameraCenterRatio??.5,zoneInsetRatio:field.cameraZoneInsetRatio??.07,referenceHeight:field.cameraReferenceHeight||477,viewWidthFt:field.cameraViewWidthFt||15.5});
  if(!framing)return null;
  const camera=createFieldCamera({
    width:canvas.width,height:canvas.height,centerX:framing.centerX,
    plateY:round(canvas.height-.055*canvas.width),cameraDepthFt,cameraHeightFt:field.cameraHeightFt||12,
    viewWidthFt:framing.viewWidthFt,pitcherDepthFt:rubberDepthFt,pitcherTargetY:canvas.height*.44,
  });
  if(!camera)return null;
  const platePoint=projectFieldPoint(camera,{lateralFt:0,depthFt:0});
  const pitcherDepthFt=field.rubberDepthFt||PLATE_TO_RUBBER_FT;
  const pitcherPoint=projectFieldPoint(camera,{lateralFt:0,depthFt:pitcherDepthFt});
  const batterDepthFt=Number.isFinite(field.batterRearDepthFt)?field.batterRearDepthFt:-1;
  const batterLateralFt=Number.isFinite(field.batterRearLateralFt)?field.batterRearLateralFt:BATTER_REAR_LATERAL_FT;
  const batterRear=projectFieldPoint(camera,{lateralFt:batterLateralFt,depthFt:batterDepthFt});
  const box=projectBatterBox(camera,{
    centerLateralFt:BATTER_BOX_CENTER_LATERAL_FT,
    nearDepthFt:Number.isFinite(field.batterBoxNearDepthFt)?field.batterBoxNearDepthFt:-2,
    farDepthFt:Number.isFinite(field.batterBoxFarDepthFt)?field.batterBoxFarDepthFt:4,
    widthFt:Number.isFinite(field.batterBoxWidthFt)?field.batterBoxWidthFt:4,
  });
  const fieldLine=projectFieldPoint(camera,{depthFt:Number.isFinite(manifest.stadium?.fieldLineDepthFt)?manifest.stadium.fieldLineDepthFt:196});
  return {
    camera,zoneCenter:center,plate:platePoint,platePolygon:projectHomePlate(camera),
    pitcher:{...pitcherPoint,height:projectFieldHeight(camera,pitcherDepthFt,field.pitcherHeightFt||6.2),depthFt:pitcherDepthFt},
    batterRear:{...batterRear,depthFt:batterDepthFt,lateralFt:batterLateralFt},
    batterHeight:projectFieldHeight(camera,batterDepthFt,field.batterHeightFt||6.1),
    batterBox:box,box:box?.points,
    fieldLineY:fieldLine?.y,sceneScale:framing.sceneScale,
    pixelsPerFoot:projectFieldPoint(camera,{depthFt:0})?.scale||0,
  };
};
const drawGround=(ctx,g,moundImage,moundInfo)=>{
  if(!g)return;
  const {plate,pitcher,box,pixelsPerFoot}=g;
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(moundImage&&moundInfo?.rubber?.length===2){
    const halfFt=(moundInfo.diameterFt||18)/2;
    const left=projectFieldPoint(g.camera,{lateralFt:-halfFt,depthFt:pitcher.depthFt});
    const right=projectFieldPoint(g.camera,{lateralFt:halfFt,depthFt:pitcher.depthFt});
    const dw=Math.max(1,round(right.x-left.x)),scale=dw/moundImage.naturalWidth,dh=round(moundImage.naturalHeight*scale);
    const x=round(pitcher.x-moundInfo.rubber[0]*dw),y=round(pitcher.y-moundInfo.rubber[1]*dh);
    ctx.drawImage(moundImage,x,y,dw,dh);
  }else{
    const rx=round(8*pixelsPerFoot*.5),ry=Math.max(4,round(rx/3));
    ctx.fillStyle='#70462f';ctx.beginPath();ctx.ellipse(pitcher.x,pitcher.y+2*ry,rx,ry,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#a36b43';ctx.beginPath();ctx.ellipse(pitcher.x,pitcher.y+ry,rx*.92,ry*.78,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#dfcda1';ctx.fillRect(pitcher.x-round(1*pixelsPerFoot),pitcher.y-round(.5*pixelsPerFoot),round(2*pixelsPerFoot),Math.max(1,round(.45*pixelsPerFoot)));
  }
  ctx.strokeStyle='#fff0c8';ctx.lineWidth=2*(g.sceneScale||1);ctx.beginPath();
  ctx.moveTo(box.leftNear.x,box.leftNear.y);ctx.lineTo(box.rightNear.x,box.rightNear.y);
  ctx.lineTo(box.rightFar.x,box.rightFar.y);ctx.lineTo(box.leftFar.x,box.leftFar.y);ctx.closePath();ctx.stroke();
  ctx.fillStyle='#ead9aa';ctx.beginPath();for(const [index,p] of g.platePolygon.entries())index?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);ctx.closePath();ctx.fill();ctx.restore();
};

/**
 * Pixel-only art layer. The engine, 9-zone input and result overlays remain owned by BallparkBattle.
 * All flight and pose changes are presentation-only and keyed by the parent's playToken/fxStage.
 */
export default function PixelUmpireScene({sceneRef,pitcherAtlas,artId,shot,fxStage,impactAt=0,playToken,pitchZone=null,revealed=null,knockedOut=false,contactPointRef,onReady}){
  const canvasRef=useRef(null),ballCanvasRef=useRef(null),live=useRef({}),wakeRef=useRef(null);
  live.current={sceneRef,pitcherAtlas,artId,shot,fxStage,impactAt,playToken,pitchZone,revealed,knockedOut,contactPointRef,onReady};

  useEffect(()=>{
    let alive=true,raf=0,ro=null,mo=null,ctx=null,ballCtx=null,scene=null,canvas=null,ballCanvas=null,startAt=0,lastToken=null,tailAt=null,images=null,lastReady=null,contextLost=false,lastActorPlay=null,recovery=null;
    const ready=value=>{if(lastReady!==value){lastReady=value;live.current.onReady?.(value);}};
    const recoveryAlive=(play,now)=>!!play&&now>=play.impactTime&&impactPresentationElapsed(now-play.impactTime,0,'release')<play.recoveryMs;
    const cleanup=()=>{alive=false;raf=cancelAnimationFrameId(raf);ro?.disconnect();mo?.disconnect();window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);canvas?.removeEventListener('contextlost',lost);canvas?.removeEventListener('contextrestored',restored);ballCanvas?.removeEventListener('contextlost',lost);ballCanvas?.removeEventListener('contextrestored',restored);scene?.removeAttribute('data-pixel-umpire-short-scene');ready(false);};
    const resize=()=>{if(!canvas||!scene||!ctx)return;const r=scene.getBoundingClientRect();if(!r.width||!r.height)return;
      const height=Math.max(1,round(PIXEL_SCENE_WIDTH*r.height/r.width));
      if(canvas.width!==PIXEL_SCENE_WIDTH||canvas.height!==height){canvas.width=PIXEL_SCENE_WIDTH;canvas.height=height;}
      if(ballCanvas&&(ballCanvas.width!==PIXEL_SCENE_WIDTH||ballCanvas.height!==height)){ballCanvas.width=PIXEL_SCENE_WIDTH;ballCanvas.height=height;}
      if(height<(manifest.field?.cameraReferenceHeight||477))scene.setAttribute('data-pixel-umpire-short-scene','true');
      else scene.removeAttribute('data-pixel-umpire-short-scene');
      draw(performance.now());
    };
    const lost=e=>{e.preventDefault?.();contextLost=true;raf=cancelAnimationFrameId(raf);ready(false);};
    const restored=()=>{if(!alive)return;contextLost=false;ready(true);resize();wakeRef.current?.();};
    const draw=now=>{
      if(!alive||contextLost||!ctx||!canvas||!scene||!images)return;
      const state=live.current,{width:w,height:h}=canvas;
      if(ballCtx)ballCtx.clearRect(0,0,w,h);
      let g=groundGeometry(scene,canvas);
      ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=false;
      cover(ctx,images.stadium,w,h,manifest.stadium?.fieldLineY,g?.fieldLineY);
      const active=!!state.fxStage&&!!state.shot&&hasPitchVisual(state.shot)&&!!state.revealed;
      if(!active&&!recovery&&recoveryAlive(lastActorPlay,now))recovery=lastActorPlay;
      if(active&&state.playToken!==lastToken){
        if(lastActorPlay&&lastActorPlay.playToken!==state.playToken&&recoveryAlive(lastActorPlay,now))recovery=lastActorPlay;
        lastToken=state.playToken;startAt=now;tailAt=null;
      }
      const reduceMotion=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const timeline=withKnockoutHold(redRushTimeline(state.shot?.motion,reduceMotion),state.knockedOut&&!reduceMotion);
      const duration=Math.max(Number(state.impactAt)||0,Number(timeline?.duration)||0);
      const clockElapsed=active?Math.max(0,now-startAt):0;
      if(active&&(state.fxStage==='release'||state.fxStage==='settle')&&tailAt===null)tailAt=now;
      const elapsed=active?(reduceMotion?stageMotionElapsed(duration,state.impactAt,state.fxStage,{reducedMotion:true,duration}):impactPresentationElapsed(clockElapsed,state.impactAt,state.fxStage)):0;
      const actorElapsed=active?Math.max(0,elapsed-(Number(state.impactAt)||0)):0;
      const sampledStage=active?(reduceMotion?state.fxStage==='windup'?'windup':state.fxStage==='impact'||state.fxStage==='slowmo'?'impact':'settle':state.fxStage):null;
      const batterInfo=manifest.atlases.batter,batStates=batterInfo.states,batterCell=atlasCell(manifest,batterInfo);
      const actorAction=state.revealed?.action||'swing',actorKind=state.revealed?.kind||'whiff',actorTimelines=batterInfo.timelines;
      const currentTrack=actorTimelines?.[actorAction==='bunt'?'bunt':actorAction==='take'?'take':'swing'];
      const readyIndex=batStates.reset[batStates.reset.length-1],readyFrame=Number.isInteger(actorTimelines?.readyFrame)?actorTimelines.readyFrame:readyIndex;
      const recoveryElapsed=recovery?impactPresentationElapsed(now-recovery.impactTime,0,'release'):null;
      const recoveryActive=!!recovery&&now>=recovery.impactTime&&recoveryElapsed<recovery.recoveryMs;
      const gatherAt=currentTrack?.find(entry=>entry?.phase==='gather'&&Number.isFinite(entry.atMs))?.atMs??-700;
      const newPlayStillOpening=active&&!reduceMotion&&state.fxStage==='windup'&&!!currentTrack&&clockElapsed-(Number(state.impactAt)||0)<gatherAt;
      const recoveryPhase=recoveryActive&&(!active||newPlayStillOpening)?sampleMotionTrack(recovery.track,recoveryElapsed,{contact:recovery.contact,readyFrame:recovery.readyFrame}):null;
      const phase=recoveryPhase?{phase:recoveryPhase.phase,batter:recoveryPhase.frame,pitcher:'idle',attacking:true,contact:recovery.contact}:
        atlasMotion({stage:sampledStage,elapsed,actorElapsed,impactAt:state.impactAt,action:actorAction,kind:actorKind,bunt:actorAction==='bunt',states:batStates,poseOrder:batterInfo.poseOrder||'v1',timelines:actorTimelines});
      if(active&&currentTrack){
        lastActorPlay={playToken:state.playToken,track:currentTrack,contact:['hit','foul','sacrifice','out'].includes(actorKind),readyFrame,impactTime:startAt+Math.max(0,Number(state.impactAt)||0),recoveryMs:trackRecoveryDuration(currentTrack,readyFrame)};
      }
      if(!recoveryActive)recovery=null;
      const batterAtlas=images.batter,batInfo=batterInfo,batRect=atlasFrame(batterAtlas,batInfo.columns,batInfo.rows,phase.batter);
      const batterFrames=batInfo.frames||manifest.frames?.batter||[],frame=batterFrames[phase.batter],feet=sourceFeetForFrame(frame,batterCell);
      const referenceBatterFrame=batterFrames[readyIndex];
      const batterBounds=referenceBatterFrame?.bounds||referenceBatterFrame?.contentBounds;
      const batterHeight=g?.batterHeight||Math.min(w/100,h/118)*6.1;
      drawGround(ctx,g,images.mound,manifest.mound);
      if(g){
        const sr=scene.getBoundingClientRect();
        const props={'--pixel-pitcher-x':g.pitcher.x*sr.width/w+'px','--pixel-pitcher-y':g.pitcher.y*sr.height/h+'px','--pixel-pitcher-height':round(g.pitcher.height)*sr.height/h+'px'};
        for(const [key,value] of Object.entries(props))if(scene.style.getPropertyValue(key)!==value)scene.style.setProperty(key,value);
      }
      const batterTarget=g?.batterRear||{x:round(w*.25),y:round(h-w*.025)};
      const batterRearFoot=sourcePointForFrame(frame,'feet',batterCell)||feet?.rear,batterFrontFoot=sourcePointForFrame(frame,'frontFoot',batterCell);
      const rearGroundline=soleCenter(frame,'rear',batterCell),frontGroundline=soleCenter(frame,'front',batterCell);
      const plantStart=actorAction==='bunt'?25:3,plantEnd=actorAction==='bunt'?31:23;
      const plantFrames=actorAction==='take'?[]:actorAction==='bunt'?[25,26,27,28,29,30,31]:[3,4,5,6,7,8,9,10,11,12,13,14,16,17,18,19,20,21,22,23,32,33,34,35];
      const batFit=batterPlantTransform({frame,frameIndex:phase.batter,readyFrame:referenceBatterFrame,plantFrame:batterFrames[plantStart],plantFrames,cell:batterCell,targetRear:batterTarget,targetHeight:batterHeight,referenceBodyHeight:authoredBodyHeight(batterBounds,batRect.sh)});
      if(frame?.footContact?.rear!==false){
        const rearShadowSource=rearGroundline||batterRearFoot;
        if(rearShadowSource)drawContactShadow(ctx,transformedPoint(rearShadowSource,batFit),batFit.scale);
      }
      if(frame?.footContact?.front!==false){
        const frontShadowSource=frontGroundline||batterFrontFoot;
        if(frontShadowSource)drawContactShadow(ctx,transformedPoint(frontShadowSource,batFit),batFit.scale);
      }
      drawSprite(ctx,batterAtlas,batRect,w,h,batFit);
      const contactStates=state.revealed?.action==='bunt'?batStates.bunt||batStates.swing:batStates.swing;
      const contactIndex=contactStates[Math.min(2,contactStates.length-1)],contactFrame=batterFrames[contactIndex],contactRect=atlasFrame(batterAtlas,batInfo.columns,batInfo.rows,contactIndex);
      const contactPlantStart=state.revealed?.action==='bunt'?25:3;
      const contactPlantFrames=state.revealed?.action==='bunt'?[25,26,27,28,29,30,31]:[3,4,5,6,7,8,9,10,11,12,13,14,16,17,18,19,20,21,22,23,32,33,34,35];
      const contactFit=batterPlantTransform({frame:contactFrame,frameIndex:contactIndex,readyFrame:referenceBatterFrame,plantFrame:batterFrames[contactPlantStart],plantFrames:contactPlantFrames,cell:batterCell,targetRear:batterTarget,targetHeight:batterHeight,referenceBodyHeight:authoredBodyHeight(batterBounds,contactRect.sh)});
      const barrelSource=sourcePointForFrame(contactFrame,'barrel',batterCell),barrelScene=barrelSource&&transformedPoint(barrelSource,contactFit);
      const grip=sourcePointForFrame(contactFrame,'grip',batterCell),axisAnchor=contactFrame?.anchors?.batAxis;
      const unitScale=contactFit.scale*(batterCell.scale||1);
      const batAxis=Array.isArray(axisAnchor)?{x:axisAnchor[0],y:axisAnchor[1],unitScale}:grip&&barrelSource?{x:barrelSource.x-grip.x,y:barrelSource.y-grip.y,unitScale}:{x:1,y:-.12,unitScale};
      const contactPoint=Number.isInteger(state.pitchZone)&&barrelScene?physicalPitchPoint(state.pitchZone,barrelScene,batAxis):null;
      if(state.contactPointRef){const sr=scene.getBoundingClientRect();state.contactPointRef.current=contactPoint?{x:contactPoint.x*sr.width/w,y:contactPoint.y*sr.height/h,sw:sr.width,sh:sr.height}:null;}
      const isRedRush=state.artId===RED_RUSH_ASSET_ID,atlas=isRedRush?images.redRush:images.roster,atlasInfo=isRedRush?manifest.atlases.redRush:null,redRushCell=atlasInfo?atlasCell(manifest,atlasInfo):null;
      let pitcherRect,stance=STANCE[state.artId]||[.5,1],release=RELEASE[state.artId]||[.05,.35],pitcherBodyHeight=0,pitcherAnatomyScale=1,pitcherGroundFoot=null;
      const flightStart=Math.max(0,(Number(state.impactAt)||0)-Math.min(PITCH_FLIGHT_MS,(Number(state.impactAt)||0)*.3));
      if(isRedRush){
        const redStates=atlasInfo.states,windup=redStates.windup||[0],drive=redStates.drive||[0],reset=redStates.reset||[0];
        const pitcherFrames=atlasInfo.frames||manifest.frames?.redRush||[],referencePitcherFrame=pitcherFrames[reset[reset.length-1]];
        pitcherBodyHeight=authoredBodyHeight(referencePitcherFrame?.bounds,atlas.naturalHeight/atlasInfo.rows);
        const ix=state.knockedOut&&active&&elapsed>=state.impactAt?drive[3]:pixelPitcherFrame(elapsed,flightStart,Number(state.impactAt)||0,redStates,active);
        pitcherRect=atlasFrame(atlas,atlasInfo.columns,atlasInfo.rows,ix);
        const releaseIndex=drive[2],poseIndex=ix;
        const releaseMeta=pitcherFrames[releaseIndex];
        stance=sourcePointForFrame(pitcherFrames[poseIndex],'feet',redRushCell)||stance;
        release=sourcePointForFrame(releaseMeta,'release',redRushCell)||release;
        // The v2 pitcher packet authors the active support sole (not a second foot).
        pitcherGroundFoot=sourcePointForFrame(pitcherFrames[poseIndex],'frontFoot',redRushCell)||sourcePointForFrame(pitcherFrames[poseIndex],'feet',redRushCell);
        pitcherAnatomyScale=pitcherFrames[poseIndex]?.anatomyScale||1;
      }else if(atlas?.naturalWidth){
        const cols=10,rows=12,ix=active?redRushFrameAt(state.knockedOut?Math.min(elapsed,state.impactAt):elapsed):0;
        pitcherRect=atlasFrame(atlas,cols,rows,ix);
      }
      let releasePoint=null;
      if(pitcherRect){
        const fw=pitcherRect.sw,fh=pitcherRect.sh,target=g?.pitcher||{x:round(w*.834),y:round(h*.337)};
        const anchor= isRedRush?(stance?.x!=null?stance:{x:stance[0]*fw,y:stance[1]*fh}):{x:stance[0]*fw,y:stance[1]*fh};
        const displayH=round(g?.pitcher.height||Math.min(w/100,h/118)*6.2),scale=displayH/(isRedRush?pitcherBodyHeight:fh)*pitcherAnatomyScale,displayW=round(fw*scale);
        const actorLeft=round(target.x-anchor.x*scale),actorTop=round(target.y-anchor.y*scale);
        // Pin the supporting foot while keeping the complete atlas cell aspect.
        // A defeated pitcher stays lowered through the parent's existing KO tail.
        const koSince=state.knockedOut&&active&&tailAt!==null&&!reduceMotion?Math.max(0,now-tailAt-120):0;
        const koEase=1-Math.pow(1-Math.min(1,koSince/380),3);
        if(pitcherGroundFoot&&!koEase)drawContactShadow(ctx,transformedPoint(pitcherGroundFoot,{x:target.x,y:target.y,scale,rotation:0,anchor}),scale);
        ctx.save();
        if(koEase){ctx.translate(target.x+koEase*3,target.y);ctx.rotate(koEase*.26);ctx.scale(1,1-koEase*.14);ctx.translate(-target.x,-target.y);}
        ctx.drawImage(atlas,pitcherRect.sx,pitcherRect.sy,pitcherRect.sw,pitcherRect.sh,actorLeft,actorTop,displayW,round(fh*scale));
        ctx.restore();
        // Compute the ball origin from the held release pose even while a windup pose is displayed.
        if(isRedRush&&release?.x!=null){
          const releaseFeet=sourcePointForFrame((atlasInfo.frames||manifest.frames?.redRush||[])[atlasInfo.states.drive[2]],'feet',redRushCell)||anchor;
          const releaseLeft=round(target.x-releaseFeet.x*scale),releaseTop=round(target.y-releaseFeet.y*scale);
          releasePoint={x:round(releaseLeft+release.x*scale),y:round(releaseTop+release.y*scale)};
        }else{
          const rp=Array.isArray(release)?release:[.05,.35];
          const releaseIx=redRushFrameAt(flightStart),releaseRect=isRedRush?pitcherRect:atlasFrame(atlas,10,12,releaseIx);
          const releaseWidth=round(releaseRect.sw*scale),releaseHeight=round(releaseRect.sh*scale);
          const releaseLeft=round(target.x-anchor.x*scale),releaseTop=round(target.y-anchor.y*scale);
          releasePoint={x:round(releaseLeft+rp[0]*releaseWidth),y:round(releaseTop+rp[1]*releaseHeight)};
        }
      }
      const impactConfirmed=['impact','slowmo','release','settle'].includes(state.fxStage);
      const outgoingProgress=Math.max(0,Math.min(1,(elapsed-(Number(state.impactAt)||0))/520));
      if(active&&releasePoint&&contactPoint&&elapsed>=flightStart){
        const target=contactPoint;
        {
          const impact=Math.max(flightStart+1,Number(state.impactAt)||1);
          const incoming=incomingPitchPoint(elapsed,flightStart,impact,releasePoint,target);
          let bx=incoming.x,by=incoming.y;
          const grade=state.shot?.grade||'',contact=['hit','foul','sacrifice','out'].includes(state.revealed?.kind);
          if(impactConfirmed&&elapsed>=impact&&contact){
            const outgoing=outgoingPitchPoint(outgoingProgress,target,{width:w,height:h,kind:state.revealed.kind,grade,sceneScale:g?.sceneScale||1});
            bx=outgoing.x;by=outgoing.y;
          }else if(impactConfirmed&&elapsed>=impact&&!contact){
            const passed=passedPitchPoint(elapsed,impact,releasePoint,target,g?.sceneScale||1);bx=passed.x;by=passed.y;
          }
          const out=ballCtx||ctx,ball=pixelBallRects(bx,by,g?.sceneScale||1);out.fillStyle='#10111b';out.fillRect(ball.outer.x,ball.outer.y,ball.outer.width,ball.outer.height);out.fillStyle='#fff6dc';out.fillRect(ball.inner.x,ball.inner.y,ball.inner.width,ball.inner.height);
        }
      }
    };
    const activeNow=()=>{const s=live.current,active=!!s.fxStage&&!!s.shot&&hasPitchVisual(s.shot)&&!!s.revealed;
      const recoveryActive=recoveryAlive(recovery,performance.now());
      return alive&&shouldAnimatePixelScene({active:active||recoveryActive,contextLost,hidden:document.hidden,inspected:scene?.getAttribute('aria-hidden')==='true'||scene?.hasAttribute('inert'),reducedMotion:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches});};
    const tick=now=>{raf=0;if(!alive)return;draw(now);if(activeNow())raf=requestAnimationFrame(tick);};
    const wake=()=>{
      if(contextLost)return;
      if(activeNow()){if(!raf)raf=requestAnimationFrame(tick);}
      else {draw(performance.now());if(activeNow()&&!raf)raf=requestAnimationFrame(tick);}
    };
    const visibility=()=>wakeRef.current?.();
    const boot=async()=>{
      try{
        scene=live.current.sceneRef?.current;canvas=canvasRef.current;ballCanvas=ballCanvasRef.current;if(!scene||!canvas)return;
        ctx=safe2dContext(canvas);if(!ctx){ready(false);return;}
        ballCtx=safe2dContext(ballCanvas);
        const atlasSrc=live.current.pitcherAtlas;
        if(!atlasSrc)throw new Error('pitcher atlas unavailable');
        const [stadium,batter,redRush,roster,mound]=await Promise.all([loadImage(stadiumUrl),loadImage(batterAtlasUrl),loadImage(redRushAtlasUrl),loadImage(atlasSrc),loadImage(moundUrl)]);
        if(!alive)return;images={stadium,batter,redRush,roster,mound};
        resize();ready(true);
        ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;ro?.observe(scene);
        mo=typeof MutationObserver!=='undefined'?new MutationObserver(visibility):null;mo?.observe(scene,{attributes:true,attributeFilter:['aria-hidden','inert']});
        window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);canvas.addEventListener('contextlost',lost);canvas.addEventListener('contextrestored',restored);ballCanvas?.addEventListener('contextlost',lost);ballCanvas?.addEventListener('contextrestored',restored);
        wakeRef.current=wake;wake();
      }catch{if(alive)ready(false);}
    };
    boot();return ()=>{wakeRef.current=null;cleanup();};
  },[artId,pitcherAtlas]);

  useEffect(()=>{
    if(playToken!==undefined&&canvasRef.current)canvasRef.current.dataset.playToken=String(playToken);
    // One clock per pitch; changing fxStage only samples that clock at the parent-owned stage.
    wakeRef.current?.();
  },[fxStage,playToken,shot,revealed,impactAt]);

  return <><canvas ref={canvasRef} className="pixel-umpire-canvas" aria-hidden="true"/><canvas ref={ballCanvasRef} className="pixel-umpire-ball-layer" aria-hidden="true"/></>;
}
