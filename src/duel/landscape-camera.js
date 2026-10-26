/* Presentation-only camera. Metres, +z toward the pitcher, y above the dirt.
   A compressed lens behind home plate keeps the short landscape strip readable.
   No engine state, pitch probabilities or save values enter this module. */
export const FIELD={plate:.4318,rubberDistance:18.4404,rubberWidth:.6096,moundRadius:2.7432,boxWidth:1.2192,boxDepth:1.8288,boxGap:.1524};
export const CAMERA={yaw:-20*Math.PI/180,distance:10,eye:2,aspect:384/320};
export function cameraLens(width,height){
  const focal=Math.min(height*3.6,width*1.7);
  // One shared optical centre, constrained by the complete batter/bat envelope.
  return {focal,x:Math.max(width*.30,focal*.26),y:height*.9-focal*CAMERA.eye/CAMERA.distance};
}
export function projectField(width,height,x,z,y=0){
  const c=Math.cos(CAMERA.yaw),s=Math.sin(CAMERA.yaw),depth=CAMERA.distance+x*s+z*c;
  const lens=cameraLens(width,height);
  return {x:lens.x+lens.focal*(x*c-z*s)/depth,y:lens.y+lens.focal*(CAMERA.eye-y)/depth};
}
export function cameraGeometry(width,height){
  const at=(x,z,y=0)=>projectField(width,height,x,z,y);
  const plate=at(0,0),rubber=at(0,FIELD.rubberDistance,.254);
  const {focal}=cameraLens(width,height),feet=at(-.96,-.25),h=Math.min(height*.89,focal*.255),w=h*CAMERA.aspect;
  const contact=at(.03,.15,1.30);
  // The new sheet's contact bat crosses the plate at this height. The 9-zone
  // proxy stays small and quiet: the actual tactical board remains in the dock.
  const strikeScale=focal/(CAMERA.distance+.15*Math.cos(CAMERA.yaw)),tw=strikeScale*.5,th=strikeScale*.62;
  const target={x:contact.x-tw/2,y:contact.y-th/2,w:tw,h:th};
  const ph=focal*2.3/(CAMERA.distance+FIELD.rubberDistance*Math.cos(CAMERA.yaw));
  return {plate,rubber,feet,contact,target,batter:{x:feet.x-w/2,y:feet.y-h,w,h},pitcher:{x:rubber.x-ph/2,y:rubber.y-ph,w:ph,h:ph}};
}
export function targetPoint(box,zone){
  if(!box)return null;
  return {x:box.x+box.w*(zone===9?1.18:((zone??4)%3+.5)/3),y:box.y+box.h*(zone===9?.5:(Math.floor((zone??4)/3)+.5)/3)};
}
export function groundPolygon(width,height,points){return points.map(([x,z,y])=>{const p=projectField(width,height,x,z,y||0);return `${p.x},${p.y}`;}).join(' ');}
