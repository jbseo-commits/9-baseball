import {ZONE_ORDER} from './cards.js';
import {gimmickFor} from './gimmick.js';
import pitcherRoster from '../../assets/pitcher-mobs-v1/roster.json' with {type:'json'};

const RED_RUSH_ID='regular-01-red-rush';
const TYPES=new Set(['battle','elite','training','locker','shop','rest','boss','event']);
const COMBAT_TYPES=new Set(['battle','elite','boss']);
const LABELS={
  battle:'정규 승부',elite:'강적 승부',training:'타격 훈련',locker:'라커룸',shop:'장비 상점',rest:'휴식일',boss:'막 보스',event:'낯선 만남',
};
const ROUTE_LABELS={
  development:'육성 루트',steady:'안정 루트',craft:'정비 루트',scout:'분석 루트',gauntlet:'강행군',playoff:'플레이오프',ace:'에이스 사냥',
};
const UTILITY={
  training:{effect:'카드 강화',detail:'핵심 카드 하나를 강화해 다음 경기부터 역할을 선명하게 만듭니다.',risk:'낮음',reward:'덱 강화'},
  locker:{effect:'덱 정리',detail:'약한 카드를 덜 뽑도록 덱을 정리하는 구간입니다.',risk:'낮음',reward:'덱 압축'},
  shop:{effect:'전력 보강',detail:'카드와 런 전체를 바꾸는 유물 중 하나를 골라 전력을 보강합니다.',risk:'낮음',reward:'카드 / 유물'},
  rest:{effect:'컨디션 회복',detail:'다음 전투에서 타선의 타격 기술 +8. 강행군을 끊고 다음 투수를 안정적으로 공략합니다.',risk:'최저',reward:'다음 전투 타격 +8'},
  event:{effect:'낯선 만남',detail:'들어가 봐야 안다. 길 위의 사건은 매번 다르다.',risk:'불명',reward:'불명'},
};
const copy=o=>JSON.parse(JSON.stringify(o));
const mix=x=>{x=(x^61)^(x>>>16);x=(x+Math.imul(x,8))>>>0;x^=x>>>4;x=Math.imul(x,0x27d4eb2d)>>>0;x^=x>>>15;return x>>>0;};
const sample=(seed,salt,list)=>list[mix((seed>>>0)^Math.imul(salt+1,0x9e3779b1))%list.length];

const ARCHETYPES=[
  {key:'outside',label:'바깥쪽 제구형',style:'rookie',threat:'바깥 코스 비중이 높아 좁은 노림을 흔듭니다.',zoneOpen:4,zoneMax:6},
  {key:'sinker',label:'낮은 싱커형',style:'sinker',threat:'낮은 3분할을 오래 압박하고 병살 위험을 만듭니다.',zoneOpen:5,zoneMax:7},
  {key:'high',label:'높은 공 수비형',style:'deep',threat:'높은 공과 깊은 수비로 장타 기대값을 낮춥니다.',zoneOpen:5,zoneMax:8},
  {key:'closer',label:'반대 코스 승부형',style:'closer',threat:'이전 노림 반대편을 찌르며 2스트라이크에 존을 넓힙니다.',zoneOpen:7,zoneMax:9},
];
const ARCHETYPE_BY_KEY=Object.fromEntries(ARCHETYPES.map(x=>[x.key,x]));
/* 막이 오를수록 단순히 숫자만 세지는 게 아니라 상대의 질문 자체가 바뀐다. */
const ACT_ARCHETYPE_KEYS={
  1:['outside','sinker'],
  2:['sinker','high','outside'],
  3:['high','closer','sinker'],
};
const BOSS_ARCHETYPE={1:'sinker',2:'high',3:'closer'};
/* 한 런의 전투 칸은 최대 23개다. 이름 풀은 그보다 넉넉해야 한 런 안에서 겹치지 않는다. */
const NAMES=['윤태성','민재호','강도윤','박현우','이시훈','최준혁','김태겸','한지우','오세민','정우찬',
  '임건호','서재윤','노경환','백승호','류지환','문성주','조현성','신동하','황인우','고태원',
  '남기웅','배정후','심규빈','전우영','권재민','유상혁','장민석','차도훈','표세진','홍기준'];

