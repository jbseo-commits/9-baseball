import React,{useState} from 'react';
import {CARDS,cardCost,upgradeText,FAMILIES,DECK_MAX} from './cards.js';
import {shapeHas} from './engine.js';
import {cardArtFor} from './card-art.js';
import {V10_ALL_RELICS} from './v10-relics.js';
import {relicArtFor} from './relic-art.js';
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
import './stop-readability.css';

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

/* `pick` is the go button's second line until something is chosen (M02: the verb never disappears) */
const COPY={
  reward:{title:o=>(o?.name||'투수')+' 강판',line:'새로운 힘으로, 다음 경기를 준비하세요.',go:'챙긴다',pick:'카드를 고르세요',skip:'그냥 간다'},
  locker:{title:()=>'라커룸',line:'손에 안 붙는 배트는 두고 간다.',go:'뺀다',pick:'뺄 카드를 고르세요',skip:'그냥 간다'},
  training:{title:()=>'타격 훈련',line:'한 장을 단련한다.',go:'단련한다',pick:'단련할 카드를 고르세요',skip:'그냥 간다'},
  shop:{title:()=>'장비 상점',line:'하나만 들일 수 있다.',go:'들인다',pick:'하나를 고르세요',skip:'그냥 간다'},
  rest:{title:()=>'휴식일',line:'하루 쉬면 다음 경기 타격 +8.',go:'쉰다',pick:'휴식을 고르세요',skip:'그냥 간다'},
};
/* what the go button names once an offer is picked */
const offerName=(o,plus)=>!o?'':o.type==='relic'?(V10_ALL_RELICS[o.relic]?.name||''):o.type==='rest'?'컨디션 회복':
  (CARDS[o.kind]?.name||'')+((o.type==='upgrade'||plus)?'+':'');
const EMPTY={locker:'덱이 가장 얇다. 뺄 카드가 없다.',training:'더 단련할 카드가 없다.',shop:'덱이 가득 찼다.',rest:'쉴 것이 없다.',
  reward:`덱이 가득 찼다 (${DECK_MAX}장). 라커룸에서 카드를 빼면 다시 받을 수 있다.`};

const Glyph=({zones})=><span className="bp-glyph" aria-hidden="true">{Array.from({length:9},(_,z)=><i key={z} className={zones?.includes(z)?'on':''}/>)}</span>;
/* coverage shape on a centred aim, for the card face */
const shapeZones=shape=>Array.from({length:9},(_,i)=>i).filter(i=>shapeHas(shape,4,i));
/* V16 rarity: common / uncommon / rare, plus the three act signatures */
const RARITY_LABEL={common:'COMMON',uncommon:'UNCOMMON',rare:'RARE',signature:'EPIC'};

