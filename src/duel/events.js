import {CARDS,canUpgrade,DECK_MAX,DECK_MIN} from './cards.js';
import {applyRewardToDeck} from './deck.js';
import {completeRunNode,getRunNode} from './run-map.js';
import {V10_ALL_RELICS,v10RelicOffers} from './v10-relics.js';

/* Slay-the-Spire-style road events, adapted to 9ZONE currencies (deck, relics,
   outs, next-battle bonus). No gold, no HP, no new resources, no new save fields:
   the event on a node derives from the node seed, so the same node always offers
   the same event on every load. */

// Tiny seeded rng, local so this module stays dependency-lean.
const rngNext=r=>{r.s=(r.s+0x6D2B79F5)>>>0;let t=r.s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
const rngFrom=seed=>({s:seed>>>0});
const pick=(r,list)=>list[Math.floor(rngNext(r)*list.length)];
const eul=name=>/[가-힣]/.test(name)&&(((name.charCodeAt(name.length-1)-0xac00)%28)>0)?'을':'를';

export const EVENT_DEFS=[
  {id:'dugout-cache',acts:[1,2,3],title:'버려진 더그아웃',text:'텅 빈 더그아웃 벤치 아래, 누군가 두고 간 장비 가방이 있다.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'rummage',label:'뒤진다',desc:'무작위 카드 1장을 덱에 넣는다',ops:[{op:'addRandom'}]},
     {id:'delve',label:'깊이 판다',desc:'무작위 1장을 얻고, 무작위 1장을 잃는다',ops:[{op:'addRandom'},{op:'sacrificeRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'veteran-coach',acts:[1,2,3],title:'은퇴한 타격 코치',text:'베테랑 코치가 방망이를 두드리며 타석을 본다. "한 가지만 가르쳐주지."',
   choices:[
     {id:'drill',label:'특훈을 받는다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'advice',label:'조언만 듣는다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'rain-delay',acts:[2,3],title:'빗속 대기',text:'소나기가 그라운드를 적신다. 경기는 곧 재개된다. 이 시간을 어떻게 쓸까.',
   choices:[
     {id:'loosen',label:'몸을 푼다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'rest',label:'빗속 휴식',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'train',label:'빗속 특훈',desc:'무작위 강화 + 이어지는 아웃 +1',ops:[{op:'upgradeRandom'},{op:'outsUp'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'night-game',acts:[1,2,3],title:'한밤의 내기 야구',text:'마스크를 쓴 남자가 동전을 튕긴다. "앞면이면 다음 경기, 뒷면이면 아웃 하나."',
   choices:[
     {id:'bet',label:'내기를 받는다',desc:'앞면: 다음 전투 타격 +8. 뒷면: 이어지는 아웃 +1',ops:[{op:'gamble',p:0.5,win:[{op:'bonus8'}],lose:[{op:'outsUp'}]}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'old-catcher',acts:[1,2],title:'은퇴한 포수',text:'은퇴한 포수가 글러브를 두드린다. "어깨는 내가 풀어주지. 대신 필요 없는 건 두고 가게."',
   choices:[
     {id:'massage',label:'마사지를 받는다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'tidy',label:'장비를 정리한다',desc:'무작위 카드 1장을 덱에서 뺀다',ops:[{op:'sacrificeRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'groundskeeper',acts:[1,2,3],title:'그라운드 키퍼',text:'새벽 그라운드를 고르는 노인이 삽을 멈춘다. "하나만 고르게. 공짜는 없어."',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'forget',label:'묻는다',desc:'무작위 카드 1장을 덱에서 뺀다',ops:[{op:'sacrificeRandom'}]},
     {id:'reshape',label:'갈아엎는다',desc:'무작위 1장을 잃고 무작위 1장을 얻는다',ops:[{op:'transformRandom'}]},
     {id:'grow',label:'다진다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'lucky-ball',acts:[1,2],title:'행운의 파울볼',text:'관중석에서 날아온 파울볼이 발치에 멈춘다. 누군가 "그건 행운이야!"라고 외친다.',
   choices:[
     {id:'keep',label:'품는다',desc:'같은 카드를 한 장 더 넣는다',ops:[{op:'duplicateRandom'}]},
     {id:'sign',label:'사인해서 돌려준다',desc:'유물 1개를 얻고, 무작위 1장을 잃는다',ops:[{op:'gainRelic'},{op:'sacrificeRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'phantom-fan',acts:[2,3],title:'유령 관중',text:'빈 관중석에서 박수가 들린다. "우리 응원을 받아들여라. 대신 대가를 치러야 한다."',
   choices:[
     {id:'accept',label:'받아들인다',desc:'같은 카드 2장을 더 넣고, 이어지는 아웃 +1',ops:[{op:'duplicateRandom'},{op:'duplicateRandom'},{op:'outsUp'}]},
     {id:'refuse',label:'거절한다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'contract',acts:[2,3],title:'이면 계약서',text:'양복 차림의 남자가 계약서를 내민다. "사인 하나면 장비는 주지. 대가는 네 덱에서 가져간다."',
   choices:[
     {id:'sign',label:'서명한다',desc:'유물 1개를 얻고, 무작위 1장을 잃는다',ops:[{op:'gainRelic'},{op:'sacrificeRandom'}]},
     {id:'tear',label:'찢는다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'doubleheader',acts:[2,3],title:'더블헤더',text:'방송사 직원이 달려온다. "오늘 2경기 연속 편성됐어요! 뛸래요?"',
   choices:[
     {id:'double',label:'연전을 치른다',desc:'무작위 강화 + 이어지는 아웃 +1',ops:[{op:'upgradeRandom'},{op:'outsUp'}]},
     {id:'single',label:'한 경기만',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'scout-rumor',acts:[1,2,3],title:'스카우트의 소문',text:'모자를 눌러쓴 스카우트가 속삭인다. "쓸 만한 정보를 줄게. 대신 네 패 중 하나를 내놓게."',
   choices:[
     {id:'trade',label:'맞바꾼다',desc:'무작위 1장을 잃고, 유물 1개를 얻는다',ops:[{op:'sacrificeRandom'},{op:'gainRelic'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'cursed-bat',acts:[2,3],title:'저주받은 배트',text:'거미줄 친 배트에서 서늘한 기운이 난다. 잡는 순간 동전이 튕겨 오른다.',
   choices:[
     {id:'grab',label:'잡는다',desc:'앞면: 유물 1개. 뒷면: 이어지는 아웃 +1',ops:[{op:'gamble',p:0.5,win:[{op:'gainRelic'}],lose:[{op:'outsUp'}]}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'bullpen-phone',acts:[1,2],title:'불펜 전화',text:'불펜 전화가 울린다. 받을까, 말까.',
   choices:[
     {id:'answer',label:'받는다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'hangup',label:'끊는다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'seventh-stretch',acts:[1,2,3],title:'7회말 스트레칭',text:'관중과 함께 기지개를 켠다. 짧은 휴식, 아니면 단체 체조.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'rest',label:'쉰다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'drill',label:'단체 체조',desc:'무작위 1장을 잃고 무작위 1장을 얻는다',ops:[{op:'transformRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'rookie-wall',acts:[1],title:'루키의 벽',text:'1년 차 시절의 자신이 마운드에 서 있다. "넘어설 수 있겠어?"',
   choices:[
     {id:'clash',label:'정면돌파',desc:'무작위 1장을 잃고, 유물 1개를 얻는다',ops:[{op:'sacrificeRandom'},{op:'gainRelic'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
];

export function eventForNode(node){
  if(!node||node.type!=='event')return null;
  const eligible=EVENT_DEFS.filter(d=>d.acts.includes(node.act));
  if(!eligible.length)return null;
  return eligible[(node.seed>>>0)%eligible.length];
}

function concreteParams(state,def,node,act){
  const r=rngFrom((node.seed>>>0)^0xE7E47);
  const upgradable=state.deck.filter(canUpgrade);
  return {
    addKind:def.addPool?pick(r,def.addPool):null,
    sacrificeId:state.deck.length?pick(r,state.deck.map(c=>c.id)):null,
    upgradeId:upgradable.length?pick(r,upgradable.map(c=>c.id)):null,
    duplicateId:state.deck.length?pick(r,state.deck.map(c=>c.id)):null,
    relic:v10RelicOffers({seed:state.initialSeed|0,act,nodeSeed:node.seed>>>0,owned:state.relics||[]})[0]||null,
  };
}

function choiceProblem(state,ops,params){
  const has=op=>ops.some(o=>o.op===op);
  const adds=ops.filter(o=>o.op==='addRandom'||o.op==='duplicateRandom').length;
  if(adds&&state.deck.length+adds>DECK_MAX)return '덱이 가득 찼다';
  if(has('sacrificeRandom')&&(state.deck.length<=DECK_MIN||!params.sacrificeId))return '덱이 가장 얇다';
  if(has('upgradeRandom')&&!params.upgradeId)return '강화할 카드가 없다';
  if(has('transformRandom')&&(state.deck.length<=DECK_MIN||!params.sacrificeId||!params.addKind))return '덱이 가장 얇다';
  if(has('gainRelic')&&!params.relic)return '가져갈 유물이 없다';
  if(has('outsUp')&&(state.runOuts|0)>=2)return '이어지는 아웃이 가득 찼다';
  if(has('outsDown')&&(state.runOuts|0)<=0)return '줄일 아웃이 없다';
  if(has('gamble')){
    for(const o of ops.filter(x=>x.op==='gamble')){
      for(const sub of [...(o.win||[]),...(o.lose||[])]){
        if(sub.op==='outsUp'&&(state.runOuts|0)>=2)return '이어지는 아웃이 가득 찼다';
        if(sub.op==='outsDown'&&(state.runOuts|0)<=0)return '줄일 아웃이 없다';
        if((sub.op==='addRandom'||sub.op==='duplicateRandom')&&state.deck.length>=DECK_MAX)return '덱이 가득 찼다';
        if(sub.op==='upgradeRandom'&&!params.upgradeId)return '강화할 카드가 없다';
        if(sub.op==='gainRelic'&&!params.relic)return '가져갈 유물이 없다';
      }
    }
  }
  return null;
}

export function eventOfferForNode(state){
  if(state?.version!==10||state.phase!=='event')return null;
  const node=getRunNode(state.runMap,state.runMap?.currentNodeId);
  const def=eventForNode(node);
  if(!def)return null;
  const params=concreteParams(state,def,node,node.act);
  return {
    event:def.id,title:def.title,text:def.text,nodeId:node.id,nodeSeed:node.seed>>>0,
    choices:def.choices.map(c=>{
      return {id:c.id,label:c.label,desc:c.desc+concreteSuffix(state,c.ops,params),problem:choiceProblem(state,c.ops,params),ops:c.ops.map(o=>({...o,...params}))};
    }),
  };
}

function cardName(state,id){const c=state.deck.find(x=>x.id===id);return c?CARDS[c.kind]?.name||c.kind:id;}

function concreteSuffix(state,ops,params){
  const parts=[];
  for(const o of ops){
    if(o.op==='addRandom'&&params.addKind)parts.push(`${CARDS[params.addKind]?.name||params.addKind} 획득`);
    else if(o.op==='sacrificeRandom'&&params.sacrificeId)parts.push(`${cardName(state,params.sacrificeId)} 상실`);
    else if(o.op==='upgradeRandom'&&params.upgradeId)parts.push(`${cardName(state,params.upgradeId)} 강화`);
    else if(o.op==='duplicateRandom'&&params.duplicateId)parts.push(`${cardName(state,params.duplicateId)} 복제`);
    else if(o.op==='gainRelic'&&params.relic)parts.push(`${V10_ALL_RELICS[params.relic]?.name||params.relic} 획득`);
    else if(o.op==='transformRandom'&&params.sacrificeId&&params.addKind)parts.push(`${cardName(state,params.sacrificeId)}→${CARDS[params.addKind]?.name||params.addKind}`);
  }
  return parts.length?' · '+parts.join(' · '):'';
}
const hashStr=s=>[...String(s)].reduce((a,c)=>(Math.imul(a,31)+c.charCodeAt(0))>>>0,7);

function applyOp(s,state,o,lines,seedSalt){
  if(o.op==='addRandom'){
    const moved=applyRewardToDeck(s.deck,{type:'add',kind:o.addKind},s.nextId);
    s.deck=moved.deck;s.nextId=moved.nextId;
    lines.push(`${CARDS[o.addKind]?.name||o.addKind}${eul(CARDS[o.addKind]?.name||o.addKind)} 덱에 넣었다.`);
  }else if(o.op==='sacrificeRandom'){
    const name=cardName(s,o.sacrificeId);
    s.deck=applyRewardToDeck(s.deck,{type:'remove',id:o.sacrificeId},s.nextId).deck;
    lines.push(`${name}${eul(name)} 잃었다.`);
  }else if(o.op==='upgradeRandom'){
    const name=cardName(s,o.upgradeId);
    s.deck=applyRewardToDeck(s.deck,{type:'upgrade',id:o.upgradeId},s.nextId).deck;
    lines.push(`${name}+.`);
  }else if(o.op==='bonus8'){
    s.v10.nextBattleBonus={technique:8,source:'event'};
    lines.push('다음 전투 타격 +8.');
  }else if(o.op==='outsUp'){
    s.runOuts=Math.min(2,(s.runOuts|0)+1);
    lines.push('이어지는 아웃 +1.');
  }else if(o.op==='outsDown'){
    s.runOuts=Math.max(0,(s.runOuts|0)-1);
    lines.push('이어지는 아웃 -1.');
  }else if(o.op==='gainRelic'){
    if(!s.relics.includes(o.relic))s.relics.push(o.relic);
    lines.push(`${V10_ALL_RELICS[o.relic]?.name||o.relic} 유물을 얻었다.`);
  }else if(o.op==='transformRandom'){
    const name=cardName(s,o.sacrificeId);
    s.deck=applyRewardToDeck(s.deck,{type:'remove',id:o.sacrificeId},s.nextId).deck;
    const moved=applyRewardToDeck(s.deck,{type:'add',kind:o.addKind},s.nextId);
    s.deck=moved.deck;s.nextId=moved.nextId;
    lines.push(`${name}${eul(name)} 잃고 ${CARDS[o.addKind]?.name||o.addKind}${eul(CARDS[o.addKind]?.name||o.addKind)} 얻었다.`);
  }else if(o.op==='duplicateRandom'){
    const kind=(state.deck.find(x=>x.id===o.duplicateId))?.kind;
    const moved=applyRewardToDeck(s.deck,{type:'add',kind},s.nextId);
    s.deck=moved.deck;s.nextId=moved.nextId;
    lines.push(`${CARDS[kind]?.name||kind}${eul(CARDS[kind]?.name||kind)} 한 장 더 넣었다.`);
  }else if(o.op==='gamble'){
    const g=rngFrom((seedSalt^hashStr(choiceSalt(o)))>>>0);
    const win=rngNext(g)<(o.p??0.5);
    lines.push(win?'동전은 앞면.':'동전은 뒷면.');
    for(const sub of (win?o.win:o.lose)){
      if(sub.op==='outsUp'||sub.op==='outsDown'){
        const before=s.runOuts|0;
        s.runOuts=sub.op==='outsUp'?Math.min(2,before+1):Math.max(0,before-1);
        lines.push(s.runOuts===before?'이미 한계라 그대로다.':`이어지는 아웃 ${sub.op==='outsUp'?'+1':'-1'}.`);
      }else applyOp(s,state,{...o,...sub},lines,seedSalt);
    }
  }
}
const choiceSalt=o=>o.choiceId||'';

export function resolveEventChoice(state,choiceId){
  const fail=()=>({state,event:null,outcome:null});
  const offer=eventOfferForNode(state);
  if(!offer)return fail();
  const choice=offer.choices.find(c=>c.id===choiceId);
  if(!choice||choice.problem)return fail();
  const s=JSON.parse(JSON.stringify(state)),lines=[];
  for(const o of choice.ops)applyOp(s,state,{...o,choiceId},lines,offer.nodeSeed);
  s.v10.utilityHistory=[...(s.v10.utilityHistory||[]),{nodeId:offer.nodeId,kind:'event',action:{type:'event',event:offer.event,choice:choiceId}}];
  s.runMap=completeRunNode(s.runMap);
  s.phase='map';s.battle=null;s.pitcher=null;s.route=null;s.last=null;
  s.v10={...s.v10,nodeId:null,opponent:null,lastCombat:null,rewardChoices:[],relicChoices:[],activeBattleBonus:null};
  return {state:s,event:offer.event,outcome:lines.join(' ')||'아무 일도 없었다.'};
}
