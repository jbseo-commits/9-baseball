import React from 'react';
import {resultSequence} from '../presentation-snapshot.js';

export default function ResultSequence({result,execution}){
  const steps=resultSequence(result,execution);
  if(!steps.length)return null;
  return <ol className="bv-result-sequence" aria-label="실제 발동 순서" data-testid="bv-result-sequence">
    {steps.map((s,i)=><li key={s.kind} className={'k-'+s.kind} style={{'--beat-delay':70+i*75+'ms'}}>{s.text}</li>)}
  </ol>;
}
