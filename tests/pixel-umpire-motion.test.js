import {describe,it,expect,vi} from 'vitest';
import {atlasCell,atlasMotion,cancelAnimationFrameId,contactShadowRects,coverPlacement,incomingPitchPoint,normalizedActorFrame,orientedBatterBox,outgoingPitchPoint,passedPitchPoint,pixelBallRects,pixelPitcherFrame,safe2dContext,sequenceFrame,shouldAnimatePixelScene,sourceFeetForFrame,sourcePointForFrame,physicalPitchPoint,stageMotionElapsed,transformedPoint,PIXEL_SCENE_BASE_WIDTH,PIXEL_SCENE_SCALE,PIXEL_SCENE_WIDTH} from '../src/duel/pixel-umpire-motion.js';
import v2Manifest from '../assets/production-art/pixel-umpire-v2/runtime/manifest.json' with {type:'json'};

const states={windup:[0,1,2,3],swing:[4,5,6,7],follow:[8,9],reset:[10,11],bunt:[12,13],drive:[0,1,2,3]};

describe('pixel umpire presentation-only timeline',()=>{
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