/* reward reveal (BP-12): each offer starts face down and flips in turn; signature cards burst gold */
const Back=()=><i className="bp-offer-back" aria-hidden="true"><Glyph zones={[0,2,4,6,8]}/></i>;
function Offer({o,on,count,onClick,plus=false,reveal=null}){
  const rv=reveal==null?{}:{style:{'--i':reveal}};
  /* relic / rest: a wide equipment tile — medal mark, name, the whole effect line (M01) */
  if(o.type==='relic'){const r=V10_ALL_RELICS[o.relic];
    return <button type="button" className={'bp-offer relic bp-tile'+(relicArtFor(o.relic)?' has-art':'')+(on?' on':'')} aria-pressed={on} onClick={onClick} data-relic={o.relic} {...rv}>
      {reveal!=null&&<Back/>}{relicArtFor(o.relic)&&<i className="bp-relic-ico" aria-hidden="true" style={{backgroundImage:`url(${relicArtFor(o.relic)})`}}/>}<b className="bp-mark">{r?.mark}</b><em className="bp-tile-kind">{r?.tier==='boss'?'보스 유물':r?.tier==='elite'?'엘리트 유물':'장비'}</em>
      <strong className="bp-offer-name">{r?.name}</strong><span className="bp-offer-desc">{r?.text}</span></button>;}
  if(o.type==='rest')return <button type="button" className={'bp-offer rest bp-tile'+(on?' on':'')} aria-pressed={on} onClick={onClick}>
    <b className="bp-mark">+8</b><em className="bp-tile-kind">휴식</em>
    <strong className="bp-offer-name">컨디션 회복</strong><span className="bp-offer-desc">다음 경기 타격 +8</span></button>;
  const def=CARDS[o.kind],skill=def?.type==='skill',tier=def?.rarity||'common',rare=tier==='signature'||tier==='rare';
  const art=REWARD_CARD_ART[o.kind]||cardArtFor(o.kind)||rewardPrecisionBlue;
  const cost=cardCost(o.kind),fam=FAMILIES[def?.family]?.name;
  return <button type="button" className={'bp-offer reward-card'+(skill?' skill':'')+(rare?' rare':'')+' r-'+tier+(on?' on':'')} aria-pressed={on} onClick={onClick} data-card-kind={o.kind} {...rv}>
    {reveal!=null&&<Back/>}
    <span className="bp-offer-cost" aria-label={`코스트 ${cost}`}>{cost}</span>
    <div className="bp-offer-art" style={{backgroundImage:`url(${art})`}}/>
    {rare&&<em className="bp-rare-tag">{tier==='signature'?'시그니처':'희귀'}</em>}
    {skill?<b className="bp-mark">준비</b>:<div className="bp-offer-glyph"><Glyph zones={shapeZones(def?.shape)}/></div>}
    <strong className="bp-offer-name">{def?.name}{(o.type==='upgrade'||plus)&&<sup>+</sup>}</strong>
    {/* every effect line, in full: it wraps at the card width instead of being cut (M05) */}
    <span className="bp-offer-desc">{o.type==='upgrade'?<span className="bp-offer-line bp-offer-up">{upgradeText(o.kind)}</span>:(def?.gives||[]).map((g,i)=><span key={i} className="bp-offer-line">{g}</span>)}</span>
    <em className="bp-reward-rarity">{fam&&<span className="bp-fam">{fam}</span>}{fam&&<i className="bp-sep"> · </i>}<span className="bp-tier">{RARITY_LABEL[tier]||'COMMON'}</span></em>
    {count>1&&<small className="bp-offer-count">덱에 {count}장</small>}
  </button>;
}

