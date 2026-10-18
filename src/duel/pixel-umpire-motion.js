export const PIXEL_SCENE_BASE_WIDTH=240;
export const PIXEL_SCENE_WIDTH=384;
export const PIXEL_SCENE_SCALE=PIXEL_SCENE_WIDTH/PIXEL_SCENE_BASE_WIDTH;

export function atlasCell(manifest,atlas){
  return {...(manifest?.cell||{}),...(atlas?.cell||{})};
}

export function pixelBallRects(x,y){
  const width=Math.round(5*PIXEL_SCENE_SCALE),height=Math.round(4*PIXEL_SCENE_SCALE);
  const innerWidth=Math.round(3*PIXEL_SCENE_SCALE),innerHeight=Math.round(2*PIXEL_SCENE_SCALE);
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

export function atlasMotion({stage,elapsed=0,impactAt=0,action='swing',kind='whiff',bunt=false,states={},poseOrder='v1'}={}){
  const windup=states.windup||[0],swing=states.swing||[0],follow=states.follow||swing,reset=states.reset||[0],buntFrames=states.bunt||swing;
  const impact=Math.max(0,Number(impactAt)||0),t=Math.max(0,Number(elapsed)||0),d=t-impact;
  const attacking=action!=='take',contact=kind==='hit'||kind==='foul'||kind==='sacrifice'||kind==='out';
  const readyBatter=reset[reset.length-1];
  if(!stage)return {phase:'idle',batter:readyBatter,pitcher:'idle',attacking:false,contact:false};
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

export function outgoingPitchPoint(progress,target,{width,height,kind,grade=''}={}){
  const p=clamp01(progress),e=1-Math.pow(1-p,1.35);
  if(kind==='foul')return {x:Math.round(target.x-e*width*.65),y:Math.round(target.y+e*height*.2)};
  if(kind==='out'||kind==='sacrifice')return {x:Math.round(target.x+e*width*.36),y:Math.round(target.y-e*height*.1-Math.sin(e*Math.PI)*height*.025)};
  return {x:Math.round(target.x+e*width*.82),y:Math.round(target.y-e*height*(/homer|grand/.test(grade)?.72:.35)-Math.sin(e*Math.PI)*height*.1)};
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

export function passedPitchPoint(elapsed,impactAt,releasePoint,target){
  if(!releasePoint||!target)return null;
  const length=Math.hypot(target.x-releasePoint.x,target.y-releasePoint.y)||1;
  const distance=Math.min(18,Math.max(0,elapsed-impactAt)*.07);
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
