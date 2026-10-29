/* battle-vnext 구장 카메라 (C02). docs/design/mockup-v1/reference/scene.js의 순수 계산을 옮긴 것.
   모든 좌표는 선정 구장 원화(1672×941)의 픽셀이다. 화면·카드 UI 좌표가 아니다.
   배경·배우·그림자는 같은 world transform 하나를 쓴다. 배우만 따로 키우거나 옮기지 않는다. */
import layout from '../../../assets/production-art/mockup-v1-intake/scene-layout.json';
import {ATBAT_COMPOSITION} from './atbat-composition.js';

const pt=p=>Object.freeze({x:p.x,y:p.y});
const actorOf=a=>Object.freeze({file:a.file,sourceWidth:a.sourceWidth,sourceHeight:a.sourceHeight,worldHeight:a.worldHeight,
  anchor:pt(a.anchor),worldFoot:pt(a.worldFoot),handedness:a.handedness,poses:a.poses});

export const SCENE=Object.freeze({
  world:Object.freeze({width:layout.world.width,height:layout.world.height}),
  home:pt(layout.landmarks.home),mound:pt(layout.landmarks.mound),
  batter:actorOf(layout.actors.batter),pitcher:actorOf(layout.actors.pitcher),
  shadows:Object.freeze(layout.shadows.map(s=>Object.freeze({...s}))),
  /* 목업 참고점. 실제 투구 동작의 release/contact 이벤트가 아니다 (C06에서 프레임 metadata로 교체) */
  sampleFlight:Object.freeze({release:pt(layout.sampleFlightOnly.release),contact:pt(layout.sampleFlightOnly.contact),
    productionEventsVerified:!!layout.sampleFlightOnly.productionEventsVerified}),
  animationReady:!!layout.animationReady,
});

/* 가로·높이 540 이하 = 아래 정렬(손패 쪽에 발이 남는다) · 세로 = .4 · PC 가로 = .42 */
export function cameraYAlign(width,height){
  const c=layout.camera;
  if(width>=height&&height<=c.shortLandscapeMaxHeight)return c.shortLandscapeYAlign;
  return width<height?c.portraitYAlign:c.desktopYAlign;
}

/* cover: 구장이 화면을 빈틈없이 덮는 가장 작은 배율 */
export function worldCamera(width,height){
  const {width:W,height:H}=SCENE.world;
  if(!(width>0)||!(height>0))return {scale:0,x:0,y:0,yAlign:cameraYAlign(width||0,height||0)};
  const scale=Math.max(width/W,height/H),yAlign=cameraYAlign(width,height);
  return {scale,x:(width-W*scale)*layout.camera.xAlign,y:(height-H*scale)*yAlign,yAlign};
}

/* Fixed union of ALL authored poses. The camera must not pump on each frame.
   The field and every actor/effect still share this single world matrix. */
export const ATBAT_BOUNDS=Object.freeze([ATBAT_COMPOSITION.batter,ATBAT_COMPOSITION.pitcher].reduce((out,a)=>{
  const k=a.worldHeight/a.sourceHeight;
  for(const f of a.frames){const [l,t,r,b]=f.alphaBounds;
    out.left=Math.min(out.left,a.worldFoot.x+(l-a.anchor.x)*k);
    out.right=Math.max(out.right,a.worldFoot.x+(r-a.anchor.x)*k);
    out.top=Math.min(out.top,a.worldFoot.y+(t-a.anchor.y)*k);
    out.bottom=Math.max(out.bottom,a.worldFoot.y+(b-a.anchor.y)*k);
  }return out;
},{left:Infinity,top:Infinity,right:-Infinity,bottom:-Infinity}));

export function atbatCamera(width,height){
  const base=worldCamera(width,height);
  if(!base.scale||width<height*.7)return base;
  const pad=8,b=ATBAT_BOUNDS;
  const scale=base.scale;
  const minX=pad-b.left*scale,maxX=width-pad-b.right*scale;
  const x=Math.max(width-SCENE.world.width*scale,Math.min(0,Math.max(minX,Math.min(maxX,width*.48-ATBAT_COMPOSITION.home.x*scale))));
  const minY=pad-b.top*scale,maxY=height-pad-b.bottom*scale;
  const y=Math.max(height-SCENE.world.height*scale,Math.min(0,Math.max(minY,Math.min(maxY,(height-SCENE.world.height*scale)*.42))));
  return {...base,scale,x,y};
}

/* 배우 상자(구장 좌표): actorScale = worldHeight/sourceHeight, origin = worldFoot − anchor×scale */
export function actorBox(actor){
  const scale=actor.worldHeight/actor.sourceHeight;
  return {x:actor.worldFoot.x-actor.anchor.x*scale,y:actor.worldFoot.y-actor.anchor.y*scale,
    width:actor.sourceWidth*scale,height:actor.worldHeight,scale};
}

export const toScreen=(camera,p)=>({x:p.x*camera.scale+camera.x,y:p.y*camera.scale+camera.y});
export const cameraMatrix=camera=>`matrix(${camera.scale},0,0,${camera.scale},${camera.x},${camera.y})`;

/* C04/C05 오버레이가 쓸 화면 좌표 묶음 (Scene root 기준 px) */
export function sceneSnapshot(width,height,insetBottom=0,framing='cover'){
  const camera=(framing==='atbat'?atbatCamera:worldCamera)(width,Math.max(1,height-insetBottom)),at=p=>toScreen(camera,p);
  const composition=framing==='atbat'?ATBAT_COMPOSITION:SCENE;
  return {width,height,camera,home:at(composition.home),mound:at(composition.mound),
    batterFoot:at(composition.batter.worldFoot),pitcherFoot:at(composition.pitcher.worldFoot),
    release:at(composition.release||SCENE.sampleFlight.release),contact:at(composition.contact||SCENE.sampleFlight.contact)};
}
