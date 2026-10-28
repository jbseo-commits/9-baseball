import React from 'react';
import BattleScene from './BattleScene.jsx';
import BattleHud from './BattleHud.jsx';
import HandDock from './HandDock.jsx';
import DecisionPanel,{BattleAction} from './DecisionPanel.jsx';
import ResultReadout from './ResultReadout.jsx';
import './layout.css';

/* Presentation only. BallparkBattle keeps selection, inspector, commit and next
   timers; App still owns the engine, save and pitch presentation lifecycle. */
export default function BattleView({model,actors,playback=null,rootRef,sceneRef,zoneRef,handRef,title,review=false,
  inspector=null,menuOpen=false,recent=null,onMenu,onCardTap,onCardDetail,onPiles,onZoneTap,onZoneHover,
  onPointerDown,onPointerMove,onPointerUp,onPointerCancel,onTake,onSwing,onNext,piles}){
  return <main ref={rootRef} className={'battle-vnext'+(menuOpen?' inspecting':'')} data-phase={model.phase} aria-label="타석">
    <div className="bv-stage" ref={sceneRef}>
      <BattleScene playback={playback} result={model.result} scene={model.scene} actors={actors} phase={model.phase} reserveHand>
        {model.phase==='result'&&model.result&&<ResultReadout result={model.result} shotGrade={model.scene.shotGrade} variant="spotlight"/>}
      </BattleScene>
    </div>
    <BattleHud hud={model.hud} forecast={model.forecast} sources={model.zones?.sources} phase={model.phase}
      title={title} onMenu={onMenu} menuOpen={menuOpen}/>
    <div className="bv-hand-area">
      <HandDock ref={handRef} hand={menuOpen?model.hand.map(c=>({...c,disabled:false})):model.hand} energy={model.energy}
        input={menuOpen?{...model.input,canSelect:true}:model.input} phase={model.phase}
        piles={piles} onCardTap={onCardTap} onCardDetail={onCardDetail} onPiles={onPiles}/>
    </div>
    <div className="bv-command-rail">
    <div className="bv-decision-area" ref={zoneRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
      onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
      <DecisionPanel {...model} showAction={false} recent={recent} shotGrade={model.scene.shotGrade} onZoneTap={onZoneTap} onZoneHover={onZoneHover}
        onTake={onTake} onSwing={onSwing} onNext={onNext}/>
    </div>
    <footer className="bv-action-dock" aria-label="이번 공 실행">
      <BattleAction input={model.input} energy={model.energy} phase={model.phase} onTake={onTake} onSwing={onSwing} onNext={onNext}/>
    </footer>
    </div>
    {menuOpen&&<div className="bv-inspector-area">{inspector}</div>}
    {review&&<p className="bv-review-notice">메모리 검수 · 샘플 배우</p>}
  </main>;
}
