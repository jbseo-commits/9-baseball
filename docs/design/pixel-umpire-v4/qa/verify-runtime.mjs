import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url));
const repo=process.argv[2]||process.cwd();
const m=await import(pathToFileURL(path.join(repo,'src/duel/pixel-umpire-motion.js')));
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const old=read(path.join(repo,'assets/production-art/pixel-umpire-v3/runtime/manifest.json'));
const now=read(path.join(repo,'assets/production-art/pixel-umpire-v4/runtime/manifest.json'));
const ba=now.atlases.batter,used=new Set();let samples=0,divergences=0;
for(const action of ['swing','bunt','take'])for(let dt=-1567;dt<=2270;dt++){
  let first;
  for(const kind of ['hit','whiff']){
    const phase=m.atlasMotion({stage:dt<0?'windup':'release',elapsed:1567+dt,actorElapsed:Math.max(0,dt),impactAt:1567,action,kind,bunt:action==='bunt',states:ba.states,poseOrder:ba.poseOrder,timelines:ba.timelines});
    if(!ba.frames[phase.batter])throw Error('Invalid timeline source '+phase.batter);
    if(dt<0&&first!=null&&first!==phase.batter)divergences++;
    first=phase.batter;used.add(phase.batter);samples++;
  }
}
const fixtures=[];
for(const label of ['390x844','360x640','pc1280x720']){
  const f=read(path.join(root,'fixture-'+label+'.json'));if(f.rendererGeometryConfirmed!==true)throw Error('Unconfirmed fixture');
  const w=f.nativeCanvas.width,h=f.nativeCanvas.height,field=now.field;
  const framing=m.responsiveFieldCameraFraming({width:w,height:h,zoneCenterX:Math.round(f.zoneCenterSceneCss.x*w/f.sceneCss.width),centerRatio:field.cameraCenterRatio,zoneInsetRatio:field.cameraZoneInsetRatio,referenceHeight:field.cameraReferenceHeight,viewWidthFt:field.cameraViewWidthFt});
  const camera=m.createFieldCamera({width:w,height:h,centerX:framing.centerX,plateY:Math.round(h-.055*w),cameraDepthFt:m.PLATE_TO_RUBBER_FT,cameraHeightFt:12,viewWidthFt:framing.viewWidthFt,pitcherDepthFt:m.PLATE_TO_RUBBER_FT,pitcherTargetY:h*.44});
  const target=m.projectFieldPoint(camera,{lateralFt:field.batterRearLateralFt,depthFt:field.batterRearDepthFt});
  const height=m.projectFieldHeight(camera,field.batterRearDepthFt,6.1);
  const fit=(manifest,index,action='swing')=>{const b=manifest.atlases.batter;return m.batterPlantTransform({frame:b.frames[index],frameIndex:index,readyFrame:b.frames[0],plantFrame:b.frames[action==='bunt'?25:3],plantFrames:action==='bunt'?[25,26,27,28,29,30,31]:[3,4,5,6,7,8,9,10,11,12,13,14,16,17,18,19,20,21,22,23,32,33,34,35],frames:b.frames,cell:m.atlasCell(manifest,b),targetRear:target,targetHeight:height,referenceBodyHeight:b.frames[0].bounds.height*256});};
  const contacts=[];
  for(const [action,index]of [['swing',8],['bunt',26]]){
    const a=fit(old,index,action),b=fit(now,index,action);
    if(JSON.stringify(a)!==JSON.stringify(b))throw Error(label+' contact transform differs '+action);
    const frame=ba.frames[index],cell=m.atlasCell(now,ba),point=m.transformedPoint(m.sourcePointForFrame(frame,'barrel',cell),b),axis={x:frame.anchors.batAxis[0],y:frame.anchors.batAxis[1],unitScale:b.scale*(cell.scale||1)};
    for(let zone=0;zone<10;zone++)contacts.push({action,zone,point:m.physicalPitchPoint(zone,point,axis)});
  }
  const sequence=[19,...ba.timelines.swing.filter(e=>e.atMs>740).map(e=>e.frame)],poses=[];let minMargin=Infinity,worst=null;
  for(const index of sequence){
    const frame=ba.frames[index],cell=m.atlasCell(now,ba),transform=fit(now,index),points={};
    for(const anchor of ['head','hip','grip'])if(frame.anchors[anchor])points[anchor]=m.transformedPoint(m.sourcePointForFrame(frame,anchor,cell),transform);
    for(const side of ['rear','front']){
      const line=m.sourceSoleGroundline(frame,side,cell);const transformed=line.map(p=>m.transformedPoint(p,transform));points[side]={x:(transformed[0].x+transformed[1].x)/2,y:(transformed[0].y+transformed[1].y)/2};
      for(const p of transformed){const q=m.unprojectGroundPoint(camera,p);const boxCenter=m.BATTER_BOX_CENTER_LATERAL_FT;const margin=Math.min(q.lateralFt-(boxCenter-2),(boxCenter+2)-q.lateralFt,q.depthFt+2,4-q.depthFt);if(margin<minMargin){minMargin=margin;worst={index,side,p,q};}}
    }
    poses.push({index,points,gripOccluded:!!frame.gripOccluded});
  }
  const deltas=poses.slice(1).map((b,i)=>{const a=poses[i],dist={};for(const key of Object.keys(a.points))if(b.points[key])dist[key]=Math.hypot(b.points[key].x-a.points[key].x,b.points[key].y-a.points[key].y);return {from:a.index,to:b.index,dist,gripInferred:a.gripOccluded||b.gripOccluded};});
  if(minMargin<0)throw Error(label+' sole outside box: '+JSON.stringify(worst));
  fixtures.push({label,nativeCanvas:f.nativeCanvas,camera,sceneScale:framing.sceneScale,contactTransformsIdentical:true,contacts,minSoleEndpointMarginFt:minMargin,worstSoleEndpoint:worst,poses,deltas});
}
const out={schemaVersion:1,sourceSHA256:crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,'assets/production-art/pixel-umpire-v4/runtime/manifest.json'))).digest('hex'),samples,actualUniqueSourceIndices:[...used].sort((a,b)=>a-b),actualUniqueSourceCount:used.size,preImpactHitWhiffPoseDivergences:divergences,fixtures,limits:['Technical projected-coordinate comparison is not motion or art quality approval.','Occluded grip is anatomically inferred; visible contact anchors8/26 remain exact V3.','No dense collision rerun is claimed: unchanged source0..35 RGBA and equal contact transforms preserve the prior V3 small-screen precontact residuals, which are documented, not zero.','Groundline endpoints are manual; far shoe may be foreshortened/occluded.']};
fs.writeFileSync(path.join(root,'final-runtime-audit-v4.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify({samples,actualSourceCount:used.size,preImpactDivergences:divergences,fixtures:fixtures.map(f=>({label:f.label,minMargin:f.minSoleEndpointMarginFt,readySeam:f.deltas.at(-1),supportTransition:f.deltas.find(d=>d.from===44&&d.to===45)}))},null,2));
