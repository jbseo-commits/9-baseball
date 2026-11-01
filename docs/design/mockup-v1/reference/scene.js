// All coordinates belong to the stadium drawing, not to the screen or card UI.
export const DIAMOND = Object.freeze({
 width:1672,height:941,
 home:{x:815,y:824},mound:{x:832,y:580},
 batter:{height:670,cellWidth:1024,cellHeight:1536,anchor:{x:470,y:1485},foot:{x:520,y:909}},
 pitcher:{height:310,cellWidth:1024,cellHeight:1536,anchor:{x:595,y:1495},foot:{x:832,y:580}},
});
export function worldCamera(width,height){
 const scale=Math.max(width/DIAMOND.width,height/DIAMOND.height);
 const yAlign=width>=height&&height<=540?1:width<height?.4:.42;
 return {scale,x:(width-DIAMOND.width*scale)/2,y:(height-DIAMOND.height*scale)*yAlign};
}
export function actorBox(actor){
 const scale=actor.height/actor.cellHeight;
 return {x:actor.foot.x-actor.anchor.x*scale,y:actor.foot.y-actor.anchor.y*scale,width:actor.cellWidth*scale,height:actor.height};
}
export function layoutDiamond(){
 const field=document.querySelector('.field'),world=document.querySelector('.diamond-world');
 const camera=worldCamera(field.clientWidth,field.clientHeight);
 world.style.transform=`matrix(${camera.scale},0,0,${camera.scale},${camera.x},${camera.y})`;
 for(const name of ['batter','pitcher']){
  const box=actorBox(DIAMOND[name]),el=document.querySelector('.actor-'+name);
  Object.assign(el.style,{left:box.x+'px',top:box.y+'px',width:box.width+'px',height:box.height+'px'});
 }
 // Flight starts at the pitcher's release area and travels toward home.
 const point=p=>({x:p.x*camera.scale+camera.x,y:p.y*camera.scale+camera.y});
 const release=point({x:790,y:361}),contact=point({x:760,y:653});
 field.style.setProperty('--release-x',release.x+'px');field.style.setProperty('--release-y',release.y+'px');
 field.style.setProperty('--contact-x',contact.x+'px');field.style.setProperty('--contact-y',contact.y+'px');
 window.mockupScene={camera,home:point(DIAMOND.home),mound:point(DIAMOND.mound),batterFoot:point(DIAMOND.batter.foot),pitcherFoot:point(DIAMOND.pitcher.foot)};
 return {release,contact};
}
