import React,{useEffect,useRef,useState} from 'react';
import BallparkActors from './BallparkActors.jsx';
import {BATTER_V15_SHEET,BATTER_V15_RIG} from './batter-v15.js';
import {RED_RUSH_RELEASE_MS,PITCH_FLIGHT_MS} from './pitcher-sd.js';
import redRushAtlas from '../../assets/pitcher-sd-v1/red-rush-pitch-120-atlas.png';
import './ballpark.css';
import './cinematic-director.css';
import './cinematic-v2-showcase.css';

const POSES={ready:1,load:1,trigger:1,'swing-start':1,'swing-mid':1,contact:1,'follow-through-early':1,'follow-through-late':1,finish:1,settle:1};
const CONTACT_MS=RED_RUSH_RELEASE_MS+PITCH_FLIGHT_MS;
const SHOT={grade:'homer',kind:'homer',title:'HOME RUN',motion:{impactAt:CONTACT_MS,settleAt:CONTACT_MS+620,duration:CONTACT_MS+900,freeze:90,slowmo:true}};
const STAGES=[['windup',0],['pitcher-focus',Math.max(0,RED_RUSH_RELEASE_MS-250)],['pitch-release',RED_RUSH_RELEASE_MS-35],['ball-approach',RED_RUSH_RELEASE_MS+70],['impact',CONTACT_MS-45],['slowmo',CONTACT_MS],['release',CONTACT_MS+140],['settle',CONTACT_MS+760]];
const CAMERA={windup:'hold','pitcher-focus':'pitcher','pitch-release':'pitcher-release','ball-approach':'approach',impact:'contact',slowmo:'contact',release:'track',settle:'recover'};
const EXIT_MS=650;
const LOOP_MS=CONTACT_MS+1650;

export default function CinematicV2Showcase(){
  const sceneRef=useRef(null);
  const cameraRef=useRef(null);
  const [token,setToken]=useState(1);
  const [stage,setStage]=useState('windup');
  const [auto,setAuto]=useState(true);
  const replay=()=>setToken(v=>v+1);
  useEffect(()=>{const timers=STAGES.map(([name,at])=>setTimeout(()=>setStage(name),at));return()=>timers.forEach(clearTimeout)},[token]);
  useEffect(()=>{if(!auto)return;const id=setInterval(replay,LOOP_MS);return()=>clearInterval(id)},[auto]);
  useEffect(()=>{
    const cam=cameraRef.current;if(!cam)return;
    if(stage!=='release'||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){cam.style.removeProperty('--track-x');cam.style.removeProperty('--track-y');cam.style.removeProperty('--track-scale');return}
    const started=performance.now();let raf=0;
    const follow=now=>{const u=Math.max(0,Math.min(1,(now-started)/EXIT_MS)),ease=1-Math.pow(1-u,3),arc=Math.sin(Math.PI*u);cam.style.setProperty('--track-x',`${(-1.5-6.2*ease).toFixed(2)}%`);cam.style.setProperty('--track-y',`${(.5+5.1*ease-1.3*arc).toFixed(2)}%`);cam.style.setProperty('--track-scale',(1.075+.065*ease).toFixed(3));if(u<1)raf=requestAnimationFrame(follow)};
    raf=requestAnimationFrame(follow);return()=>cancelAnimationFrame(raf)
  },[stage,token]);
  const camera=CAMERA[stage]||'hold';
  return <main className="cinematic-v2-showcase">
    <header className="cinematic-v2-showcase__bar"><div><strong>CINEMATIC V2 · LIVE PIXI</strong><small>실제 릴리즈 프레임 → 300ms 비행 → 컨택</small></div><button type="button" onClick={replay}>다시 재생</button><button type="button" aria-pressed={auto} onClick={()=>setAuto(v=>!v)}>{auto?'자동 ON':'자동 OFF'}</button></header>
    <section ref={sceneRef} data-camera={camera} className={`bp-scene cinematic-v2-showcase__scene fx-stage-${stage} fx-homer cam-${camera}`}>
      <div ref={cameraRef} className="cinematic-v2-showcase__camera"><div className="bp-bg" aria-hidden="true"/><div className="bp-haze" aria-hidden="true"/><div className="bp-pitcher cinematic-v2-showcase__pitcher" aria-hidden="true"/><div className="bp-batter cinematic-v2-showcase__batter" aria-hidden="true"/><div className="bp-zone cinematic-v2-showcase__zone" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><BallparkActors sceneRef={sceneRef} pitcherAtlas={redRushAtlas} artId="red-rush" batterPoses={POSES} batterSheet={BATTER_V15_SHEET} batterRig={BATTER_V15_RIG} pitchZone={4} shot={SHOT} fxStage={stage} playToken={token}/></div>
      <div className="cinematic-v2-showcase__label"><b>HOME RUN</b><span>{stage.toUpperCase()} · {camera.toUpperCase()}</span></div>
    </section>
  </main>;
}
