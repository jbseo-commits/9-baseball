import React,{useEffect,useRef,useState} from 'react';
import BallparkActors from './BallparkActors.jsx';
import {BATTER_V15_SHEET,BATTER_V15_RIG} from './batter-v15.js';
import redRushAtlas from '../../assets/pitcher-sd-v1/red-rush-pitch-120-atlas.png';
import './ballpark.css';
import './cinematic-director.css';
import './cinematic-v2-showcase.css';

const POSES={ready:1,load:1,trigger:1,'swing-start':1,'swing-mid':1,contact:1,'follow-through-early':1,'follow-through-late':1,finish:1,settle:1};
const SHOT={grade:'homer',kind:'homer',title:'HOME RUN',motion:{impactAt:620,settleAt:1760,duration:2020,freeze:90,slowmo:true}};
const STAGES=[['windup',0],['pitcher-focus',120],['pitch-release',330],['ball-approach',430],['impact',520],['slowmo',620],['release',760],['settle',1740]];
const CAMERA={windup:'hold','pitcher-focus':'pitcher','pitch-release':'pitcher-release','ball-approach':'approach',impact:'contact',slowmo:'contact',release:'track',settle:'recover'};
const EXIT_MS=650;

export default function CinematicV2Showcase(){
  const sceneRef=useRef(null);
  const cameraRef=useRef(null);
  const [token,setToken]=useState(1);
  const [stage,setStage]=useState('windup');
  const [auto,setAuto]=useState(true);
  const replay=()=>setToken(v=>v+1);
  useEffect(()=>{const timers=STAGES.map(([name,at])=>setTimeout(()=>setStage(name),at));return()=>timers.forEach(clearTimeout)},[token]);
  useEffect(()=>{if(!auto)return;const id=setInterval(replay,3200);return()=>clearInterval(id)},[auto]);
  useEffect(()=>{
    const cam=cameraRef.current;if(!cam)return;
    if(stage!=='release'||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){cam.style.removeProperty('--track-x');cam.style.removeProperty('--track-y');cam.style.removeProperty('--track-scale');return}
    const started=performance.now();let raf=0;
    const follow=now=>{const u=Math.max(0,Math.min(1,(now-started)/EXIT_MS)),ease=1-Math.pow(1-u,3),arc=Math.sin(Math.PI*u);cam.style.setProperty('--track-x',`${(-1.5-6.2*ease).toFixed(2)}%`);cam.style.setProperty('--track-y',`${(.5+5.1*ease-1.3*arc).toFixed(2)}%`);cam.style.setProperty('--track-scale',(1.075+.065*ease).toFixed(3));if(u<1)raf=requestAnimationFrame(follow)};
    raf=requestAnimationFrame(follow);return()=>cancelAnimationFrame(raf)
  },[stage,token]);
  const camera=CAMERA[stage]||'hold';
  return <main className="cinematic-v2-showcase">
    <header className="cinematic-v2-showcase__bar"><div><strong>CINEMATIC V2 · LIVE PIXI</strong><small>투수 → 공 → 타자 → 홈런 자동 연출</small></div><button type="button" onClick={replay}>다시 재생</button><button type="button" aria-pressed={auto} onClick={()=>setAuto(v=>!v)}>{auto?'자동 ON':'자동 OFF'}</button></header>
    <section ref={sceneRef} data-camera={camera} className={`bp-scene cinematic-v2-showcase__scene fx-stage-${stage} fx-homer cam-${camera}`}>
      <div ref={cameraRef} className="cinematic-v2-showcase__camera"><div className="bp-bg" aria-hidden="true"/><div className="bp-haze" aria-hidden="true"/><div className="bp-pitcher cinematic-v2-showcase__pitcher" aria-hidden="true"/><div className="bp-batter cinematic-v2-showcase__batter" aria-hidden="true"/><div className="bp-zone cinematic-v2-showcase__zone" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><BallparkActors sceneRef={sceneRef} pitcherAtlas={redRushAtlas} artId="red-rush" batterPoses={POSES} batterSheet={BATTER_V15_SHEET} batterRig={BATTER_V15_RIG} pitchZone={4} shot={SHOT} fxStage={stage} playToken={token}/></div>
      <div className="cinematic-v2-showcase__label"><b>HOME RUN</b><span>{stage.toUpperCase()} · {camera.toUpperCase()}</span></div>
    </section>
  </main>;
}
