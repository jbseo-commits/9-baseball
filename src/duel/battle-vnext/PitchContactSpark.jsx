import React from 'react';
import sheetUrl from '../../../assets/production-art/pxf-hit-spark/hit-spark.png';

export const HIT_SPARK_DURATION_MS=200;
// Eight authored cells, row-major in a 3x3 sheet. No timers or CSS animation.
export function hitSparkFrame(age,{enabled=true,reduced=false,result='hit'}={}){
  if(!enabled||reduced||!['hit','foul'].includes(result)||!Number.isFinite(age)||age<0||age>=HIT_SPARK_DURATION_MS)return null;
  return Math.floor(age/(HIT_SPARK_DURATION_MS/8));
}

export default function PitchContactSpark({age,point,result,enabled=true,reduced=false}){
  const frame=hitSparkFrame(age,{enabled,reduced,result});
  if(frame===null)return null;
  const size=80;
  // Drawn BEFORE the ball: its opaque center cannot replace ball/barrel contact.
  // Small normal-blend sprite; no additive bloom, camera flash, or second marker.
  return <svg data-testid="trajectory-contact" data-pxf-frame={frame}
    x={point.x-size/2} y={point.y-size/2} width={size} height={size}
    viewBox={`${frame%3*96} ${Math.floor(frame/3)*96} 96 96`}
    overflow="hidden" opacity=".5" aria-hidden="true" style={{imageRendering:'pixelated'}}>
    <image href={sheetUrl} x="0" y="0" width="288" height="288"/>
  </svg>;
}