export default function BallparkStop({kind,opponent=null,portrait=null,options=[],relics=[],relicTier='elite',runOuts=0,canRecover=false,onRecover,deck=[],deckCount=0,onPick,onSkip,onDeck,onInspect}){
  const [sel,setSel]=useState(null),[selR,setSelR]=useState(null);
  /* 강적·보스 보상: 전용 유물을 반드시 하나 고른다. 카드는 고르거나 넘길 수 있다. */
  const needRelic=kind==='reward'&&relics.length>0;
  const c=COPY[kind]||COPY.rest,o=options[sel];
  /* the locker lists every copy, not one tile per kind: removal targets one id,
     and a base copy and its + copy must stay distinguishable and separately pickable */
  const shown=options;
  /* the knocked-out pitcher gets the last word: her line lands big, next to her portrait */
  const voice=kind==='reward'?pitcherLine(opponent?.artId,'knockout',deckCount):'';
  const after=o?(o.type==='add'?deckCount+1:o.type==='remove'?deckCount-1:deckCount):deckCount;
  /* layout hints for stop-readability.css: how many cards share the row, and whether the reward row scrolls */
  const cards=shown.filter(x=>x.type!=='relic'&&x.type!=='rest').length;
  const relicName=selR!=null?V10_ALL_RELICS[relics[selR]]?.name:'';
  const goSub=needRelic?(selR!=null?relicName+(o?' + '+offerName(o):''):'유물을 고르세요'):o?offerName(o,kind==='locker'?deck.some(d=>d.id===o.id&&d.plus):false):c.pick;
  const goOk=needRelic?selR!=null:!!o;
  return <main className={'bp-stop bp-choice stop-'+kind} aria-label={c.title(opponent)} style={{'--bp-sky':`url(${stadium})`}}>
    <div className="bp-bar"><span>{kind==='reward'?'승리':'쉬어 가는 곳'}</span><span className="bp-piles"><button type="button" onClick={onDeck}>덱 {deckCount}{after!==deckCount&&<> → <b>{after}</b></>}</button></span></div>
    <header className="bp-shead">
      {portrait&&<button type="button" className="bp-sport" aria-label={opponent?.name+' 초상 크게 보기'} onClick={e=>onInspect?.(opponent,e)}><img alt="" src={portrait}/></button>}
      <div className={'bp-stitle'+(voice?' has-voice':'')}>{voice&&<q className="bp-kovoice" data-testid="bp-kovoice">{voice}</q>}<h1>{c.title(opponent)}</h1><p>{options.length?c.line:EMPTY[kind]||''}</p></div>
    </header>
    <div className={'bp-offers'+(kind==='reward'?' reveal':'')} data-cards={cards} data-many={cards>3?'':undefined} style={{'--n':Math.max(1,Math.min(cards,3))}}>
      {shown.map(x=>{const i=options.indexOf(x);const plus=kind==='locker'?deck.some(d=>d.id===x.id&&d.plus):false;return <Offer key={i} o={x} on={sel===i} plus={plus} reveal={kind==='reward'?shown.indexOf(x):null} onClick={()=>setSel(sel===i?null:i)}/>;})}
    </div>
    {needRelic&&<section className="bp-relics" aria-label="전용 유물" data-testid="bp-relics"><h2 className="bp-relics-h"><i className={'bp-relic-tier '+relicTier}>{relicTier==='boss'?'보스 유물':'엘리트 유물'}</i> 하나를 고른다</h2>
      <div className="bp-relic-offers">{relics.map((k,i)=><Offer key={k} o={{type:'relic',relic:k}} on={selR===i} onClick={()=>setSelR(selR===i?null:i)}/>)}</div>
      {kind==='reward'&&runOuts>0&&<p className="bp-outs-note" data-testid="bp-outs-note">이어지는 아웃 {runOuts}/2{canRecover?' · 보스 보상 대신 0으로 회복할 수 있다.':' · 보스를 잡아야 회복할 수 있다.'}</p>}
      <p className="bp-relic-desc" data-testid="bp-relic-desc">{selR!=null?V10_ALL_RELICS[relics[selR]]?.text:'유물을 눌러 효과를 확인한다.'}</p></section>}
    <div className="bp-verbs stop">
      {/* the verb is always on the button; the second line guides (nothing picked) or names the pick */}
      {(!!options.length||needRelic)&&<button type="button" className={'bp-verb go'+(goOk?' picked':'')} data-testid="bp-stop-go" disabled={!goOk} onClick={()=>goOk&&(needRelic?onPick?.(o||{type:'skip'},relics[selR]):onPick?.(o))}
        aria-label={c.go+' · '+goSub}>
        <span className="bp-go-verb">{c.go}</span><span className="bp-go-sub" data-testid="bp-stop-go-sub">{goSub}</span></button>}
      {needRelic&&canRecover&&<button type="button" className="bp-verb wait bp-recover" data-testid="bp-recover" onClick={()=>onRecover?.()}
        aria-label={'아웃 회복 · 보상 포기 · 아웃 '+runOuts+' → 0'}><span className="bp-go-verb">아웃 회복</span><span className="bp-go-sub">보상 포기 · 아웃 {runOuts}→0</span></button>}
      {!needRelic&&<button type="button" className={'bp-verb '+(options.length?'wait':'go')} data-testid="bp-stop-skip" onClick={onSkip}>{options.length?c.skip:'지도로'}</button>}
    </div>
  </main>;
}
