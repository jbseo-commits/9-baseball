import React,{useState,useCallback,useRef,useEffect,useLayoutEffect} from 'react';
import BattleScene from './BattleScene.jsx';
import BattleHud from './BattleHud.jsx';
import HandDock from './HandDock.jsx';
import DecisionPanel,{BattleAction,DecisionSummary} from './DecisionPanel.jsx';
import {atbatCardArt} from './atbat-card-art.js';
import {cinemaMoment} from './cinema-director.js';
import ResultReadout from './ResultReadout.jsx';
import CoverageInsert from './CoverageInsert.jsx';
import AnimationSpeed from './AnimationSpeed.jsx';
import useAnimationRate from './use-animation-rate.js';
import {StackTray} from './StackPlacement.jsx';
import {dragPreviewBox} from './drag-preview.js';
import BattleSymbol from './BattleSymbol.jsx';
import {referenceSkinVars} from './reference-skins.js';
import './layout.css';
import './selection.css';
import './atbat.css';
import './folded-hand.css';
import './refined.css';
import './reference.css';
import './thumb-hand.css';

/* Presentation only. BallparkBattle keeps selection, inspector, commit and next
   timers; App still owns the engine, save and pitch presentation lifecycle. */
export default function BattleView({model,actors,playback=null,execution=null,animationRate=1,onAnimationRateChange=null,rootRef,sceneRef,zoneRef,handRef,title,review=false,
  inspector=null,menuOpen=false,recent=null,onMenu,sound=false,onToggleSound=null,onCardTap,onCardDetail,onPiles,onZoneTap,onZoneHover,
  onToggleSupport,onClearPlan,onCardDrop=null,onPreviewCardDrop=null,onRemoveSupport=null,onPointerDown,onPointerMove,onPointerUp,onPointerCancel,onTake,onSwing,onNext,piles}){
  const finale=cinemaMoment(model.result,model.scene.fxStage,!!playback);
  const spotlight=model.result&&playback&&!finale?{...model.result,knockedOut:false}:model.result;
  const [field,setField]=useState(null);
  const ownRoot=useRef(null),viewRef=rootRef||ownRoot;
  useAnimationRate(viewRef,playback?.rate||animationRate);
  const [handOpen,setHandOpen]=useState(false),[placements,setPlacements]=useState([]),[pendingDrop,setPendingDrop]=useState(null),[dragFace,setDragFace]=useState(null),[dropProblem,setDropProblem]=useState('');
  const [dragPreview,setDragPreview]=useState(null),dragFaceRef=useRef(null);
  const setPlacement=next=>setPlacements(prev=>next?[...prev.filter(p=>p.id!==next.id),next].slice(-4):[]);
  const finishPlacement=useCallback(seq=>setPlacements(prev=>prev.filter(p=>p.seq!==seq)),[]);
  const [landscape,setLandscape]=useState(()=>typeof window==='undefined'||window.innerWidth>=window.innerHeight);
  const shown=handOpen||!landscape;
  const source=useRef(null),drag=useRef(null),sequence=useRef(0),suppressClick=useRef(false),handleRef=useRef(null);
  const cancelDrag=useCallback(()=>{drag.current=null;source.current=null;setDragFace(null);setDragPreview(null);},[]);
  // Touch browsers may leave keyboard focus on body. Capture the field's
  // fold command before App's global Escape resets a plan; dialogs keep it.
  useEffect(()=>{
    const fold=e=>{if(e.defaultPrevented||e.key!=='Escape'||menuOpen||document.querySelector('[aria-modal="true"]'))return;if(drag.current){e.preventDefault();cancelDrag();}if(!handOpen)return;e.preventDefault();cancelDrag();setHandOpen(false);handleRef.current?.focus();};
    window.addEventListener('keydown',fold,true);return()=>window.removeEventListener('keydown',fold,true);
  },[handOpen,menuOpen,cancelDrag]);
  const pieceIds=(model.zones?.pieces||[]).map(p=>p.id).join('|');
  useLayoutEffect(()=>{
    const ids=new Set((model.zones?.pieces||[]).map(p=>p.id));
    setPlacements(prev=>{const next=prev.filter(p=>ids.has(p.id));return next.length===prev.length?prev:next;});
  },[pieceIds]); // Removed supports cannot remount an old receipt on a later drop.
  const handlePress=useRef(null),handleClick=useRef(false);
  const clearPress=useRef(null),clearClick=useRef(false);
  const clearPlan=()=>{cancelDrag();setPlacement(null);setDropProblem('');onClearPlan?.();};
  const executionLatch=useRef(false);
  useEffect(()=>{if(model.input.canSelect)executionLatch.current=false;},[model.phase,model.scene.playToken,model.input.canSelect,model.input.actionKind]);
  const runAction=kind=>{const callback=kind==='take'?onTake:onSwing;if(executionLatch.current||!callback||!model.input.canSelect||menuOpen)return;executionLatch.current=true;callback();};
  const onLayout=useCallback(s=>setField(prev=>prev&&prev.width===s.width&&prev.height===s.height&&prev.home.x===s.home.x&&prev.home.y===s.home.y?prev:s),[]);
  const main=model.hand.find(c=>c.selectionRole==='main');
  const hasSupport=model.hand.some(c=>c.selectionRole==='support'||c.selectionRole==='armed');
  const cardSource=id=>{const el=[...viewRef.current.querySelectorAll('.bv-card-slot')].find(el=>el.dataset.cardId===id)?.querySelector('.bv-card');
    if(!el)return null;const b=el.getBoundingClientRect();
    const transform=getComputedStyle(el.closest('.bv-card-slot')).transform;
    const m=transform?.match(/^matrix\(([^)]+)\)/)?.[1].split(',').map(Number);
    const art=el.querySelector('.bv-card-art'),copy=el.querySelector('.bv-card-copy');
    return {artSide:art&&copy&&art.offsetLeft>copy.offsetLeft?'right':'left',x:b.left+b.width/2,y:b.top+b.height/2,w:b.width,h:b.height,angle:m?Math.atan2(m[1],m[0])*180/Math.PI:0,
      artFraction:(el.querySelector('.bv-card-art')?.offsetWidth||0)/(el.offsetWidth||1)||.4,
      font:parseFloat(getComputedStyle(el.querySelector('.bv-card-name')).fontSize)||18,small:parseFloat(getComputedStyle(el.querySelector('.bv-card-effect')).fontSize)||12};};
  const remember=id=>{source.current=cardSource(id);};
  const place=(z,id=main?.id)=>{
    if(!model.input.canSelect||menuOpen)return;
    setDropProblem('');const item=model.hand.find(c=>c.id===id);onZoneTap?.(z);
    if(item&&item.type!=='prepare'&&!item.problem&&!model.energy?.shortfall&&model.input.canSelect&&!menuOpen){
      const cell=viewRef.current?.querySelector(`.bv-cell[data-zone="${z}"]`),b=cell?.getBoundingClientRect();
      // Refresh after hand scrolling. A drag carries its release location; a
      // folded-hand re-aim starts from the visible zone rather than off-screen.
      const origin=source.current?.drag?source.current:shown?cardSource(id):null;
      setPlacement({seq:++sequence.current,id,name:item.name,cost:item.cost,summary:item.summary,art:atbatCardArt(item)?.url,
        source:origin||{x:b?b.left+b.width/2:0,y:b?b.top+b.height/2:0,w:b?.width||76,h:b?.height||76,angle:0}});
      source.current=null;setHandOpen(false);cell?.focus({preventScroll:true});
    }
  };
  // A drop can select a different card and place it in one gesture. Wait for
  // that selection's render before dispatching the existing zone callback.
  useEffect(()=>{
    if(!pendingDrop)return;
    const item=model.hand.find(c=>c.id===pendingDrop.id);
    if(!model.input.canSelect||!item){setPendingDrop(null);return;}
    if(pendingDrop.direct){
      const piece=model.zones?.pieces?.find(p=>p.id===pendingDrop.id);
      if(piece?.aimZone===pendingDrop.zone){setPlacement(pendingDrop.receipt);source.current=null;setDropProblem('');setHandOpen(false);setPendingDrop(null);viewRef.current?.querySelector(`.bv-cell[data-zone="${pendingDrop.zone}"]`)?.focus({preventScroll:true});}
    }else if(item.selectionRole==='main'||item.selectionRole==='armed'){
      place(pendingDrop.zone,pendingDrop.id);setPendingDrop(null);
    }else setPendingDrop(null);
  },[pendingDrop,model.hand,model.input.canSelect]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{if(menuOpen){setPlacement(null);setPendingDrop(null);setDragFace(null);setDragPreview(null);drag.current=null;}},[menuOpen]);
  useEffect(()=>{if(model.phase!=='deciding'){setPlacement(null);setPendingDrop(null);setDropProblem('');setHandOpen(false);setDragFace(null);setDragPreview(null);drag.current=null;}},[model.phase]);
  useEffect(()=>{const resize=()=>{setLandscape(window.innerWidth>=window.innerHeight);drag.current=null;setDragFace(null);setDragPreview(null);};window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
  const pointerDown=e=>{
    suppressClick.current=false;
    if(!model.input.canSelect||menuOpen)return;
    const el=e.target.closest('.bv-card');if(!el||el.disabled)return;
    const id=el.closest('.bv-card-slot')?.dataset.cardId,item=model.hand.find(c=>c.id===id);
    // A drop has explicit support/re-aim intent; ordinary taps keep the
    // existing main comparison or support-mode removal contract.
    if(!item||item.type==='prepare')return;
    const row=el.closest('.bv-hand-row');
    drag.current={id,name:item.name,x:e.clientX,y:e.clientY,pointer:e.pointerId,type:e.pointerType,row,scroll:row?.scrollTop||0,mode:null};suppressClick.current=false;
  };
  const pointerMove=e=>{
    const d=drag.current;if(!d||d.pointer!==e.pointerId)return;
    const dx=e.clientX-d.x,dy=e.clientY-d.y;
    if(!d.mode&&Math.hypot(dx,dy)>14){
      if((Math.abs(dx)>14&&Math.abs(dx)>Math.abs(dy)*.45)||d.type==='mouse')d.mode='drag';
      else if(Math.abs(dy)>14)d.mode='scroll';
      if(d.mode)e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if(d.mode==='drag'){
      e.preventDefault();const item=model.hand.find(c=>c.id===d.id),z=viewRef.current?.querySelector('.bv-zone')?.getBoundingClientRect();
      const box=dragPreviewBox({x:e.clientX,y:e.clientY},{width:window.innerWidth,height:window.innerHeight},z?{x:z.x,y:z.y,w:z.width,h:z.height}:null);
      setDragFace({...box,name:d.name,cost:item.cost,summary:item.summary,art:atbatCardArt(item)?.url});
      const cell=document.elementFromPoint(e.clientX,e.clientY)?.closest('.bv-cell'),zone=cell&&viewRef.current?.contains(cell)?Number(cell.dataset.zone):null;
      if(zone!==d.zone){d.zone=zone;setDragPreview(zone===null?null:onPreviewCardDrop?.(d.id,zone)||null);}
    }
    else if(d.mode==='scroll'){e.preventDefault();if(d.row)d.row.scrollTop=d.scroll-dy;}
  };
  const pointerUp=e=>{
    const d=drag.current,face=dragFaceRef.current?.getBoundingClientRect();drag.current=null;setDragFace(null);setDragPreview(null);if(!d?.mode)return;
    e.preventDefault();suppressClick.current=true;
    if(d.mode==='scroll')return;
    const cell=document.elementFromPoint(e.clientX,e.clientY)?.closest('.bv-cell');
    if(!cell||cell.disabled||!viewRef.current?.contains(cell))return;
    source.current=face?.width?{x:face.x+face.width/2,y:face.y+face.height/2,w:face.width,h:face.height,angle:0,font:15,small:11,drag:true,artSide:'right',artFraction:60/face.width}:{x:e.clientX,y:e.clientY,w:170,h:72,angle:-6,font:16,small:11,drag:true};
    const item=model.hand.find(c=>c.id===d.id);
    if(onCardDrop){
      const outcome=onCardDrop(d.id,Number(cell.dataset.zone));
      if(!outcome?.ok){source.current=null;setDropProblem(outcome?.reason||'카드를 놓을 수 없습니다.');return;}
      setPendingDrop({id:d.id,zone:Number(cell.dataset.zone),direct:true,receipt:{seq:++sequence.current,id:d.id,name:item.name,cost:item.cost,summary:item.summary,art:atbatCardArt(item)?.url,source:source.current}});return;
    }
    if(item?.selectionRole==='main'||item?.selectionRole==='armed')place(Number(cell.dataset.zone),d.id);
    else{setPlacement(null);onCardTap?.(d.id);setPendingDrop({id:d.id,zone:Number(cell.dataset.zone)});}
  };
  return <main ref={viewRef} onKeyDown={()=>{suppressClick.current=false;}} className={'battle-vnext bv-atbat bv-foldable bv-refined bv-reference'+(menuOpen?' inspecting':'')} data-animation-rate={animationRate} data-hand-open={shown?'true':'false'} data-phase={model.phase} data-support={hasSupport?'true':'false'} style={{...referenceSkinVars,'--bv-verdict-delay':playback?'120ms':'0ms',...(field?{'--bv-plate-x':field.home.x+'px','--bv-plate-y':field.home.y+'px','--bv-mound-y':field.mound.y+'px','--ref-scale':field.camera.scale,'--ref-zone-size':field.zoneSize+'px'}:{})}} aria-label="타석">
    <div className="bv-stage" ref={sceneRef}>
      <BattleScene playback={playback} result={model.result} finale={finale} scene={model.scene} actors={actors} phase={model.phase} framing="atbat" onLayout={onLayout}>
        {model.phase==='result'&&model.result&&<ResultReadout finale={finale} result={spotlight} shotGrade={model.scene.shotGrade} variant="spotlight"/>}
      </BattleScene>
    </div>
    <AnimationSpeed rate={animationRate} onChange={onAnimationRateChange} disabled={!!playback||model.phase==='committing'||!!placements.length||!!pendingDrop||menuOpen}/>
    <BattleHud result={model.result} playback={playback} resultKey={model.scene.playToken} hud={model.hud} forecast={model.forecast} sources={model.zones?.sources} phase={model.phase}
      title={model.hud.actLabel||title} sound={sound} onToggleSound={onToggleSound} onMenu={onMenu} menuOpen={menuOpen} refined/>
    <div className="bv-decision-area" ref={zoneRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
      onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
      {main&&model.phase==='deciding'&&<p className="bv-field-choice">{main.name}<span>{main.type==='prepare'?'준비':`${main.coverage?.length||0}존 커버`}</span></p>}
      <DecisionPanel {...model} dragPreview={dragPreview} animationRate={animationRate} sound={sound} execution={execution} showAction={false} showPlan={false} recent={recent} shotGrade={model.scene.shotGrade} onZoneTap={z=>place(z,model.hand.find(c=>c.selectionRole==='armed')?.id||main?.id)} onZoneHover={onZoneHover}
        onTake={onTake} onSwing={onSwing} onNext={onNext}/>
    </div>
    <button ref={handleRef} type="button" className="bv-hand-handle" aria-label={handOpen?'손패 접기':'손패 펼치기'} aria-expanded={handOpen} aria-controls="bv-folding-hand"
      onPointerDown={e=>{handleClick.current=false;handlePress.current={id:e.pointerId,x:e.clientX,y:e.clientY};}}
      onPointerUp={e=>{const p=handlePress.current;handlePress.current=null;if(!e.currentTarget.disabled&&e.pointerType==='touch'&&p?.id===e.pointerId&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<10){e.preventDefault();handleClick.current=true;if(handOpen)cancelDrag();setHandOpen(v=>!v);}}}
      onPointerCancel={()=>{handlePress.current=null;}}
      onKeyDown={()=>{handleClick.current=false;}}
      onClick={()=>{if(handleClick.current){handleClick.current=false;return;}if(handOpen)cancelDrag();setHandOpen(v=>!v);}}
      disabled={model.phase==='flight'||model.phase==='committing'||menuOpen}>
      <span aria-hidden="true">{handOpen?'›':'‹'}</span><b>손패 {model.hand.filter(c=>c.type!=='basic').length}</b><small>{handOpen?'접기':'펼치기'}</small>{!handOpen&&model.energy&&<em aria-label={`에너지 ${model.energy.current}/${model.energy.cap}`}><BattleSymbol kind="energy"/>{model.energy.current}</em>}
    </button>
    <div className="bv-command-rail">
    <svg className="bv-reference-orbit" viewBox="0 0 100 1000" preserveAspectRatio="none" aria-hidden="true"><path d="M110 -30 Q-45 500 110 1030"/>{Array.from({length:21},(_,i)=><path key={i} d={`M${65-Math.sin(i/20*Math.PI)*49} ${i*50}h${i%5===0?18:8}`}/>)}</svg>
    <div id="bv-folding-hand" className="bv-hand-area" aria-hidden={!shown} {...(!shown?{inert:''}:{})}
      onPointerDownCapture={pointerDown} onPointerMoveCapture={pointerMove} onPointerUpCapture={pointerUp}
      onLostPointerCapture={e=>{if(e.target===e.currentTarget&&drag.current)cancelDrag();}} onScrollCapture={()=>{if(drag.current?.mode==='drag')cancelDrag();else{setDragFace(null);setDragPreview(null);}}} onPointerCancel={cancelDrag}
      onClickCapture={e=>{if(suppressClick.current){e.preventDefault();e.stopPropagation();suppressClick.current=false;}}}>
      <HandDock selection={model.selection} onToggleSupport={onToggleSupport} ref={handRef} hand={menuOpen?model.hand.map(c=>({...c,disabled:false})):model.hand} energy={model.energy}
        input={menuOpen?{...model.input,canSelect:true}:model.input} phase={model.phase}
        piles={piles} onCardTap={id=>{if(!model.selection?.supportMode)setPlacement(null);setDropProblem('');remember(id);onCardTap?.(id);}} onCardDetail={onCardDetail} onPiles={onPiles} artFor={atbatCardArt} grid="orbit"/>
    </div>
    <StackTray pieces={model.zones?.pieces} links={model.zones?.links} hand={model.hand} energy={model.energy} phase={model.phase} canAdd={model.selection?.canAddSupport} canSelect={model.input.canSelect&&!menuOpen} onAdd={()=>{if(!model.selection?.supportMode)onToggleSupport?.();setHandOpen(true);}} onRemove={onRemoveSupport}/>
    {dropProblem&&<p className="bv-drop-problem" role="status">{dropProblem}</p>}
    <DecisionSummary {...model} compact execution={execution} shotGrade={model.scene.shotGrade} recent={recent}/>
    <footer className="bv-action-dock" aria-label="이번 공 실행">
      {onClearPlan&&model.input.actionKind!=='none'&&<button type="button" className="bv-plan-clear" disabled={!model.selection?.canClear} aria-label="선택 해제 · 지켜보기로 전환" onPointerDown={e=>{clearClick.current=false;clearPress.current={id:e.pointerId,x:e.clientX,y:e.clientY};}} onPointerUp={e=>{const p=clearPress.current;clearPress.current=null;if(!e.currentTarget.disabled&&e.pointerType==='touch'&&p?.id===e.pointerId&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<10){e.preventDefault();clearClick.current=true;clearPlan();}}} onPointerCancel={()=>{clearPress.current=null;}} onKeyDown={()=>{clearClick.current=false;}} onClick={()=>{if(clearClick.current){clearClick.current=false;return;}clearPlan();}}>해제</button>}
      <BattleAction symbolic input={model.input} energy={model.energy} phase={model.phase} actionName={model.input.actionKind==='swing'?main?.name:''} onTake={()=>runAction('take')} onSwing={()=>runAction('swing')} onNext={onNext}/>
      {model.phase==='deciding'&&<BattleAction symbolic testId="bp-other-action" input={model.input.actionKind==='watch'
        ?{actionKind:'swing',actionLabel:'스윙',ariaLabel:'스윙 · 카드와 코스를 먼저 고르세요',canExecute:false,callback:'onSwing'}
        :{actionKind:'watch',actionLabel:'지켜보기',ariaLabel:'지켜보기 · 선택한 카드를 쓰지 않고 이번 공을 지켜봅니다',canExecute:model.input.canSelect&&!menuOpen,callback:'onTake'}} energy={model.energy} phase={model.phase} onTake={()=>runAction('take')} onSwing={()=>runAction('swing')}/>}
    </footer>
    </div>
    {placements.filter(p=>model.zones?.pieces?.some(piece=>piece.id===p.id)).map(request=><CoverageInsert key={request.id+':'+request.seq} request={request} pieces={model.zones?.pieces} rootRef={viewRef} phase={model.phase} sound={sound} menuOpen={menuOpen} onFinish={finishPlacement} animationRate={animationRate}/>)}
    {dragFace&&<div ref={dragFaceRef} className="bv-drag-face" aria-hidden="true" style={{left:dragFace.x,top:dragFace.y,width:dragFace.w,height:dragFace.h}}><span className="bv-drag-art" style={{backgroundImage:dragFace.art?`url(${dragFace.art})`:undefined}}/><b>{dragFace.cost}</b><strong>{dragFace.name}</strong><small>{dragFace.summary}</small></div>}
    {menuOpen&&<div className="bv-inspector-area">{inspector}</div>}
    {review&&<p className="bv-review-notice">메모리 검수 · 샘플 배우</p>}
  </main>;
}
