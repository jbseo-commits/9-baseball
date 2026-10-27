/* battle-vnext 구장 카메라 (C02). docs/design/mockup-v1/reference/scene.js의 순수 계산을 옮긴 것.
   모든 좌표는 선정 구장 원화(1672×941)의 픽셀이다. 화면·카드 UI 좌표가 아니다.
   배경·배우·그림자는 같은 world transform 하나를 쓴다. 배우만 따로 키우거나 옮기지 않는다. */
import layout from '../../../assets/production-art/mockup-v1-intake/scene-layout.json';

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

/* 배우 상자(구장 좌표): actorScale = worldHeight/sourceHeight, origin = worldFoot − anchor×scale */
export function actorBox(actor){
  const scale=actor.worldHeight/actor.sourceHeight;
  return {x:actor.worldFoot.x-actor.anchor.x*scale,y:actor.worldFoot.y-actor.anchor.y*scale,
    width:actor.sourceWidth*scale,height:actor.worldHeight,scale};
}

export const toScreen=(camera,p)=>({x:p.x*camera.scale+camera.x,y:p.y*camera.scale+camera.y});
export const cameraMatrix=camera=>`matrix(${camera.scale},0,0,${camera.scale},${camera.x},${camera.y})`;

/* C04/C05 오버레이가 쓸 화면 좌표 묶음 (Scene root 기준 px) */
export function sceneSnapshot(width,height,insetBottom=0){
  const camera=worldCamera(width,Math.max(1,height-insetBottom)),at=p=>toScreen(camera,p);
  return {width,height,camera,home:at(SCENE.home),mound:at(SCENE.mound),
    batterFoot:at(SCENE.batter.worldFoot),pitcherFoot:at(SCENE.pitcher.worldFoot),
    release:at(SCENE.sampleFlight.release),contact:at(SCENE.sampleFlight.contact)};
}
