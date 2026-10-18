import React,{useEffect,useRef} from 'react';
import manifest from '../../assets/production-art/pixel-umpire-v2/runtime/manifest.json' with {type:'json'};
import stadiumUrl from '../../assets/production-art/pixel-umpire-v2/runtime/stadium.png';
import batterAtlasUrl from '../../assets/production-art/pixel-umpire-v2/runtime/batter-atlas.png';
import redRushAtlasUrl from '../../assets/production-art/pixel-umpire-v2/runtime/red-rush-atlas.png';
import moundUrl from '../../assets/production-art/pixel-umpire-v2/runtime/mound.png';
import {PITCH_FLIGHT_MS,RED_RUSH_ASSET_ID,hasPitchVisual,redRushFrameAt,redRushTimeline,withKnockoutHold} from './pitcher-sd.js';
import RELEASE from './pitcher-release.json';
import STANCE from './pitcher-stance.json';
import {atlasCell,atlasMotion,cancelAnimationFrameId,contactShadowRects,coverPlacement,incomingPitchPoint,normalizedActorFrame,orientedBatterBox,outgoingPitchPoint,passedPitchPoint,physicalPitchPoint,pixelBallRects,pixelPitcherFrame,PIXEL_SCENE_WIDTH,safe2dContext,shouldAnimatePixelScene,sourceFeetForFrame,sourcePointForFrame,stageMotionElapsed,transformedPoint} from './pixel-umpire-motion.js';
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
const fit=(fw,fh,feet,referenceBounds,targetRear,targetHeight,anatomyScale=1)=>{
  const foot=feet?.rear||{x:round(fw*.5),y:round(fh*.94)};
  const boxHeight=authoredBodyHeight(referenceBounds,fh);
  const poseScale=Number.isFinite(anatomyScale)&&anatomyScale>0?anatomyScale:1;
  return {x:targetRear.x,y:targetRear.y,scale:targetHeight/boxHeight*poseScale,rotation:0,anchor:foot};
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
  const u=Math.min(canvas.width/100,canvas.height/118);
  const batterRear={x:round(.25*canvas.width),y:round(canvas.height-.025*canvas.width)};
  return {plate:{x:center.x,y:round(canvas.height-.055*canvas.width)},u,
    pitcher:{x:round(center.x+21.4*u),y:round(canvas.height-78.4*u)},zoneCenter:center,
    batterRear,batterLead:{x:round(batterRear.x+12*u),y:round(batterRear.y-19.5*u)},
    box:{leftTop:{x:round(batterRear.x-7*u),y:round(batterRear.y-21.5*u)},rightTop:{x:round(batterRear.x+17*u),y:round(batterRear.y-21.5*u)},rightBottom:{x:round(batterRear.x+10*u),y:round(batterRear.y+1.5*u)},leftBottom:{x:round(batterRear.x-23*u),y:round(batterRear.y+1.5*u)}}};
};
const drawGround=(ctx,g,moundImage,moundInfo)=>{
  if(!g)return;
  const {plate,u,pitcher,box}=g;
  ctx.save();ctx.imageSmoothingEnabled=false;
  // All field marks are hand-sized pixel primitives in the same camera as the 9-zone overlay.
  // Scanline clay keeps field props on the same hard pixel grid as the sprites.
  const oval=(cx,cy,rx,ry,color)=>{ctx.fillStyle=color;for(let y=-round(ry);y<=round(ry);y++){const x=round(rx*Math.sqrt(Math.max(0,1-y*y/(ry*ry))));ctx.fillRect(round(cx)-x,round(cy)+y,x*2+1,1);}};
  if(moundImage&&moundInfo?.rubber?.length===2){
    const dw=round((moundInfo.displayWidthU||48)*u),scale=dw/moundImage.naturalWidth,dh=round(moundImage.naturalHeight*scale);
    const x=round(pitcher.x-moundInfo.rubber[0]*dw),y=round(pitcher.y-moundInfo.rubber[1]*dh);
    ctx.drawImage(moundImage,x,y,dw,dh);
  }else{
    oval(pitcher.x,pitcher.y+u,24*u,5.5*u,'#70462f');
    oval(pitcher.x,pitcher.y,22*u,4.5*u,'#a36b43');
    oval(pitcher.x-2*u,pitcher.y-u,15*u,2.5*u,'#bc8957');
    ctx.fillStyle='#dfcda1';ctx.fillRect(pitcher.x-round(4*u),pitcher.y-round(u),round(8*u),Math.max(1,round(u)));
  }
  ctx.strokeStyle='#e4d8b5';ctx.lineWidth=1;ctx.beginPath();
  ctx.moveTo(box.leftTop.x,box.leftTop.y);ctx.lineTo(box.rightTop.x,box.rightTop.y);
  ctx.lineTo(box.rightBottom.x,box.rightBottom.y);ctx.lineTo(box.leftBottom.x,box.leftBottom.y);ctx.closePath();ctx.stroke();
  ctx.fillStyle='#ead9aa';ctx.beginPath();ctx.moveTo(plate.x-round(6*u),plate.y-round(3*u));ctx.lineTo(plate.x+round(6*u),plate.y-round(3*u));ctx.lineTo(plate.x+round(6*u),plate.y);ctx.lineTo(plate.x,plate.y+round(3*u));ctx.lineTo(plate.x-round(6*u),plate.y);ctx.closePath();ctx.fill();ctx.restore();
};

