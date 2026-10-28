/* battle-vnext 검토용 fixture (C01). 테스트·컴포넌트 검수 전용이며 본편 런타임은 import하지 않는다.
   모든 상태는 본편 엔진(createV10Duel·enterV10Node·setAimZone·playV10Action·advanceV10Pitch)으로 만든다.
   seed와 steps가 곧 재현 기록이다. 엔진 밖에서 손댄 단계는 op 이름에 grant를 붙여 구별한다.
   storage를 받지 않으므로 생산 세이브(9zone-v10-run)를 읽거나 쓰지 않는다. */
import {createV10Duel,enterV10Node,setAimZone,playV10Action,advanceV10Pitch,previewCard,previewV10Stack,
  createDefenseLabState,applyStartPack} from '../engine.js';
import {captureExecution} from '../presentation-snapshot.js';
import {CARDS} from '../cards.js';
import {coverageText} from '../information.js';

export const FIXTURE_SEED=20261027;
export const FIXTURE_NODE='a1-entry';
/* seed 20261027 · a1-entry 첫 손패: strike(2) strike(2) scout(1) place(1) watch(1) · 에너지 2/2 · 읽기 0 */

/* App.jsx의 hand/choice와 같은 모양을 만든다 (App 888–914행의 V10 경로). */
export function appInputs(s,{selected=null,swingStack=[]}={}){
  const b=s.battle,byId=id=>s.deck.find(c=>c.id===id);
  const showPreview=id=>{const p=previewCard(s,id);return {...p,coverageLabel:p.coverage?coverageText(s,id):undefined};};
  const hand=b.hand.filter(id=>{const e=byId(id);return e&&CARDS[e.kind];}).map(id=>({id,entry:byId(id),preview:showPreview(id)}));
  const entry=selected&&selected!=='basic'&&b.hand.includes(selected)?byId(selected):null;
  const stackAllowed=!!(entry&&entry.kind!=='bunt'&&b.growthMode!=='patience');
  const activeStack=stackAllowed?swingStack.filter(x=>b.hand.includes(x.id)&&x.id!==selected):[];
  const raw=selected&&(selected==='basic'||b.hand.includes(selected))
    ?(CARDS[entry?.kind]?.type!=='skill'&&entry?previewV10Stack(s,selected,activeStack):showPreview(selected)):null;
  const choice=raw&&raw.coverage?{...raw,coverageLabel:raw.coverage.length+(activeStack.length?'존 스택 커버':'존 커버')}:raw;
  return {hand,choice,swingStack:activeStack};
}

/* 손패에서 kind의 n번째 카드 id */
export function handId(s,kind,nth=0){
  const ids=s.battle.hand.filter(id=>s.deck.find(c=>c.id===id)?.kind===kind);
  if(ids[nth]==null)throw new Error(`fixture: 손패에 ${kind} #${nth} 없음`);
  return ids[nth];
}

function runSteps(seed,steps){
  let s=null,execution=null;
  for(const st of steps){
    if(st.op==='new')s=createV10Duel(seed);
    else if(st.op==='defense-lab')s=createDefenseLabState(seed,st.pack||'link',st.scenario||'normal');
    else if(st.op==='start-pack')s=applyStartPack(s,st.pack);
    /* Explicit diagnostic HP setup; the actual attack/KO is still engine-resolved. */
    else if(st.op==='grant-hp')s={...s,pitcher:{...s.pitcher,hp:st.hp}};
    else if(st.op==='enter')s=enterV10Node(s,st.node);
    else if(st.op==='aim')s=setAimZone(s,st.zone);
    else if(st.op==='take'){const before=s;s=playV10Action(s,{type:'take'});execution=captureExecution(before,s);}
    else if(st.op==='play'){
      const id=st.card==='basic'?'basic':handId(s,st.card,st.nth||0);
      const supports=(st.supports||[]).map(x=>({id:handId(s,x.card,x.nth||0),aimZone:x.aimZone}));
      const before=s;s=playV10Action(s,{type:'card',id,...(supports.length?{supports}:{})});execution=captureExecution(before,s,{selected:id});
    }
    else if(st.op==='next')s=advanceV10Pitch(s);
    /* 엔진 밖: 보상 화면에서 얻는 유물을 바로 부여 (읽기 단계 검수용) */
    else if(st.op==='grant-relics')s={...s,relics:[...(s.relics||[]),...st.relics]};
    else throw new Error('fixture: 알 수 없는 단계 '+st.op);
  }
  return {s,execution};
}

const OPEN=[{op:'new'},{op:'enter',node:FIXTURE_NODE}];
/* take → 다음 공: 지켜보기 보상으로 에너지 3/3이 된다 (지원 카드 겹치기 검수용) */
const TAKE_THEN_NEXT=[...OPEN,{op:'take'},{op:'next'}];

