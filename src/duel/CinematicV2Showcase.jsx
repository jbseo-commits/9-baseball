import React,{useEffect,useRef,useState} from 'react';
import BallparkActors from './BallparkActors.jsx';
import {BATTER_V15_SHEET,BATTER_V15_RIG} from './batter-v15.js';
import redRushAtlas from '../../assets/pitcher-sd-v1/red-rush-pitch-120-atlas.png';
import './ballpark.css';
import './cinematic-director.css';
import './cinematic-v2-showcase.css';

const POSES={ready:1,load:1,trigger:1,'swing-start':1,'swing-mid':1,contact:1,'follow-through-early':1,'follow-through-late':1,finish:1,settle:1};
const SHOT={grade:'homer',kind:'homer',title:'HOME RUN',motion:{impactAt:620,settleAt:1760,duration:1900,freeze:90,slowmo:true}};
const STAGES=[['windup',0],['impact',520],['slowmo',620],['release',790],['settle',1650]];
const CAMERA={windup:'hold',impact:'contact',slowmo:'contact',release:'track',settle:'recover'};

export default function CinematicV2Showcase(){
  const sceneRef=useRef(null);
  const [token,setToken]=useState(1);
  const [stage,setStage]=useState('windup');
  const [auto,setAuto]=useState(true);
  const replay=()=>setToken(v=>v+1);
  useEffect(()=>{
    const timers=STAGES.map(([name,at])=>setTimeout(()=>setStage(name),at));
    return()=>timers.forEach(clearTimeout);
  },[token]);
  useEffect(()=>{
    if(!auto)return;
    const id=setInterval(replay,3000);
    return()=>clearInterval(id);
  },[auto]);
  const camera=CAMERA[stage]||'hold';
  return <main className="cinematic-v2-showcase">
    <header className="cinematic-v2-showcase__bar">
      <div><strong>CINEMATIC V2 · LIVE PIXI</strong><small>실제 BallparkActors · 홈런 자동 재생</small></div>
      <button type="button" onClick={replay}>다시 재생</button>
      <button type="button" aria-pressed={auto} onClick={()=>setAuto(v=>!v)}>{auto?'자동 ON':'자동 OFF'}</button>
    </header>
    <section ref={sceneRef} data-camera={camera} className={`bp-scene cinematic-v2-showcase__scene fx-stage-${stage} fx-homer cam-${camera}`}>
      <div className="cinematic-v2-showcase__camera">
        <div className="bp-bg" aria-hidden="true"/>
        <div className="bp-haze" aria-hidden="true"/>
        <div className="bp-pitcher cinematic-v2-showcase__pitcher" aria-hidden="true"/>
        <div className="bp-batter cinematic-v2-showcase__batter" aria-hidden="true"/>
        <div className="bp-zone cinematic-v2-showcase__zone" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
        <BallparkActors sceneRef={sceneRef} pitcherAtlas={redRushAtlas} artId="red-rush" batterPoses={POSES} batterSheet={BATTER_V15_SHEET} batterRig={BATTER_V15_RIG} pitchZone={4} shot={SHOT} fxStage={stage} playToken={token}/>
      </div>
      <div className="cinematic-v2-showcase__label"><b>HOME RUN</b><span>{stage.toUpperCase()} · {camera.toUpperCase()}</span></div>
    </section>
  </main>;
}
