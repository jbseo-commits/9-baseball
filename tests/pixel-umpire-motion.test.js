import {describe,it,expect,vi} from 'vitest';
import {actorShadowProjection,atlasCell,atlasMotion,BATTER_BOX_CENTER_LATERAL_FT,BATTER_REAR_LATERAL_FT,batterPlantTransform,cancelAnimationFrameId,contactShadowRects,coverPlacement,createFieldCamera,createFrameMaskCache,impactPresentationElapsed,incomingPitchPoint,normalizedActorFrame,orientedBatterBox,outgoingPitchPoint,passedPitchPoint,pixelBallRects,pixelPitcherFrame,projectBatterBox,projectFieldHeight,projectFieldPoint,projectHomePlate,responsiveFieldCameraFraming,safe2dContext,sampleMotionTrack,sequenceFrame,shouldAnimatePixelScene,sourceFeetForFrame,sourcePointForFrame,sourceSoleGroundline,sourceSoleCenter,physicalPitchPoint,stageMotionElapsed,stadiumLitPixel,trackRecoveryDuration,transformedPoint,unprojectGroundPoint,PIXEL_SCENE_BASE_WIDTH,PIXEL_SCENE_SCALE,PIXEL_SCENE_WIDTH,PLATE_TO_RUBBER_FT,PLATE_TO_RUBBER_M} from '../src/duel/pixel-umpire-motion.js';
import v2Manifest from '../assets/production-art/pixel-umpire-v2/runtime/manifest.json' with {type:'json'};
import v3Manifest from '../assets/production-art/pixel-umpire-v3/runtime/manifest.json' with {type:'json'};

const states={windup:[0,1,2,3],swing:[4,5,6,7],follow:[8,9],reset:[10,11],bunt:[12,13],drive:[0,1,2,3]};
const insidePolygon=(p,vertices)=>{
  let sign=0;
  for(let i=0;i<vertices.length;i++){
    const a=vertices[i],b=vertices[(i+1)%vertices.length],cross=(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
    if(Math.abs(cross)<1e-6)continue;
    if(sign&&Math.sign(cross)!==sign)return false;
    sign=Math.sign(cross);
  }
  return true;
};
const segmentDistance=(p,a,b)=>{
  const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));
  return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));
};

