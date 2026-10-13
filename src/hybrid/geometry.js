// Feet on the ground: u is lateral, v points from the rear plate tip toward the mound.
// MLB layout: 17-inch plate, 6-inch gaps, two equal 4×6-foot batter's boxes.
export const GROUND={halfPlate:17/24,gap:.5,boxWidth:4,boxLength:6,moundDistance:60.5};
// Trim empty sky; the complete actor boxes and home-plate ground stay inside this window.
export const VIEW={x:0,y:80,width:1280,height:640};
const origin=[450,615],rubber=[972,400],perspective=.035,lateral=[60,11];
export function projectGround(u,v){
  const d=1+perspective*v;
  return origin.map((o,i)=>(o+lateral[i]*u+((rubber[i]-o)/GROUND.moundDistance+rubber[i]*perspective)*v)/d);
}
const inner=GROUND.halfPlate+GROUND.gap,outer=inner+GROUND.boxWidth;
const back=GROUND.halfPlate-GROUND.boxLength/2,front=GROUND.halfPlate+GROUND.boxLength/2;
const box=side=>[[side*outer,back],[side*inner,back],[side*inner,front],[side*outer,front]].map(([u,v])=>projectGround(u,v));
export const FIELD={width:1280,height:720,
  batter:{x:125,y:137,w:300,h:450},
  pitcher:{x:857,y:170,w:230,h:230},
  rubber:{x:rubber[0],y:rubber[1]},
  batterBox:box(-1),oppositeBox:box(1),
  plate:[[-GROUND.halfPlate,GROUND.halfPlate*2],[GROUND.halfPlate,GROUND.halfPlate*2],[GROUND.halfPlate,GROUND.halfPlate],[0,0],[-GROUND.halfPlate,GROUND.halfPlate]].map(([u,v])=>projectGround(u,v)),
  // Chalk begins beyond the boxes, leaving the home-plate area clear as on a real field.
  foulLines:[-1,1].map(side=>[projectGround(side*6,6),projectGround(side*60,60)]),
  plateWear:[projectGround(-.35,.95),projectGround(.3,.95)],
};
// Measured on the runtime CONTACT cell (512×768): barrel outer edge (503,405).
// Leave room within the .017h ball radius so all nine zone offsets still touch the wood.
export const ACTOR_GEOMETRY={exactScale:true,contactAnchor:{x:503/512,y:405/768,baseline:1527/1536,ballOffset:.0135,zoneStep:.003}};
export const layoutStyle=({x,y,w,h})=>({left:x,top:y,width:w,height:h,bottom:'auto'});
export const points=vertices=>vertices.map(p=>p.join(',')).join(' ');
