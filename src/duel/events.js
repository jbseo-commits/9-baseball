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
     {id:'bet',label:'내기를 받는다',desc:'50%: 다음 전투 타격 +8 / 50%: 이어지는 아웃 +1',ops:[{op:'gamble',p:0.5,win:[{op:'bonus8'}],lose:[{op:'outsUp'}]}]},
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
     {id:'reshape',label:'갈아엎는다',desc:'묻은 자리에 새 흙을 덮는다 · 무작위 1장 교환',ops:[{op:'transformRandom'}]},
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
     {id:'read',label:'조항부터 읽는다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
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
     {id:'doubt',label:'소문을 무시한다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'cursed-bat',acts:[2,3],title:'저주받은 배트',text:'거미줄 친 배트에서 서늘한 기운이 난다. 잡는 순간 동전이 튕겨 오른다.',
   choices:[
     {id:'grab',label:'잡는다',desc:'50%: 유물 1개 / 50%: 이어지는 아웃 +1',ops:[{op:'gamble',p:0.5,win:[{op:'gainRelic'}],lose:[{op:'outsUp'}]}]},
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
     {id:'drill',label:'단체 체조',desc:'자세를 다시 잡는다 · 무작위 1장 교환',ops:[{op:'transformRandom'}]},
     {id:'stretch',label:'기지개를 켠다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'rookie-wall',acts:[1],title:'루키의 벽',text:'1년 차 시절의 자신이 마운드에 서 있다. "넘어설 수 있겠어?"',
   choices:[
     {id:'clash',label:'정면돌파',desc:'무작위 1장을 잃고, 유물 1개를 얻는다',ops:[{op:'sacrificeRandom'},{op:'gainRelic'}]},
     {id:'wait',label:'지나간다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'alley-coach',acts:[1,2],title:'골목 코치',text:'담벼락에 기대선 코치가 방망이를 내민다. "한 대만 고쳐줄게."',
   choices:[
     {id:'fix',label:'고친다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'lost-glove',acts:[1,2],title:'잃어버린 글러브',text:'관중석 밑에서 낡은 글러브가 나왔다. 주인이 기다리고 있다.',
   choices:[
     {id:'return',label:'주인을 찾아준다',desc:'무작위 카드 1장을 덱에서 빼고, 다음 전투 타격 +8',ops:[{op:'sacrificeRandom'},{op:'bonus8'}]},
     {id:'ask',label:'글러브를 찬 뒤 묻는다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'exchange-student',acts:[1,2],title:'교환학생',text:'전학 온 타자가 말한다. "내 장비를 네 거랑 바꾸자."',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'swap',label:'바꾼다',desc:'장비를 맞바꾼다 · 무작위 1장 교환',ops:[{op:'transformRandom'}]},
      {id:'practice',label:'같이 연습한다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'twin-bats',acts:[1,2,3],title:'쌍둥이 배트',text:'똑같이 생긴 배트 두 자루. 진품과 모조품, 어느 쪽이 네 손에 맞는지 직접 재봐야 한다.',
   choices:[
     {id:'take',label:'꺼내본다',desc:'같은 카드를 한 장 더 넣는다',ops:[{op:'duplicateRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'night-snack',acts:[1,2,3],title:'야식 트럭',text:'불 꺼진 구장 앞에 야식 트럭 하나. 주인이 세 가지 메뉴를 가리킨다.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'snack',label:'간단히 먹는다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'feast',label:'배불리 먹는다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'box',label:'미스터리 박스',desc:'50%: 유물 1개 / 50%: 무작위 1장 교환',ops:[{op:'gamble',p:0.5,win:[{op:'gainRelic'}],lose:[{op:'transformRandom'}]}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'freshman-cheer',acts:[1,2],title:'신입 응원단',text:'신입생들이 플래카드를 흔든다. "선배님만 믿어요! 대신 저희도 껴주세요!"',
   choices:[
     {id:'join',label:'데려간다',desc:'같은 카드 2장을 더 넣고, 이어지는 아웃 +1',ops:[{op:'duplicateRandom'},{op:'duplicateRandom'},{op:'outsUp'}]},
     {id:'refuse',label:'사양한다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'scorecard',acts:[1,2,3],title:'주운 스코어카드',text:'바람에 날린 스코어카드. 빼곡한 메모가 다음 투수를 꿰뚫고 있다.',
   choices:[
     {id:'skim',label:'훑어본다',desc:'같은 카드를 한 장 더 넣는다',ops:[{op:'duplicateRandom'}]},
     {id:'memorize',label:'외운다',desc:'무작위 1장을 잃고, 유물 1개를 얻는다',ops:[{op:'sacrificeRandom'},{op:'gainRelic'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'fog-game',acts:[2,3],title:'안개 경기',text:'짙은 안개가 그라운드를 삼켰다. 누군가 속삭인다. "안개 속엔 좋은 것도 있다."',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'enter',label:'들어간다',desc:'유물 1개를 얻고, 안개 속에서 무작위 1장 교환',ops:[{op:'gainRelic'},{op:'transformRandom'}]},
     {id:'wait',label:'기다린다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'first-pitch',acts:[1],title:'시구식',text:'개막전 시구자로 뽑혔다. 마운드에 서면 관중이 들썩인다.',
   choices:[
     {id:'throw',label:'던진다',desc:'유물 1개를 얻고, 같은 카드를 한 장 더 넣는다',ops:[{op:'gainRelic'},{op:'duplicateRandom'}]},
     {id:'watch',label:'구경한다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'steal-attempt',acts:[1,2,3],title:'도루 시도',text:'1루 코치가 눈짓한다. "뛰어? 말어?"',
   choices:[
     {id:'run',label:'뛴다',desc:'60%: 무작위 카드 1장 강화 / 40%: 이어지는 아웃 +1',ops:[{op:'gamble',p:0.6,win:[{op:'upgradeRandom'}],lose:[{op:'outsUp'}]}]},
     {id:'stay',label:'가만히 있는다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'sign-steal',acts:[1,2],title:'사인 훔치기',text:'상대 덕아웃 사인이 훤히 보인다. 베꼈다 걸리면 가만 안 둔다.',
   choices:[
     {id:'steal',label:'훔친다',desc:'유물 1개를 얻고, 이어지는 아웃 +1',ops:[{op:'gainRelic'},{op:'outsUp'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'walkoff-dream',acts:[2,3],title:'끝내기 꿈',text:'꿈에서 끝내기 안타를 쳤다. 눈을 뜨니 손에 땀이 차 있다.',
   choices:[
     {id:'chase',label:'꾼다',desc:'무작위 1장을 잃고, 강화 가능한 카드를 전부 강화한다',ops:[{op:'sacrificeRandom'},{op:'upgradeAll'}]},
     {id:'wake',label:'깬다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'replay',label:'꿈을 되풀이한다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'phantom-tag',acts:[2,3],title:'유령 태그',text:'아무도 없는 2루에서 태그 소리가 난다. "같이 뛰자."',
   choices:[
     {id:'run',label:'뛴다',desc:'같은 카드를 한 장 더 넣고, 이어지는 아웃 +1',ops:[{op:'duplicateRandom'},{op:'outsUp'}]},
     {id:'refuse',label:'거절한다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'mound-visit',acts:[1,2,3],title:'마운드 방문',text:'감독이 마운드에 오른다. 격려냐, 문책이냐.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'praise',label:'격려한다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'scold',label:'문책한다',desc:'훈련을 단련한다 · 무작위 1장 교환',ops:[{op:'transformRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'foul-pole',acts:[1,2,3],title:'파울 폴대',text:'외야 폴대가 바람에 흔들린다. 맞히면 행운, 빗나가면 민망.',
   choices:[
     {id:'aim',label:'겨냥한다',desc:'50%: 유물 1개 / 50%: 이어지는 아웃 +1',ops:[{op:'gamble',p:0.5,win:[{op:'gainRelic'}],lose:[{op:'outsUp'}]}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'bullpen-cart',acts:[1,2],title:'불펜 카트',text:'고장 난 불펜 카트. 밀어줄까, 얻어탈까.',
   choices:[
     {id:'ride',label:'얻어탄다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'push',label:'밀어준다',desc:'무작위 1장을 잃고, 다음 전투 타격 +8',ops:[{op:'sacrificeRandom'},{op:'bonus8'}]},
     {id:'tune',label:'바퀴를 손질한다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'night-bus',acts:[2,3],title:'심야 버스',text:'막차 시간이 촉박하다. 마지막 좌석에 누군가 앉아 있다.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'share',label:'합승한다',desc:'길 위에서 장비가 바뀐다 · 무작위 1장 교환',ops:[{op:'transformRandom'}]},
     {id:'deal',label:'심야 특가',desc:'유물 1개를 얻고, 무작위 카드 1장 강화',ops:[{op:'gainRelic'},{op:'upgradeRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'extra-innings',acts:[3],title:'연장전',text:'승부가 가려지지 않는다. 끝까지 버틸지, 지금 갈지 정해야 한다.',
   choices:[
     {id:'endure',label:'버틴다',desc:'강화 가능한 카드를 전부 강화하고, 이어지는 아웃 +1',ops:[{op:'upgradeAll'},{op:'outsUp'}]},
     {id:'gamble',label:'승부치기',desc:'50%: 다음 전투 타격 +8 / 50%: 이어지는 아웃 +1',ops:[{op:'gamble',p:0.5,win:[{op:'bonus8'}],lose:[{op:'outsUp'}]}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'match-point',acts:[3],title:'매치 포인트',text:'결승점까지 아웃 하나. 누군가 속삭인다. "카드 한 장이면 장비 하나."',
   choices:[
     {id:'deal',label:'맞바꾼다',desc:'무작위 1장을 잃고, 유물 1개를 얻는다',ops:[{op:'sacrificeRandom'},{op:'gainRelic'}]},
     {id:'hold',label:'끝까지 버틴다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'morning-bullpen',acts:[1],title:'새벽 불펜',text:'아무도 없는 새벽 불펜. 몸을 풀까, 더 잘까.',
   choices:[
     {id:'early',label:'일찍 나간다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'sleep',label:'더 잔다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'broken-bat',acts:[1,2],title:'부러진 배트',text:'타격 연습 중 배트가 부러졌다. 고칠까, 버릴까.',
   choices:[
     {id:'fix',label:'고친다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'toss',label:'버린다',desc:'무작위 카드 1장을 덱에서 뺀다',ops:[{op:'sacrificeRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'rookie-card',acts:[1,2,3],title:'루키 카드',text:'어린 팬이 카드첩을 내민다. "사인해주시면 제 카드를 드릴게요!"',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'collect',label:'모은다',desc:'같은 카드를 한 장 더 넣는다',ops:[{op:'duplicateRandom'}]},
     {id:'trade',label:'교환한다',desc:'카드 한 장을 맞바꾼다 · 무작위 1장 교환',ops:[{op:'transformRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'bleacher-creature',acts:[2,3],title:'외야 괴짜',text:'외야석 괴짜가 소리친다. "내 춤을 따라하면 행운이 온다!"',
   choices:[
     {id:'dance',label:'춘다',desc:'50%: 같은 카드를 한 장 더 넣는다 / 50%: 이어지는 아웃 +1',ops:[{op:'gamble',p:0.5,win:[{op:'duplicateRandom'}],lose:[{op:'outsUp'}]}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'anthem',acts:[1,2,3],title:'애국가',text:'경기 전 애국가가 울린다. 가슴에 손을 얹을까.',
   choices:[
     {id:'sing',label:'부른다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'silent',label:'묵념한다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'passed-ball',acts:[1,2],title:'포일',text:'포수가 공을 뒤로 빠뜨렸다. 주자가 뛴다. 쫓을까.',
   choices:[
     {id:'chase',label:'쫓는다',desc:'유물 1개를 얻고, 이어지는 아웃 +1',ops:[{op:'gainRelic'},{op:'outsUp'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'sun-delay',acts:[2,3],title:'햇빛 지연',text:'석양이 마운드를 정면으로 찌른다. 심판이 잠시 멈췄다.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'wait',label:'기다린다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'push',label:'감행한다',desc:'무작위 1장을 잃고 무작위 1장을 얻고, 이어지는 아웃 +1',ops:[{op:'transformRandom'},{op:'outsUp'}]},
     {id:'shade',label:'그늘에서 본다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'perfect-game',acts:[3],title:'퍼펙트 도전',text:'9회까지 노히트. 대기록 앞에서 손이 떨린다.',
   choices:[
     {id:'challenge',label:'도전한다',desc:'40%: 강화 가능한 카드를 전부 강화 / 60%: 이어지는 아웃 +1',ops:[{op:'gamble',p:0.4,win:[{op:'upgradeAll'}],lose:[{op:'outsUp'}]}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'opening-day',acts:[1],title:'개막전',text:'새 시즌 첫 경기. 관중석이 들썩인다.',
   choices:[
     {id:'play',label:'뛴다',desc:'같은 카드를 한 장 더 넣는다',ops:[{op:'duplicateRandom'}]},
     {id:'watch',label:'본다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'wave',acts:[1,2,3],title:'파도타기',text:'관중석 파도타기가 시작됐다. 동참할까.',
   choices:[
     {id:'ride',label:'탄다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'sit',label:'앉는다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'cleanup-hitter',acts:[2,3],title:'4번 타자',text:'4번 타자가 다가온다. "이번 타석은 나한테 맡겨. 대신 장비 한 벌은 내가 고르겠어."',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'trust',label:'맡긴다',desc:'타순을 넘긴다 · 무작위 1장 교환',ops:[{op:'transformRandom'}]},
      {id:'own',label:'거절하고 직접 친다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},

  /* ── R23 배치 ── */
  {id:'foul-ball-back',acts:[1,2,3],title:'파울볼 답사',text:'파울볼이 관중석으로 넘어갔다. 방울 소리가 난다.',
   choices:[
     {id:'chase',label:'쫓아가서 줍는다',desc:'같은 카드를 한 장 더 넣는다',ops:[{op:'duplicateRandom'}]},
     {id:'let',label:'끝까지 안 간다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'bullpen-bet',acts:[1,2,3],title:'불펜 내기',text:'불펜에서 동전을 치는 소리가 난다. "끝까지 가볼래?"',
   choices:[
     {id:'bet',label:'거는',desc:'50%: 다음 전투 타격 +8 / 50%: 이어지는 아웃 +1',ops:[{op:'gamble',p:0.5,win:[{op:'bonus8'}],lose:[{op:'outsUp'}]}]},
     {id:'watch',label:'구경한다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'bat-grip',acts:[1,2,3],title:'배트 그립',text:'손에 쥔 자국이 선명하다. 방식을 바꿔 볼까.',
   choices:[
     {id:'grip',label:'손잡이를 바꾼다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'swing',label:'그대로 친다',desc:'같은 카드를 한 장 더 넣고 이어지는 아웃 +1',ops:[{op:'duplicateRandom'},{op:'outsUp'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'chalk-line',acts:[1,2,3],title:'안내 분필선',text:'타석 주변 분필 선이 번져 있다. 다시 그을까.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'draw',label:'다시 그린다',desc:'무작위 카드 1장 획득',ops:[{op:'addRandom'}]},
     {id:'smudge',label:'발로 지운다',desc:'무작위 1장 교환',ops:[{op:'transformRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'roster-cut',acts:[2,3],title:'명단에서 빠지다',text:'감독이 부른다. 이번 명단엔 네 이름이 없다.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'wait',label:'순서를 기다린다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'watch',label:'응원석에서 지켜본다',desc:'무작위 카드 1장 획득과 이어지는 아웃 +1',ops:[{op:'addRandom'},{op:'outsUp'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'scout-report',acts:[1,2],title:'스카우트 보고서',text:'옛 스카우트가 접힌 종이를 내민다. "읽을래, 버릴래?"',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'read',label:'읽는다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'burn',label:'불에 태운다',desc:'읽은 것을 버리고 새로 짚는다 · 무작위 1장 교환',ops:[{op:'transformRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'locker-door',acts:[1,2,3],title:'라커 문',text:'닫아 둔 라커에서 소리가 난다.',
   choices:[
     {id:'open',label:'연다',desc:'유물 1개를 얻는다',ops:[{op:'gainRelic'}]},
     {id:'shut',label:'닫아 둔다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'cold-water',acts:[1,2,3],title:'냉수 샤워',text:'샤워실에서 물소리가 난다.',
   choices:[
     {id:'shower',label:'찬물로 한다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'skip',label:'건너뛴다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'ground-crew',acts:[1,2,3],title:'그라운드 크루',text:'정원 팀이 그라운드를 말하고 있다. 합류할까.',
   choices:[
     {id:'help',label:'돕는다',desc:'같은 카드를 한 장 더 넣고 이어지는 아웃 +1',ops:[{op:'duplicateRandom'},{op:'outsUp'}]},
     {id:'watch',label:'멀리서 본다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'stadium-lights',acts:[1,2,3],title:'구장 조명',text:'작업자가 조명 하나를 교체 중이다.',
   choices:[
     {id:'help',label:'판을 잡아 준다',desc:'강화 가능한 카드를 전부 강화한다',ops:[{op:'upgradeAll'}]},
     {id:'wait',label:'끝날 때까지돕고 쉰다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'cap-swap',acts:[1,2,3],title:'모자 맞교환',text:'누군가 모자를 바꿔 끼자고 한다.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'swap',label:'맞바꾼다',desc:'무작위 1장 교환',ops:[{op:'transformRandom'}]},
     {id:'keep',label:'내 모자를 지켜낸다',desc:'같은 카드를 한 장 더 넣는다',ops:[{op:'duplicateRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'pitch-clock',acts:[2,3],title:'투구 시계',text:'코치가 손목 시계를 가리킨다. 서두르라고.',
   choices:[
     {id:'rush',label:'서두른다',desc:'60%: 무작위 카드 1장 강화 / 40%: 이어지는 아웃 +1',ops:[{op:'gamble',p:0.6,win:[{op:'upgradeRandom'}],lose:[{op:'outsUp'}]}]},
     {id:'slow',label:'천천히 한다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'scorekeeper',acts:[1,2,3],title:'기록원',text:'옛 기록원이 스코어카드를 베껴 준다.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'copy',label:'베낀다',desc:'같은 카드를 한 장 더 넣는다',ops:[{op:'duplicateRandom'}]},
     {id:'erase',label:'숫자를 지운다',desc:'무작위 1장 교환',ops:[{op:'transformRandom'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'bat-boy',acts:[1,2],title:'배트 전담',text:'배트를 건네주는 사람이 웃으며 손을 내민다.',
   choices:[
     {id:'lend',label:'빌려 든다',desc:'같은 카드를 한 장 더 넣고 이어지는 아웃 +1',ops:[{op:'duplicateRandom'},{op:'outsUp'}]},
     {id:'decline',label:'사양한다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'tar-tub',acts:[1,2,3],title:'타르 통',text:'스파이크에 바르는 검은 타르가 고갈되어 있다.',
   choices:[
     {id:'tar',label:'새 통을 구한다',desc:'유물 1개를 얻고 이어지는 아웃 +1',ops:[{op:'gainRelic'},{op:'outsUp'}]},
     {id:'wipe',label:'닦아만 둔다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'pinch-runner',acts:[2,3],title:'대타 러너',text:'대타 러너 신입이 준비 운동을 한다.',
   choices:[
     {id:'call',label:'불러 세운다',desc:'55%: 같은 카드를 한 장 더 넣는다 / 45%: 이어지는 아웃 +1',ops:[{op:'gamble',p:0.55,win:[{op:'duplicateRandom'}],lose:[{op:'outsUp'}]}]},
     {id:'stay',label:'지키고 둔다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'dugout-fridge',acts:[1,2,3],title:'더그아웃 냉장고',text:'냉장고 문을 열면 전이 낌새가 난다.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'open',label:'문자를 꺼낸다',desc:'무작위 카드 1장 획득',ops:[{op:'addRandom'}]},
     {id:'shut',label:'문 닫는다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'clubhouse-card',acts:[1,2,3],title:'클럽하우시 카드',text:'선배들이 볼 던지는 카드를 펼친다.',
   choices:[
     {id:'play',label:'참가한다',desc:'같은 카드를 한 장 더 넣는다',ops:[{op:'duplicateRandom'}]},
     {id:'fold',label:'접어 둔다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'base-coach',acts:[1,2,3],title:'1루 코치',text:'코치가 손을 내젓는다. 세 번째라고 신호를 준다.',
   choices:[
     {id:'wave',label:'손짓에 따른다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'hold',label:'멈춰 선다',desc:'같은 카드를 한 장 더 넣고 이어지는 아웃 +1',ops:[{op:'duplicateRandom'},{op:'outsUp'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'ticket-comp',acts:[2,3],title:'좌석 승격',text:'빈 좌석이 하나 늘었다. 안내원이 손짓한다.',
   choices:[
     {id:'move',label:'앞자리로 옮긴다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'stay',label:'제자리에 남는다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'bat-shavings',acts:[1,2,3],title:'배트 대패질',text:'만지면 두꺼운 쪽이 정답이다.',
   choices:[
     {id:'shave',label:'얇게 깎는다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'keep',label:'그대로 둔다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'hand-ball',acts:[1,2],title:'핸드볼',text:'연습공이 굴러온다. 주울까.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'catch',label:'받아든다',desc:'무작위 카드 1장 획득',ops:[{op:'addRandom'}]},
     {id:'drop',label:'넘어뜨린다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'closing-time',acts:[1,2,3],title:'마감',text:'구장이 닫힌다. 혼자 남을래.',
   choices:[
     {id:'leave-field',label:'먼저 나간다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'stay',label:'마지막까지 본다',desc:'유물 1개를 얻고 이어지는 아웃 +1',ops:[{op:'gainRelic'},{op:'outsUp'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'foul-territory',acts:[1,2,3],title:'파울 지역',text:'담벼락 뒤편에 뭔가 굴러다녀 있다.',
   choices:[
     {id:'dig',label:'파헤쳐 본다',desc:'무작위 카드 1장을 잃고 유물 1개를 얻는다',ops:[{op:'sacrificeRandom'},{op:'gainRelic'}]},
     {id:'walk',label:'그냥 지나간다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'bat-mark',acts:[1,2,3],title:'배트에 남긴 글씨',text:'배트에 새겨진 글씨가 있다.',
   choices:[
     {id:'keep',label:'새겨 둔다',desc:'같은 카드를 한 장 더 넣는다',ops:[{op:'duplicateRandom'}]},
     {id:'sand',label:'사과한다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'ground-speed',acts:[1,2,3],title:'그라운드 질주',text:'경주 코스를 누가 제안했다.',
   choices:[
     {id:'sprint',label:'끝까지 뛴다',desc:'50%: 다음 전투 타격 +8 / 50%: 이어지는 아웃 +1',ops:[{op:'gamble',p:0.5,win:[{op:'bonus8'}],lose:[{op:'outsUp'}]}]},
     {id:'jog',label:'천천히 뛴다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'rookie-journal',acts:[1],title:'신입 일지',text:'신입이 썼다 지운 첫 문장을 다시 보여 준다.',
   choices:[
     {id:'read',label:'읽어 준다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'close',label:'다시 접어 준다',desc:'강화 가능한 카드를 전부 강화하고 이어지는 아웃 +1',ops:[{op:'upgradeAll'},{op:'outsUp'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'equipment-manager',acts:[1,2,3],title:'장비 관리원',text:'관리원이 장비를 내밀며 도장을 찍는다.',
   choices:[
     {id:'borrow',label:'빌린다',desc:'유물 1개를 얻는다',ops:[{op:'gainRelic'}]},
     {id:'return',label:'돌려준다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'walk-off-battle',acts:[2,3],title:'끝내기 승부',text:'마지막 공을 기다리는 사람이 있다.',
   choices:[
     {id:'take',label:'선수선택을 한다',desc:'50%: 강화 가능한 카드를 전부 강화 / 50%: 이어지는 아웃 +1',ops:[{op:'gamble',p:0.5,win:[{op:'upgradeAll'}],lose:[{op:'outsUp'}]}]},
     {id:'watch',label:'지켜본다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'press-box',acts:[2,3],title:'기자실',text:'기자들이 마이크를 내민다.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'answer',label:'답한다',desc:'무작위 1장 교환',ops:[{op:'transformRandom'}]},
     {id:'report',label:'결과만 전한다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'hide',label:'도망친다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'tape-measure',acts:[1,2,3],title:'줄자',text:'줄자를 펴서 거리를 잰다.',
   choices:[
     {id:'measure',label:'정확히 잰다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'guess',label:'대충 맞춘다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'bat-shed',acts:[1,2,3],title:'배치 창고',text:'배트를 두는 작은 창고가 열려 있다.',
   choices:[
     {id:'raid',label:'두 자루 챙긴다',desc:'같은 카드를 한 장 더 넣고 이어지는 아웃 +1',ops:[{op:'duplicateRandom'},{op:'outsUp'}]},
     {id:'lock',label:'문을 잠근다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'sticky-grip',acts:[2,3],title:'미끄럼 방지',text:'손에 묻은 거품이 잘 안 없어진다.',
   choices:[
     {id:'grip',label:'새 장갑을 덧는다',desc:'유물 1개를 얻고 이어지는 아웃 +1',ops:[{op:'gainRelic'},{op:'outsUp'}]},
     {id:'wipe',label:'천으로 닦는다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'timekeeper',acts:[1,2,3],title:'시간 확인',text:'코치가 시계를 두 번 울린다.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'calm',label:'호흡을 고른다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'rush',label:'서두른다',desc:'무작위 1장 교환과 이어지는 아웃 +1',ops:[{op:'transformRandom'},{op:'outsUp'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'clubhouse-song',acts:[1,2,3],title:'클럽하우시 노래',text:'스피커에서 노래가 나온다.',
   choices:[
     {id:'sing',label:'따라 부른다',desc:'같은 카드를 한 장 더 넣는다',ops:[{op:'duplicateRandom'}]},
     {id:'hum',label:'있어 만든다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'old-scorebook',acts:[1,2],title:'옛 기록장',text:'먼지 쌓인 기록장에 손이 닿는다.',
   choices:[
     {id:'read',label:'펼쳐 본다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'shelf',label:'돌려놓는다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'bat-inspection',acts:[1,2,3],title:'배트 검사',text:'규격 검사가 다가온다.',
   choices:[
     {id:'show',label:'그대로 보여 준다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'hide',label:'숨겨 둔다',desc:'유물 1개를 얻고 이어지는 아웃 +1',ops:[{op:'gainRelic'},{op:'outsUp'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'mascot-race',acts:[1,2,3],title:'마스코트 경주',text:'마스코트가 던지기 대회를 제안한다.',
   choices:[
     {id:'win',label:'먼저 던진다',desc:'50%: 유물 1개 / 50%: 이어지는 아웃 +1',ops:[{op:'gamble',p:0.5,win:[{op:'gainRelic'}],lose:[{op:'outsUp'}]}]},
     {id:'clap',label:'박만 치다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'dugout-mirror',acts:[2,3],title:'더그아웃 거울',text:'얼굴이 낯설다.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'look',label:'주변을 훑어본다',desc:'무작위 1장 교환',ops:[{op:'transformRandom'}]},
     {id:'smash',label:'깨버린다',desc:'무작위 카드 1장 획득과 이어지는 아웃 +1',ops:[{op:'addRandom'},{op:'outsUp'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'seat-view',acts:[1,2,3],title:'자리 시야',text:'앞줄에 빈 자리가 하나 있다.',
   choices:[
     {id:'front',label:'앞줄로 간다',desc:'무작위 카드 1장 강화와 이어지는 아웃 +1',ops:[{op:'upgradeRandom'},{op:'outsUp'}]},
     {id:'back',label:'뒤로 물러난다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'equipment-bag',acts:[1,2,3],title:'장비 가방',text:'닫아 둔 가방이 무겁다.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'open',label:'전부 꺼낸다',desc:'무작위 카드 1장 획득',ops:[{op:'addRandom'}]},
     {id:'zip',label:'다시 닫는다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'bench-stretch',acts:[1,2,3],title:'벤치 스트레칭',text:'이닝 전에 버릇으로 몸을 푼다.',
   choices:[
     {id:'stretch',label:'몸을 푼다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'skip',label:'그냥 앉는다',desc:'같은 카드를 한 장 더 넣고 이어지는 아웃 +1',ops:[{op:'duplicateRandom'},{op:'outsUp'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'warning-track',acts:[1,2,3],title:'경고 트랙',text:'공이 파 라인 밖으로 나갔다.',
   choices:[
     {id:'roll',label:'뛰어가 본다',desc:'유물 1개를 얻고 이어지는 아웃 +1',ops:[{op:'gainRelic'},{op:'outsUp'}]},
     {id:'stay',label:'지켜본다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'chalk-dust',acts:[1,2],title:'분필가루',text:'주루 주변에 분필가루가 새어 나왔다.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'dust',label:'뿌린다',desc:'무작위 카드 1장 획득',ops:[{op:'addRandom'}]},
     {id:'wipe',label:'주머니에 묻는다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'clubhouse-tidy',acts:[1,2,3],title:'클럽하우시 정리',text:'버려야 할 장비가 한적이다. 치우는 사람이 너를 본다.',
   choices:[
     {id:'tidy',label:'쓰레기통을 비운다',desc:'무작위 카드 1장을 잃고 유물 1개를 얻는다',ops:[{op:'sacrificeRandom'},{op:'gainRelic'}]},
     {id:'later',label:'내일 한다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'crowd-count',acts:[1,2],title:'관중 세기',text:'좌석을 세는 기준이 바뀌었다.',
   choices:[
     {id:'count',label:'끝까지 센다',desc:'같은 카드를 한 장 더 넣는다',ops:[{op:'duplicateRandom'}]},
     {id:'skip',label:'건너뛴다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'dugout-note',acts:[2,3],title:'더그아웃 메모지',text:'접힌 메모지가 짐 위에 놓여 있다.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'read',label:'펼친다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'fold',label:'잠시 접어 둔다',desc:'무작위 1장 교환과 이어지는 아웃 +1',ops:[{op:'transformRandom'},{op:'outsUp'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'gear-lottery',acts:[1,2,3],title:'장비 나눠주기',text:'창고에 남은 장비를 팀이 나눠 갖는다.',
   choices:[
     {id:'take',label:'가져간다',desc:'유물 1개를 얻고 이어지는 아웃 +1',ops:[{op:'gainRelic'},{op:'outsUp'}]},
     {id:'decline',label:'남겨 둔다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'closing-chant',acts:[1,2,3],title:'마지막 함성',text:'경기가 끝나고 관중이 마지막 함성을 한다.',
   choices:[
     {id:'chant',label:'합류한다',desc:'같은 카드를 한 장 더 넣고 이어지는 아웃 +1',ops:[{op:'duplicateRandom'},{op:'outsUp'}]},
     {id:'sit',label:'조용히 앉는다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'foul-ball-return',acts:[1,2,3],title:'관중이 되돌려 준다',text:'던진 파울볼이 다시 넘어왔다. 누군가 손을 내밀고 있다.',
   choices:[
     {id:'catch',label:'받아 든다',desc:'무작위 강화 가능 카드 1장을 강화한다',ops:[{op:'upgradeRandom'}]},
     {id:'return',label:'줄인다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'dugout-bullhorn',acts:[1,2,3],title:'더그아웃 나팔',text:'선배가 나팔을 꺼내 든다.',
   choices:[
     {id:'blow',label:'분다',desc:'강화 가능한 카드를 전부 강화하고 이어지는 아웃 +1',ops:[{op:'upgradeAll'},{op:'outsUp'}]},
     {id:'pass',label:'넘긴다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'bat-cooling',acts:[2,3],title:'배트 식히기',text:'방망이가 아직 뜨겁다.',
   choices:[
     {id:'cool',label:'물에 담근다',desc:'강화 가능한 카드를 전부 강화한다',ops:[{op:'upgradeAll'}]},
     {id:'pocket',label:'주머니에 넣는다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'evening-practice',acts:[1,2,3],title:'저녁 연습',text:'조명이 켜진다. 몇 번 더 치를까.',
   choices:[
     {id:'swing',label:'더 친다',desc:'50%: 무작위 카드 1장 강화 / 50%: 이어지는 아웃 +1',ops:[{op:'gamble',p:0.5,win:[{op:'upgradeRandom'}],lose:[{op:'outsUp'}]}]},
     {id:'watch',label:'구경만 한다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'corner-flag',acts:[1,2,3],title:'모서리 깃발',text:'파울선 구석 깃발이 쓰러져 있다.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'raise',label:'세운다',desc:'무작위 카드 1장 획득',ops:[{op:'addRandom'}]},
     {id:'lower',label:'눕혀 둔다',desc:'이어지는 아웃 -1',ops:[{op:'outsDown'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
  {id:'locker-buddy',acts:[1,2],title:'라커 친구',text:'옆 라커의 사람이 장비를 내민다.',
   addPool:['slug','rally','flow','defend','lure','strike'],
   choices:[
     {id:'swap',label:'받아 든다',desc:'무작위 1장 교환',ops:[{op:'transformRandom'}]},
     {id:'cheer',label:'옆자리로 앉는다',desc:'다음 전투 타격 +8',ops:[{op:'bonus8'}]},
     {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
   ]},
];

export function eventForNode(node){
  if(!node||node.type!=='event')return null;
  const eligible=EVENT_DEFS.filter(d=>d.acts.includes(node.act));
  if(!eligible.length)return null;
  /* Appending defs re-maps which event a saved node shows (same seed, longer
     list). That is intended: the offer stays valid and derivable, only its
     fiction changes between versions. */
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
  /* Every card-adding op needs a concrete target; without one it would apply an
     undefined kind and write a card the save validator rejects. */
  if(has('addRandom')&&!params.addKind)return '받을 카드가 없다';
  if(has('duplicateRandom')&&!params.duplicateId)return '덱이 비었다';
  if(has('sacrificeRandom')&&(state.deck.length<=DECK_MIN||!params.sacrificeId))return '덱이 가장 얇다';
  if(has('upgradeRandom')&&!params.upgradeId)return '강화할 카드가 없다';
  if(has('upgradeAll')&&!params.upgradeId)return '강화할 카드가 없다';
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
        if(sub.op==='addRandom'&&!params.addKind)return '받을 카드가 없다';
        if(sub.op==='duplicateRandom'&&!params.duplicateId)return '덱이 비었다';
        if(sub.op==='upgradeRandom'&&!params.upgradeId)return '강화할 카드가 없다';
        if(sub.op==='upgradeAll'&&!params.upgradeId)return '강화할 카드가 없다';
        if(sub.op==='gainRelic'&&!params.relic)return '가져갈 유물이 없다';
        /* A transform needs a concrete random-add pool; without one the offer
           would apply `kind:null` and corrupt the deck. */
        if(sub.op==='transformRandom'&&(!params.addKind||!params.sacrificeId))return '덱이 가장 얇다';
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
  /* Several ops can share one seeded target (two duplicateRandom ops hit the same
     card), so tally instead of printing the same name twice. */
  const counts=new Map();
  const add=part=>counts.set(part,(counts.get(part)||0)+1);
  for(const o of ops){
    if(o.op==='addRandom'&&params.addKind)add(`${CARDS[params.addKind]?.name||params.addKind} 획득`);
    else if(o.op==='sacrificeRandom'&&params.sacrificeId)add(`${cardName(state,params.sacrificeId)} 상실`);
    else if(o.op==='upgradeRandom'&&params.upgradeId)add(`${cardName(state,params.upgradeId)} 강화`);
    else if(o.op==='upgradeAll'&&params.upgradeId)add('강화 전부');
    else if(o.op==='duplicateRandom'&&params.duplicateId)add(`${cardName(state,params.duplicateId)} 복제`);
    else if(o.op==='gainRelic'&&params.relic)add(`${V10_ALL_RELICS[params.relic]?.name||params.relic} 획득`);
    else if(o.op==='transformRandom'&&params.sacrificeId&&params.addKind)add(`${cardName(state,params.sacrificeId)}→${CARDS[params.addKind]?.name||params.addKind}`);
  }
  const parts=[...counts].map(([part,n])=>n>1?`${part} ×${n}`:part);
  return parts.length?' · '+parts.join(' · '):'';
}
const hashStr=s=>[...String(s)].reduce((a,c)=>(Math.imul(a,31)+c.charCodeAt(0))>>>0,7);

function applyOp(s,state,o,lines,seedSalt){
  if(o.op==='addRandom'){
    if(!o.addKind){lines.push('아무 일도 없었다.');return;}
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
  }else if(o.op==='upgradeAll'){
    const targets=s.deck.filter(canUpgrade);
    for(const t of targets)s.deck=applyRewardToDeck(s.deck,{type:'upgrade',id:t.id},s.nextId).deck;
    /* An 18-card deck would otherwise print every name in one line; cap the list. */
    const names=targets.map(t=>cardName(s,t.id)+'+');
    lines.push(`카드 ${names.length}장 강화: ${names.slice(0,4).join(' · ')}${names.length>4?` 외 ${names.length-4}장`:''}.`);
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
    /* Belt-and-braces with choiceProblem: never swap in an undefined kind. */
    if(!o.addKind||!o.sacrificeId){lines.push('아무 일도 없었다.');return;}
    const name=cardName(s,o.sacrificeId);
    s.deck=applyRewardToDeck(s.deck,{type:'remove',id:o.sacrificeId},s.nextId).deck;
    const moved=applyRewardToDeck(s.deck,{type:'add',kind:o.addKind},s.nextId);
    s.deck=moved.deck;s.nextId=moved.nextId;
    lines.push(`${name}${eul(name)} 잃고 ${CARDS[o.addKind]?.name||o.addKind}${eul(CARDS[o.addKind]?.name||o.addKind)} 얻었다.`);
  }else if(o.op==='duplicateRandom'){
    const kind=(state.deck.find(x=>x.id===o.duplicateId))?.kind;
    if(!kind){lines.push('아무 일도 없었다.');return;}
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