/* 막마다 무엇이 어려워지는지 한 곳에 적는다. 화면도 이 표를 그대로 읽어 플레이어에게 보여준다.
   hp는 끌어내릴 양, stat은 투수 기본기, zone은 쓰는 코스 수. 코스가 넓어지는 게 읽기를 가장 어렵게 만든다. */
export const ACT_ESCALATION={
  1:{name:'개막',hp:-12,stat:0,zone:0,note:'바깥·낮은 공 중심. 볼은 드물다. 읽은 대로 치며 덱의 첫 방향을 정하는 막.'},
  2:{name:'중반',hp:16,stat:4,zone:1,note:'싱커와 높은 공이 섞이고 코스가 하나 더 열린다. 1막에서 고른 카드끼리 연계를 만들 시점.'},
  3:{name:'결승',hp:36,stat:9,zone:2,note:'높은 공·반대 코스 승부가 본격화되고 코스 둘이 더 열린다. 압축과 시그니처 카드가 없으면 한 타석이 비싸다.'},
};
export const actEscalation=act=>ACT_ESCALATION[act]||ACT_ESCALATION[1];

function makeOpponent(seed,act,type,row,lane,route){
  const salt=act*101+row*17+lane*7+(type==='elite'?31:type==='boss'?67:0);
  const pool=(ACT_ARCHETYPE_KEYS[act]||ACT_ARCHETYPE_KEYS[1]).map(k=>ARCHETYPE_BY_KEY[k]);
  const archetype=type==='boss'?ARCHETYPE_BY_KEY[BOSS_ARCHETYPE[act]||'outside']:sample(seed,salt,pool);
  const step=actEscalation(act);
  const base={battle:72,elite:92,boss:120}[type]+step.hp;
  const routeBonus=route==='gauntlet'||route==='ace'?8:route==='playoff'?4:0;
  const maxHp=base+routeBonus;
  const rewardTier=type==='boss'?3:type==='elite'?2:1;
  const reward=rewardTier===1?'막별 기본 3장 드래프트':rewardTier===2?'시그니처 카드 포함 4장 드래프트':act===3?'최종 결승 · 런 완주':'막 돌파 · 시그니처 4장 드래프트';
  return {
    name:sample(seed,salt+13,NAMES),archetype:archetype.label,archetypeKey:archetype.key,style:archetype.style,
    maxHp,statBonus:(type==='battle'?0:type==='elite'?6:10)+step.stat+Math.floor(routeBonus/2),
    zoneOpen:Math.min(9,archetype.zoneOpen+step.zone),zoneMax:Math.min(9,archetype.zoneMax+step.zone),
    /* V12 P6-2: the map fingerprint shows exactly the zones the engine opens first (repertoire at plate 1) */
    openingZones:(ZONE_ORDER[archetype.style]||[]).slice(0,Math.min(9,archetype.zoneOpen+step.zone)).sort((a,z)=>a-z),
    threat:archetype.threat,rewardTier,act,actName:step.name,
    /* 화면이 막 난도를 추론하지 않게, 이 막에서 무엇이 얼마나 올랐는지 그대로 실어 보낸다. */
    escalation:{name:step.name,hp:step.hp,stat:step.stat,zone:step.zone,note:step.note},
    risk:rewardTier===3?'최종':rewardTier===2?'높음':routeBonus?'중상':'보통',
    reward,
  };
}

function makeNode(seed,act,spec){
  const base={id:`a${act}-${spec.key}`,act,row:spec.row,lane:spec.lane,type:spec.type,name:LABELS[spec.type],
    route:spec.route||'steady',routeLabel:ROUTE_LABELS[spec.route||'steady'],seed:mix((seed>>>0)^Math.imul(act*131+spec.row*19+spec.lane*7+spec.key.length,0x9e3779b1))};
  if(COMBAT_TYPES.has(spec.type)){
    const opponent=makeOpponent(seed,act,spec.type,spec.row,spec.lane,base.route);
    return {...base,opponent,risk:opponent.risk,reward:opponent.reward,preview:`${opponent.name} · ${opponent.archetype} · HP ${opponent.maxHp}`};
  }
  const utility=UTILITY[spec.type];
  return {...base,utility:{...utility},risk:utility.risk,reward:utility.reward,preview:`${utility.effect} · ${utility.detail}`};
}

