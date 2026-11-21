/* Review rules v1. Stable IDs are independent of legacy power/link/hold saves.
 * Art remains explicitly held: no concept sheet is a production atlas. */
export const HITTER_CLASSES=Object.freeze([
 {id:'slugger-v1',name:'슬러거',tone:'power',tag:'좁게 · 크게',desc:'한 칸에 장타를 건다. 강타는 에너지 2.',kinds:['slug','slug','soloShot','gapHunter','loadPower','setup','watch'],featured:['slug','loadPower','soloShot']},
 {id:'contact-v1',name:'컨택 히터',tone:'hold',tag:'넓게 · 단타',desc:'넓은 커트와 단타로 버틴다. 큰 한 방은 적다.',kinds:['defend','defend','tableSetter','cutMaster','eyeLevel','calm','watch'],featured:['defend','tableSetter','cutMaster']},
 {id:'bad-ball-v1',name:'배드볼 히터',tone:'hold',tag:'존 밖 · 위험',desc:'존 밖 베팅: 단타 45%·파울 15%. 존 안은 헛스윙.',kinds:['chaseBall','chaseBall','cutMaster','foulTip','fightOff','scout','watch'],featured:['chaseBall','scout','cutMaster']},
 {id:'spray-v1',name:'스프레이 히터',tone:'link',tag:'타구 방향 선택',desc:'당김은 장타, 중앙은 범위, 밀기는 주자 진루.',kinds:['sprayPull','sprayCenter','sprayPush','insideGuard','outsideReach','setup','watch'],featured:['sprayPull','sprayCenter','sprayPush']},
]);
export const hitterClass=id=>HITTER_CLASSES.find(x=>x.id===id)||null;
export const CLASS_CARDS={
 twoStrikeRelay:{name:'끝까지 연결',type:'attack',art:'double',family:'relay',shape:'point',singles:true,advance:3,requires:'twoStrike',rewardClass:'contact-v1',rarity:'uncommon',flavor:'버틸지, 한 칸을 믿을지.',role:'진루',axis:'point',gives:['1존 · 단타','기존 주자 홈인'],needs:['2스트라이크'],text:'컨택 전용 · 2스트라이크에서만. 선택 1존의 주공격 적중은 단타, 기존 주자는 최소 3루 진루. 빗나가면 기본 파울·헛스윙 확률 그대로이며 삼진될 수 있다. 지원 적중에는 주자 진루 효과가 없다.'},
 chaseBall:{name:'존 밖 베팅',type:'attack',art:'bat',family:'grind',shape:'point',power:0,singles:true,outsideBet:true,starterOnly:true,rarity:'common',flavor:'선택한 타격 방식으로 승부한다.',role:'생존',axis:'point',gives:['존 밖 단타 45%','파울 15%'],needs:['에너지 2','존 안 헛스윙'],text:'배드볼 전용 · 에너지 2. 노림 칸과 무관하게 존 밖만 베팅. 볼이면 단타 45%·파울 15%·헛스윙 40%. 존 안은 헛스윙. 단타 피해 최대 8. 지원 카드로 사용할 수 없다. (검수 규칙)'},
 sprayPull:{name:'당김 드라이브',type:'attack',art:'bat',family:'power',shape:'point',power:2,hrCap:true,battedDirection:'left',starterOnly:true,rarity:'common',flavor:'선택한 타격 방식으로 승부한다.',role:'장타',axis:'point',gives:['좌측 타구','파워 +36'],needs:['1존'],text:'스프레이 전용 · 선택 1존. 파워 +36. 메인 적중 타구를 좌측으로 보낸다. 방향이 공의 코스나 적중률을 바꾸지는 않는다.'},
 sprayCenter:{name:'중앙 드라이브',type:'attack',art:'bat',family:'lane',shape:'column',power:0,battedDirection:'center',starterOnly:true,rarity:'common',flavor:'선택한 타격 방식으로 승부한다.',role:'범위',axis:'column',gives:['중앙 타구','세로 3존'],needs:[],text:'스프레이 전용 · 선택 세로 3존. 메인 적중 타구를 중앙으로 보낸다.'},
 sprayPush:{name:'밀기 드라이브',type:'attack',art:'bat',family:'relay',shape:'row',power:0,singles:true,advance:2,battedDirection:'right',starterOnly:true,rarity:'common',flavor:'선택한 타격 방식으로 승부한다.',role:'진루',axis:'row',gives:['우측 타구','기존 주자 +2루'],needs:['단타 한정'],text:'스프레이 전용 · 선택 가로 3존. 메인 적중은 단타, 기존 주자 +2루. 타구를 우측으로 보낸다.'},
};
export const CLASS_ART_STATUS=Object.freeze(Object.fromEntries(HITTER_CLASSES.map(c=>[c.id,{status:'held',atlas:null,reason:'Distinct approved native poses not available; retain shared approved actor.'}])));
