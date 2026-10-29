/* Measured on the actual old artwork. Comparison-only; no engine or global CSS. */
export const LEGACY_FIELD=Object.freeze({width:941,height:1672,
  rubber:Object.freeze({x:644,y:844}),home:Object.freeze({x:468,y:1355}),
  batterFoot:Object.freeze({x:120,y:1460}),
  batter:Object.freeze({cellWidth:512,cellHeight:768,anchorX:140,anchorY:763,worldHeight:480}),pitcherWorldHeight:270});
export function legacySceneGeometry(width){
  const w=Math.max(1,Number(width)||440),scale=w/LEGACY_FIELD.width,height=Math.round(w*1.04);
  const y=height-12-LEGACY_FIELD.batterFoot.y*scale,at=p=>({x:p.x*scale,y:p.y*scale+y});
  const m=LEGACY_FIELD.batter,h=m.worldHeight*scale,fw=h*m.cellWidth/m.cellHeight,foot=at(LEGACY_FIELD.batterFoot);
  const batter={x:foot.x-h/2+fw/2-m.anchorX*h/m.cellHeight,y:foot.y-h,width:h,height:h,frameWidth:fw};
  const ph=LEGACY_FIELD.pitcherWorldHeight*scale,rubber=at(LEGACY_FIELD.rubber);
  return {width:w,height,scale,background:{x:0,y,width:w,height:LEGACY_FIELD.height*scale},rubber,home:at(LEGACY_FIELD.home),foot,
    batter,pitcher:{x:rubber.x-ph/2,y:rubber.y-ph,width:ph,height:ph},zone:{x:w-168,y:height-168,width:156,height:156}};
}
export function comparisonFrameSize(variant,width,height){
  const w=Math.max(1,width),h=Math.max(1,height);
  return variant==='legacy'?{w:Math.min(440,w),h}:{w,h:w<600?h:Math.min(h,Math.floor(w*9/16))};
}
export function legacySceneVars(g){
  const px=n=>n+'px';return {'--lc-scene-h':px(g.height),'--lc-bg-w':px(g.background.width),'--lc-bg-h':px(g.background.height),'--lc-bg-y':px(g.background.y),
    '--lc-batter-x':px(g.batter.x),'--lc-batter-y':px(g.batter.y),'--lc-batter-h':px(g.batter.height),'--lc-batter-shadow-x':px(g.foot.x-g.batter.x),
    '--lc-pitcher-x':px(g.pitcher.x),'--lc-pitcher-y':px(g.pitcher.y),'--lc-pitcher-h':px(g.pitcher.height),'--lc-zone-x':px(g.zone.x),'--lc-zone-y':px(g.zone.y)};
}