/* 슬더스식 길 생성: 막마다 시드로 칸 수·자리·연결·종류를 새로 뽑는다.
   고정 규칙: 입구(a{act}-entry)와 보스(a{act}-boss)는 한 칸, 모든 칸은 앞으로만 이어져 보스에 닿는다. */
const LANES=4;
const ACT_ROWS={1:3,2:4,3:3};
const ACT_REQUIRED={1:['elite','shop','rest','training|locker'],2:['elite','shop','rest','training|locker'],3:['elite','shop','rest']};
const ROUTE_BY_TYPE={battle:'steady',elite:'gauntlet',training:'development',locker:'craft',shop:'craft',rest:'steady',boss:'playoff',event:'steady'};
const routeFor=(act,type)=>act===1?ROUTE_BY_TYPE[type]:type==='elite'?(act===2?'ace':'playoff'):type==='battle'&&act===3?'playoff':type==='shop'?'scout':ROUTE_BY_TYPE[type];
const makeRng=seed=>{let s=seed>>>0;return ()=>{s=mix(s+0x9e3779b9>>>0);return s/0x100000000;};};
const pickWeighted=(rng,table)=>{const total=table.reduce((a,[,w])=>a+w,0);let r=rng()*total;for(const [k,w] of table){r-=w;if(r<0)return k;}return table[0][0];};
const shuffle=(rng,list)=>{const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};

function rowTable(act,row,last,counts){
  if(row===1)return [['battle',60],['training',20],['locker',20]];
  const elite=counts.elite>=2?0:act===3?26:act===2?20:16;
  const shop=counts.shop>=2?0:12;
  if(last)return [['rest',32],['shop',shop?26:0],['battle',28],['elite',elite?14:0]];
  return [['battle',46],['elite',elite],['shop',shop],['rest',10],['training',9],['locker',8],['event',8]];
}

function planAct(seed,act){
  const rng=makeRng(mix((seed>>>0)^Math.imul(act+7,0x85ebca6b)));
  const mid=ACT_ROWS[act],rows=[[{row:0,lane:1,type:'battle'}]],counts={elite:0,shop:0};
  for(let row=1;row<=mid;row++){
    const size=row===1?pickWeighted(rng,[[2,35],[3,65]]):pickWeighted(rng,[[2,10],[3,45],[4,45]]);
    const lanes=shuffle(rng,[...Array(LANES).keys()]).slice(0,size).sort((a,b)=>a-b);
    const cells=lanes.map(lane=>{
      const type=pickWeighted(rng,rowTable(act,row,row===mid,counts).filter(([,w])=>w>0));
      if(counts[type]!==undefined)counts[type]++;
      return {row,lane,type};
    });
    if(!cells.some(c=>c.type==='battle'))cells[Math.floor(rng()*cells.length)].type='battle';
    if(row===mid&&!cells.some(c=>c.type==='rest'||c.type==='shop'))cells[Math.floor(rng()*cells.length)].type='rest';
    rows.push(cells);
  }
  /* 한 막에 꼭 한 번은 만나야 하는 칸. 시드가 나빠도 막이 전투만으로 채워지지 않게 빈 종류를 전투 칸에서 바꿔 채운다. */
  for(const want of ACT_REQUIRED[act]){
    const alts=want.split('|'),cells=rows.flat();
    if(cells.some(c=>alts.includes(c.type)))continue;
    const type=alts[Math.floor(rng()*alts.length)];
    const dup=c=>cells.filter(o=>o.type===c.type).length>1;
    const swap=cells.filter(c=>c.row>=(type==='elite'?2:1)&&(c.type==='battle'?rows[c.row].filter(o=>o.type==='battle').length>1:dup(c)));
    if(swap.length)swap[Math.floor(rng()*swap.length)].type=type;
  }
  rows.push([{row:mid+1,lane:1,type:'boss'}]);
  const key=c=>c.row===0?'entry':c.type==='boss'?'boss':`r${c.row}l${c.lane}`;
  const edges=[];
  for(let r=0;r<rows.length-1;r++){
    const from=rows[r],to=rows[r+1],has=new Set();
    const link=(a,b)=>{const k=key(a)+'>'+key(b);if(!has.has(k)){has.add(k);edges.push([key(a),key(b)]);}};
    if(from.length===1||to.length===1){for(const a of from)for(const b of to)link(a,b);continue;}
    const nearest=(c,list)=>[...list].sort((x,y)=>Math.abs(x.lane-c.lane)-Math.abs(y.lane-c.lane)||(rng()<.5?-1:1));
    for(const a of from){
      const near=nearest(a,to);link(a,near[0]);
      if(rng()<.4)link(a,near[1]);
    }
    for(const b of to)if(!edges.some(e=>e[1]===key(b)&&from.some(a=>key(a)===e[0])))link(nearest(b,from)[0],b);
  }
  return {cells:rows.flat().map(c=>({...c,key:key(c)})),edges};
}

