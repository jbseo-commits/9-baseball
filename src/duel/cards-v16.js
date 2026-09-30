/* V16 reward expansion (2026-09-28): 124 cards across 11 deck concepts.
   Every effect is an engine keyword (engine.js shapeHas / zoneBonusFor / applySkillFx / v10CardFxPlan),
   never a one-off rule. Attack keywords:
     shape  point|row|column|cross|all|pairH|pairV|x|diag|box|corners   power  -1..3 (x18 power edge)
     pressure  precision HP rate on a direct hit     hrCap / singles / advance / foulMiss / foulBall / bunt
     zoneBonus {cols,rows,zones,technique,power}      requires runner|twoStrike|strike|first|empty
     fx (HP on a hit unless noted): hit perRunner empty twoStrike ahead first shaken(per level) scouted xbh
        hand(per card) connect(full stack) support(as a stacked card) foul(on foul) miss(on whiff)
        drawHit drawPlay shakeHit
   Skill fx: aim draw scout(row|full|ball) expand run patient power dmg pressure ballDmg walkDmg foulDmg undo shake
   family = deck concept, rarity = common|uncommon|rare (draft weight by act). Art reuses the family's
   V15 illustration until each card gets its own (see docs/art/V16-CARD-ART-QUEUE.md). */

export const FAMILIES={
  precision:{name:'정밀',text:'좁게 읽고 정확히 맞혀 정타 압박을 키운다'},
  power:{name:'장타',text:'한 존에 파워를 몰아 장타와 홈런으로 끝낸다'},
  relay:{name:'연결',text:'주자를 쌓고 진루시켜 주자 수만큼 피해를 늘린다'},
  grind:{name:'소모전',text:'파울로 버티며 파울마다 투수 HP를 깎는다'},
  eye:{name:'선구안',text:'공을 골라 볼과 볼넷, 유리한 카운트로 압박한다'},
  clutch:{name:'클러치',text:'투스트라이크에 몰렸을 때 가장 강해진다'},
  tempo:{name:'속공',text:'초구부터 공격하고 카드를 계속 돌린다'},
  stack:{name:'연계',text:'카드를 겹쳐 연결할수록 한 스윙이 무거워진다'},
  intel:{name:'분석',text:'공을 간파하고 읽기 등급을 올려 확실하게 친다'},
  mental:{name:'흔들기',text:'투수를 흔들고 흔들린 만큼 더 크게 친다'},
  lane:{name:'코스',text:'몸쪽·바깥·높은·낮은 공 하나의 코스를 전문으로 판다'},
};

const A=(o)=>({type:'attack',needs:[],power:0,...o});
const S=(o)=>({type:'skill',axis:null,needs:[],...o});

