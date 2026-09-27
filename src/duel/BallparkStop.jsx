import React,{useState} from 'react';
import {CARDS,upgradeText,FAMILIES} from './cards.js';
import {shapeHas} from './engine.js';
import {cardArtFor} from './card-art.js';
import {V10_RELICS} from './v10-relics.js';
import {pitcherLine} from './pitcher-voice.js';
import stadium from '../../assets/duel/stadium.png';
import rewardPrecisionBlue from '../../assets/production-art/mockup-world-v15/reward-precision-blue.png';
import rewardFlameRed from '../../assets/production-art/mockup-world-v15/reward-flame-red.png';
import rewardRelayCyan from '../../assets/production-art/mockup-world-v15/reward-relay-cyan.png';
import cardBunt from '../../assets/production-art/mockup-world-v15/card-bunt.png';
import cardDefend from '../../assets/production-art/mockup-world-v15/card-defend.png';
import cardWall from '../../assets/production-art/mockup-world-v15/card-wall.png';
import cardLaser from '../../assets/production-art/mockup-world-v15/card-laser.png';
import cardCommit from '../../assets/production-art/mockup-world-v15/card-commit.png';
import cardSetup from '../../assets/production-art/mockup-world-v15/card-setup.png';
import cardWatch from '../../assets/production-art/mockup-world-v15/card-watch.png';
import cardScout from '../../assets/production-art/mockup-world-v15/card-scout.png';
import cardLure from '../../assets/production-art/mockup-world-v15/card-lure.png';
import cardCalm from '../../assets/production-art/mockup-world-v15/card-calm.png';
import deckGroundHit from '../../assets/production-art/mockup-world-v15/deck-ground-hit.png';
import deckPullGold from '../../assets/production-art/mockup-world-v15/deck-pull-gold.png';
import deckComboBlue from '../../assets/production-art/mockup-world-v15/deck-combo-blue.png';
import './ballpark.css';

/* V13 BALLPARK BP-4 — reward and facility stops (docs/design/v13/BALLPARK.md).
   One scene header, one line, the offers as cards, one button. Engine calls stay in the parent:
   onPick(option) confirms, onSkip() passes. `options` are engine options ({type,kind,id,relic}). */

const REWARD_CARD_ART = {
  place: rewardPrecisionBlue,
  rally: rewardRelayCyan,
  finisher: rewardFlameRed,
  strike: deckGroundHit,
  slug: deckPullGold,
  flow: deckComboBlue,
  bunt: cardBunt,
  defend: cardDefend,
  wall: cardWall,
  laser: cardLaser,
  commit: cardCommit,
  setup: cardSetup,
  watch: cardWatch,
  scout: cardScout,
  lure: cardLure,
  calm: cardCalm,
};

const COPY={
  reward:{title:o=>(o?.name||'투수')+' 강판',line:'새로운 힘으로, 다음 경기를 준비하세요.',go:'챙긴다',skip:'그냥 간다'},
  locker:{title:()=>'라커룸',line:'손에 안 붙는 배트는 두고 간다.',go:'뺀다',skip:'그냥 간다'},
  training:{title:()=>'타격 훈련',line:'한 장을 단련한다.',go:'단련한다',skip:'그냥 간다'},
  shop:{title:()=>'장비 상점',line:'하나만 들일 수 있다.',go:'들인다',skip:'그냥 간다'},
  rest:{title:()=>'휴식일',line:'하루 쉬면 다음 경기 타격 +8.',go:'쉰다',skip:'그냥 간다'},
};
const EMPTY={locker:'덱이 가장 얇다. 뺄 카드가 없다.',training:'더 단련할 카드가 없다.',shop:'덱이 가득 찼다.',rest:'쉴 것이 없다.'};

const Glyph=({zones})=><span className="bp-glyph" aria-hidden="true">{Array.from({length:9},(_,z)=><i key={z} className={zones?.includes(z)?'on':''}/>)}</span>;
/* coverage shape on a centred aim, for the card face */
const shapeZones=shape=>Array.from({length:9},(_,i)=>i).filter(i=>shapeHas(shape,4,i));
/* V16 rarity: common / uncommon / rare, plus the three act signatures */
const RARITY_LABEL={common:'COMMON',uncommon:'UNCOMMON',rare:'RARE',signature:'EPIC'};

