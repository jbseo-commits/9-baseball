import React,{forwardRef,useCallback,useImperativeHandle,useLayoutEffect,useRef,useState} from 'react';
import BattleCard,{defaultCardArt,selectionTag} from './BattleCard.jsx';
import './hand.css';

/* C03 — 항상 보이는 손패와 그 바로 위 에너지. 여는 단계 없음. 에너지·손패 DOM은 각각 하나.
   카드 탭은 부모의 기존 선택 규칙(pickSwing/pickPrep)으로 간다. 이 컴포넌트는 선택 상태를 갖지 않는다. */

/* 이 거리 이상 끌면 스크롤로 보고 이어지는 click을 막는다 */
export const SWIPE_SLOP_PX=10;

export function energyLine(energy,phase){
  if(!energy)return '';
  if(phase==='deciding'){
    if(energy.shortfall>0)return `${energy.shortfall} 부족`;
    if(energy.selectedCost>0)return `−${energy.selectedCost} → ${energy.remainingIfExecuted} 남음`;
    if(energy.armedCost>0)return `지원 +${energy.armedCost}`;
    return '';
  }
  return energy.upcoming||energy.refill||'';
}

/* 실행하면 쓰일 칸(spend) · 모자란 칸(short)을 미리 보여준다 */
export function energyPips(energy){
  if(!energy)return [];
  const keep=Math.max(0,energy.current-energy.selectedCost),n=Math.max(energy.cap,energy.current);
  return Array.from({length:n},(_,i)=>i<keep?'on':i<energy.current?'spend':i<energy.current+energy.shortfall?'short':'off');
}

function lockText(input,phase){
  if(input?.canSelect)return '';
  if(phase==='committing'||phase==='flight')return '투구 중 · 손패 잠금';
  if(input?.blockedReason)return input.blockedReason;
  return '';
}

