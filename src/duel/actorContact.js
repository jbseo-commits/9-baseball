// Optional calibrated contact for an authored sprite. Legacy callers retain their original aim.
export function actorContactPoint(b,zone,anchor){
  const row=zone<9?Math.floor(zone/3):2.4,col=zone<9?zone%3:2.6;
  if(!anchor)return {x:b.x+b.w/2+b.h*(.39-(col-1)*.03),y:b.y+b.h-b.h*(.53-row*.07)};
  return {
    x:b.x+b.w*anchor.x+b.h*anchor.ballOffset-(col-1)*b.h*anchor.zoneStep,
    y:b.y+b.h*(anchor.y+1-anchor.baseline)+(row-1)*b.h*anchor.zoneStep,
  };
}