/* reward reveal (BP-12): each offer starts face down and flips in turn; signature cards burst gold */
const Back=()=><i className="bp-offer-back" aria-hidden="true"><Glyph zones={[0,2,4,6,8]}/></i>;
function Offer({o,on,count,onClick,reveal=null}){
  const rv=reveal==null?{}:{style:{'--i':reveal}};
  if(o.type==='relic'){const r=V10_RELICS[o.relic];
    return <button type="button" className={'bp-offer relic'+(on?' on':'')} aria-pressed={on} onClick={onClick} {...rv}>
      {reveal!=null&&<Back/>}<b className="bp-mark">{r?.mark}</b><strong>{r?.name}</strong><span>{r?.text}</span></button>;}
  if(o.type==='rest')return <button type="button" className={'bp-offer rest'+(on?' on':'')} aria-pressed={on} onClick={onClick}>
    <b className="bp-mark">+8</b><strong>컨디션 회복</strong><span>다음 경기 타격 +8</span></button>;
  const def=CARDS[o.kind],skill=def?.type==='skill',tier=def?.rarity||'common',rare=tier==='signature'||tier==='rare';
  const art=REWARD_CARD_ART[o.kind]||cardArtFor(o.kind)||rewardPrecisionBlue;
  const cost=def?.cost||(def?.power>=2?2:1),fam=FAMILIES[def?.family]?.name;
  return <button type="button" className={'bp-offer reward-card'+(skill?' skill':'')+(rare?' rare':'')+' r-'+tier+(on?' on':'')} aria-pressed={on} onClick={onClick} data-card-kind={o.kind} {...rv}>
    {reveal!=null&&<Back/>}
    <span className="bp-offer-cost" aria-label={`코스트 ${cost}`}>{cost}</span>
    <div className="bp-offer-art" style={{backgroundImage:`url(${art})`}}/>
    {rare&&<em className="bp-rare-tag">{tier==='signature'?'시그니처':'희귀'}</em>}
    {skill?<b className="bp-mark">준비</b>:<div className="bp-offer-glyph"><Glyph zones={shapeZones(def?.shape)}/></div>}
    <strong className="bp-offer-name">{def?.name}{o.type==='upgrade'&&<sup>+</sup>}</strong>
    <span className="bp-offer-desc">{o.type==='upgrade'?upgradeText(o.kind):(def?.gives||[]).slice(0,2).map((g,i)=><span key={i} className="bp-offer-line">{g}</span>)}</span>
    <em className="bp-reward-rarity">{fam?fam+' · ':''}{RARITY_LABEL[tier]||'COMMON'}</em>
    {count>1&&<small>덱에 {count}장</small>}
  </button>;
}

export default function BallparkStop({kind,opponent=null,portrait=null,options=[],deck=[],deckCount=0,onPick,onSkip,onDeck,onInspect}){
  const [sel,setSel]=useState(null);
  const c=COPY[kind]||COPY.rest,o=options[sel];
  /* the locker lists the whole deck: one button per card kind, not one per copy */
  const shown=kind==='locker'?options.filter((x,i)=>options.findIndex(y=>y.kind===x.kind)===i):options;
  const count=k=>deck.filter(d=>d.kind===k).length;
  /* the knocked-out pitcher gets the last word: her line lands big, next to her portrait */
  const voice=kind==='reward'?pitcherLine(opponent?.artId,'knockout',deckCount):'';
  const after=o?(o.type==='add'?deckCount+1:o.type==='remove'?deckCount-1:deckCount):deckCount;
  return <main className={'bp-stop stop-'+kind} aria-label={c.title(opponent)} style={{'--bp-sky':`url(${stadium})`}}>
    <div className="bp-bar"><span>{kind==='reward'?'승리':'쉬어 가는 곳'}</span><span className="bp-piles"><button type="button" onClick={onDeck}>덱 {deckCount}{after!==deckCount&&<> → <b>{after}</b></>}</button></span></div>
    <header className="bp-shead">
      {portrait&&<button type="button" className="bp-sport" aria-label={opponent?.name+' 초상 크게 보기'} onClick={e=>onInspect?.(opponent,e)}><img alt="" src={portrait}/></button>}
      <div className={'bp-stitle'+(voice?' has-voice':'')}>{voice&&<q className="bp-kovoice" data-testid="bp-kovoice">{voice}</q>}<h1>{c.title(opponent)}</h1><p>{options.length?c.line:EMPTY[kind]||''}</p></div>
    </header>
    <div className={'bp-offers'+(kind==='reward'?' reveal':'')}>
      {shown.map(x=>{const i=options.indexOf(x);return <Offer key={i} o={x} on={sel===i} count={kind==='locker'?count(x.kind):0} reveal={kind==='reward'?shown.indexOf(x):null} onClick={()=>setSel(sel===i?null:i)}/>;})}
    </div>
    <div className="bp-verbs stop">
      {!!options.length&&<button type="button" className="bp-verb go" data-testid="bp-stop-go" disabled={!o} onClick={()=>o&&onPick?.(o)}>{c.go}</button>}
      <button type="button" className={'bp-verb '+(options.length?'wait':'go')} data-testid="bp-stop-skip" onClick={onSkip}>{options.length?c.skip:'지도로'}</button>
    </div>
  </main>;
}