export const CARDS_V16={
  /* ---------------- 정밀 precision ---------------- */
  pinpoint:A({family:'precision',rarity:'common',name:'핀포인트',art:'bat',shape:'point',pressure:.70,role:'정타',axis:'point',gives:['1존 커버','정확 적중 HP +70%'],text:'선택한 1존 커버. 메인으로 정확히 적중하면 투수 HP 압박 +70%.',flavor:'정타 노림보다 한 뼘 더 좁게.'}),
  eyeLevel:A({family:'precision',rarity:'common',name:'눈높이 컨택',art:'bat',shape:'pairH',pressure:.35,role:'정타',axis:'pairH',gives:['가로 2존 커버','정확 적중 HP +35%'],text:'선택 존과 가운데 쪽 옆 존 커버. 정확 적중 HP +35%.',flavor:'눈높이로 들어오는 공만 기다린다.'}),
  verticalRead:A({family:'precision',rarity:'common',name:'위아래 노림',art:'bat',shape:'pairV',pressure:.35,role:'정타',axis:'pairV',gives:['세로 2존 커버','정확 적중 HP +35%'],text:'선택 존과 가운데 쪽 위아래 존 커버. 정확 적중 HP +35%.',flavor:'높이만 틀려도 다시 한 번.'}),
  readStrike:A({family:'precision',rarity:'uncommon',name:'읽은 공 강타',art:'target',shape:'point',power:1,pressure:.30,role:'정타',axis:'point',fx:{scouted:6},gives:['1존 · 파워 +18','간파한 공 안타 +6 HP'],text:'1존 커버 · 파워 +18. 이번 공을 간파한 상태에서 안타면 +6 HP.',flavor:'본 공은 놓치지 않는다.'}),
  surgeon:A({family:'precision',rarity:'uncommon',name:'외과의 스윙',art:'bat',shape:'point',pressure:.50,role:'정타',axis:'point',fx:{hit:3},gives:['1존 · 정확 HP +50%','안타 +3 HP'],text:'1존 커버. 정확 적중 HP +50%, 안타면 추가 +3 HP.',flavor:'필요한 곳만 정확히 벤다.'}),
  needle:A({family:'precision',rarity:'rare',name:'바늘구멍',art:'target',shape:'point',power:-1,pressure:1.0,role:'정타',axis:'point',gives:['1존 · 파워 -18','정확 적중 HP +100%'],text:'1존 커버 · 파워 -18. 정확히 적중하면 투수 HP 압박 +100%. 장타는 버리고 피해를 두 배로.',flavor:'바늘구멍으로 낙타를 통과시킨다.'}),
  counterRead:A({family:'precision',rarity:'common',name:'역이용',art:'bat',shape:'point',pressure:.30,role:'정타',axis:'point',fx:{ahead:5},gives:['1존 · 정확 HP +30%','유리한 카운트 안타 +5 HP'],text:'1존 커버. 정확 적중 HP +30%. 볼이 스트라이크보다 많을 때 안타면 +5 HP.',flavor:'던질 곳이 없는 투수를 노린다.'}),
  onePatience:A({family:'precision',rarity:'uncommon',name:'한 칸의 인내',art:'moon',shape:'point',pressure:.40,role:'정타',axis:'point',fx:{drawHit:1},gives:['1존 · 정확 HP +40%','안타 시 카드 +1'],text:'1존 커버. 정확 적중 HP +40%. 안타면 카드 1장 뽑기.',flavor:'한 칸을 맞히면 다음 칸이 보인다.'}),
  laserEye:A({family:'precision',rarity:'uncommon',name:'레이저 아이',art:'sun',shape:'diag',pressure:.30,role:'정타',axis:'diag',gives:['대각선 커버','정확 적중 HP +30%'],text:'선택 존을 지나는 대각선 전체 커버. 정확 적중 HP +30%.',flavor:'구석에서 구석으로 긋는 선.'}),
  coldRead:S({family:'precision',rarity:'uncommon',name:'냉정한 판독',art:'eye',role:'관찰',fx:{scout:'full',pressure:.20},gives:['높이·안팎 확인','정확 HP +20%'],text:'준비 1회 · 이번 공의 높이와 안팎을 모두 확인. 이번 타석 정확 적중 HP +20%.',flavor:'숨을 멈추고 한 칸만 본다.'}),
  focusBreath:S({family:'precision',rarity:'common',name:'집중 호흡',art:'target',role:'집중',fx:{aim:1,pressure:.40},gives:['집중 +1','정확 HP +40%'],text:'준비 1회 · 이번 타석 집중 +1, 정확 적중 HP +40%.',flavor:'배트 끝까지 신경을 모은다.'}),
  markZone:S({family:'precision',rarity:'common',name:'존 마킹',art:'target',role:'집중',fx:{pressure:.25,draw:1},gives:['정확 HP +25%','카드 +1'],text:'준비 1회 · 이번 타석 정확 적중 HP +25%. 카드 1장 뽑기.',flavor:'칠 곳에 점을 찍어 둔다.'}),
  perfectRead:A({family:'precision',rarity:'rare',name:'완벽한 판독',art:'eye',shape:'point',power:2,pressure:.60,role:'정타',axis:'point',fx:{scouted:10},gives:['1존 · 파워 +36 · 정확 +60%','간파한 공 +10 HP'],text:'1존 커버 · 파워 +36. 정확 적중 HP +60%. 간파한 공을 치면 추가 +10 HP.',flavor:'읽기가 끝나면 스윙은 결과를 적을 뿐.'}),

  /* ---------------- 장타 power ---------------- */
  fullSwing:A({family:'power',rarity:'common',name:'풀스윙',art:'comet',shape:'point',power:2,hrCap:true,role:'장타',axis:'point',gives:['1존 · 파워 +36','홈런 상한 해제'],text:'1존 커버 · 파워 +36. 홈런 확률 상한이 크게 열린다.',flavor:'맞으면 넘어간다.'}),
  moonshot:A({family:'power',rarity:'rare',name:'문샷',art:'comet',shape:'point',power:3,hrCap:true,role:'장타',axis:'point',fx:{xbh:4},gives:['1존 · 파워 +54','장타 +4 HP'],text:'1존 커버 · 파워 +54 · 홈런 상한 해제. 2루타 이상이면 +4 HP.',flavor:'달까지 보내 버린다.'}),
  gapHunter:A({family:'power',rarity:'common',name:'좌중간 가르기',art:'sun',shape:'pairH',power:1,role:'장타',axis:'pairH',fx:{xbh:3},gives:['가로 2존 · 파워 +18','장타 +3 HP'],text:'가로 2존 커버 · 파워 +18. 2루타 이상이면 +3 HP.',flavor:'외야수 둘 사이의 빈 땅.'}),
  pullHook:A({family:'power',rarity:'common',name:'잡아당기기',art:'comet',shape:'column',power:1,zoneBonus:{cols:[0],power:1},role:'장타',axis:'column',gives:['세로 3존 · 파워 +18','몸쪽 공 파워 +18'],text:'세로 3존 커버 · 파워 +18. 몸쪽 공을 치면 파워 +18 추가.',flavor:'몸쪽은 당겨서 담장으로.'}),
  oppoPower:A({family:'power',rarity:'uncommon',name:'밀어서 넘기기',art:'sun',shape:'column',power:1,zoneBonus:{cols:[2],power:1},role:'장타',axis:'column',gives:['세로 3존 · 파워 +18','바깥 공 파워 +18'],text:'세로 3존 커버 · 파워 +18. 바깥 공을 치면 파워 +18 추가.',flavor:'반대 방향 담장도 담장이다.'}),
  upperCut:A({family:'power',rarity:'uncommon',name:'어퍼컷',art:'comet',shape:'row',power:1,zoneBonus:{rows:[2],power:1},role:'장타',axis:'row',gives:['가로 3존 · 파워 +18','낮은 공 파워 +18'],text:'가로 3존 커버 · 파워 +18. 낮은 공을 치면 파워 +18 추가.',flavor:'떨어지는 공을 퍼 올린다.'}),
  highHeat:A({family:'power',rarity:'uncommon',name:'하이볼 강타',art:'sun',shape:'row',power:1,zoneBonus:{rows:[0],power:1},role:'장타',axis:'row',gives:['가로 3존 · 파워 +18','높은 공 파워 +18'],text:'가로 3존 커버 · 파워 +18. 높은 공을 치면 파워 +18 추가.',flavor:'눈높이 직구는 선물이다.'}),
  cleanup:A({family:'power',rarity:'uncommon',name:'4번 타자',art:'comet',shape:'point',power:2,role:'장타',axis:'point',fx:{perRunner:3},gives:['1존 · 파워 +36','주자 1명당 안타 +3 HP'],text:'1존 커버 · 파워 +36. 안타 때 루상 주자 1명당 +3 HP.',flavor:'밥상은 차려졌다.'}),
  soloShot:A({family:'power',rarity:'common',name:'솔로포 각',art:'comet',shape:'point',power:2,role:'장타',axis:'point',fx:{empty:6},gives:['1존 · 파워 +36','빈 베이스 안타 +6 HP'],text:'1존 커버 · 파워 +36. 주자가 없을 때 안타면 +6 HP.',flavor:'혼자서도 한 점.'}),
  loadPower:S({family:'power',rarity:'common',name:'힘 모으기',art:'target',role:'장타',fx:{power:1},gives:['이번 타석 파워 +18'],text:'준비 1회 · 이번 타석 모든 스윙 파워 +18.',flavor:'하체에 힘을 싣는다.'}),
  sluggerInstinct:S({family:'power',rarity:'uncommon',name:'거포 본능',art:'comet',role:'장타',fx:{power:2},gives:['이번 타석 파워 +36'],text:'준비 1회 · 이번 타석 모든 스윙 파워 +36.',flavor:'짧게 치는 법은 잊었다.'}),
  calledShot:S({family:'power',rarity:'rare',name:'예고 홈런',art:'comet',role:'장타',fx:{power:2,dmg:6},gives:['파워 +36','이번 타석 안타 +6 HP'],text:'준비 1회 · 이번 타석 파워 +36, 안타면 +6 HP.',flavor:'배트 끝으로 담장을 가리킨다.'}),
  thunder:A({family:'power',rarity:'rare',name:'천둥 스윙',art:'sun',shape:'cross',power:1,role:'장타',axis:'cross',fx:{miss:3},gives:['십자 5존 · 파워 +18','헛스윙도 +3 HP'],text:'십자 5존 커버 · 파워 +18. 헛스윙해도 바람 소리에 투수 HP -3.',flavor:'못 맞혀도 무섭게.'}),

  /* ---------------- 연결 relay ---------------- */
  advanceHit:A({family:'relay',rarity:'common',name:'진루타',art:'double',shape:'row',advance:2,role:'진루',axis:'row',fx:{perRunner:1},gives:['가로 3존 · 주자 +2베이스','주자 1명당 +1 HP'],text:'가로 3존 커버. 안타면 기존 주자 최소 2베이스 진루, 주자 1명당 +1 HP.',flavor:'한 베이스 더.'}),
  hitAndRun:A({family:'relay',rarity:'common',name:'히트 앤드 런',art:'double',shape:'column',advance:2,role:'진루',axis:'column',fx:{perRunner:2},gives:['세로 3존 · 주자 +2베이스','주자 1명당 +2 HP'],text:'세로 3존 커버. 안타면 기존 주자 최소 2베이스, 주자 1명당 +2 HP.',flavor:'주자는 이미 뛰고 있다.'}),
  squeeze:A({family:'relay',rarity:'uncommon',name:'스퀴즈',art:'diamond',shape:'all',bunt:{sac:.82,foul:.18,plusSac:.92,plusFoul:.08},role:'진루',axis:'all',gives:['희생 82%','주자 진루'],needs:['아웃 지불'],text:'9존 대응. 스트라이크에 82% 희생 번트, 18% 파울. 2스트라이크 번트 파울은 삼진.',flavor:'3루 주자, 지금이다.'}),
  tableSetter:A({family:'relay',rarity:'common',name:'테이블 세터',art:'double',shape:'pairH',singles:true,role:'진루',axis:'pairH',fx:{empty:3,drawHit:1},gives:['가로 2존 · 단타','빈 베이스 +3 HP · 카드 +1'],text:'가로 2존 커버 · 단타 확정. 주자가 없을 때 안타면 +3 HP. 안타 시 카드 1장.',flavor:'일단 나가야 시작된다.'}),
  rbiMachine:A({family:'relay',rarity:'uncommon',name:'타점 기계',art:'double',shape:'point',power:1,role:'진루',axis:'point',fx:{perRunner:4},gives:['1존 · 파워 +18','주자 1명당 +4 HP'],text:'1존 커버 · 파워 +18. 안타 때 루상 주자 1명당 +4 HP.',flavor:'주자가 보이면 눈이 빛난다.'}),
  steppingStone:A({family:'relay',rarity:'rare',name:'징검다리',art:'double',shape:'cross',advance:2,role:'진루',axis:'cross',gives:['십자 5존 커버','주자 +2베이스'],text:'십자 5존 커버. 안타면 기존 주자 최소 2베이스 진루.',flavor:'한 명씩 건너간다.'}),
  basesLoaded:A({family:'relay',rarity:'rare',name:'만루 작전',art:'double',shape:'row',advance:3,role:'진루',axis:'row',fx:{perRunner:5},gives:['가로 3존 · 주자 전원 홈인','주자 1명당 +5 HP'],text:'가로 3존 커버. 안타면 기존 주자 전원 홈인, 주자 1명당 +5 HP.',flavor:'꽉 찬 베이스는 쏟아지기 위해 있다.'}),
  leadOff:A({family:'relay',rarity:'common',name:'리드오프',art:'bat',shape:'pairV',role:'진루',axis:'pairV',fx:{first:3,empty:2},gives:['세로 2존 커버','초구 +3 · 빈 베이스 +2 HP'],text:'세로 2존 커버. 초구 안타 +3 HP, 주자가 없을 때 안타 +2 HP.',flavor:'첫 타자의 첫 공.'}),
  stealSign:S({family:'relay',rarity:'common',name:'도루 사인',art:'spark',role:'진루',requires:'runner',fx:{run:1,draw:1},gives:['주자 +1루','카드 +1'],needs:['주자'],text:'준비 1회 · 이번 타석 안타 때 기존 주자 추가 1베이스. 카드 1장. 주자가 있어야 사용.',flavor:'투수가 발을 들면 뛴다.'}),
  thirdCoach:S({family:'relay',rarity:'uncommon',name:'3루 코치',art:'spark',role:'진루',requires:'runner',fx:{run:2},gives:['주자 +2루'],needs:['주자'],text:'준비 1회 · 이번 타석 안타 때 기존 주자 추가 2베이스. 주자가 있어야 사용.',flavor:'팔을 돌린다. 홈까지.'}),
  chainSign:S({family:'relay',rarity:'common',name:'연결 사인',art:'spark',role:'진루',requires:'runner',fx:{dmg:4},gives:['이번 타석 안타 +4 HP'],needs:['주자'],text:'준비 1회 · 이번 타석 안타면 +4 HP. 주자가 있어야 사용.',flavor:'다음 타자에게 넘긴다.'}),
  homeRush:S({family:'relay',rarity:'rare',name:'홈 쇄도',art:'spark',role:'진루',requires:'runner',fx:{run:2,dmg:6},gives:['주자 +2루','안타 +6 HP'],needs:['주자'],text:'준비 1회 · 이번 타석 안타 때 주자 추가 2베이스, 안타 +6 HP. 주자가 있어야 사용.',flavor:'슬라이딩, 세이프.'}),
  relayBat:A({family:'relay',rarity:'uncommon',name:'이어치기',art:'double',shape:'row',advance:2,role:'진루',axis:'row',fx:{support:3},gives:['가로 3존 · 주자 +2베이스','겹쳐 쓰면 안타 +3 HP'],text:'가로 3존 커버. 안타면 주자 최소 2베이스. 겹친 카드로 써서 안타가 나면 +3 HP.',flavor:'앞 타자의 스윙을 이어받는다.'}),

  /* ---------------- 소모전 grind ---------------- */
  cutMaster:A({family:'grind',rarity:'uncommon',name:'커트 장인',art:'shield',shape:'cross',power:-1,singles:true,foulMiss:.50,foulBall:.25,role:'생존',axis:'cross',fx:{foul:2},gives:['십자 5존 · 단타','파울 50% · 파울 +2 HP'],text:'십자 5존 커버 · 단타 확정. 빗나가도 파울 50%, 파울마다 투수 HP -2.',flavor:'열 개를 걷어내면 열한 번째가 온다.'}),
  fightOff:A({family:'grind',rarity:'common',name:'걷어내기',art:'shield',shape:'pairH',singles:true,foulMiss:.45,role:'생존',axis:'pairH',fx:{foul:2},gives:['가로 2존 · 단타','파울 45% · 파울 +2 HP'],text:'가로 2존 커버 · 단타 확정. 빗나가도 파울 45%, 파울 +2 HP.',flavor:'좋은 공이 올 때까지.'}),
  longAtBat:A({family:'grind',rarity:'uncommon',name:'끈질긴 타석',art:'moon',shape:'row',singles:true,foulMiss:.40,role:'생존',axis:'row',fx:{foul:3},gives:['가로 3존 · 단타','파울 40% · 파울 +3 HP'],text:'가로 3존 커버 · 단타 확정. 빗나가도 파울 40%, 파울 +3 HP.',flavor:'투구 수 15개짜리 타석.'}),
  wearDown:S({family:'grind',rarity:'common',name:'투구 수 늘리기',art:'moon',role:'생존',fx:{patient:1,foulDmg:3},gives:['파울 생존','이번 타석 파울 +3 HP'],text:'준비 1회 · 이번 타석 파울 생존력 증가, 파울마다 +3 HP.',flavor:'어깨는 무한하지 않다.'}),
  holdOn:S({family:'grind',rarity:'uncommon',name:'버티기',art:'moon',role:'생존',fx:{patient:1,draw:2},gives:['파울 생존','카드 +2'],text:'준비 1회 · 이번 타석 파울 생존력 증가. 카드 2장 뽑기.',flavor:'무릎을 꿇지 않는다.'}),
  shieldBat:A({family:'grind',rarity:'rare',name:'방패 배트',art:'shield',shape:'cross',power:-1,singles:true,foulMiss:.60,foulBall:.30,role:'생존',axis:'cross',fx:{foul:4},gives:['십자 5존 · 단타','파울 60% · 파울 +4 HP'],text:'십자 5존 커버 · 단타 확정. 빗나가도 파울 60%, 존 밖 볼도 30% 파울. 파울마다 +4 HP.',flavor:'이 배트로는 삼진당하지 않는다.'}),
  grinder:A({family:'grind',rarity:'rare',name:'그라인더',art:'shield',shape:'box',singles:true,foulMiss:.50,role:'생존',axis:'box',fx:{foul:1},gives:['주변 9존 · 단타','파울 50% · 파울 +1 HP'],text:'선택 존과 주변 칸 모두 커버 · 단타 확정. 빗나가도 파울 50%, 파울 +1 HP.',flavor:'갈아서 넘긴다.'}),
  gripTape:S({family:'grind',rarity:'uncommon',name:'그립 테이프',art:'ball',role:'생존',fx:{expand:1,patient:1},gives:['범위 +1','파울 생존'],text:'준비 1회 · 다음 스윙 커버를 상하좌우 1칸 확장, 이번 타석 파울 생존력 증가.',flavor:'손에서 미끄러지지 않게.'}),
  foulTip:A({family:'grind',rarity:'common',name:'파울팁',art:'shield',shape:'pairV',singles:true,foulMiss:.55,role:'생존',axis:'pairV',fx:{foul:2},gives:['세로 2존 · 단타','파울 55% · 파울 +2 HP'],text:'세로 2존 커버 · 단타 확정. 빗나가도 파울 55%, 파울 +2 HP.',flavor:'스치기만 해도 산다.'}),
  attrition:A({family:'grind',rarity:'rare',name:'소모전',art:'moon',shape:'cross',singles:true,foulMiss:.50,role:'생존',axis:'cross',fx:{foul:5},gives:['십자 5존 · 단타','파울 50% · 파울 +5 HP'],text:'십자 5존 커버 · 단타 확정. 빗나가도 파울 50%, 파울마다 +5 HP.',flavor:'이긴 쪽이 더 지친 쪽이다.'}),
  benchCheer:S({family:'grind',rarity:'common',name:'벤치의 격려',art:'moon',role:'생존',fx:{draw:1,foulDmg:2},gives:['카드 +1','이번 타석 파울 +2 HP'],text:'준비 1회 · 카드 1장 뽑기. 이번 타석 파울마다 +2 HP.',flavor:'더그아웃이 일어선다.'}),
  timeOut:S({family:'grind',rarity:'rare',name:'타임',art:'moon',role:'생존',requires:'strike',fx:{undo:1},gives:['스트라이크 -1'],needs:['스트라이크'],text:'준비 1회 · 스트라이크 하나를 지운다. 스트라이크가 있을 때만 사용.',flavor:'잠깐, 타석을 벗어난다.'}),

  /* ---------------- 선구안 eye ---------------- */
  goodEye:S({family:'eye',rarity:'common',name:'좋은 눈',art:'eye',role:'관찰',fx:{scout:'ball',draw:1},gives:['볼 여부 확인','카드 +1'],text:'준비 1회 · 이번 공이 볼인지 스트라이크 존 안인지 확인. 카드 1장.',flavor:'볼은 치지 않는다.'}),
  countBattle:S({family:'eye',rarity:'common',name:'카운트 싸움',art:'eye',role:'집중',fx:{ballDmg:2},gives:['이번 타석 볼 +2 HP'],text:'준비 1회 · 이번 타석 지켜본 볼마다 투수 HP -2 추가.',flavor:'투수가 먼저 지친다.'}),
  walkHunter:S({family:'eye',rarity:'uncommon',name:'볼넷 사냥',art:'eye',role:'집중',fx:{walkDmg:8},gives:['이번 타석 볼넷 +8 HP'],text:'준비 1회 · 이번 타석 볼넷이면 투수 HP -8 추가.',flavor:'걸어 나가도 상처는 남는다.'}),
  aheadSwing:A({family:'eye',rarity:'common',name:'유리한 카운트',art:'bat',shape:'point',power:1,role:'정타',axis:'point',fx:{ahead:6},gives:['1존 · 파워 +18','유리한 카운트 안타 +6 HP'],text:'1존 커버 · 파워 +18. 볼이 스트라이크보다 많을 때 안타면 +6 HP.',flavor:'이제 내가 고를 차례.'}),
  sitFastball:A({family:'eye',rarity:'common',name:'직구 노림',art:'bat',shape:'pairH',role:'정타',axis:'pairH',fx:{ahead:4},gives:['가로 2존 커버','유리한 카운트 안타 +4 HP'],text:'가로 2존 커버. 볼이 많을 때 안타면 +4 HP.',flavor:'카운트를 잡으러 오는 공.'}),
  discipline:S({family:'eye',rarity:'common',name:'참을성',art:'moon',role:'생존',fx:{patient:1,ballDmg:1},gives:['파울 생존','이번 타석 볼 +1 HP'],text:'준비 1회 · 이번 타석 파울 생존력 증가, 지켜본 볼마다 +1 HP.',flavor:'참는 것도 기술이다.'}),
  zoneJudge:S({family:'eye',rarity:'uncommon',name:'존 판정',art:'book',role:'관찰',fx:{scout:'row',ballDmg:1},gives:['높이 · 볼 확인','이번 타석 볼 +1 HP'],text:'준비 1회 · 이번 공의 높이 또는 볼 여부 확인. 이번 타석 볼마다 +1 HP.',flavor:'심판보다 먼저 판정한다.'}),
  threeOh:A({family:'eye',rarity:'rare',name:'3볼 노림',art:'comet',shape:'point',power:2,role:'장타',axis:'point',fx:{ahead:9},gives:['1존 · 파워 +36','유리한 카운트 안타 +9 HP'],text:'1존 커버 · 파워 +36. 볼이 스트라이크보다 많을 때 안타면 +9 HP.',flavor:'3-0, 그린 라이트.'}),
  eyeTest:A({family:'eye',rarity:'uncommon',name:'선구안 테스트',art:'eye',shape:'pairV',role:'정타',axis:'pairV',fx:{ahead:3,drawHit:1},gives:['세로 2존 커버','유리한 카운트 +3 HP · 카드 +1'],text:'세로 2존 커버. 볼이 많을 때 안타면 +3 HP. 안타 시 카드 1장.',flavor:'고른 공만 친다.'}),
  scoreSheet:S({family:'eye',rarity:'common',name:'기록지 분석',art:'book',role:'관찰',fx:{draw:2},gives:['카드 +2','읽기 점수 +1'],text:'준비 1회 · 카드 2장 뽑기. 덱에 있으면 읽기 등급 점수 +1.',flavor:'어제의 공이 오늘의 공을 알려준다.'}),
  hawkEye:S({family:'eye',rarity:'rare',name:'매의 눈',art:'eye',role:'관찰',fx:{scout:'full',ballDmg:2},gives:['높이·안팎 확인','이번 타석 볼 +2 HP'],text:'준비 1회 · 이번 공의 높이와 안팎 확인. 이번 타석 볼마다 +2 HP.',flavor:'실밥이 보인다.'}),
  takeSign:S({family:'eye',rarity:'common',name:'웨이팅 사인',art:'eye',role:'집중',fx:{aim:1,ballDmg:1},gives:['집중 +1','이번 타석 볼 +1 HP'],text:'준비 1회 · 이번 타석 집중 +1, 지켜본 볼마다 +1 HP.',flavor:'하나 보고 간다.'}),

  /* ---------------- 클러치 clutch ---------------- */
  twoStrikeApproach:A({family:'clutch',rarity:'uncommon',name:'투스트라이크 어프로치',art:'shield',shape:'cross',role:'생존',axis:'cross',fx:{twoStrike:4},gives:['십자 5존 커버','투스트라이크 안타 +4 HP'],text:'십자 5존 커버. 투스트라이크에서 안타면 +4 HP.',flavor:'몰리면 넓게 지킨다.'}),
  lastChance:A({family:'clutch',rarity:'uncommon',name:'마지막 기회',art:'comet',shape:'point',power:2,role:'장타',axis:'point',fx:{twoStrike:8},gives:['1존 · 파워 +36','투스트라이크 안타 +8 HP'],text:'1존 커버 · 파워 +36. 투스트라이크에서 안타면 +8 HP.',flavor:'한 번 남았다. 한 번이면 된다.'}),
  clutchHitter:A({family:'clutch',rarity:'uncommon',name:'클러치 히터',art:'double',shape:'pairH',role:'진루',axis:'pairH',fx:{twoStrike:5,perRunner:2},gives:['가로 2존 커버','투스트라이크 +5 · 주자당 +2 HP'],text:'가로 2존 커버. 투스트라이크 안타 +5 HP, 주자 1명당 +2 HP.',flavor:'득점권에서 더 강하다.'}),
  chokeUp:A({family:'clutch',rarity:'common',name:'짧게 쥐기',art:'shield',shape:'row',singles:true,foulMiss:.30,role:'생존',axis:'row',fx:{twoStrike:3},gives:['가로 3존 · 단타','투스트라이크 안타 +3 HP'],text:'가로 3존 커버 · 단타 확정. 빗나가도 파울 30%. 투스트라이크 안타 +3 HP.',flavor:'배트를 한 뼘 짧게.'}),
  nerveOfSteel:S({family:'clutch',rarity:'uncommon',name:'강심장',art:'target',role:'집중',requires:'twoStrike',fx:{power:2,dmg:4},gives:['파워 +36','이번 타석 안타 +4 HP'],needs:['투스트라이크'],text:'준비 1회 · 투스트라이크에서만. 이번 타석 파워 +36, 안타 +4 HP.',flavor:'심장이 느려진다.'}),
  edgeSwing:A({family:'clutch',rarity:'rare',name:'벼랑 끝 스윙',art:'comet',shape:'point',power:3,hrCap:true,role:'장타',axis:'point',fx:{twoStrike:10},gives:['1존 · 파워 +54','투스트라이크 안타 +10 HP'],text:'1존 커버 · 파워 +54 · 홈런 상한 해제. 투스트라이크 안타 +10 HP.',flavor:'떨어지기 직전이 가장 높다.'}),
  zoneProtect:A({family:'clutch',rarity:'uncommon',name:'존 보호',art:'shield',shape:'box',singles:true,foulMiss:.35,role:'생존',axis:'box',fx:{twoStrike:2},gives:['주변 9존 · 단타','투스트라이크 안타 +2 HP'],text:'선택 존과 주변 칸 커버 · 단타 확정. 빗나가도 파울 35%. 투스트라이크 안타 +2 HP.',flavor:'스트라이크는 전부 건드린다.'}),
  fightingSpirit:S({family:'clutch',rarity:'common',name:'투혼',art:'moon',role:'생존',requires:'twoStrike',fx:{patient:1,draw:2},gives:['파울 생존','카드 +2'],needs:['투스트라이크'],text:'준비 1회 · 투스트라이크에서만. 파울 생존력 증가, 카드 2장.',flavor:'아직 끝나지 않았다.'}),
  walkOff:A({family:'clutch',rarity:'rare',name:'끝내기 본능',art:'sun',shape:'pairV',power:2,role:'장타',axis:'pairV',fx:{twoStrike:6,perRunner:3},gives:['세로 2존 · 파워 +36','투스트라이크 +6 · 주자당 +3 HP'],text:'세로 2존 커버 · 파워 +36. 투스트라이크 안타 +6 HP, 주자 1명당 +3 HP.',flavor:'마지막 타석이 제일 좋다.'}),
  iceVeins:S({family:'clutch',rarity:'common',name:'얼음 심장',art:'target',role:'집중',requires:'twoStrike',fx:{aim:1,pressure:.50},gives:['집중 +1','정확 HP +50%'],needs:['투스트라이크'],text:'준비 1회 · 투스트라이크에서만. 집중 +1, 이번 타석 정확 적중 HP +50%.',flavor:'손끝이 차가워진다.'}),
  counterPrep:S({family:'clutch',rarity:'common',name:'반격 준비',art:'target',role:'집중',requires:'strike',fx:{aim:2},gives:['집중 +2'],needs:['스트라이크'],text:'준비 1회 · 스트라이크가 있을 때만. 이번 타석 집중 +2.',flavor:'맞은 만큼 돌려준다.'}),
  comebackSwing:A({family:'clutch',rarity:'common',name:'반격의 풀스윙',art:'sun',shape:'column',power:1,role:'장타',axis:'column',fx:{twoStrike:5},gives:['세로 3존 · 파워 +18','투스트라이크 안타 +5 HP'],text:'세로 3존 커버 · 파워 +18. 투스트라이크 안타 +5 HP.',flavor:'몰린 자의 스윙은 크다.'}),

  /* ---------------- 속공 tempo ---------------- */
  firstStrike:A({family:'tempo',rarity:'common',name:'초구 공략',art:'bat',shape:'pairH',role:'정타',axis:'pairH',fx:{first:5},gives:['가로 2존 커버','초구 안타 +5 HP'],text:'가로 2존 커버. 타석 첫 공을 안타로 만들면 +5 HP.',flavor:'준비는 대기 타석에서 끝났다.'}),
  aggressive:A({family:'tempo',rarity:'common',name:'적극 타격',art:'bat',shape:'row',role:'수급',axis:'row',fx:{first:4,drawPlay:1},gives:['가로 3존 · 사용 시 카드 +1','초구 안타 +4 HP'],text:'가로 3존 커버. 쓰면 카드 1장 뽑기. 초구 안타 +4 HP.',flavor:'기다리지 않는다.'}),
  quickFastball:A({family:'tempo',rarity:'uncommon',name:'빠른 공 대처',art:'comet',shape:'point',power:1,role:'장타',axis:'point',fx:{first:6},gives:['1존 · 파워 +18','초구 안타 +6 HP'],text:'1존 커버 · 파워 +18. 초구 안타 +6 HP.',flavor:'첫 공은 늘 직구다.'}),
  quickWrists:A({family:'tempo',rarity:'common',name:'빠른 손목',art:'bat',shape:'column',role:'수급',axis:'column',fx:{first:3,drawHit:1},gives:['세로 3존 커버','초구 +3 HP · 안타 시 카드 +1'],text:'세로 3존 커버. 초구 안타 +3 HP. 안타 시 카드 1장.',flavor:'늦게 봐도 빨리 친다.'}),
  ambush:S({family:'tempo',rarity:'common',name:'매복',art:'target',role:'집중',requires:'first',fx:{power:1,dmg:3},gives:['파워 +18','이번 타석 안타 +3 HP'],needs:['타석 첫 공'],text:'준비 1회 · 타석 첫 공에서만. 이번 타석 파워 +18, 안타 +3 HP.',flavor:'초구가 오는 순간을 안다.'}),
  hotStart:A({family:'tempo',rarity:'rare',name:'불붙은 방망이',art:'sun',shape:'cross',power:1,role:'장타',axis:'cross',fx:{first:8},gives:['십자 5존 · 파워 +18','초구 안타 +8 HP'],text:'십자 5존 커버 · 파워 +18. 초구 안타 +8 HP.',flavor:'첫 공부터 불이 붙는다.'}),
  lineupCycle:S({family:'tempo',rarity:'common',name:'타순 순환',art:'eye',role:'수급',fx:{draw:2,aim:1},gives:['카드 +2','집중 +1'],text:'준비 1회 · 카드 2장 뽑기, 이번 타석 집중 +1.',flavor:'다음, 그다음, 그다음.'}),
  reshuffle:S({family:'tempo',rarity:'uncommon',name:'다시 짜기',art:'book',role:'수급',fx:{draw:3},gives:['카드 +3'],text:'준비 1회 · 카드 3장 뽑기. 손패는 최대 9장.',flavor:'작전판을 뒤집는다.'}),
  fullHand:A({family:'tempo',rarity:'uncommon',name:'만반의 준비',art:'book',shape:'point',role:'정타',axis:'point',fx:{hand:1},gives:['1존 커버','안타 시 손패 1장당 +1 HP'],text:'1존 커버. 안타 때 남은 손패 1장당 +1 HP.',flavor:'쓸 카드가 많을수록 무겁다.'}),
  allIn:A({family:'tempo',rarity:'rare',name:'올인',art:'sun',shape:'row',power:1,role:'장타',axis:'row',fx:{hand:2},gives:['가로 3존 · 파워 +18','안타 시 손패 1장당 +2 HP'],text:'가로 3존 커버 · 파워 +18. 안타 때 남은 손패 1장당 +2 HP.',flavor:'가진 걸 전부 건다.'}),
  tempoSwing:A({family:'tempo',rarity:'common',name:'템포 스윙',art:'bat',shape:'pairV',role:'수급',axis:'pairV',fx:{drawPlay:1},gives:['세로 2존 커버','사용 시 카드 +1'],text:'세로 2존 커버. 쓰면 카드 1장 뽑기.',flavor:'리듬이 끊기지 않는다.'}),
  rhythm:S({family:'tempo',rarity:'common',name:'리듬 타기',art:'spark',role:'수급',fx:{aim:1,draw:1},gives:['집중 +1','카드 +1'],text:'준비 1회 · 이번 타석 집중 +1, 카드 1장.',flavor:'투수의 박자에 올라탄다.'}),

  /* ---------------- 연계 stack ---------------- */
  backupSwing:A({family:'stack',rarity:'common',name:'백업 스윙',art:'shield',shape:'pairH',role:'범위',axis:'pairH',fx:{support:4},gives:['가로 2존 커버','겹쳐 쓰면 안타 +4 HP'],text:'가로 2존 커버. 겹친 카드로 써서 안타가 나면 +4 HP.',flavor:'메인이 놓친 공을 받아낸다.'}),
  wideNet:A({family:'stack',rarity:'common',name:'그물망',art:'shield',shape:'row',power:-1,role:'범위',axis:'row',fx:{support:3},gives:['가로 3존 · 파워 -18','겹쳐 쓰면 안타 +3 HP'],text:'가로 3존 커버 · 파워 -18. 겹친 카드로 써서 안타가 나면 +3 HP.',flavor:'촘촘하게 펼친다.'}),
  comboStarter:A({family:'stack',rarity:'uncommon',name:'연계의 시작',art:'target',shape:'point',pressure:.30,role:'정타',axis:'point',fx:{connect:5},gives:['1존 · 정확 HP +30%','완전 연결 안타 +5 HP'],text:'1존 커버. 정확 적중 HP +30%. 메인으로 쓰고 겹친 카드가 모두 연결되면 안타 +5 HP.',flavor:'첫 고리가 사슬을 정한다.'}),
  chainLink:A({family:'stack',rarity:'rare',name:'사슬 고리',art:'shield',shape:'cross',role:'범위',axis:'cross',fx:{support:3,connect:3},gives:['십자 5존 커버','겹침 +3 · 완전 연결 +3 HP'],text:'십자 5존 커버. 겹친 카드로 안타 +3 HP. 메인으로 완전 연결 안타 +3 HP.',flavor:'어느 쪽에서 당겨도 끊기지 않는다.'}),
  teamBatting:A({family:'stack',rarity:'uncommon',name:'팀 배팅',art:'double',shape:'column',role:'범위',axis:'column',fx:{support:5},gives:['세로 3존 커버','겹쳐 쓰면 안타 +5 HP'],text:'세로 3존 커버. 겹친 카드로 써서 안타가 나면 +5 HP.',flavor:'한 명이 아니라 아홉 명이 친다.'}),
  fullStack:A({family:'stack',rarity:'rare',name:'풀 스택',art:'target',shape:'x',power:1,role:'범위',axis:'x',fx:{connect:8},gives:['X 5존 · 파워 +18','완전 연결 안타 +8 HP'],text:'선택 존과 대각 4칸 커버 · 파워 +18. 메인으로 완전 연결 안타 +8 HP.',flavor:'네 장이 한 장처럼.'}),
  cornerGuard:A({family:'stack',rarity:'common',name:'모서리 수비',art:'shield',shape:'corners',role:'범위',axis:'corners',fx:{support:2},gives:['네 모서리 + 선택 존','겹쳐 쓰면 안타 +2 HP'],text:'네 모서리와 선택 존 커버. 겹친 카드로 안타 +2 HP.',flavor:'구석은 내가 맡는다.'}),
  xSwing:A({family:'stack',rarity:'uncommon',name:'X 스윙',art:'sun',shape:'x',role:'범위',axis:'x',gives:['X 5존 커버'],text:'선택 존과 대각선 4칸 커버.',flavor:'십자가 아니면 X다.'}),
  diagCut:A({family:'stack',rarity:'common',name:'대각 베기',art:'sun',shape:'diag',role:'범위',axis:'diag',fx:{support:2},gives:['대각선 커버','겹쳐 쓰면 안타 +2 HP'],text:'선택 존을 지나는 대각선 커버. 겹친 카드로 안타 +2 HP.',flavor:'비스듬히 가른다.'}),
  linkSign:S({family:'stack',rarity:'common',name:'연계 사인',art:'ball',role:'범위',fx:{expand:1,draw:1},gives:['범위 +1','카드 +1'],text:'준비 1회 · 다음 스윙 커버를 상하좌우 1칸 확장. 카드 1장.',flavor:'다음 카드와 손을 잡는다.'}),
  comboCall:S({family:'stack',rarity:'common',name:'콤보 콜',art:'spark',role:'집중',fx:{pressure:.30,dmg:2},gives:['정확 HP +30%','이번 타석 안타 +2 HP'],text:'준비 1회 · 이번 타석 정확 적중 HP +30%, 안타 +2 HP.',flavor:'외쳐라, 연계!'}),
  teamwork:S({family:'stack',rarity:'rare',name:'팀워크',art:'spark',role:'수급',fx:{draw:2,dmg:5},gives:['카드 +2','이번 타석 안타 +5 HP'],text:'준비 1회 · 카드 2장, 이번 타석 안타 +5 HP.',flavor:'혼자 치는 사람은 없다.'}),

  /* ---------------- 분석 intel (role 관찰 → read level) ---------------- */
  videoRoom:S({family:'intel',rarity:'common',name:'영상 분석',art:'book',role:'관찰',fx:{scout:'row',draw:1},gives:['높이 확인','카드 +1'],text:'준비 1회 · 이번 공의 높이 또는 볼 여부 확인. 카드 1장.',flavor:'어젯밤 본 영상 그대로.'}),
  scoutNote:S({family:'intel',rarity:'common',name:'스카우팅 노트',art:'book',role:'관찰',fx:{aim:1,draw:1},gives:['집중 +1','카드 +1'],text:'준비 1회 · 이번 타석 집중 +1, 카드 1장. 덱에 있으면 읽기 점수 +1.',flavor:'메모 한 줄이 한 점이 된다.'}),
  dataBat:A({family:'intel',rarity:'common',name:'데이터 타격',art:'book',shape:'pairH',role:'관찰',axis:'pairH',fx:{scouted:5},gives:['가로 2존 커버','간파한 공 안타 +5 HP'],text:'가로 2존 커버. 간파한 공을 치면 +5 HP. 덱에 있으면 읽기 점수 +1.',flavor:'숫자가 방향을 말해준다.'}),
  patternRead:A({family:'intel',rarity:'rare',name:'패턴 해독',art:'book',shape:'cross',role:'관찰',axis:'cross',fx:{scouted:4},gives:['십자 5존 커버','간파한 공 안타 +4 HP'],text:'십자 5존 커버. 간파한 공을 치면 +4 HP. 덱에 있으면 읽기 점수 +1.',flavor:'이 투수는 세 번째에 바깥을 던진다.'}),
  tipping:S({family:'intel',rarity:'uncommon',name:'버릇 간파',art:'eye',role:'관찰',fx:{scout:'full'},gives:['높이·안팎 확인'],text:'준비 1회 · 이번 공의 높이와 안팎을 모두 확인.',flavor:'글러브가 먼저 말해준다.'}),
  analyst:A({family:'intel',rarity:'rare',name:'분석가',art:'book',shape:'point',power:1,pressure:.40,role:'관찰',axis:'point',fx:{scouted:8},gives:['1존 · 파워 +18 · 정확 +40%','간파한 공 +8 HP'],text:'1존 커버 · 파워 +18. 정확 적중 HP +40%. 간파한 공이면 +8 HP.',flavor:'이미 알고 있었다.'}),
  signSteal:S({family:'intel',rarity:'uncommon',name:'사인 훔치기',art:'eye',role:'관찰',fx:{scout:'row',pressure:.30},gives:['높이 확인','정확 HP +30%'],text:'준비 1회 · 이번 공의 높이 또는 볼 여부 확인. 이번 타석 정확 적중 HP +30%.',flavor:'포수의 손가락을 읽는다.'}),
  speedGun:S({family:'intel',rarity:'common',name:'스피드건',art:'target',role:'관찰',fx:{scout:'ball',aim:1},gives:['볼 여부 확인','집중 +1'],text:'준비 1회 · 이번 공이 볼인지 확인. 이번 타석 집중 +1.',flavor:'구속이 떨어졌다.'}),
  pitchChart:A({family:'intel',rarity:'common',name:'투구 차트',art:'book',shape:'row',role:'관찰',axis:'row',fx:{scouted:3,drawHit:1},gives:['가로 3존 커버','간파 +3 HP · 안타 시 카드 +1'],text:'가로 3존 커버. 간파한 공이면 +3 HP. 안타 시 카드 1장.',flavor:'점 하나하나가 공 하나하나.'}),
  insight:S({family:'intel',rarity:'common',name:'통찰',art:'eye',role:'관찰',fx:{draw:1,pressure:.20},gives:['카드 +1','정확 HP +20%'],text:'준비 1회 · 카드 1장, 이번 타석 정확 적중 HP +20%.',flavor:'한 발 물러서서 본다.'}),
  brainBat:A({family:'intel',rarity:'uncommon',name:'두뇌 타격',art:'book',shape:'column',role:'관찰',axis:'column',fx:{scouted:5},gives:['세로 3존 커버','간파한 공 안타 +5 HP'],text:'세로 3존 커버. 간파한 공을 치면 +5 HP.',flavor:'머리로 먼저 친다.'}),
  fullScout:S({family:'intel',rarity:'rare',name:'완전 분석',art:'eye',role:'관찰',fx:{scout:'full',draw:2},gives:['높이·안팎 확인','카드 +2'],text:'준비 1회 · 이번 공의 높이와 안팎을 확인하고 카드 2장.',flavor:'이 투수에 대해 모르는 것은 없다.'}),

  /* ---------------- 흔들기 mental ---------------- */
  taunt:S({family:'mental',rarity:'common',name:'도발',art:'spark',role:'집중',fx:{shake:1},gives:['투수 흔들림 +1'],text:'준비 1회 · 투수 흔들림 +1 (막별 상한). 흔들린 투수는 볼이 늘고 읽기 +1.',flavor:'배트로 투수를 가리킨다.'}),
  crowdRoar:S({family:'mental',rarity:'uncommon',name:'관중 함성',art:'spark',role:'집중',fx:{shake:1,draw:1},gives:['투수 흔들림 +1','카드 +1'],text:'준비 1회 · 투수 흔들림 +1, 카드 1장.',flavor:'구장이 한 목소리로.'}),
  pressureBat:A({family:'mental',rarity:'common',name:'압박 타격',art:'bat',shape:'pairH',role:'정타',axis:'pairH',fx:{shaken:3},gives:['가로 2존 커버','흔들림 1단계당 안타 +3 HP'],text:'가로 2존 커버. 안타 때 투수 흔들림 1단계당 +3 HP.',flavor:'흔들리는 곳을 민다.'}),
  breakHim:A({family:'mental',rarity:'uncommon',name:'무너뜨리기',art:'comet',shape:'point',power:1,role:'장타',axis:'point',fx:{shaken:5},gives:['1존 · 파워 +18','흔들림 1단계당 +5 HP'],text:'1존 커버 · 파워 +18. 안타 때 흔들림 1단계당 +5 HP.',flavor:'금이 간 곳을 친다.'}),
  rattle:A({family:'mental',rarity:'common',name:'흔들어 놓기',art:'spark',shape:'row',role:'집중',axis:'row',fx:{shakeHit:1},gives:['가로 3존 커버','안타 시 흔들림 +1'],text:'가로 3존 커버. 안타면 투수 흔들림 +1.',flavor:'한 방이면 표정이 바뀐다.'}),
  stareDown:S({family:'mental',rarity:'uncommon',name:'노려보기',art:'eye',role:'집중',fx:{shake:1,aim:1},gives:['흔들림 +1','집중 +1'],text:'준비 1회 · 투수 흔들림 +1, 이번 타석 집중 +1.',flavor:'눈을 피하는 쪽이 진다.'}),
  killerInstinct:A({family:'mental',rarity:'rare',name:'킬러 본능',art:'comet',shape:'point',power:2,role:'장타',axis:'point',fx:{shaken:6,shakeHit:1},gives:['1존 · 파워 +36','흔들림당 +6 HP · 안타 시 +1'],text:'1존 커버 · 파워 +36. 안타 때 흔들림 1단계당 +6 HP, 그리고 흔들림 +1.',flavor:'약해진 순간을 놓치지 않는다.'}),
  benchJockey:S({family:'mental',rarity:'common',name:'벤치 야유',art:'spark',role:'집중',fx:{shake:1,ballDmg:1},gives:['흔들림 +1','이번 타석 볼 +1 HP'],text:'준비 1회 · 투수 흔들림 +1, 이번 타석 볼마다 +1 HP.',flavor:'더그아웃에서 휘파람.'}),
  momentum:A({family:'mental',rarity:'uncommon',name:'흐름 타기',art:'sun',shape:'cross',role:'범위',axis:'cross',fx:{shaken:2,drawHit:1},gives:['십자 5존 커버','흔들림당 +2 HP · 카드 +1'],text:'십자 5존 커버. 안타 때 흔들림 1단계당 +2 HP, 카드 1장.',flavor:'흐름은 이쪽으로 왔다.'}),
  collapse:S({family:'mental',rarity:'rare',name:'붕괴 유도',art:'spark',role:'집중',fx:{shake:2},gives:['투수 흔들림 +2'],text:'준비 1회 · 투수 흔들림 +2 (막별 상한).',flavor:'무너지는 건 한순간.'}),
  dagger:A({family:'mental',rarity:'uncommon',name:'비수',art:'bat',shape:'column',role:'정타',axis:'column',fx:{shaken:4},gives:['세로 3존 커버','흔들림 1단계당 +4 HP'],text:'세로 3존 커버. 안타 때 흔들림 1단계당 +4 HP.',flavor:'가장 아픈 곳을 찌른다.'}),
  crack:A({family:'mental',rarity:'uncommon',name:'균열',art:'spark',shape:'pairV',role:'집중',axis:'pairV',fx:{shaken:2,shakeHit:1},gives:['세로 2존 커버','흔들림당 +2 HP · 안타 시 +1'],text:'세로 2존 커버. 안타 때 흔들림 1단계당 +2 HP, 그리고 흔들림 +1.',flavor:'작은 금이 벽을 무너뜨린다.'}),

  /* ---------------- 코스 lane ---------------- */
  insideGuard:A({family:'lane',rarity:'common',name:'몸쪽 대비',art:'shield',shape:'column',zoneBonus:{cols:[0],technique:12},role:'범위',axis:'column',gives:['세로 3존 커버','몸쪽 공 타격 +12'],text:'세로 3존 커버. 몸쪽 공을 치면 타격 +12로 타구 질 개선.',flavor:'몸쪽을 버리지 않는다.'}),
  outsideReach:A({family:'lane',rarity:'common',name:'바깥 공략',art:'bat',shape:'column',zoneBonus:{cols:[2],technique:12},role:'범위',axis:'column',fx:{hit:2},gives:['세로 3존 커버','바깥 타격 +12 · 안타 +2 HP'],text:'세로 3존 커버. 바깥 공을 치면 타격 +12. 안타 +2 HP.',flavor:'끝까지 따라간다.'}),
  highLane:A({family:'lane',rarity:'common',name:'하이 패스트볼 킬러',art:'sun',shape:'row',zoneBonus:{rows:[0],power:1},role:'장타',axis:'row',gives:['가로 3존 커버','높은 공 파워 +18'],text:'가로 3존 커버. 높은 공을 치면 파워 +18.',flavor:'위로 오면 위로 보낸다.'}),
  lowLane:A({family:'lane',rarity:'common',name:'로우볼 히터',art:'sun',shape:'row',zoneBonus:{rows:[2],technique:12},role:'범위',axis:'row',fx:{hit:2},gives:['가로 3존 커버','낮은 공 타격 +12 · 안타 +2 HP'],text:'가로 3존 커버. 낮은 공을 치면 타격 +12. 안타 +2 HP.',flavor:'무릎 높이가 내 높이.'}),
  middleMash:A({family:'lane',rarity:'common',name:'한가운데 강타',art:'comet',shape:'point',power:1,zoneBonus:{zones:[4],power:2},role:'장타',axis:'point',gives:['1존 · 파워 +18','한가운데 공 파워 +36'],text:'1존 커버 · 파워 +18. 한가운데 공을 치면 파워 +36 추가.',flavor:'실투는 용서하지 않는다.'}),
  cornerSpecialist:A({family:'lane',rarity:'uncommon',name:'구석 공략',art:'target',shape:'corners',role:'범위',axis:'corners',fx:{hit:3},gives:['네 모서리 + 선택 존','안타 +3 HP'],text:'네 모서리와 선택 존 커버. 안타 +3 HP.',flavor:'투수가 좋아하는 곳이 내가 좋아하는 곳.'}),
  insideKiller:A({family:'lane',rarity:'uncommon',name:'몸쪽 킬러',art:'comet',shape:'pairV',zoneBonus:{cols:[0],power:2},role:'장타',axis:'pairV',gives:['세로 2존 커버','몸쪽 공 파워 +36'],text:'세로 2존 커버. 몸쪽 공을 치면 파워 +36.',flavor:'몸쪽으로 오면 끝이다.'}),
  awayKing:A({family:'lane',rarity:'uncommon',name:'바깥쪽의 왕',art:'sun',shape:'pairV',zoneBonus:{cols:[2],power:2},role:'장타',axis:'pairV',gives:['세로 2존 커버','바깥 공 파워 +36'],text:'세로 2존 커버. 바깥 공을 치면 파워 +36.',flavor:'바깥쪽은 내 영토다.'}),
  laneMaster:A({family:'lane',rarity:'rare',name:'코스 장인',art:'target',shape:'column',power:1,zoneBonus:{cols:[0,2],technique:12},role:'범위',axis:'column',fx:{hit:5},gives:['세로 3존 · 파워 +18','양 끝 타격 +12 · 안타 +5 HP'],text:'세로 3존 커버 · 파워 +18. 몸쪽·바깥 공 타격 +12. 안타 +5 HP.',flavor:'코스 하나를 10년 팠다.'}),
  sinkerBuster:A({family:'lane',rarity:'rare',name:'싱커 버스터',art:'comet',shape:'row',power:2,zoneBonus:{rows:[2],power:1},role:'장타',axis:'row',fx:{xbh:3},gives:['가로 3존 · 파워 +36','낮은 공 파워 +18 · 장타 +3 HP'],text:'가로 3존 커버 · 파워 +36. 낮은 공 파워 +18 추가. 2루타 이상 +3 HP.',flavor:'가라앉는 공을 띄운다.'}),
  lanePromise:S({family:'lane',rarity:'common',name:'코스 약속',art:'target',role:'집중',fx:{aim:1,power:1},gives:['집중 +1','파워 +18'],text:'준비 1회 · 이번 타석 집중 +1, 파워 +18.',flavor:'이 코스에 온다면.'}),
  crossLane:A({family:'lane',rarity:'uncommon',name:'크로스 코스',art:'bat',shape:'x',role:'범위',axis:'x',fx:{hit:1},gives:['X 5존 커버','안타 +1 HP'],text:'선택 존과 대각 4칸 커버. 안타 +1 HP.',flavor:'대각선으로 들어오는 공.'}),
};

/* core V9 cards join the draft under a concept too */
export const CORE_FAMILY={place:'precision',strike:'lane',slug:'power',rally:'relay',bunt:'relay',finisher:'power',defend:'grind',
  wall:'stack',laser:'lane',commit:'power',setup:'precision',watch:'tempo',scout:'intel',lure:'stack',flow:'relay',calm:'grind'};