function buildAct(seed,act){
  const plan=planAct(seed,act);
  const nodes=plan.cells.map(c=>makeNode(seed,act,{key:c.key,row:c.row,lane:c.lane,type:c.type,route:c.row===0?(act===3?'playoff':'steady'):c.type==='boss'&&act===3?'ace':routeFor(act,c.type)}));
  const edges=plan.edges.map(([from,to])=>({from:`a${act}-${from}`,to:`a${act}-${to}`}));
  return {nodes,edges};
}


/* 이름 풀이 전투 칸보다 짧다. 시드에서 시작점을 정해 돌려 쓰되, 한 바퀴 안에서는 겹치지 않게 한다. */
function nameOpponents(seed,nodes){
  const combat=nodes.filter(n=>COMBAT_TYPES.has(n.type)&&n.opponent);
  const offset=mix((seed>>>0)^0x51ed270b)%NAMES.length;
  combat.forEach((node,index)=>{node.opponent.name=NAMES[(offset+index)%NAMES.length];});
  return nodes;
}

export function createRunMap(seed=0){
  const nodes=[],edges=[];
  for(let act=1;act<=3;act++){
    const built=buildAct(seed,act);nodes.push(...built.nodes);edges.push(...built.edges);
    if(act<3)edges.push({from:`a${act}-boss`,to:`a${act+1}-entry`});
  }
  nameOpponents(seed,nodes);
  // Same-tier authored characters, shuffled per seed so faces and order change every run.
  // Pool repeats receive numbered names to preserve unique names per run.
  const crng=makeRng(mix((seed>>>0)^0x2c1b3c6d));
  const pools=Object.fromEntries(['battle','elite','boss'].map(type=>[type,shuffle(crng,pitcherRoster.filter(p=>p.tier===type))]));
  // The very first battle stays the Red Rush introduction (one named encounter per run); everything after is shuffled.
  pools.battle=[...pitcherRoster.filter(p=>p.tier==='battle'&&p.id===RED_RUSH_ID),...pools.battle.filter(p=>p.id!==RED_RUSH_ID)];
  const counts={battle:0,elite:0,boss:0};
  const repeats=new Map();
  for(const node of nodes){
    if(!node.opponent)continue;
    const pool=pools[node.type];
    const index=counts[node.type]++;
    const bosses=pool.filter(p=>p.act===node.act);
    const pitcher=node.type==='boss'?bosses[Math.floor(crng()*bosses.length)]:(node.type==='battle'?pool[index===0?0:1+(index-1)%(pool.length-1)]:pool[index%pool.length]);
    if(!pitcher)continue;
    const seen=repeats.get(pitcher.id)||0;
    repeats.set(pitcher.id,seen+1);
    node.opponent.name=pitcher.name+(seen?' '+(seen+1):'');
    node.opponent.artId=pitcher.id;
    const gimmick=gimmickFor(pitcher.id);if(gimmick)node.opponent.gimmick=gimmick;
  }
  for(const node of nodes)if(node.opponent)node.preview=`${node.opponent.name} · ${node.opponent.archetype} · HP ${node.opponent.maxHp}`;
  return {seed:seed>>>0,nodes,edges,currentNodeId:null,completedNodeIds:[],reachableIds:['a1-entry']};
}

export const getRunNode=(map,id)=>map?.nodes?.find(n=>n.id===id)||null;
export const isCombatNode=n=>!!n&&COMBAT_TYPES.has(n.type);

export function selectRunNode(map,nodeId){
  if(!map||!map.reachableIds?.includes(nodeId))return {map,error:'unreachable'};
  const n=getRunNode(map,nodeId);if(!n||map.completedNodeIds.includes(nodeId))return {map,error:'invalid'};
  const next=copy(map);next.currentNodeId=nodeId;next.reachableIds=[];return {map:next,error:null,node:getRunNode(next,nodeId)};
}

