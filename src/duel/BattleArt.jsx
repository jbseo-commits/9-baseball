import React from 'react';

// Only the already-public word chooses the artwork. Neither this component nor
// its CSS receives the hidden pitch or an unrounded probability.
export const courseMark=face=>({'드묾':'rare','가끔':'some','자주':'often','안 던짐':'closed'}[face]||null);
export function BattleIcon({kind,className=''}){
  return <i className={`ba-icon ba-${kind} ${className}`} aria-hidden="true"/>;
}
export function CourseMark({face}){
  const mark=courseMark(face);
  return mark?<i className={`ba-course ba-${mark}`} data-course-mark={mark} aria-hidden="true"/>:null;
}
export function CourseLegend({level=0}){
  return <div className="ba-legend" aria-label="코스 표식: 공 한 개는 드묾, 두 개는 가끔, 세 개는 자주, 빗금은 안 던짐">
    {level===0&&<span><CourseMark face="자주"/>공이 많을수록 자주</span>}
    <span><CourseMark face="안 던짐"/>안 던짐</span>
  </div>;
}
