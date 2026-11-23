// Landed public result copy only. No new tutorial state or hidden pitch reads.
export function firstPitchLesson(s){
 if(s?.version!==10||!(s.stats?.pitches>=1&&s.stats.pitches<=3))return '';
 const r=s.battle?.revealed;
 if(r?.action!=='take')return '';
 if(r.kind==='ball')return r.label==='볼넷'?'4볼 · 진루':s.phase==='pitch'?'볼 +1 · 같은 타자 계속':'볼 +1';
 if(r.kind==='called')return /삼진/.test(r.label||'')?'삼진 · 아웃':s.phase==='pitch'?'스트라이크 +1 · 같은 타자 계속':'스트라이크 +1';
 return '';
}