const HandDock=forwardRef(function HandDock({hand=[],energy=null,input=null,phase='deciding',piles=null,
  onCardTap,onCardDetail=null,onPiles=null,artFor=defaultCardArt},ref){
  const rowRef=useRef(null),cardRefs=useRef(new Map()),drag=useRef(null),suppress=useRef(false);
  const [hidden,setHidden]=useState({left:0,right:0});
  const basic=hand.find(x=>x.type==='basic'),cards=hand.filter(x=>x.type!=='basic');

  /* 부모가 정보창을 닫은 뒤 선택·스크롤·포커스를 되돌릴 수 있게 한다 */
  useImperativeHandle(ref,()=>({
    getScroll:()=>rowRef.current?.scrollLeft||0,
    setScroll:x=>{if(rowRef.current)rowRef.current.scrollLeft=x;},
    focusCard:id=>{const el=cardRefs.current.get(id);if(!el)return false;el.focus();el.scrollIntoView?.({block:'nearest',inline:'nearest'});return true;},
  }),[]);

  const measure=useCallback(()=>{
    const row=rowRef.current;if(!row)return;
    const lo=row.scrollLeft,hi=lo+row.clientWidth;let left=0,right=0;
    for(const el of row.querySelectorAll('.bv-card-slot')){
      const a=el.offsetLeft,b=a+el.offsetWidth;
      if(b-1>hi&&row.clientWidth>0)right++;else if(a+1<lo)left++;
    }
    setHidden(h=>h.left===left&&h.right===right?h:{left,right});
  },[]);
  useLayoutEffect(()=>{
    measure();
    const row=rowRef.current;if(!row||typeof ResizeObserver==='undefined')return undefined;
    const ro=new ResizeObserver(measure);ro.observe(row);return ()=>ro.disconnect();
  },[measure,cards.length]);

  const onPointerDown=e=>{drag.current={x:e.clientX,y:e.clientY,id:e.pointerId};suppress.current=false;};
  const onPointerMove=e=>{const d=drag.current;if(!d||d.id!==e.pointerId)return;
    if(Math.abs(e.clientX-d.x)>=SWIPE_SLOP_PX||Math.abs(e.clientY-d.y)>=SWIPE_SLOP_PX)suppress.current=true;};
  const onPointerEnd=()=>{drag.current=null;};
  /* 스와이프 뒤 손을 뗄 때 생기는 click이 카드 선택을 바꾸지 않게 한다 */
  const onClickCapture=e=>{if(suppress.current){e.preventDefault();e.stopPropagation();suppress.current=false;}};

  const onCardKey=(e,i)=>{
    if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;
    const next=cards[i+(e.key==='ArrowRight'?1:-1)];if(!next)return;
    e.preventDefault();cardRefs.current.get(next.id)?.focus();
  };

  const line=energyLine(energy,phase),pips=energyPips(energy),lock=lockText(input,phase);
  const detailDisabled=phase==='committing'||phase==='flight';
  return <section className={'bv-hand-dock'+(input?.canSelect?'':' is-locked')} data-testid="bv-hand-dock" data-phase={phase} aria-label="손패">
    <header className="bv-hand-head">
      {energy&&<div className={'bv-energy'+(energy.shortfall>0?' is-short':'')} data-testid="bv-energy" data-energy={energy.current} data-cap={energy.cap}
        role="status" aria-label={`에너지 ${energy.current}/${energy.cap}`+(line?' · '+line:'')}>
        <span className="bv-energy-label" aria-hidden="true">에너지</span>
        <b className="bv-energy-mark" aria-hidden="true">⚡</b>
        <strong aria-hidden="true">{energy.current}<small>/{energy.cap}</small></strong>
        <span className="bv-energy-pips" aria-hidden="true">{pips.map((p,i)=><i key={i} className={p}/>)}</span>
        {line&&<em className="bv-energy-line" aria-hidden="true">{line}</em>}
      </div>}
      <span className="bv-hand-count">손패 <b>{cards.length}</b></span>
      {lock&&<span className="bv-hand-lock" role="status">{lock}</span>}
      <span className="bv-hand-tools">
        {basic&&<button type="button" className={'bv-basic-chip'+(basic.selectionRole==='main'?' is-main':'')} data-testid="bv-basic-chip"
          aria-pressed={basic.selectionRole==='main'} disabled={basic.disabled} onClick={()=>onCardTap?.('basic')}
          aria-label={'기본 스윙 · 에너지 0 · 카드 소모 없음'+(basic.selectionRole==='main'?' · 선택됨, 다시 누르면 해제':'')}>
          기본 스윙 <b aria-hidden="true">⚡0</b>{basic.selectionRole==='main'&&<i aria-hidden="true">{selectionTag(basic)}</i>}
        </button>}
        {piles&&(onPiles
          ?<button type="button" className="bv-piles" onClick={onPiles} disabled={detailDisabled}>더미 {piles.draw} · 버림 {piles.discard}</button>
          :<span className="bv-piles">더미 {piles.draw} · 버림 {piles.discard}</span>)}
      </span>
    </header>
    <div className="bv-hand-scroller">
      <ol ref={rowRef} className="bv-hand-row" data-testid="bv-hand" aria-label={`손패 ${cards.length}장`}
        onScroll={measure} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}
        onClickCapture={onClickCapture}>
        {cards.map((item,i)=><BattleCard key={item.id} item={item} art={artFor?artFor(item):null}
          cardRef={el=>{if(el)cardRefs.current.set(item.id,el);else cardRefs.current.delete(item.id);}}
          onTap={onCardTap} onDetail={onCardDetail} detailDisabled={detailDisabled} onKeyDown={e=>onCardKey(e,i)}/>)}
        {!cards.length&&<li className="bv-hand-empty">손패 없음 · 기본 스윙은 언제나 쓸 수 있다</li>}
      </ol>
      {hidden.left>0&&<span className="bv-hand-more left" aria-hidden="true">‹ {hidden.left}</span>}
      {hidden.right>0&&<span className="bv-hand-more right" data-testid="bv-hand-more" aria-hidden="true">{hidden.right} ›</span>}
    </div>
    <p className="bv-hand-legend" aria-hidden="true"><i className="k-main"/>메인 <i className="k-support"/>지원</p>
  </section>;
});
export default HandDock;