describe('pixel umpire presentation-only timeline',()=>{
  it('shares one 50ms impact hold between batter and ball and never crosses an unconfirmed impact',()=>{
    expect(impactPresentationElapsed(800,800,'windup')).toBe(799);
    expect(impactPresentationElapsed(1800,800,'windup')).toBe(799);
    expect(impactPresentationElapsed(800,800,'impact')).toBe(800);
    expect(impactPresentationElapsed(850,800,'slowmo')).toBe(800);
    expect(impactPresentationElapsed(851,800,'slowmo')).toBe(801);
    expect(impactPresentationElapsed(900,800,'release')).toBe(850);
    expect(impactPresentationElapsed(0,0,'release')).toBe(0);
    expect(impactPresentationElapsed(50,0,'release')).toBe(0);
    expect(impactPresentationElapsed(51,0,'release')).toBe(1);
  });

  it('keeps the canonical field frame and zooms out on short scenes while respecting the measured zone',()=>{
    const mobile=responsiveFieldCameraFraming({width:384,height:477,zoneCenterX:238,centerRatio:.55,zoneInsetRatio:.07,referenceHeight:477,viewWidthFt:15.5});
    const pc=responsiveFieldCameraFraming({width:384,height:341,zoneCenterX:307,centerRatio:.55,zoneInsetRatio:.07,referenceHeight:477,viewWidthFt:15.5});
    const shortPhone=responsiveFieldCameraFraming({width:384,height:299,zoneCenterX:298,centerRatio:.55,zoneInsetRatio:.07,referenceHeight:477,viewWidthFt:15.5});
    expect(mobile).toEqual({centerX:211,viewWidthFt:15.5,sceneScale:1});
    expect(pc.centerX).toBe(211);
    expect(pc.sceneScale).toBeCloseTo(.69,2);
    expect(shortPhone.centerX).toBe(211);
    expect(shortPhone.sceneScale).toBeCloseTo(.595,2);
    expect(pc.viewWidthFt).toBeGreaterThan(mobile.viewWidthFt);
    expect(shortPhone.viewWidthFt).toBeGreaterThan(pc.viewWidthFt);
  });

  it('keeps a prior authored recovery track alive through its final ready keyframe',()=>{
    const track=[{atMs:-700,frame:1},{atMs:0,frame:9},{atMs:670,frame:21},{atMs:1340,frame:0,phase:'ready'}];
    expect(trackRecoveryDuration(track,0)).toBe(1340);
    expect(sampleMotionTrack(track,670,{contact:true,readyFrame:0})).toMatchObject({frame:21});
    expect(sampleMotionTrack(track,1339,{contact:true,readyFrame:0})).toMatchObject({frame:21});
    expect(sampleMotionTrack(track,1340,{contact:true,readyFrame:0})).toMatchObject({frame:0,phase:'ready'});
    const buntRecovery=[{atMs:0,frame:30,contactOnly:true},{atMs:80,frame:32},{atMs:220,frame:33},{atMs:380,frame:34},{atMs:540,frame:35},{atMs:700,frame:0,phase:'ready'}];
    expect(trackRecoveryDuration(buntRecovery,0)).toBe(1340);
    expect(sampleMotionTrack(buntRecovery,1000,{contact:true,readyFrame:0})).toMatchObject({frame:0,phase:'ready'});
  });

  it('uses the post-impact ready keyframe rather than the initial ready pose for recovery duration',()=>{
    const track=v3Manifest.atlases.batter.timelines.swing;
    expect(track[0]).toMatchObject({atMs:-1567,frame:0,phase:'ready'});
    expect(trackRecoveryDuration(track,0)).toBe(1440);
    expect(sampleMotionTrack(track,1439,{contact:true,readyFrame:0})).toMatchObject({frame:23});
    expect(sampleMotionTrack(track,1440,{contact:true,readyFrame:0})).toMatchObject({frame:0,phase:'ready'});
  });

  it('shows the bunt default pose on a miss and contact pose only after confirmed contact',()=>{
    const art=v3Manifest.atlases.batter;
    const states=art.states;
    const defaults=atlasMotion({stage:'impact',elapsed:0,actorElapsed:0,impactAt:0,action:'bunt',kind:'whiff',bunt:true,states,poseOrder:art.poseOrder,timelines:art.timelines});
    const contact=atlasMotion({stage:'impact',elapsed:0,actorElapsed:0,impactAt:0,action:'bunt',kind:'sacrifice',bunt:true,states,poseOrder:art.poseOrder,timelines:art.timelines});
    expect(defaults.batter).toBe(25);
    expect(defaults.contact).toBe(false);
    expect(contact.batter).toBe(26);
    expect(contact.contact).toBe(true);
  });

  it('keeps the same batter windup for contact and misses before the parent impactAt',()=>{
    const hit=atlasMotion({stage:'windup',elapsed:30,impactAt:200,action:'place',kind:'hit',states});
    const miss=atlasMotion({stage:'windup',elapsed:30,impactAt:200,action:'place',kind:'whiff',states});
    expect(hit).toEqual(miss);
    expect(hit.batter).toBe(2);
    expect(atlasMotion({stage:'windup',elapsed:170,impactAt:200,states}).batter).toBe(5);
  });

  it('pins contact to swing frame 2 and skips it on a whiff',()=>{
    const beforeHit=atlasMotion({stage:'windup',elapsed:199,impactAt:200,action:'slug',kind:'hit',states});
    const beforeMiss=atlasMotion({stage:'windup',elapsed:199,impactAt:200,action:'slug',kind:'whiff',states});
    expect(beforeHit.batter).toBe(5);
    expect(beforeHit).toEqual(beforeMiss);
    const hit=atlasMotion({stage:'windup',elapsed:200,impactAt:200,action:'slug',kind:'hit',states});
    const miss=atlasMotion({stage:'windup',elapsed:200,impactAt:200,action:'slug',kind:'whiff',states});
    expect(hit.phase).toBe(miss.phase);
    expect(hit.contact).toBe(true);
    expect(miss.contact).toBe(false);
    expect(miss.batter).toBe(7); // whiff skips the frame-2 contact pose
    expect(hit.batter).toBe(6);
    expect(atlasMotion({stage:'release',elapsed:320,impactAt:200,action:'slug',kind:'hit',states}).batter).toBe(7);
  });

  it('plays the v2 extension before rising barrel without changing timing or v1 order',()=>{
    const v2States={...states,follow:[8,9,10]};
    const sample=(delta,poseOrder,atlasStates=states)=>atlasMotion({stage:'release',elapsed:500+delta,impactAt:500,action:'swing',kind:'hit',states:atlasStates,poseOrder}).batter;
    expect(sample(49,'v2')).toBe(6); // contact pose ends at the existing +50ms boundary
    expect(sample(50,'v2')).toBe(7); // extension
    expect(sample(109,'v2')).toBe(7);
    expect(sample(110,'v2')).toBe(8); // rising barrel
    expect(sample(169,'v2')).toBe(8);
    expect(sample(170,'v2')).toBe(9); // over-left-shoulder
    expect(sample(240,'v2',v2States)).toBe(10); // balanced finish
    expect(sample(300,'v2',v2States)).toBe(10);
    expect(sample(80,undefined)).toBe(8);
    expect(sample(140,undefined)).toBe(7);
  });

  it('samples optional signed-impact pose tracks with variable authored frame spacing',()=>{
    const track=[
      {atMs:-1400,frame:15,phase:'windup'}, {atMs:-850,frame:0,phase:'windup'},
      {atMs:-150,frame:4,phase:'swing'}, {atMs:-75,frame:5,phase:'swing'},
      {atMs:0,frame:6,phase:'swing',contactOnly:true}, {atMs:1,frame:7,phase:'swing'},
      {atMs:90,frame:8,phase:'follow'}, {atMs:210,frame:9,phase:'follow'},
      {atMs:430,frame:10,phase:'reset'}, {atMs:690,frame:11,phase:'reset'},
      {atMs:1050,frame:0,phase:'ready'},
    ];
    expect(atlasMotion({stage:'windup',elapsed:100,impactAt:1400,states,timelines:{swing:track}}).batter).toBe(15);
    expect(atlasMotion({stage:'impact',elapsed:1400,actorElapsed:0,impactAt:1400,kind:'hit',states,timelines:{swing:track}}).batter).toBe(6);
    expect(atlasMotion({stage:'impact',elapsed:1400,actorElapsed:0,impactAt:1400,kind:'whiff',states,timelines:{swing:track}}).batter).toBe(5);
    expect(atlasMotion({stage:'impact',elapsed:1400,actorElapsed:250,impactAt:1400,kind:'hit',states,timelines:{swing:track}}).batter).toBe(9);
    expect(sampleMotionTrack(track,1050,{contact:true,readyFrame:11})).toMatchObject({frame:0,phase:'ready'});
  });

  it('never swings on a take',()=>{
    expect(atlasMotion({stage:'windup',elapsed:50,impactAt:200,action:'take',kind:'ball',states}).attacking).toBe(false);
    expect(atlasMotion({stage:'impact',elapsed:220,impactAt:200,action:'take',kind:'called',states}).batter).toBe(11);
  });

  it('uses normalized authored anchors and row-major sheet cells',()=>{
    const frame={anchors:{feet:[.2,.9],barrel:[.88,.35]}};
    const cell={width:192,height:256};
    expect(sourceFeetForFrame(frame,cell)).toEqual({rear:{x:38,y:230},lead:null});
    expect(sourcePointForFrame(frame,'barrel',cell)).toEqual({x:169,y:90});
    expect(normalizedActorFrame({frameIndex:13,columns:4,cellWidth:192,cellHeight:256})).toEqual({sx:192,sy:768,sw:192,sh:256});
    expect(sequenceFrame([1,2,3],1)).toBe(3);
    expect(transformedPoint({x:4,y:8},{x:10,y:20,scale:2,rotation:0,anchor:{x:1,y:2}})).toEqual({x:16,y:32});
    expect(PIXEL_SCENE_WIDTH).toBe(384);
    expect(PIXEL_SCENE_WIDTH/PIXEL_SCENE_BASE_WIDTH).toBe(PIXEL_SCENE_SCALE);
    expect(PIXEL_SCENE_BASE_WIDTH).toBe(240); // retain the old render baseline for scale comparisons
  });

  it('resolves per-atlas cell metadata over legacy shared cells',()=>{
    const legacy={cell:{width:256,height:256,scale:2}},v2={cell:{width:512,height:512,scale:2}};
    expect(atlasCell(legacy,{columns:4})).toEqual(legacy.cell);
    expect(atlasCell(legacy,{cell:{width:512,height:512,scale:2}})).toEqual(v2.cell);
    expect(atlasCell(legacy,{cell:{width:256,height:256,scale:1}})).toEqual({width:256,height:256,scale:1});
    expect(atlasCell(v2,{cell:{width:768}})).toEqual({width:768,height:512,scale:2});
  });

  it('uses the measured opaque Red Rush release fingertip as the v2 ball origin',()=>{
    const redRush=v2Manifest.atlases.redRush,cell=atlasCell(v2Manifest,redRush),releaseFrame=redRush.frames[redRush.states.drive[2]];
    expect(cell).toEqual({width:256,height:256,scale:1});
    expect(sourcePointForFrame(releaseFrame,'release',cell)).toEqual({x:69,y:72});
  });

  it('keeps the ball outline at its previous CSS size in the higher-resolution buffer',()=>{
    const ball=pixelBallRects(120,100);
    expect(ball.outer.width).toBe(Math.round(5*PIXEL_SCENE_SCALE));
    expect(ball.outer.height).toBe(Math.round(4*PIXEL_SCENE_SCALE));
    expect(ball.inner.width).toBe(Math.round(3*PIXEL_SCENE_SCALE));
    expect(ball.inner.height).toBe(Math.round(2*PIXEL_SCENE_SCALE));
    expect(ball.outer.width/PIXEL_SCENE_WIDTH).toBeCloseTo(5/PIXEL_SCENE_BASE_WIDTH,4);
    expect(pixelBallRects(120,100,.69)).toMatchObject({outer:{width:6,height:4},inner:{width:3,height:2}});
    expect(pixelBallRects(120,100,.595)).toMatchObject({outer:{width:5,height:4},inner:{width:3,height:2}});
  });

  it('aligns the authored stadium field line to the computed pitcher horizon and keeps legacy centering',()=>{
    const aligned=coverPlacement(384,576,384,477,{fieldLineY:229,desiredHorizon:130});
    expect(aligned).toEqual({x:0,y:-99,width:384,height:576});
    expect(aligned.y+229).toBe(130);
    const lowClamped=coverPlacement(384,576,384,477,{fieldLineY:229,desiredHorizon:500});
    expect(lowClamped.y).toBe(0);
    expect(coverPlacement(384,576,384,477)).toEqual({x:0,y:-49,width:384,height:576});
  });

  it('places a small two-tone contact shadow at the authored front-foot point',()=>{
    const frontFoot=sourcePointForFrame({anchors:{frontFoot:[.75,.875]}},'frontFoot',{width:256,height:256});
    const shadow=contactShadowRects(frontFoot,.5);
    const moved=contactShadowRects({x:frontFoot.x+10,y:frontFoot.y+8},.5);
    expect(frontFoot).toEqual({x:192,y:224});
    expect(shadow.outer.width).toBe(7);
    expect(shadow.outer.height).toBe(2);
    expect(moved.outer.x-shadow.outer.x).toBe(10);
    expect(moved.outer.y-shadow.outer.y).toBe(8);
    expect(contactShadowRects(null,.5)).toBe(null);
  });

  it('fits v2 chalk box to authored ready feet inside the mobile plate and canvas',()=>{
    const cell={width:256,height:256},ready={anchors:{feet:[92/256,234/256],frontFoot:[167/256,219/256]}};
    const u=3.84,bodyHeight=218,targetHeight=68*u,scale=targetHeight/bodyHeight;
    const rear={x:Math.round(.20*384),y:Math.round(477-5*u)};
    const rearSource=sourceFeetForFrame(ready,cell).rear;
    const frontSource=sourcePointForFrame(ready,'frontFoot',cell);
    const front={x:Math.round(rear.x+(frontSource.x-rearSource.x)*scale),y:Math.round(rear.y+(frontSource.y-rearSource.y)*scale)};
    const layout=orientedBatterBox(rear,front,u,{nearU:6,farU:8,sideHalfU:3,rightLimit:215,bottomLimit:475});
    const corners=Object.values(layout.box);
    expect(layout.rearFoot.x).toBe(rear.x);
    expect(layout.frontFoot.x-layout.rearFoot.x).toBe(front.x-rear.x);
    expect(Math.max(...corners.map(p=>p.x))).toBeLessThanOrEqual(215);
    expect(Math.max(...corners.map(p=>p.y))).toBeLessThanOrEqual(475);
    expect(Math.min(...corners.map(p=>p.x))).toBeGreaterThanOrEqual(0);
    expect(Math.min(...corners.map(p=>p.y))).toBeGreaterThanOrEqual(0);
  });

  it('projects the plate, 60 ft 6 in rubber, mound axis, and fixed 4 by 6 ft batter box together',()=>{
    expect(PLATE_TO_RUBBER_M).toBe(18.44);
    expect(PLATE_TO_RUBBER_FT).toBeCloseTo(60.5,0);
    const camera=createFieldCamera({width:384,height:477,centerX:Math.round(384*v3Manifest.field.cameraCenterRatio),plateY:456,cameraDepthFt:PLATE_TO_RUBBER_FT,cameraHeightFt:12,viewWidthFt:15.5,pitcherDepthFt:PLATE_TO_RUBBER_FT,pitcherTargetY:210});
    const plate=projectFieldPoint(camera,{lateralFt:0,depthFt:0});
    const rubber=projectFieldPoint(camera,{lateralFt:0,depthFt:60.5});
    const plateCorners=projectHomePlate(camera);
    expect(plate).toMatchObject({x:211,y:456});
    expect(rubber).toMatchObject({x:211,y:210});
    expect(Math.max(...plateCorners.map(point=>point.x))-Math.min(...plateCorners.map(point=>point.x))).toBeGreaterThan(30);
    expect(Math.max(...plateCorners.map(point=>point.x))-Math.min(...plateCorners.map(point=>point.x))).toBeLessThan(40);
    expect(projectFieldHeight(camera,60.5,6.2)/projectFieldHeight(camera,-1,6.1)).toBeCloseTo(.5,1);
    const box=projectBatterBox(camera);
    expect(box.world).toMatchObject({widthFt:4,lengthFt:6,centerLateralFt:BATTER_BOX_CENTER_LATERAL_FT,nearDepthFt:-2,farDepthFt:4});
    expect(box.points.leftNear.y).toBeGreaterThan(box.points.leftFar.y);
    expect(box.points.rightNear.x-box.points.leftNear.x).toBeGreaterThan(box.points.rightFar.x-box.points.leftFar.x);
    expect((box.points.leftNear.x+box.points.rightNear.x)/2).toBeLessThan(plate.x);
    expect(BATTER_BOX_CENTER_LATERAL_FT+2).toBeCloseTo(-(17/24+.5));
  });

  it('keeps home plate flat edge toward the pitcher and the point toward the catcher',()=>{
    const camera=createFieldCamera({width:384,height:477,centerX:238,plateY:456,cameraDepthFt:PLATE_TO_RUBBER_FT,cameraHeightFt:12,viewWidthFt:15.5});
    const vertices=projectHomePlate(camera);
    const world=vertices.map(point=>unprojectGroundPoint(camera,point));
    const half=17/24,depth=17/12;
    expect(world).toHaveLength(5);
    const expected=[[-half,depth],[half,depth],[half,depth/2],[0,0],[-half,depth/2]];
    for(let i=0;i<expected.length;i++){
      expect(Math.abs(world[i].lateralFt-expected[i][0])).toBeLessThan(.15);
      expect(Math.abs(world[i].depthFt-expected[i][1])).toBeLessThan(.15);
    }
    expect(vertices[0].y).toBe(vertices[1].y);
    expect(vertices[3].y).toBeGreaterThan(vertices[0].y);
  });

  it('places the fixed six-inch-gap box and authored contact barrel beside home plate',()=>{
    const art=v2Manifest.atlases.batter,cell=atlasCell(v2Manifest,art),contact=art.frames[art.states.swing[2]];
    const camera=createFieldCamera({width:384,height:477,centerX:238,plateY:456,pitcherTargetY:210});
    const rear=projectFieldPoint(camera,{lateralFt:BATTER_REAR_LATERAL_FT,depthFt:-1});
    const ready=art.frames[art.states.reset.at(-1)],readyHeight=ready.bounds.height*cell.height;
    const scale=projectFieldHeight(camera,-1,6.1)/readyHeight;
    const contactRear=sourceFeetForFrame(contact,cell).rear,barrel=sourcePointForFrame(contact,'barrel',cell);
    const barrelPoint={x:Math.round(rear.x+(barrel.x-contactRear.x)*scale),y:Math.round(rear.y+(barrel.y-contactRear.y)*scale)};
    const plate=projectFieldPoint(camera,{depthFt:0}),halfPlatePx=projectFieldPoint(camera,{lateralFt:17/24,depthFt:0}).x-plate.x;
    expect(Math.abs(barrelPoint.x-plate.x)).toBeLessThan(halfPlatePx);
    expect(barrelPoint.x).toBeCloseTo(229,0);
  });

  it('keeps both authored ready soles inside the fixed world-space box without moving the box to the sprite',()=>{
    const art=v2Manifest.atlases.batter,cell=atlasCell(v2Manifest,art),frameIndex=art.states.reset.at(-1),frame=art.frames[frameIndex];
    const camera=createFieldCamera({width:384,height:477,centerX:238,plateY:456,pitcherTargetY:210});
    const box=projectBatterBox(camera).points;
    const rear=projectFieldPoint(camera,{lateralFt:BATTER_REAR_LATERAL_FT,depthFt:-1});
    const sourceRear=sourceFeetForFrame(frame,cell).rear,sourceLead=sourcePointForFrame(frame,'frontFoot',cell);
    const scale=projectFieldHeight(camera,-1,6.1)/(frame.bounds.height*cell.height);
    const lead={x:Math.round(rear.x+(sourceLead.x-sourceRear.x)*scale),y:Math.round(rear.y+(sourceLead.y-sourceRear.y)*scale)};
    const polygon=[box.leftNear,box.rightNear,box.rightFar,box.leftFar];
    const rearWorld=unprojectGroundPoint(camera,rear),leadWorld=unprojectGroundPoint(camera,lead);
    const margin=point=>Math.min(point.lateralFt-(BATTER_BOX_CENTER_LATERAL_FT-2),BATTER_BOX_CENTER_LATERAL_FT+2-point.lateralFt,point.depthFt-(-2),4-point.depthFt);
    expect(insidePolygon(rear,polygon)).toBe(true);
    expect(insidePolygon(lead,polygon)).toBe(true);
    expect(margin(rearWorld)).toBeGreaterThan(.4);
    expect(margin(leadWorld)).toBeGreaterThan(.4);
  });

  it('checks every active authored v2 sole against the same fixed batter box',()=>{
    const art=v2Manifest.atlases.batter,cell=atlasCell(v2Manifest,art),indices=[...new Set(Object.values(art.states).flat())];
    const camera=createFieldCamera({width:384,height:477,centerX:238,plateY:456,pitcherTargetY:210}),box=projectBatterBox(camera).points;
    const polygon=[box.leftNear,box.rightNear,box.rightFar,box.leftFar],rear=projectFieldPoint(camera,{lateralFt:BATTER_REAR_LATERAL_FT,depthFt:-1});
    const reference=art.frames[art.states.reset.at(-1)],height=projectFieldHeight(camera,-1,6.1),scale=height/(reference.bounds.height*cell.height);
    for(const index of indices){
      const frame=art.frames[index],sourceRear=sourceFeetForFrame(frame,cell)?.rear,sourceLead=sourcePointForFrame(frame,'frontFoot',cell);
      if(!sourceRear||!sourceLead)continue;
      const lead={x:Math.round(rear.x+(sourceLead.x-sourceRear.x)*scale),y:Math.round(rear.y+(sourceLead.y-sourceRear.y)*scale)};
      expect(insidePolygon(rear,polygon),`rear foot frame ${index}`).toBe(true);
      expect(insidePolygon(lead,polygon),`lead foot frame ${index}`).toBe(true);
    }
  });

  it('loads the 4 by 9 V3 batter atlas and counts only timeline-active source poses',()=>{
    const art=v3Manifest.atlases.batter;
    const active=new Set([...art.timelines.swing,...art.timelines.bunt,...art.timelines.take].map(entry=>entry.frame));
    expect(art).toMatchObject({columns:4,rows:9,poseOrder:'v3'});
    expect(art.frames).toHaveLength(36);
    expect(active.size).toBe(30);
    expect(active.size).toBe(art.timelineUniqueSourceCount);
    expect([...active].sort((a,b)=>a-b)).not.toContain(24); // bunt0 exists, but no authored track visits it
    expect(active.has(26)).toBe(true);
    expect(active.has(15)).toBe(false);
    expect(active.has(7)).toBe(true);
    expect(trackRecoveryDuration(art.timelines.swing,art.timelines.readyFrame)).toBe(1440);
  });

  it('keeps the same calibrated normal swing poses for hits and whiffs through pre-impact frame 7',()=>{
    const art=v3Manifest.atlases.batter;
    expect(art.timelines.swing).toContainEqual({atMs:-40,frame:7,phase:'swing'});
    const sample=(delta,kind)=>atlasMotion({stage:delta<0?'windup':'impact',elapsed:300+delta,impactAt:300,action:'swing',kind,states:art.states,poseOrder:art.poseOrder,timelines:art.timelines});
    for(const delta of [-41,-1]){
      const hit=sample(delta,'hit'),miss=sample(delta,'whiff');
      expect(hit).toEqual(miss);
      expect(hit.contact).toBe(false);
      expect(hit.batter).toBe(delta===-41?6:7);
    }
  });

  it('uses the motion-reviewed opaque-wood contact anchors for normal and bunt',()=>{
    const art=v3Manifest.atlases.batter,cell=atlasCell(v3Manifest,art);
    // These native atlas pixels were checked against the actual painted wood and opaque alpha.
    expect(sourcePointForFrame(art.frames[8],'barrel',cell)).toEqual({x:191,y:78});
    expect(sourcePointForFrame(art.frames[26],'barrel',cell)).toEqual({x:197,y:82});
  });

  it('pins the planted front sole from normal plant3 and bunt25 while keeping pre-plant rear anchoring',()=>{
    const art=v3Manifest.atlases.batter,cell=atlasCell(v3Manifest,art),ready=art.frames[art.timelines.readyFrame];
    const camera=createFieldCamera({width:384,height:477,centerX:Math.round(384*v3Manifest.field.cameraCenterRatio),plateY:456,cameraDepthFt:PLATE_TO_RUBBER_FT,cameraHeightFt:12,viewWidthFt:15.5,pitcherDepthFt:PLATE_TO_RUBBER_FT,pitcherTargetY:210});
    const rear=projectFieldPoint(camera,{lateralFt:v3Manifest.field.batterRearLateralFt,depthFt:v3Manifest.field.batterRearDepthFt});
    const height=projectFieldHeight(camera,v3Manifest.field.batterRearDepthFt,6.1),bodyHeight=ready.bodyBounds.height*cell.height;
    const pre=batterPlantTransform({frame:art.frames[2],frameIndex:2,readyFrame:ready,plantFrame:art.frames[3],plantFrames:[3,4,5],cell,targetRear:rear,targetHeight:height,referenceBodyHeight:bodyHeight});
    const planted=batterPlantTransform({frame:art.frames[6],frameIndex:6,readyFrame:ready,plantFrame:art.frames[3],plantFrames:[3,4,5,6],cell,targetRear:rear,targetHeight:height,referenceBodyHeight:bodyHeight});
    const normalReset=batterPlantTransform({frame:art.frames[23],frameIndex:23,readyFrame:ready,plantFrame:art.frames[3],plantFrames:[3,4,5,6,23],cell,targetRear:rear,targetHeight:height,referenceBodyHeight:bodyHeight});
    const readyAgain=batterPlantTransform({frame:ready,frameIndex:0,readyFrame:ready,plantFrame:art.frames[3],plantFrames:[3,4,5,6,23],cell,targetRear:rear,targetHeight:height,referenceBodyHeight:bodyHeight});
    const bunt=batterPlantTransform({frame:art.frames[26],frameIndex:26,readyFrame:ready,plantFrame:art.frames[25],plantFrames:[25,26,28,29,30,31],cell,targetRear:rear,targetHeight:height,referenceBodyHeight:bodyHeight});
    const pinCenter=(frame,transform)=>{
      const line=sourceSoleGroundline(frame,'front',cell);
      return transformedPoint({x:(line[0].x+line[1].x)/2,y:(line[0].y+line[1].y)/2},transform);
    };
    const normalPlantTarget=pinCenter(art.frames[3],batterPlantTransform({frame:art.frames[3],frameIndex:3,readyFrame:ready,plantFrame:art.frames[3],plantFrames:[3],cell,targetRear:rear,targetHeight:height,referenceBodyHeight:bodyHeight}));
    const buntPlantTarget=pinCenter(art.frames[25],batterPlantTransform({frame:art.frames[25],frameIndex:25,readyFrame:ready,plantFrame:art.frames[25],plantFrames:[25],cell,targetRear:rear,targetHeight:height,referenceBodyHeight:bodyHeight}));
    expect(pre.frontPlanted).toBe(false);
    expect(pre.anchor).toEqual(sourcePointForFrame(art.frames[2],'feet',cell));
    expect(planted.frontPlanted).toBe(true);
    expect(normalReset.frontPlanted).toBe(true);
    expect(readyAgain.frontPlanted).toBe(false);
    expect(bunt.frontPlanted).toBe(true);
    expect(pinCenter(art.frames[6],planted)).toEqual(normalPlantTarget);
    expect(pinCenter(art.frames[23],normalReset)).toEqual(normalPlantTarget);
    expect(pinCenter(art.frames[26],bunt)).toEqual(buntPlantTarget);
    expect(planted.scale).toBeCloseTo(height/192,4);
  });

  it('uses authored support metadata to replant a rear sole against the ready frame without changing scale',()=>{
    const art=v3Manifest.atlases.batter,cell=atlasCell(v3Manifest,art),ready=art.frames[art.timelines.readyFrame],frame={...art.frames[6],grounding:{support:'rear',targetFrame:0,targetSupport:'rear'}};
    const targetRear={x:211,y:390},targetHeight=180,bodyHeight=192;
    const transform=batterPlantTransform({frame,frameIndex:6,readyFrame:ready,plantFrame:art.frames[3],plantFrames:[],frames:art.frames,cell,targetRear,targetHeight,referenceBodyHeight:bodyHeight});
    const readyFeet=sourcePointForFrame(ready,'feet',cell),readySole=sourceSoleCenter(ready,'rear',cell);
    const expected=transformedPoint(readySole,{x:targetRear.x,y:targetRear.y,scale:targetHeight/bodyHeight,rotation:0,anchor:readyFeet});
    expect(transform.grounding).toEqual({support:'rear',source:sourceSoleCenter(frame,'rear',cell),target:expected});
    expect(transformedPoint(transform.grounding.source,transform)).toEqual(expected);
    expect(transform.anchor).toEqual(transform.grounding.source);
    expect(transform.scale).toBeCloseTo(targetHeight/bodyHeight,8);
    expect(transform.frontPlanted).toBe(false);
  });

  it('keeps a bounded least-recently-used cache for derived per-frame masks',()=>{
    const cache=createFrameMaskCache(2),make=value=>()=>({value});
    expect(cache.get(1,make('one'))).toEqual({value:'one'});
    cache.get(2,make('two'));cache.get(1,make('unused'));cache.get(3,make('three'));
    expect(cache.size).toBe(2);
    expect(cache.get(2,make('two-again'))).toEqual({value:'two-again'});
    expect(cache.size).toBe(2);
    cache.clear();expect(cache.size).toBe(0);
  });

  it('anchors cast shadows at the support point and projects the upper body down-left',()=>{
    const projection=actorShadowProjection({target:{x:120,y:220},scale:.5,anchor:{x:40,y:200}}),{matrix,anchor,target}=projection;
    const project=point=>({x:target.x+matrix.a*(point.x-anchor.x)+matrix.c*(point.y-anchor.y),y:target.y+matrix.b*(point.x-anchor.x)+matrix.d*(point.y-anchor.y)});
    expect(project(anchor)).toEqual(target);
    const crown=project({x:80,y:40});
    expect(crown.x).toBeLessThan(target.x);
    expect(crown.y).toBeGreaterThan(target.y);
  });

  it('warms and cools actor surface pixels with bounded changes while preserving alpha and red identity',()=>{
    const highlight=stadiumLitPixel(236,226,204,173),shadow=stadiumLitPixel(8,14,26,91),red=stadiumLitPixel(210,28,38,255);
    expect(highlight[0]).toBeGreaterThan(236);
    expect(shadow[2]).toBeGreaterThan(26);
    expect(highlight[3]).toBe(173);
    expect(shadow[3]).toBe(91);
    expect(red[0]).toBeGreaterThan(red[1]*1.8);
    expect(red[3]).toBe(255);
  });

  it('fits every unique active V3 groundline inside the fixed world box at authored 6.1 ft scale',()=>{
    const art=v3Manifest.atlases.batter,cell=atlasCell(v3Manifest,art),ready=art.frames[art.timelines.readyFrame];
    const indices=[...new Set([...art.timelines.swing,...art.timelines.bunt,...art.timelines.take].map(entry=>entry.frame))];
    const camera=createFieldCamera({width:384,height:477,centerX:Math.round(384*v3Manifest.field.cameraCenterRatio),plateY:456,cameraDepthFt:PLATE_TO_RUBBER_FT,cameraHeightFt:12,viewWidthFt:15.5,pitcherDepthFt:PLATE_TO_RUBBER_FT,pitcherTargetY:210});
    const target=projectFieldPoint(camera,{lateralFt:v3Manifest.field.batterRearLateralFt,depthFt:v3Manifest.field.batterRearDepthFt});
    const height=projectFieldHeight(camera,v3Manifest.field.batterRearDepthFt,6.1),bodyHeight=ready.bodyBounds.height*cell.height;
    const bounds={left:BATTER_BOX_CENTER_LATERAL_FT-2,right:BATTER_BOX_CENTER_LATERAL_FT+2,near:-2,far:4};
    let minimumMargin=Infinity;
    for(const index of indices){
      const frame=art.frames[index],isBunt=index>=25&&index<=31;
      const plantFrame=isBunt?art.frames[25]:art.frames[3];
      const plantFrames=isBunt?[25,26,27,28,29,30,31]:[3,4,5,6,7,8,9,10,11,12,13,14,16,17,18,19,20,21,22,23,32,33,34,35];
      const transform=batterPlantTransform({frame,frameIndex:index,readyFrame:ready,plantFrame,plantFrames,cell,targetRear:target,targetHeight:height,referenceBodyHeight:bodyHeight});
      expect(transform.scale).toBeCloseTo(height/192,4);
      for(const side of ['rear','front']){
        if(frame.footContact?.[side]===false)continue;
        const line=sourceSoleGroundline(frame,side,cell);
        expect(line,`missing ${side} sole line on frame ${index}`).toHaveLength(2);
        for(const source of line){
          const world=unprojectGroundPoint(camera,transformedPoint(source,transform));
          const margin=Math.min(world.lateralFt-bounds.left,bounds.right-world.lateralFt,world.depthFt-bounds.near,bounds.far-world.depthFt);
          minimumMargin=Math.min(minimumMargin,margin);
          expect(margin,`frame ${index} ${side} sole endpoint ${JSON.stringify(world)}`).toBeGreaterThan(0);
        }
      }
    }
    expect(minimumMargin).toBeGreaterThan(.15);
    expect(v3Manifest.field.batterRearLateralFt).toBe(-3.65);
    expect(v3Manifest.field.batterRearDepthFt).toBe(-1.5);
    expect(bounds.right).toBeCloseTo(-1.208333,5);
  });

  it('keeps V3 body, active soles, and box in frame for canonical mobile and shorter PC scene fixtures',()=>{
    const art=v3Manifest.atlases.batter,cell=atlasCell(v3Manifest,art),ready=art.frames[art.timelines.readyFrame];
    const indices=[...new Set([...art.timelines.swing,...art.timelines.bunt,...art.timelines.take].map(entry=>entry.frame))];
    const fixtures=[{height:477,zoneCenterX:238,zoneLeft:169},{height:341,zoneCenterX:307,zoneLeft:242},{height:299,zoneCenterX:298,zoneLeft:224}];
    for(const fixture of fixtures){
      const {height,zoneCenterX,zoneLeft}=fixture,width=384,framing=responsiveFieldCameraFraming({width,height,zoneCenterX,centerRatio:v3Manifest.field.cameraCenterRatio,zoneInsetRatio:v3Manifest.field.cameraZoneInsetRatio,referenceHeight:v3Manifest.field.cameraReferenceHeight,viewWidthFt:v3Manifest.field.cameraViewWidthFt});
      const camera=createFieldCamera({width,height,centerX:framing.centerX,plateY:height-.055*width,cameraDepthFt:PLATE_TO_RUBBER_FT,cameraHeightFt:12,viewWidthFt:framing.viewWidthFt,pitcherDepthFt:PLATE_TO_RUBBER_FT,pitcherTargetY:height*.44});
      const target=projectFieldPoint(camera,{lateralFt:v3Manifest.field.batterRearLateralFt,depthFt:v3Manifest.field.batterRearDepthFt});
      const targetHeight=projectFieldHeight(camera,v3Manifest.field.batterRearDepthFt,6.1),bodyHeight=ready.bodyBounds.height*cell.height;
      const bounds={left:BATTER_BOX_CENTER_LATERAL_FT-2,right:BATTER_BOX_CENTER_LATERAL_FT+2,near:-2,far:4};
      const polygon=Object.values(projectBatterBox(camera).points),readyTransform=batterPlantTransform({frame:ready,frameIndex:0,readyFrame:ready,plantFrame:ready,plantFrames:[],cell,targetRear:target,targetHeight,referenceBodyHeight:bodyHeight});
      const bodyTop={x:(ready.bodyBounds.x+ready.bodyBounds.width/2)*cell.width,y:ready.bodyBounds.y*cell.height};
      const upperBody=transformedPoint(bodyTop,readyTransform);
      expect(framing.centerX).toBe(211);
      expect(Math.round(zoneCenterX)).toBe(fixture.height===477?238:zoneCenterX);
      expect(upperBody.x).toBeLessThan(zoneLeft);
      for(const index of indices){
        const frame=art.frames[index],isBunt=index>=25&&index<=31,plantFrame=isBunt?art.frames[25]:art.frames[3];
        const plantFrames=isBunt?[25,26,27,28,29,30,31]:[3,4,5,6,7,8,9,10,11,12,13,14,16,17,18,19,20,21,22,23,32,33,34,35];
        const transform=batterPlantTransform({frame,frameIndex:index,readyFrame:ready,plantFrame,plantFrames,cell,targetRear:target,targetHeight,referenceBodyHeight:bodyHeight});
        const content=frame.contentBounds,contentCorners=[{x:content.x*cell.width,y:content.y*cell.height},{x:(content.x+content.width)*cell.width,y:content.y*cell.height},{x:content.x*cell.width,y:(content.y+content.height)*cell.height},{x:(content.x+content.width)*cell.width,y:(content.y+content.height)*cell.height}].map(point=>transformedPoint(point,transform));
        expect(Math.min(...contentCorners.map(p=>p.x)),`frame ${index} left at H${height}`).toBeGreaterThanOrEqual(0);
        expect(Math.max(...contentCorners.map(p=>p.x)),`frame ${index} right at H${height}`).toBeLessThanOrEqual(width);
        expect(Math.min(...contentCorners.map(p=>p.y)),`frame ${index} top at H${height}`).toBeGreaterThanOrEqual(0);
        expect(Math.max(...contentCorners.map(p=>p.y)),`frame ${index} bottom at H${height}`).toBeLessThanOrEqual(height);
        for(const side of ['rear','front']){
          if(frame.footContact?.[side]===false)continue;
          for(const point of sourceSoleGroundline(frame,side,cell)){
            const screen=transformedPoint(point,transform),world=unprojectGroundPoint(camera,screen);
            const margin=Math.min(world.lateralFt-bounds.left,bounds.right-world.lateralFt,world.depthFt-bounds.near,bounds.far-world.depthFt);
            expect(margin,`frame ${index} ${side} foot at H${height}`).toBeGreaterThan(0);
          }
        }
      }
      expect(Math.max(...polygon.map(p=>p.x))).toBeLessThan(width);
    }
  });

  it('places normal and bunt contact barrels inside the plate span and keeps whiffs clear of dense wood',()=>{
    const art=v3Manifest.atlases.batter,cell=atlasCell(v3Manifest,art),ready=art.frames[art.timelines.readyFrame];
    const camera=createFieldCamera({width:384,height:477,centerX:Math.round(384*v3Manifest.field.cameraCenterRatio),plateY:456,cameraDepthFt:PLATE_TO_RUBBER_FT,cameraHeightFt:12,viewWidthFt:15.5,pitcherDepthFt:PLATE_TO_RUBBER_FT,pitcherTargetY:210});
    const targetRear=projectFieldPoint(camera,{lateralFt:v3Manifest.field.batterRearLateralFt,depthFt:v3Manifest.field.batterRearDepthFt});
    const height=projectFieldHeight(camera,v3Manifest.field.batterRearDepthFt,6.1),bodyHeight=ready.bodyBounds.height*cell.height;
    const plate=projectFieldPoint(camera,{depthFt:0}),halfPlate=projectFieldPoint(camera,{lateralFt:17/24,depthFt:0}).x-plate.x;
    for(const {contactIndex,missIndex,plantIndex,plantFrames} of [
      {contactIndex:8,missIndex:10,plantIndex:3,plantFrames:[3,4,5,6,7,8,9,10,11,12,13,14,16,17,18,19,20,21,22,23,32,33,34,35]},
      {contactIndex:26,missIndex:25,plantIndex:25,plantFrames:[25,26,27,28,29,30,31]},
    ]){
      const transform=index=>batterPlantTransform({frame:art.frames[index],frameIndex:index,readyFrame:ready,plantFrame:art.frames[plantIndex],plantFrames,cell,targetRear,targetHeight:height,referenceBodyHeight:bodyHeight});
      const contactFrame=art.frames[contactIndex],contactTransform=transform(contactIndex);
      const barrel=transformedPoint(sourcePointForFrame(contactFrame,'barrel',cell),contactTransform);
      const grip=transformedPoint(sourcePointForFrame(contactFrame,'grip',cell),contactTransform);
      const tip=transformedPoint(sourcePointForFrame(contactFrame,'batTip',cell),contactTransform);
      const axisSource=contactFrame.anchors.batAxis,axis={x:axisSource[0],y:axisSource[1],unitScale:contactTransform.scale*(cell.scale||1)};
      const targets=Array.from({length:9},(_,zone)=>physicalPitchPoint(zone,barrel,axis));
      expect(Math.abs(barrel.x-plate.x)).toBeLessThan(halfPlate);
      // The authored contact anchors sit on the painted wood; this centerline proxy allows for bat thickness.
      expect(Math.max(...targets.map(point=>segmentDistance(point,grip,tip)))).toBeLessThan(5);
      const missFrame=art.frames[missIndex],missTransform=transform(missIndex);
      const missGrip=transformedPoint(sourcePointForFrame(missFrame,'grip',cell),missTransform);
      const missTip=transformedPoint(sourcePointForFrame(missFrame,'batTip',cell),missTransform);
      expect(Math.min(...targets.map(point=>segmentDistance(point,missGrip,missTip)))).toBeGreaterThan(5);
    }
  });

  it('fits the one projected camera in portrait and short landscape without clipping the pitcher',()=>{
    for(const height of [477,216,160]){
      const width=384,plateY=height-.055*width,viewWidthFt=Math.max(15.5,15.5*240/height),pitcherY=height*.44;
      const camera=createFieldCamera({width,height,centerX:192,plateY,cameraDepthFt:60.5,cameraHeightFt:12,viewWidthFt,pitcherDepthFt:60.5,pitcherTargetY:pitcherY});
      const rubber=projectFieldPoint(camera,{depthFt:60.5}),body=projectFieldHeight(camera,60.5,6.2);
      expect(rubber.y).toBeCloseTo(pitcherY,0);
      expect(rubber.y-body).toBeGreaterThanOrEqual(0);
    }
  });

  it('projects all nine tactical zones onto one authored physical barrel plane',()=>{
    const barrel={x:100,y:120},axis={x:1,y:0};
    const points=Array.from({length:10},(_,zone)=>physicalPitchPoint(zone,barrel,axis));
    expect(points[4]).toEqual(barrel);
    expect(points[0]).toEqual({x:97,y:119});
    expect(points[8]).toEqual({x:103,y:121});
    expect(Math.max(...points.slice(0,9).map(p=>Math.hypot(p.x-barrel.x,p.y-barrel.y)))).toBeLessThan(3.2);
    expect(Math.hypot(physicalPitchPoint(9,barrel,axis).x-barrel.x,physicalPitchPoint(9,barrel,axis).y-barrel.y)).toBe(5);
    const scaled=Array.from({length:9},(_,zone)=>physicalPitchPoint(zone,barrel,{x:1,y:0,unitScale:.5}));
    expect(Math.max(...scaled.map(p=>Math.hypot(p.x-barrel.x,p.y-barrel.y)))).toBeLessThan(3.7);
  });

  it('keeps each zone path outcome-independent until contact and continues a miss through the same point',()=>{
    const release={x:40,y:25},barrel={x:110,y:70},target=physicalPitchPoint(6,barrel,{x:1,y:-.2,unitScale:.5});
    const atHalf=incomingPitchPoint(850,700,1000,release,target);
    expect(atHalf).toEqual({x:Math.round((release.x+target.x)/2),y:Math.round((release.y+target.y)/2)});
    expect(incomingPitchPoint(1000,700,1000,release,target)).toEqual(target);
    expect(passedPitchPoint(1000,1000,release,target)).toEqual(target);
    expect(passedPitchPoint(1100,1000,release,target)).not.toEqual(target);
  });

  it('does not schedule motion with reduced motion, hidden/context-lost state, or missing canvas context',()=>{
    expect(shouldAnimatePixelScene({active:true})).toBe(true);
    for(const blocked of [{reducedMotion:true},{hidden:true},{contextLost:true},{inspected:true},{active:false}])
      expect(shouldAnimatePixelScene({active:true,...blocked})).toBe(false);
    const ctx={};expect(safe2dContext({getContext:()=>ctx})).toBe(ctx);
    expect(safe2dContext({getContext:()=>null})).toBe(null);
    expect(safe2dContext({getContext:()=>{throw Error('context unavailable')}})).toBe(null);
  });

  it('cancels the one pending animation frame during loss or cleanup',()=>{
    const cancel=vi.fn();
    expect(cancelAnimationFrameId(17,cancel)).toBe(0);
    expect(cancel).toHaveBeenCalledExactlyOnceWith(17);
    cancelAnimationFrameId(0,cancel);expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('keeps a lagged parent windup pre-impact and lets the parent impact stage release contact',()=>{
    expect(stageMotionElapsed(2400,1400,'windup')).toBe(1399);
    expect(atlasMotion({stage:'windup',elapsed:stageMotionElapsed(2400,1400,'windup'),impactAt:1400,kind:'hit',states}).contact).toBe(false);
    expect(stageMotionElapsed(30,1400,'impact')).toBe(1400);
    expect(stageMotionElapsed(2300,1400,'slowmo')).toBe(1400);
    expect(atlasMotion({stage:'impact',elapsed:stageMotionElapsed(30,1400,'impact'),impactAt:1400,kind:'hit',states}).contact).toBe(true);
    expect(stageMotionElapsed(2000,1400,'windup',{reducedMotion:true,duration:2000})).toBe(1399);
  });

  it('shows stride and cock before the empty-hand release, then follow-through and return',()=>{
    const poses={windup:[0,1,2,3],drive:[4,5,6,7],reset:[8,9,10,11]};
    expect([1000,1080,1200,1267,1350,1650,2100].map(t=>pixelPitcherFrame(t,1267,1567,poses))).toEqual([3,4,5,6,7,8,11]);
    expect(pixelPitcherFrame(0,1267,1567,poses,false)).toBe(11);
  });

  it('starts every outgoing result at the exact incoming endpoint, then separates trajectories',()=>{
    const target={x:130,y:200},results=['hit','foul','sacrifice','out'];
    for(const kind of results)expect(outgoingPitchPoint(0,target,{width:240,height:300,kind})).toEqual(target);
    const foul=outgoingPitchPoint(.5,target,{width:240,height:300,kind:'foul'});
    const hit=outgoingPitchPoint(.5,target,{width:240,height:300,kind:'hit'});
    const ground=outgoingPitchPoint(.5,target,{width:240,height:300,kind:'out'});
    expect(foul.x).toBeLessThan(target.x);expect(hit.x).toBeGreaterThan(target.x);
    expect(ground.y).toBeGreaterThan(hit.y);
  });
});
