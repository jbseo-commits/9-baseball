import React,{useState,useCallback,useRef,useEffect} from 'react';
import BattleScene from './BattleScene.jsx';
import BattleHud from './BattleHud.jsx';
import HandDock from './HandDock.jsx';
import DecisionPanel,{BattleAction,DecisionSummary} from './DecisionPanel.jsx';
import {atbatCardArt} from './atbat-card-art.js';
import {cinemaMoment} from './cinema-director.js';
import ResultReadout from './ResultReadout.jsx';
import CoverageInsert from './CoverageInsert.jsx';
import './layout.css';
import './selection.css';
import './atbat.css';
import './folded-hand.css';

/* Presentation only. BallparkBattle keeps selection, inspector, commit and next
   timers; App still owns the engine, save and pitch presentation lifecycle. */
export default function BattleView({model,actors,playback=null,execution=null,rootRef,sceneRef,zoneRef,handRef,title,review=false,
  inspector=null,menuOpen=false,recent=null,onMenu,onCardTap,onCardDetail,onPiles,onZoneTap,onZoneHover,
  onToggleSupport,onClearPlan,onPointerDown,onPointerMove,onPointerUp,onPointerCancel,onTake,onSwing,onNext,piles}){
  const finale=cinemaMoment(model.result,model.scene.fxStage,!!playback);
  const spotlight=model.result&&playback&&!finale?{...model.result,knockedOut:false}:model.result;
  const [field,setField]=useState(null);
  const ownRoot=useRef(null),viewRef=rootRef||ownRoot;
  const [handOpen,setHandOpen]=useState(false),[placement,setPlacement]=useState(null),[pendingDrop,setPendingDrop]=useState(null),[dragFace,setDragFace]=useState(null);
  const [landscape,setLandscape]=useState(()=>typeof window==='undefined'||window.innerWidth>=window.innerHeight);
  const shown=handOpen||!landscape;
  const source=useRef(null),drag=useRef(null),sequence=useRef(0),suppressClick=useRef(false),handleRef=useRef(null);
  const handlePress=useRef(null),handleClick=useRef(false);
  const onLayout=useCallback(s=>setField(prev=>prev&&prev.width===s.width&&prev.height===s.height&&prev.home.x===s.home.x&&prev.home.y===s.home.y?prev:s),[]);
  const main=model.hand.find(c=>c.selectionRole==='main');
  const hasSupport=model.hand.some(c=>c.selectionRole==='support'||c.selectionRole==='armed');
  const remember=id=>{const el=[...viewRef.current.querySelectorAll('.bv-card-slot')].find(el=>el.dataset.cardId===id)?.querySelector('.bv-card');
    if(el){const b=el.getBoundingClientRect();source.current={x:b.left+b.width/2,y:b.top+b.height/2};}};
  const place=(z,id=main?.id)=>{
    const item=model.hand.find(c=>c.id===id);onZoneTap?.(z);
    if(item&&item.type!=='prepare'&&!item.problem&&!model.energy?.shortfall&&model.input.canSelect){
      const cell=viewRef.current?.querySelector(`.bv-cell[data-zone="${z}"]`),b=cell?.getBoundingClientRect();
      setPlacement({seq:++sequence.current,id,name:item.name,art:atbatCardArt(item)?.url,source:source.current||{x:b?.left||0,y:b?.top||0}});
      setHandOpen(false);
      cell?.focus({preventScroll:true});
    }
  };
  // A drop can select a different card and place it in one gesture. Wait for
  // that selection's render before dispatching the existing zone callback.
  useEffect(()=>{
    if(!pendingDrop)return;
    const item=model.hand.find(c=>c.id===pendingDrop.id);
    if(!model.input.canSelect||!item){setPendingDrop(null);return;}
    if(item.selectionRole==='main'||item.selectionRole==='armed'){
      place(pendingDrop.zone,pendingDrop.id);setPendingDrop(null);
    }else setPendingDrop(null);
  },[pendingDrop,model.hand,model.input.canSelect]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{if(model.phase!=='deciding'){setHandOpen(false);setDragFace(null);drag.current=null;}},[model.phase]);
  useEffect(()=>{const resize=()=>{setLandscape(window.innerWidth>=window.innerHeight);drag.current=null;setDragFace(null);};window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
  const pointerDown=e=>{
    suppressClick.current=false;
    if(!model.input.canSelect||menuOpen)return;
    const el=e.target.closest('.bv-card');if(!el||el.disabled)return;
    const id=el.closest('.bv-card-slot')?.dataset.cardId,item=model.hand.find(c=>c.id===id);
    // Already placed supports keep tap-to-remove; moving them requires an
    // explicit re-aim contract rather than silently moving the main's aim.
    if(!item||item.type==='prepare'||item.selectionRole==='support')return;
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
    if(d.mode==='drag'){e.preventDefault();setDragFace({x:e.clientX,y:e.clientY,name:d.name});}
    else if(d.mode==='scroll'){e.preventDefault();if(d.row)d.row.scrollTop=d.scroll-dy;}
  };
  const pointerUp=e=>{
    const d=drag.current;drag.current=null;setDragFace(null);if(!d?.mode)return;
    e.preventDefault();suppressClick.current=true;
    if(d.mode==='scroll')return;
    const cell=document.elementFromPoint(e.clientX,e.clientY)?.closest('.bv-cell');
    if(!cell||cell.disabled||!viewRef.current?.contains(cell))return;
    source.current={x:e.clientX,y:e.clientY};
    const item=model.hand.find(c=>c.id===d.id);
    if(item?.selectionRole==='main'||item?.selectionRole==='armed')place(Number(cell.dataset.zone),d.id);
    else{setPlacement(null);onCardTap?.(d.id);setPendingDrop({id:d.id,zone:Number(cell.dataset.zone)});}
  };
  return <main ref={viewRef} onKeyDown={e=>{suppressClick.current=false;if(e.key==='Escape'&&handOpen&&!menuOpen){e.preventDefault();setHandOpen(false);handleRef.current?.focus();}}} className={'battle-vnext bv-atbat bv-foldable'+(menuOpen?' inspecting':'')} data-hand-open={shown?'true':'false'} data-phase={model.phase} data-support={hasSupport?'true':'false'} style={{'--bv-verdict-delay':playback?'120ms':'0ms',...(field?{'--bv-plate-x':field.home.x+'px','--bv-plate-y':field.home.y+'px','--bv-mound-y':field.mound.y+'px'}:{})}} aria-label="타석">
    <div className="bv-stage" ref={sceneRef}>
      <BattleScene playback={playback} result={model.result} finale={finale} scene={model.scene} actors={actors} phase={model.phase} framing="atbat" onLayout={onLayout}>
        {model.phase==='result'&&model.result&&<ResultReadout finale={finale} result={spotlight} shotGrade={model.scene.shotGrade} variant="spotlight"/>}
      </BattleScene>
    </div>
    <BattleHud result={model.result} playback={playback} resultKey={model.scene.playToken} hud={model.hud} forecast={model.forecast} sources={model.zones?.sources} phase={model.phase}
      title={title} onMenu={onMenu} menuOpen={menuOpen}/>
    <div className="bv-decision-area" ref={zoneRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
      onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
      {main&&model.phase==='deciding'&&<p className="bv-field-choice">{main.name}<span>{main.type==='prepare'?'준비':`${main.coverage?.length||0}존 커버`}</span></p>}
      <DecisionPanel {...model} execution={execution} showAction={false} showPlan={false} recent={recent} shotGrade={model.scene.shotGrade} onZoneTap={z=>place(z,model.hand.find(c=>c.selectionRole==='armed')?.id||main?.id)} onZoneHover={onZoneHover}
        onTake={onTake} onSwing={onSwing} onNext={onNext}/>
    </div>
    <button ref={handleRef} type="button" className="bv-hand-handle" aria-label={handOpen?'손패 접기':'손패 펼치기'} aria-expanded={handOpen} aria-controls="bv-folding-hand"
      onPointerDown={e=>{handleClick.current=false;handlePress.current={id:e.pointerId,x:e.clientX,y:e.clientY};}}
      onPointerUp={e=>{const p=handlePress.current;handlePress.current=null;if(!e.currentTarget.disabled&&e.pointerType==='touch'&&p?.id===e.pointerId&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<10){e.preventDefault();handleClick.current=true;setHandOpen(v=>!v);}}}
      onPointerCancel={()=>{handlePress.current=null;}}
      onKeyDown={()=>{handleClick.current=false;}}
      onClick={()=>{if(handleClick.current){handleClick.current=false;return;}setHandOpen(v=>!v);}}
      disabled={model.phase==='flight'||model.phase==='committing'||menuOpen}>
      <span aria-hidden="true">{handOpen?'›':'‹'}</span><b>손패 {model.hand.filter(c=>c.type!=='basic').length}</b><small>{handOpen?'접기':'펼치기'}</small>{!handOpen&&model.energy&&<em aria-label={`에너지 ${model.energy.current}/${model.energy.cap}`}>⚡{model.energy.current}</em>}
    </button>
    <div className="bv-command-rail">
    <div id="bv-folding-hand" className="bv-hand-area" aria-hidden={!shown} {...(!shown?{inert:''}:{})}
      onPointerDownCapture={pointerDown} onPointerMoveCapture={pointerMove} onPointerUpCapture={pointerUp}
      onPointerCancel={()=>{drag.current=null;setDragFace(null);}}
      onClickCapture={e=>{if(suppressClick.current){e.preventDefault();e.stopPropagation();suppressClick.current=false;}}}>
      <HandDock selection={model.selection} onToggleSupport={onToggleSupport} ref={handRef} hand={menuOpen?model.hand.map(c=>({...c,disabled:false})):model.hand} energy={model.energy}
        input={menuOpen?{...model.input,canSelect:true}:model.input} phase={model.phase}
        piles={piles} onCardTap={id=>{setPlacement(null);remember(id);onCardTap?.(id);}} onCardDetail={onCardDetail} onPiles={onPiles} artFor={atbatCardArt} grid="orbit"/>
    </div>
    <DecisionSummary {...model} execution={execution} shotGrade={model.scene.shotGrade} recent={recent}/>
    <footer className="bv-action-dock" aria-label="이번 공 실행">
      {onClearPlan&&model.input.actionKind!=='none'&&<button type="button" className="bv-plan-clear" disabled={!model.selection?.canClear} aria-label="선택 해제 · 지켜보기로 전환" onClick={()=>{setPlacement(null);onClearPlan();}}>해제</button>}
      <BattleAction input={model.input} energy={model.energy} phase={model.phase} actionName={model.input.actionKind==='swing'?main?.name:''} onTake={onTake} onSwing={onSwing} onNext={onNext}/>
    </footer>
    </div>
    <CoverageInsert request={placement} pieces={model.zones?.pieces} rootRef={viewRef} phase={model.phase}/>
    {dragFace&&<div className="bv-drag-face" aria-hidden="true" style={{left:dragFace.x,top:dragFace.y}}>{dragFace.name}<span>노릴 코스에 놓으세요</span></div>}
    {menuOpen&&<div className="bv-inspector-area">{inspector}</div>}
    {review&&<p className="bv-review-notice">메모리 검수 · 샘플 배우</p>}
  </main>;
}
