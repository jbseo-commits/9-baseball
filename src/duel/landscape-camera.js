/* Presentation-only camera. Metres, +z toward the pitcher, y above the dirt.
   A compressed lens behind home plate keeps the short landscape strip readable.
   No engine state, pitch probabilities or save values enter this module. */
export const FIELD={plate:.4318,rubberDistance:18.4404,rubberWidth:.6096,moundRadius:2.7432,boxWidth:1.2192,boxDepth:1.8288,boxGap:.1524};
export function projectField(width,height,x,z,y=0){
  const depth=z+10;
  return {x:width*.5+height*4*x/depth,y:height*(.3+4*((2-y)/depth-.05))};
}
export function cameraGeometry(width,height){
  const at=(x,z,y=0)=>projectField(width,height,x,z,y);
  const plate=at(0,0),rubber=at(0,FIELD.rubberDistance,.254);
  const feet=at(-.96,-.25),h=height*.94,w=h*.75;
  const contact=at(.03,.15,1.02);
  // The new sheet's contact bat crosses the plate at this height. The 9-zone
  // proxy stays small and quiet: the actual tactical board remains in the dock.
  const target={x:contact.x-height*.095,y:contact.y-height*.09,w:height*.19,h:height*.18};
  return {plate,rubber,feet,contact,target,batter:{x:feet.x-w/2,y:feet.y-h,w,h},pitcher:{x:rubber.x-height*.18,y:rubber.y-height*.36,w:height*.36,h:height*.36}};
}
export function targetPoint(box,zone){
  if(!box)return null;
  return {x:box.x+box.w*(zone===9?1.18:((zone??4)%3+.5)/3),y:box.y+box.h*(zone===9?.5:(Math.floor((zone??4)/3)+.5)/3)};
}
export function groundPolygon(width,height,points){return points.map(([x,z,y])=>{const p=projectField(width,height,x,z,y||0);return `${p.x},${p.y}`;}).join(' ');}
