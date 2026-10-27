import React,{useId} from 'react';

/* Full illustration or one complete cell, never the whole 2x2 atlas. */
export default function LandscapeCardArt({src,atlasSrc,position='0% 0%'}){
  const clip='wide-card-'+useId();
  const [x,y]=position.split(' ').map(p=>p==='100%'?1:0);
  return src?<img className="bp-wide-card-image" src={src} alt="" draggable={false}/>
    :<svg className="bp-wide-atlas" viewBox={`${x*678} ${y*581} 678 581`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs><clipPath id={clip}><rect x={x*678} y={y*581} width="678" height="581"/></clipPath></defs>
      <image href={atlasSrc} width="1356" height="1162" clipPath={`url(#${clip})`}/>
    </svg>;
}
