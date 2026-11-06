/* Public, deterministic pitcher signatures for newly generated run maps. */
const row=(z)=>Math.floor(z/3), col=(z)=>z%3;
const signatures=[
 ['regular-01-red-rush','연속 직구','같은 직구 코스를 연속해 노립니다. 정타 보너스 +2 HP.','연속 공략을 노리세요.',{pattern:'repeat',target:4,bonus:2}],
 ['regular-02-teal-mirage','청록 왕복','바깥쪽 위아래를 번갈아 노립니다. 직전과 다른 노림의 안타 +4 HP, 반복 노림은 기본 피해 ×0.8.','노림을 바꾸고 바깥 높낮이를 읽으세요.',{pattern:'outer-vertical',bonus:4}],
 ['regular-03-amber-sinker','낮은 갑옷','낮은 코스를 넓게 노립니다. 좁은 낮은 정타 +4 HP, 낮은 3존 이상 겹침 기본 피해 ×0.8.','낮은 곳은 좁게 노리세요.',{pattern:'low',bonus:4}],
 ['regular-04-ivory-ace','세 구의 서명','몸쪽·중앙·바깥을 차례로 노립니다. 세 번째 공의 안타 +5 HP.','세 번째 공을 준비하세요.',{pattern:'columns',bonus:5}],
 ['regular-05-violet-sting','중단 횡단','중단 열을 가로질러 노립니다. 본 카드 정타 +4 HP, 지원만 적중하면 기본 피해 ×0.8.','중단 정타를 본 카드로 노리세요.',{pattern:'middle',bonus:4}],
 ['regular-06-rose-paint','모서리 순환','존 모서리를 차례로 노립니다. 모서리 정타 +4 HP.','모서리 코스를 읽으세요.',{pattern:'corners',bonus:4}],
 ['tide-vesper','밀물과 썰물','낮은 공과 높은 공을 번갈아 노립니다. 지켜본 다음 안타 +5 HP.','높낮이 교대를 읽고 기다린 뒤 승부하세요.',{pattern:'row-alternate',bonus:5}],
 ['sky-phantom','하늘 그물','높은 공을 선호하고 깊은 수비를 합니다. 홈런 +8 HP.','높은 공을 공략해 큰 타구를 노리세요.',{pattern:'high',bonus:8,deep:true}],
 ['elite-01-cobalt-impact','압축 압박','투스트라이크에 압박이 강해집니다. 투스트라이크 정타 +6 HP, 초구 기본 피해 ×0.85.','투스트라이크 전에 흐름을 끊으세요.',{pattern:'pressure',bonus:6}],
 ['elite-02-neon-trick','삼각 잔상','세 코스를 삼각 순서로 노립니다. 직전과 다른 노림의 안타 +6 HP.','노림을 바꾸며 삼각 순환을 읽으세요.',{pattern:'triangle',bonus:6}],
 ['elite-03-wine-bluff','볼 유인','존 밖 볼을 유인합니다. 실제 볼을 지켜보면 +3 HP.','존 밖 공은 참으세요.',{pattern:'bluff',bonus:3}],
 ['gale-twister','시계 회전','코스를 시계 방향 순서로 노립니다. 카드 두 장 연결 안타 +6 HP.','회전 순서와 카드 연결을 활용하세요.',{pattern:'clockwise',bonus:6}],
 ['vulcan-blaze','삼구 과열','세 번째 공은 취약하고 나머지는 단단합니다. 세 번째 안타 +8 HP, 그 외 기본 피해 ×0.85.','세 번째 공을 기다리세요.',{pattern:'heat',bonus:8}],
 ['jade-viper','허물 방패','직전 안타 뒤 다음 공 기본 피해 ×0.75. 연속 본 카드 정타로 깨면 +8 HP가 별도 추가됩니다.','연속 정타로 방패를 돌파하세요.',{pattern:'shell',bonus:8}],
 ['copper-sirocco','모래 폭풍','두 볼 전 준비는 타석당 1회, 두 볼 뒤 준비 횟수는 기본값입니다. 두 볼 뒤 안타 +6 HP.','볼카운트를 활용하세요.',{pattern:'sand',bonus:6}],
 ['boss-01-emerald-tyrant','낮은 성벽','낮은 코스 3존 이상 겹침 기본 피해 ×0.7, 좁은 낮은 정타 +8 HP.','낮은 코스를 좁게 공략하세요.',{pattern:'low',bonus:8}],
 ['boss-02-platinum-halo','후광 거울','세 장 겹침 기본 피해 ×0.75. 홈런 +10 HP가 별도 추가됩니다.','큰 타구로 후퇴 수비를 넘으세요.',{pattern:'high',bonus:10}],
 ['boss-03-black-eclipse','검은 역광','직전 노림 반대 열을 선호합니다. 다른 열 정타 +8 HP.','직전과 다른 열을 노리세요.',{pattern:'opposite',bonus:8}],
 ['emerald-tempest','세 높이의 폭풍','높음·중간·낮음 순서로 노립니다. 세 번째 공의 연결 적중 +10 HP.','세 번째 공에 카드를 연결하세요.',{pattern:'rows',bonus:10}],
 ['onyx-eclipse','오닉스 사각','최근 두 번 쓰지 않은 열을 노립니다. 세 번째 공은 스택 최대 2장, 정타 +10 HP.','안 쓴 열과 세 번째 공에 대비하세요.',{pattern:'unused-column',bonus:10}],
];
export const PITCHER_ENCOUNTERS=Object.freeze(Object.fromEntries(signatures.map(([id,label,summary,counter,effect])=>[id,Object.freeze({version:1,id,label,summary,counter,effect:Object.freeze(effect)})])));
export const encounterFor=id=>{const x=PITCHER_ENCOUNTERS[id];return x?{version:1,id:x.id,label:x.label,summary:x.summary,counter:x.counter}:null;};
export function encounterStatus(state,preferredZones=[]){
 const o=state?.v10?.opponent,e=PITCHER_ENCOUNTERS[o?.artId],b=state?.battle;
 if(state?.version!==10||!e||o?.encounter?.version!==1)return null;
 const active=state?.defenseLab?.schema!==1&&!state?.v10?.zoneFirst;
 const phase={steady:'안정',pressured:'압박',critical:'위기',defeated:'격파'}[state?.pitcher?.phase]||'안정';
 const count=Number.isInteger(b?.pitchCount)?b.pitchCount:(b?.history||[]).length;
 const triggers={
  'regular-04-ivory-ace':`세 구 순서 ${count%3+1}/3`,
  'regular-06-rose-paint':`모서리 순환 ${count%4+1}/4`,
  'tide-vesper':`높낮이 교대 ${count%2+1}/2`,
  'elite-01-cobalt-impact':count===0?'초구 피해 감소':b?.strikes===2?'투스트라이크 압박':'초구 효과 해제',
  'elite-02-neon-trick':`삼각 순환 ${count%3+1}/3`,
  'gale-twister':`시계 회전 ${count%4+1}/4`,
  'vulcan-blaze':count%3===2?'3구째 과열 해제':'과열 중 · 3구째 취약',
  'copper-sirocco':`${b?.balls||0}볼 · ${b?.balls>=2?'전용 준비 제한 해제':'전용 준비 1회 제한'}`,
  'emerald-tempest':`높중낮 순환 ${count%3+1}/3`,
  'onyx-eclipse':`미사용 열 탐색 · ${count%3===2?'3구째 스택 2장 제한':'3구째 스택 제한 대기'}`,
 };
 const words=['몸쪽 위','가운데 위','바깥 위','몸쪽','가운데','바깥','몸쪽 아래','가운데 아래','바깥 아래','존 밖'];
 const preference=preferredZones.length?` · ${preferredZones.map(z=>words[z]).join('·')} 선호`:'';
 return {label:e.label,summary:e.summary,current:`${triggers[e.id]||`${b?.balls||0}볼 ${b?.strikes||0}스트라이크`}${preference} · ${phase}`,counter:e.counter,active};
}
const nearest=(target,live)=>live.reduce((a,b)=>Math.abs(a-target)<Math.abs(b-target)?a:b,live[0]);
const normalize=(w,live)=>{for(let z=0;z<9;z++)if(!live.includes(z))w[z]=0;const total=w.reduce((a,b)=>a+b,0);return total?w.map(x=>x/total):Array.from({length:10},(_,i)=>i===9?1:0);};
export function encounterDistribution(state,weights,live,trickRate=0){
 const o=state?.v10?.opponent,e=PITCHER_ENCOUNTERS[o?.artId];if(state?.version!==10||!e||o?.encounter?.version!==1||state?.defenseLab?.schema===1||state?.v10?.zoneFirst)return null;
 const b=state.battle,pat=e.effect.pattern,w=[...weights],zones=live.length?live:[9], aim=b.history.filter(h=>Number.isInteger(h.aimZone)).map(h=>h.aimZone),target=(z)=>nearest(z,zones),i=Number.isInteger(b.pitchCount)?b.pitchCount:b.history.length;
 let preferred=null, rowTarget=null;
 if(pat==='repeat')preferred=target(4);
 else if(pat==='outer-vertical')preferred=target(i%2?8:2);
 else if(pat==='low')rowTarget=2;
 else if(pat==='columns')preferred=target([0,4,8][i%3]);
 else if(pat==='middle')rowTarget=1;
 else if(pat==='corners')preferred=target([0,2,8,6][i%4]);
 else if(pat==='high')rowTarget=0;
 else if(pat==='triangle')preferred=target([0,4,8][i%3]);
 else if(pat==='clockwise')preferred=target([0,2,8,6][i%4]);
 else if(pat==='opposite'&&aim.length)preferred=zones.find(z=>col(z)===2-col(aim.at(-1)))??target(2-col(aim.at(-1)));
 else if(pat==='rows')rowTarget=[0,1,2][i%3];
 else if(pat==='unused-column'){const used=new Set(aim.slice(-2).map(col));preferred=zones.find(z=>!used.has(col(z)))??target([0,1,2].find(c=>!used.has(c))??1);}
 else if(pat==='row-alternate')rowTarget=i%2?0:2;
 else if(pat==='pressure'){if(b.strikes===2)preferred=target(3);else rowTarget=1;}
 else if(pat==='bluff')preferred=9;
 else if(pat==='heat')rowTarget=i%3===2?1:0;
 else if(pat==='shell')rowTarget=2;
 else if(pat==='sand')preferred=target(4);
 let targets=preferred===9?[9]:preferred!=null?[preferred]:zones.filter(z=>row(z)===rowTarget);
 if(rowTarget!=null&&!targets.length){const availableRows=[...new Set(zones.map(row))],closest=availableRows.reduce((a,b)=>Math.abs(a-rowTarget)<Math.abs(b-rowTarget)?a:b,availableRows[0]);targets=zones.filter(z=>row(z)===closest);}
 if(targets.length){const before=w.reduce((a,x)=>a+x,0),share=.28;for(const z of targets)w[z]+=share*before/targets.length;}
 // Movement is folded into the advertised final distribution before the only sample.
 const hasMove=trickRate>0&&(e.id==='jade-viper'||e.id==='elite-02-neon-trick'||e.id==='gale-twister');
 if(hasMove){
  const rate=trickRate, moved=Array(10).fill(0);
  for(let z=0;z<10;z++){if(z===9){moved[z]+=w[z];continue;}const ns=[z%3?z-1:-1,z%3<2?z+1:-1,z>=3?z-3:-1,z<6?z+3:-1].filter(n=>n>=0&&live.includes(n));if(!ns.length)moved[z]+=w[z];else{moved[z]+=w[z]*(1-rate);for(const n of ns)moved[n]+=w[z]*rate/ns.length;}}
  for(let z=0;z<10;z++)w[z]=moved[z];
 }
 return {probabilities:normalize(w,live),encounter:e,targets,appliedDistribution:true};
}
export function encounterPlan(state,{action,choice,r,outcome,stackCardCount=1}={}){
 const o=state?.v10?.opponent,e=PITCHER_ENCOUNTERS[o?.artId];if(state?.version!==10||!e||o?.encounter?.version!==1||state?.defenseLab?.schema===1||state?.v10?.zoneFirst)return {rate:1,bonus:0,events:[]};
 const b=state.battle,aim=r?.aimZone,hit=r?.kind==='hit',exact=hit&&aim===r.zone, phase=state.pitcher?.phase||'steady';let rate=1,bonus=0,events=[];
 const prev=b.history.at(-1),pitches=(Number.isInteger(b.pitchCount)?b.pitchCount:b.history.length)+1,primary=Array.isArray(r?.primaryCoverage)?r.primaryCoverage:[],isExact=exact&&!r?.assistOnly&&primary.includes(aim);
 if(e.id==='regular-02-teal-mirage'&&hit){if(prev?.aimZone===aim)rate*=.8;else if(prev?.aimZone!=null)bonus+=4;}
 if(['regular-03-amber-sinker','boss-01-emerald-tyrant'].includes(e.id)&&hit&&row(r.zone)===2){const whole=Array.isArray(r.coverage)?r.coverage:primary,lowCover=whole.filter(z=>row(z)===2).length;if(isExact&&primary.length===1&&whole.length===1&&lowCover===1)bonus+=e.effect.bonus;else if(lowCover>=3)rate*=e.id.startsWith('boss') ? .7 : .8;}
 if(e.id==='regular-04-ivory-ace'&&hit&&pitches%3===0)bonus+=5;
 if(e.id==='regular-05-violet-sting'&&hit){if(isExact&&row(aim)===1)bonus+=4;else if(r?.assistOnly)rate*=.8;}
 if(e.id==='regular-06-rose-paint'&&isExact&&[0,2,6,8].includes(aim))bonus+=4;
 if(e.id==='tide-vesper'&&hit&&prev?.action==='take')bonus+=5;
 if(e.id==='sky-phantom'&&hit&&(r.bases||0)>=4)bonus+=8;
 if(e.id==='elite-01-cobalt-impact'){if(pitches===1)rate*=.85;if(hit&&b.strikes===2&&isExact)bonus+=6;}
 if(e.id==='elite-02-neon-trick'&&hit&&prev?.aimZone!=null&&prev.aimZone!==aim)bonus+=6;
 if(e.id==='elite-03-wine-bluff'&&r.kind==='ball'&&action?.type==='take')bonus+=3;
 if(e.id==='gale-twister'&&hit&&(r?.stackLinks||[]).length>0&&(r.stackLinks||[]).every(x=>x.connected))bonus+=6;
 if(e.id==='vulcan-blaze'){if(pitches%3===0&&hit)bonus+=8;else rate*=.85;}
 if(e.id==='jade-viper'&&prev?.kind==='hit')rate*=.75;
 if(e.id==='jade-viper'&&hit&&prev?.kind==='hit'&&prev?.exact&&isExact)bonus+=8;
 if(e.id==='copper-sirocco'&&hit&&b.balls>=2)bonus+=6;
 if(e.id==='boss-02-platinum-halo'){if(stackCardCount>=3)rate*=.75;if(hit&&(r.bases||0)>=4)bonus+=10;}
 if(e.id==='boss-03-black-eclipse'&&hit&&prev?.aimZone!=null&&col(prev.aimZone)!==col(aim)&&isExact)bonus+=8;
 if(e.id==='emerald-tempest'&&hit&&pitches%3===0&&(r?.stackLinks||[]).length>0&&(r.stackLinks||[]).every(x=>x.connected))bonus+=10;
 if(e.id==='onyx-eclipse'&&hit&&pitches%3===0&&isExact)bonus+=10;
 if(e.id==='regular-01-red-rush'&&isExact)bonus+=2;
 if(bonus)events.push(`${e.label} · 추가 피해 +${bonus} HP`);if(rate!==1)events.push(`${e.label} · 기본 피해 ×${rate.toFixed(2)} (추가 HP 별도)`);
 return {rate,bonus,events};
}
export function encounterLimits(state){
 const o=state?.v10?.opponent,e=PITCHER_ENCOUNTERS[o?.artId];
 if(state?.version!==10||!e||o?.encounter?.version!==1||state?.defenseLab?.schema===1||state?.v10?.zoneFirst)return {stackMax:4,prepMax:2};
 const pitches=(Number.isInteger(state.battle?.pitchCount)?state.battle.pitchCount:(state.battle?.history||[]).length)+1;
 return {stackMax:e.id==='onyx-eclipse'&&pitches%3===0?2:4,
  prepMax:e.id==='copper-sirocco'&&(state.battle?.balls||0)<2?1:2};
}
