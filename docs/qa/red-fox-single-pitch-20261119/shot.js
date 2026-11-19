export const POSES=['set','lift','stride','release','follow','recover'];
export const ANCHORS=[[39,89],[44,90],[65,91],[64,92],[47,92],[61,92]];
export const TIMES=[0,500,850,1100,1260,1600,2200];
export function shotAt(ms){const t=Math.max(0,ms);let index=5;for(let i=0;i<6;i++)if(t<TIMES[i+1]){index=i;break}const destination=index<2?[184,165]:[222,171],anchor=ANCHORS[index],origin=[destination[0]-anchor[0],destination[1]-anchor[1]];
 const u=(t-1100)/480,ball=u>=0&&u<1?{x:189+11*u,y:91+123*u,r:1.5+2*u}:null;
 return {index,pose:POSES[index],origin,destination,anchor,ball,preparing:t<500,done:t>=2200};}
