import React from 'react';
import {ANIMATION_RATES} from '../animation-speed.js';
import './animation-speed.css';
export default function AnimationSpeed({rate=1,onChange,disabled=false}){
  if(!onChange)return null;
  return <label className="bv-speed-control" title={disabled?'진행 중인 연출이 끝나면 배속을 바꿀 수 있습니다.':'연출 속도'}>
    <span>연출 속도</span><select aria-label="애니메이션 배속" value={rate} disabled={disabled} onChange={e=>{if(!disabled)onChange(Number(e.target.value));}}>
      {ANIMATION_RATES.map(r=><option key={r} value={r}>{r}×</option>)}
    </select>
  </label>;
}
