// Small first-three-reward slice. No new gauge, hidden pitch read, or RNG draw.
export const HITTER_BUILDS=Object.freeze({
 'slugger-v1':{passive:'준비 후 1칸 주공격 적중: 피해 +6',branches:[{name:'예고포',why:'힘을 모아 한 칸을 노린다',cards:['loadPower','calledShot','onePatience']},{name:'주자 청소',why:'출루시킨 뒤 장타로 회수',cards:['tableSetter','basesLoaded','walkOff']}]},
 'contact-v1':{passive:'주공격 단타 +2 · 2S 커트 피해 최소 2',branches:[{name:'단타 순환',why:'2S 한 칸 적중으로 주자를 홈까지',cards:['twoStrikeRelay','quickWrists','eyeTest']},{name:'풀카운트 생존',why:'두 스트라이크에서 커트로 버틴다',cards:['cutMaster','fightOff','wearDown']}]},
 'bad-ball-v1':{passive:'지켜본 볼 피해 +2 · 존 밖 베팅은 단독 사용',branches:[{name:'악구 매복',why:'공개 단서를 읽고 밖에 한 번 건다',cards:['scout','chaseBall','zoneJudge']},{name:'볼넷 압박',why:'비슷한 공을 흘려보내며 압박',cards:['takeSign','walkHunter','eyeTest']}]},
 'spray-v1':{passive:'당김은 장타 · 중앙은 세로 · 밀기는 주자 +2루',branches:[{name:'코스 대응',why:'한 칸 장타와 세로 범위를 고른다',cards:['sprayPull','sprayCenter','insideGuard']},{name:'밀어치기 연계',why:'주자를 두고 가로 단타로 진루',cards:['sprayPush','tableSetter','hitAndRun']}]},
});
export const classBuild=state=>state?.v10?.hitterClass?.buildVersion===1?HITTER_BUILDS[state.v10.hitterClass.id]||null:null;
export function classRewardPool(state,common){
 const build=classBuild(state),n=(state?.rewards||[]).length;if(!build||n>=3)return common;
 const signature=common.length>3?common.at(-1):null;const pair=build.branches.map(b=>b.cards[n]);if(state.v10.hitterClass.id==='contact-v1'&&n===0)common=['slug',...common];return [...new Set([...pair,...common.filter(k=>!pair.includes(k)).slice(0,1),...(signature?[signature]:[])])];
}
export function classRewardLabel(state,kind){const b=classBuild(state),n=(state?.rewards||[]).length;
 // Persisted pre-relay reward choices remain authoritative after upgrading.
 if(b&&state.v10.hitterClass.id==='contact-v1'&&n===0&&kind==='tableSetter'&&state.v10.rewardChoices?.includes(kind))return b.branches[0].name;
 return n<3?b?.branches.find(x=>x.cards[n]===kind)?.name||null:null;}
export function classDamagePlan(state,{r,choice,action,outcome}){
 if(!classBuild(state))return {bonus:0,events:[]};const id=state.v10.hitterClass.id;let bonus=0,label='',minimumDamage=0;
 if(id==='slugger-v1'&&r.kind==='hit'&&!r.assistOnly&&state.battle?.preparations>0&&r.primaryCoverage?.length===1&&r.primaryCoverage.includes(r.zone)){bonus=6;label='슬러거 · 준비한 한 칸';}
 if(id==='contact-v1'&&r.kind==='hit'&&!r.assistOnly&&outcome?.bases===1){bonus=2;label='컨택 · 단타 순환';}
 if(id==='contact-v1'&&r.kind==='foul'&&state.battle?.strikes===2){minimumDamage=2;label='컨택 · 풀카운트 생존';}
 if(id==='bad-ball-v1'&&action.type==='take'&&r.kind==='ball'){bonus=2;label='배드볼 · 볼 압박';}
 return {bonus,minimumDamage,events:bonus?[`${label} · 피해 +${bonus} HP`]:minimumDamage?[`${label} · 파울 피해 최소 2 HP`]:[]};
}