/**
 * Pixel-only art layer. The engine, 9-zone input and result overlays remain owned by BallparkBattle.
 * All flight and pose changes are presentation-only and keyed by the parent's playToken/fxStage.
 */
export default function PixelUmpireScene({sceneRef,pitcherAtlas,artId,shot,fxStage,impactAt=0,playToken,pitchZone=null,revealed=null,knockedOut=false,contactPointRef,onReady}){
  const canvasRef=useRef(null),ballCanvasRef=useRef(null),live=useRef({}),wakeRef=useRef(null);
  live.current={sceneRef,pitcherAtlas,artId,shot,fxStage,impactAt,playToken,pitchZone,revealed,knockedOut,contactPointRef,onReady};

  useEffect(()=>{
    let alive=true,raf=0,ro=null,mo=null,ctx=null,ballCtx=null,scene=null,canvas=null,ballCanvas=null,startAt=0,lastToken=null,tailAt=null,images=null,lastReady=null,contextLost=false;
    const ready=value=>{if(lastReady!==value){lastReady=value;live.current.onReady?.(value);}};
    const cleanup=()=>{alive=false;raf=cancelAnimationFrameId(raf);ro?.disconnect();mo?.disconnect();window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);canvas?.removeEventListener('contextlost',lost);canvas?.removeEventListener('contextrestored',restored);ballCanvas?.removeEventListener('contextlost',lost);ballCanvas?.removeEventListener('contextrestored',restored);ready(false);};
    const resize=()=>{if(!canvas||!scene||!ctx)return;const r=scene.getBoundingClientRect();if(!r.width||!r.height)return;
      const height=Math.max(1,round(PIXEL_SCENE_WIDTH*r.height/r.width));
      if(canvas.width!==PIXEL_SCENE_WIDTH||canvas.height!==height){canvas.width=PIXEL_SCENE_WIDTH;canvas.height=height;}
      if(ballCanvas&&(ballCanvas.width!==PIXEL_SCENE_WIDTH||ballCanvas.height!==height)){ballCanvas.width=PIXEL_SCENE_WIDTH;ballCanvas.height=height;}
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
      const desiredHorizon=g?g.pitcher.y-12*g.u:null;
      cover(ctx,images.stadium,w,h,manifest.stadium?.fieldLineY,desiredHorizon);
      const active=!!state.fxStage&&!!state.shot&&hasPitchVisual(state.shot)&&!!state.revealed;
      if(active&&state.playToken!==lastToken){lastToken=state.playToken;startAt=now;tailAt=null;}
      const reduceMotion=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const timeline=withKnockoutHold(redRushTimeline(state.shot?.motion,reduceMotion),state.knockedOut&&!reduceMotion);
      const duration=Math.max(Number(state.impactAt)||0,Number(timeline?.duration)||0);
      const clockElapsed=active?Math.max(0,now-startAt):0;
      const afterHold=state.fxStage==='release'||state.fxStage==='settle';
      if(active&&afterHold&&tailAt===null)tailAt=now;
      // The parent owns the hit-stop. Start at the contact pose on its release
      // event; fit follow-through + return inside that presentation's tail.
      const tailDuration=Math.max(160,Math.min(520,duration-(timeline?.releaseAt||state.impactAt)-32-(state.knockedOut&&!reduceMotion?700:0)));
      const tailProgress=tailAt===null?0:Math.min(1,Math.max(0,(now-tailAt)/tailDuration));
      const elapsed=active?(afterHold&&!reduceMotion?Number(state.impactAt)+tailProgress*520:stageMotionElapsed(reduceMotion?duration:clockElapsed,state.impactAt,state.fxStage,{reducedMotion:reduceMotion,duration})):0;
      const sampledStage=active?(reduceMotion?state.fxStage==='windup'?'windup':state.fxStage==='impact'||state.fxStage==='slowmo'?'impact':'settle':state.fxStage):null;
      const batterInfo=manifest.atlases.batter,batStates=batterInfo.states,batterCell=atlasCell(manifest,batterInfo);
      const phase=atlasMotion({stage:sampledStage,elapsed,impactAt:state.impactAt,action:state.revealed?.action||'swing',kind:state.revealed?.kind||'whiff',bunt:state.revealed?.action==='bunt',states:batStates,poseOrder:batterInfo.poseOrder||'v1'});
      const batterAtlas=images.batter,batInfo=batterInfo,batRect=atlasFrame(batterAtlas,batInfo.columns,batInfo.rows,phase.batter);
      const batterFrames=batInfo.frames||manifest.frames?.batter||[],frame=batterFrames[phase.batter],feet=sourceFeetForFrame(frame,batterCell);
      const readyIndex=batStates.reset[batStates.reset.length-1],referenceBatterFrame=batterFrames[readyIndex];
      const batterBounds=referenceBatterFrame?.bounds||referenceBatterFrame?.contentBounds;
      const batterHeight=(g?.u||Math.min(w/100,h/118))*68;
      if(g&&batInfo.poseOrder==='v2'&&referenceBatterFrame?.anchors?.frontFoot){
        const field=manifest.field||{},targetRear={
          x:round((Number.isFinite(field.batterRearX)?field.batterRearX:.20)*w),
          y:round(h-(Number.isFinite(field.batterRearBottomU)?field.batterRearBottomU:5)*g.u),
        };
        const readyFeet=sourceFeetForFrame(referenceBatterFrame,batterCell),readyFit=fit(batRect.sw,batRect.sh,readyFeet,batterBounds,targetRear,batterHeight,referenceBatterFrame?.anatomyScale);
        const readyFront=transformedPoint(sourcePointForFrame(referenceBatterFrame,'frontFoot',batterCell),readyFit);
        const layout=orientedBatterBox(targetRear,readyFront,g.u,{
          nearU:Number.isFinite(field.batterBoxNearU)?field.batterBoxNearU:6,
          farU:Number.isFinite(field.batterBoxFarU)?field.batterBoxFarU:8,
          sideHalfU:Number.isFinite(field.batterBoxSideHalfU)?field.batterBoxSideHalfU:3,
          rightLimit:g.plate.x-6*g.u,bottomLimit:h-2,
        });
        if(layout)g={...g,batterRear:layout.rearFoot,batterLead:layout.frontFoot,box:layout.box};
      }
      drawGround(ctx,g,images.mound,manifest.mound);
      if(g){
        const sr=scene.getBoundingClientRect();
        const props={'--pixel-pitcher-x':g.pitcher.x*sr.width/w+'px','--pixel-pitcher-y':g.pitcher.y*sr.height/h+'px','--pixel-pitcher-height':round(g.u*32)*sr.height/h+'px'};
        for(const [key,value] of Object.entries(props))if(scene.style.getPropertyValue(key)!==value)scene.style.setProperty(key,value);
      }
      const batFit=fit(batRect.sw,batRect.sh,feet,batterBounds,g?.batterRear||{x:round(w*.25),y:round(h-w*.025)},batterHeight,frame?.anatomyScale);
      const batterFrontFoot=sourcePointForFrame(frame,'frontFoot',batterCell);
      if(batterFrontFoot)drawContactShadow(ctx,transformedPoint(batterFrontFoot,batFit),batFit.scale);
      drawSprite(ctx,batterAtlas,batRect,w,h,batFit);
      const contactStates=state.revealed?.action==='bunt'?batStates.bunt||batStates.swing:batStates.swing;
      const contactIndex=contactStates[Math.min(2,contactStates.length-1)],contactFrame=batterFrames[contactIndex],contactRect=atlasFrame(batterAtlas,batInfo.columns,batInfo.rows,contactIndex);
      const contactFeet=sourceFeetForFrame(contactFrame,batterCell);
      const contactFit=fit(contactRect.sw,contactRect.sh,contactFeet,batterBounds,g?.batterRear||{x:round(w*.25),y:round(h-w*.025)},batterHeight,contactFrame?.anatomyScale);
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
        const displayH=round((g?.u||Math.min(w/100,h/118))*32),scale=displayH/(isRedRush?pitcherBodyHeight:fh)*pitcherAnatomyScale,displayW=round(fw*scale);
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
      if(active&&releasePoint&&contactPoint&&elapsed>=flightStart){
        const target=contactPoint;
        {
          const impact=Math.max(flightStart+1,Number(state.impactAt)||1);
          const incoming=incomingPitchPoint(elapsed,flightStart,impact,releasePoint,target);
          let bx=incoming.x,by=incoming.y;
          const grade=state.shot?.grade||'',contact=['hit','foul','sacrifice','out'].includes(state.revealed?.kind);
          if(elapsed>=impact&&contact&&(state.fxStage==='release'||state.fxStage==='settle')){
            const outgoing=outgoingPitchPoint(tailProgress,target,{width:w,height:h,kind:state.revealed.kind,grade});
            bx=outgoing.x;by=outgoing.y;
          }else if(elapsed>=impact&&!contact){
            const passed=passedPitchPoint(elapsed,impact,releasePoint,target);bx=passed.x;by=passed.y;
          }
          const out=ballCtx||ctx,ball=pixelBallRects(bx,by);out.fillStyle='#10111b';out.fillRect(ball.outer.x,ball.outer.y,ball.outer.width,ball.outer.height);out.fillStyle='#fff6dc';out.fillRect(ball.inner.x,ball.inner.y,ball.inner.width,ball.inner.height);
        }
      }
    };
    const activeNow=()=>{const s=live.current,active=!!s.fxStage&&!!s.shot&&hasPitchVisual(s.shot)&&!!s.revealed;
      return alive&&shouldAnimatePixelScene({active,contextLost,hidden:document.hidden,inspected:scene?.getAttribute('aria-hidden')==='true'||scene?.hasAttribute('inert'),reducedMotion:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches});};
    const tick=now=>{raf=0;if(!alive)return;draw(now);if(activeNow())raf=requestAnimationFrame(tick);};
    const wake=()=>{
      const s=live.current;
      if(s.playToken!==lastToken){lastToken=s.playToken;startAt=performance.now();tailAt=null;}
      if(contextLost)return;
      if(activeNow()){if(!raf)raf=requestAnimationFrame(tick);}
      else draw(performance.now());
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
