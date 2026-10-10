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