export function completeRunNode(map,nodeId=map?.currentNodeId){
  if(!map||!nodeId||map.currentNodeId!==nodeId||map.completedNodeIds.includes(nodeId))return map;
  const next=copy(map);next.completedNodeIds=[...next.completedNodeIds,nodeId];
  next.reachableIds=next.edges.filter(e=>e.from===nodeId).map(e=>e.to);return next;
}

function pathExists(map,start,target,act){
  const q=[start],seen=new Set();
  while(q.length){const id=q.shift();if(id===target)return true;if(seen.has(id))continue;seen.add(id);
    for(const e of map.edges)if(e.from===id){const n=getRunNode(map,e.to);if(n&&n.act===act)q.push(e.to);}}
  return false;
}

export function actHasBossPath(map,act){
  return pathExists(map,`a${act}-entry`,`a${act}-boss`,act);
}

/* 고른 칸이 막다른 길이면 지도에서 갈 곳이 사라진다. 모든 칸이 그 막의 보스까지 닿는지 본다. */
export function everyNodeReachesBoss(map,act){
  const target=`a${act}-boss`;
  return map.nodes.filter(n=>n.act===act&&n.id!==target).every(n=>pathExists(map,n.id,target,act));
}

/* 갈 수 있는 칸은 저장에 적힌 대로가 아니라 진행에서 따라 나와야 한다. */
export function reachableMatchesProgress(map){
  const last=map.completedNodeIds[map.completedNodeIds.length-1];
  const expected=last?map.edges.filter(e=>e.from===last).map(e=>e.to):['a1-entry'];
  const open=map.currentNodeId&&!map.completedNodeIds.includes(map.currentNodeId);
  if(open)return map.reachableIds.length===0;
  return map.reachableIds.length===expected.length&&map.reachableIds.every(id=>expected.includes(id));
}

export function validateRunMap(map){
  if(!map||!Number.isInteger(map.seed)||!Array.isArray(map.nodes)||!Array.isArray(map.edges)
    ||!Array.isArray(map.completedNodeIds)||!Array.isArray(map.reachableIds))return false;
  const ids=map.nodes.map(n=>n?.id),set=new Set(ids);
  if(set.size!==ids.length||map.nodes.some(n=>!n||!TYPES.has(n.type)||!Number.isInteger(n.act)||n.act<1||n.act>3
    ||!Number.isInteger(n.row)||!Number.isFinite(n.lane)||typeof n.route!=='string'||typeof n.preview!=='string'))return false;
  if(map.nodes.some(n=>COMBAT_TYPES.has(n.type)
    ?!n.opponent||!Number.isInteger(n.opponent.maxHp)||n.opponent.maxHp<=0||!['rookie','sinker','deep','closer'].includes(n.opponent.style)
      ||!Number.isInteger(n.opponent.rewardTier)||n.opponent.rewardTier<1||n.opponent.rewardTier>3
    :!n.utility||typeof n.utility.effect!=='string'))return false;
  if(map.edges.some(e=>{
    if(!e||!set.has(e.from)||!set.has(e.to)||e.from===e.to)return true;
    const from=getRunNode(map,e.from),to=getRunNode(map,e.to);
    return from.act===to.act?to.row<=from.row:!(from.type==='boss'&&to.id===`a${from.act+1}-entry`);
  }))return false;
  if(map.currentNodeId!==null&&!set.has(map.currentNodeId))return false;
  if(map.completedNodeIds.some(id=>!set.has(id))||map.reachableIds.some(id=>!set.has(id))
    ||new Set(map.completedNodeIds).size!==map.completedNodeIds.length||new Set(map.reachableIds).size!==map.reachableIds.length)return false;
  if(map.reachableIds.some(id=>map.completedNodeIds.includes(id)))return false;
  for(let act=1;act<=3;act++)if(!actHasBossPath(map,act)||!everyNodeReachesBoss(map,act))return false;
  if(!reachableMatchesProgress(map))return false;
  return true;
}

export const runMapSelector=map=>map?({
  nodes:copy(map.nodes),edges:copy(map.edges),currentNodeId:map.currentNodeId,reachableIds:[...map.reachableIds],
}):null;
