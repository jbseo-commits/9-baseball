import React,{useState,useCallback} from 'react';
import BattleScene from './BattleScene.jsx';
import BattleHud from './BattleHud.jsx';
import HandDock from './HandDock.jsx';
import DecisionPanel,{BattleAction,DecisionSummary} from './DecisionPanel.jsx';
import {atbatCardArt} from './atbat-card-art.js';
import {cinemaMoment} from './cinema-director.js';
import ResultReadout from './ResultReadout.jsx';
import './layout.css';
import './selection.css';
import './atbat.css';

/* Presentation only. BallparkBattle keeps selection, inspector, commit and next
   timers; App still owns the engine, save and pitch presentation lifecycle. */
export default function BattleView({model,actors,playback=null,execution=null,rootRef,sceneRef,zoneRef,handRef,title,review=false,
  inspector=null,menuOpen=false,recent=null,onMenu,onCardTap,onCardDetail,onPiles,onZoneTap,onZoneHover,
  onToggleSupport,onClearPlan,onPointerDown,onPointerMove,onPointerUp,onPointerCancel,onTake,onSwing,onNext,piles}){
  const finale=cinemaMoment(model.result,model.scene.fxStage,!!playback);
  const spotlight=model.result&&playback&&!finale?{...model.result,knockedOut:false}:model.result;
  const [field,setField]=useState(null);
  const onLayout=useCallback(s=>setField(prev=>prev&&prev.width===s.width&&prev.height===s.height&&prev.home.x===s.home.x&&prev.home.y===s.home.y?prev:s),[]);
  const main=model.hand.find(c=>c.selectionRole==='main');
  const hasSupport=model.hand.some(c=>c.selectionRole==='support'||c.selectionRole==='armed');
  return <main ref={rootRef} className={'battle-vnext bv-atbat'+(menuOpen?' inspecting':'')} data-phase={model.phase} data-support={hasSupport?'true':'false'} style={{'--bv-verdict-delay':playback?'120ms':'0ms',...(field?{'--bv-plate-x':field.home.x+'px','--bv-plate-y':field.home.y+'px','--bv-mound-y':field.mound.y+'px'}:{})}} aria-label="타석">
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
      <DecisionPanel {...model} execution={execution} showAction={false} showPlan={false} recent={recent} shotGrade={model.scene.shotGrade} onZoneTap={onZoneTap} onZoneHover={onZoneHover}
        onTake={onTake} onSwing={onSwing} onNext={onNext}/>
    </div>
    <div className="bv-command-rail">
    <div className="bv-hand-area">
      <HandDock selection={model.selection} onToggleSupport={onToggleSupport} ref={handRef} hand={menuOpen?model.hand.map(c=>({...c,disabled:false})):model.hand} energy={model.energy}
        input={menuOpen?{...model.input,canSelect:true}:model.input} phase={model.phase}
        piles={piles} onCardTap={onCardTap} onCardDetail={onCardDetail} onPiles={onPiles} artFor={atbatCardArt} grid="orbit"/>
    </div>
    <DecisionSummary {...model} execution={execution} shotGrade={model.scene.shotGrade} recent={recent}/>
    <footer className="bv-action-dock" aria-label="이번 공 실행">
      {onClearPlan&&model.input.actionKind!=='none'&&<button type="button" className="bv-plan-clear" disabled={!model.selection?.canClear} aria-label="선택 해제 · 지켜보기로 전환" onClick={onClearPlan}>해제</button>}
      <BattleAction input={model.input} energy={model.energy} phase={model.phase} actionName={model.input.actionKind==='swing'?main?.name:''} onTake={onTake} onSwing={onSwing} onNext={onNext}/>
    </footer>
    </div>
    {menuOpen&&<div className="bv-inspector-area">{inspector}</div>}
    {review&&<p className="bv-review-notice">메모리 검수 · 샘플 배우</p>}
  </main>;
}
