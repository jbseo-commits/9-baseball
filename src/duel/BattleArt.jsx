import React from 'react';

// Only the already-public word chooses the artwork. Neither this component nor
// its CSS receives the hidden pitch or an unrounded probability.
export const courseMark=face=>({'드묾':'rare','가끔':'some','자주':'often','안 던짐':'closed'}[face]||null);
// Accept only already-public words, intervals and rounded integer percentages.
// A rounded 0% is not a closed course; a 0~5% interval still has a positive tone.
export function courseHeat(face){
  const words={'드묾':'1','가끔':'3','자주':'5','안 던짐':'closed','안 씀':'closed','단서 밖':'unknown','확정':'certain'};
  if(typeof face==='string'&&Object.hasOwn(words,face))return words[face];
  const exact=typeof face==='string'&&face.match(/^(\d{1,3})%$/);
  const range=typeof face==='string'&&face.match(/^(\d{1,3})~(\d{1,3})%$/);
  const low=Number(exact?.[1]??range?.[1]),high=Number(exact?.[1]??range?.[2]);
  if(!Number.isFinite(high)||low>high||high>100)return 'unknown';
  if(high===0)return 'zero';
  return high<=10?'1':high<=20?'2':high<=30?'3':high<=50?'4':'5';
}
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
