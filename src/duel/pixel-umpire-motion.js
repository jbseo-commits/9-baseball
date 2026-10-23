export const PIXEL_SCENE_WIDTH=240;

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

export function atlasMotion({stage,elapsed=0,impactAt=0,action='swing',kind='whiff',bunt=false,states={}}={}){
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
  if(d<110)return {phase:'follow',batter:contact?follow[0]:swingFrames.at(-1),attacking,contact};
  if(d<170)return {phase:'follow',batter:swingFrames.at(-1),attacking,contact};
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