/* ui: 컨테이너의 로컬 조정 상태와 선택. card 이름은 손패 kind로 적고 build에서 id로 바꾼다. */
export const VNEXT_FIXTURES=Object.freeze([
  {id:'watch-read0',title:'무선택 · 읽기 0',rules:'main-run',seed:FIXTURE_SEED,steps:OPEN,ui:{}},
  {id:'swing-main',title:'공격 카드 선택 · 가운데 노림',rules:'main-run',seed:FIXTURE_SEED,steps:[...OPEN,{op:'aim',zone:4}],ui:{select:'strike'}},
  {id:'basic-swing',title:'맨손 스윙 선택',rules:'main-run',seed:FIXTURE_SEED,steps:[...OPEN,{op:'aim',zone:4}],ui:{select:'basic'}},
  {id:'prepare',title:'준비 카드 선택',rules:'main-run',seed:FIXTURE_SEED,steps:OPEN,ui:{select:'scout'}},
  {id:'cost-short',title:'준비 사용 후 에너지 1 · 2코스트 선택',rules:'main-run',seed:FIXTURE_SEED,
    steps:[...OPEN,{op:'play',card:'scout'},{op:'aim',zone:4}],ui:{select:'strike'}},
  {id:'support-armed',title:'지원 카드가 코스를 기다림',rules:'main-run',seed:FIXTURE_SEED,
    steps:[...TAKE_THEN_NEXT,{op:'aim',zone:4}],ui:{select:'place',armed:'strike'}},
  {id:'support-stacked',title:'메인 + 지원 1장',rules:'main-run',seed:FIXTURE_SEED,
    steps:[...TAKE_THEN_NEXT,{op:'aim',zone:4}],ui:{select:'place',stack:[{card:'strike',aimZone:8}]}},
  {id:'read1',title:'읽기 1 (스코프)',rules:'main-run',seed:FIXTURE_SEED,steps:[...OPEN,{op:'grant-relics',relics:['scope']},{op:'aim',zone:4}],ui:{select:'strike'}},
  {id:'read2',title:'읽기 2 (스코프 + 호크아이)',rules:'main-run',seed:FIXTURE_SEED,
    steps:[...OPEN,{op:'grant-relics',relics:['scope','hawkEye']},{op:'aim',zone:4}],ui:{select:'strike'}},
  {id:'inspector-open',title:'정보창 열림 · 배경 잠금',rules:'main-run',seed:FIXTURE_SEED,steps:[...OPEN,{op:'aim',zone:4}],ui:{select:'strike',inspectOpen:true}},
  {id:'flight',title:'타격 직후 · 공 날아오는 중',rules:'main-run',seed:FIXTURE_SEED,
    steps:[...OPEN,{op:'aim',zone:4},{op:'play',card:'strike'}],ui:{fxStage:'windup',hasNext:true}},
  {id:'result-swing',title:'타격 결과',rules:'main-run',seed:FIXTURE_SEED,
    steps:[...OPEN,{op:'aim',zone:4},{op:'play',card:'strike'}],ui:{hasNext:true}},
  /* 이 seed의 첫 공은 바깥쪽 높게(2)로 온다: 같은 코스를 노리면 정확 적중 */
  {id:'result-hit',title:'정확 적중 결과',rules:'main-run',seed:FIXTURE_SEED,
    steps:[...OPEN,{op:'aim',zone:2},{op:'play',card:'strike'}],ui:{hasNext:true}},
  {id:'result-near',title:'한 칸 차이 실패',rules:'main-run',seed:FIXTURE_SEED,
    steps:[...OPEN,{op:'aim',zone:1},{op:'play',card:'strike'}],ui:{hasNext:true}},
  {id:'result-take',title:'지켜보기 결과',rules:'main-run',seed:FIXTURE_SEED,steps:[...OPEN,{op:'take'}],ui:{hasNext:true}},
  {id:'cinema-exact',title:'연출 · 정확 적중',rules:'main-run',seed:FIXTURE_SEED,steps:[...OPEN,{op:'aim',zone:2},{op:'play',card:'strike'}],ui:{animate:true,hasNext:true}},
  {id:'cinema-near',title:'연출 · 한 칸 차이',rules:'main-run',seed:FIXTURE_SEED,steps:[...OPEN,{op:'aim',zone:1},{op:'play',card:'strike'}],ui:{animate:true,hasNext:true}},
  {id:'cinema-homer',title:'연출 · 홈런',rules:'main-run',seed:5,steps:[{op:'new'},{op:'start-pack',pack:'power'},{op:'enter',node:FIXTURE_NODE},{op:'aim',zone:6},{op:'play',card:'slug'}],ui:{animate:true,hasNext:true}},
  {id:'cinema-knockout',title:'연출 · 강판 (HP 1 검수)',rules:'main-run',seed:FIXTURE_SEED,steps:[...OPEN,{op:'grant-hp',hp:1},{op:'aim',zone:2},{op:'play',card:'strike'}],ui:{animate:true,hasNext:true}},
  {id:'defense-lab',title:'방어 실험 규칙 (본 런 아님)',rules:'defense-lab',seed:20261022,steps:[{op:'defense-lab'}],ui:{},defenseLab:true},
]);

/* fixture → buildBattleViewModel 입력 */
export function buildFixture(idOrFixture){
  const f=typeof idOrFixture==='string'?VNEXT_FIXTURES.find(x=>x.id===idOrFixture):idOrFixture;
  if(!f)throw new Error('fixture: 없음 '+idOrFixture);
  const {s,execution}=runSteps(f.seed,f.steps),ui=f.ui||{};
  const idOf=card=>card==='basic'?'basic':handId(s,card);
  const selected=ui.select?idOf(ui.select):null;
  const swingStack=(ui.stack||[]).map(x=>({id:idOf(x.card),aimZone:x.aimZone}));
  const {hand,choice,swingStack:active}=s.phase==='battle'?appInputs(s,{selected,swingStack}):{hand:appInputs(s).hand,choice:null,swingStack:[]};
  const nextLabel=s.phase==='pitch'?'다음 공':s.phase==='between'?'다음 타자':'';
  return {s,execution,animate:!!ui.animate,hand,selected,swingStack:active,choice,
    armed:ui.armed?idOf(ui.armed):null,inspectOpen:!!ui.inspectOpen,fxStage:ui.animate?'windup':ui.fxStage||null,
    hasNext:!!ui.hasNext&&!!nextLabel,nextLabel,playToken:s.stats?.pitches||0,
    artId:s.v10?.opponent?.artId||null,defenseLab:f.defenseLab?s.defenseLab:null};
}
