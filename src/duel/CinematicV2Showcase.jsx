import React,{useEffect,useRef,useState} from 'react';
import BallparkActors from './BallparkActors.jsx';
import {BATTER_V15_SHEET,BATTER_V15_RIG} from './batter-v15.js';
import {RED_RUSH_RELEASE_MS,PITCH_FLIGHT_MS} from './pitcher-sd.js';
import redRushAtlas from '../../assets/pitcher-sd-v1/red-rush-pitch-120-atlas.png';
import tealMirageAtlas from '../../assets/pitcher-sd-v2/atlases/regular-02-teal-mirage-pitch-120-atlas.png';
import amberSinkerAtlas from '../../assets/pitcher-sd-v2/atlases/regular-03-amber-sinker-pitch-120-atlas.png';
import ivoryAceAtlas from '../../assets/pitcher-sd-v2/atlases/regular-04-ivory-ace-pitch-120-atlas.png';
import cobaltImpactAtlas from '../../assets/pitcher-sd-v2/atlases/elite-01-cobalt-impact-pitch-120-atlas.png';
import emeraldTyrantAtlas from '../../assets/pitcher-sd-v2/atlases/boss-01-emerald-tyrant-pitch-120-atlas.png';
import './ballpark.css';
import './cinematic-director.css';
import './cinematic-v2-showcase.css';

const POSES={ready:1,load:1,trigger:1,'swing-start':1,'swing-mid':1,contact:1,'follow-through-early':1,'follow-through-late':1,finish:1,settle:1};
const CONTACT_MS=RED_RUSH_RELEASE_MS+PITCH_FLIGHT_MS;
const SHOT={grade:'homer',kind:'homer',title:'HOME RUN',motion:{impactAt:CONTACT_MS,settleAt:CONTACT_MS+700,duration:CONTACT_MS+1040,freeze:90,slowmo:true,syncToPitcher:true}};
const STAGES=[['windup',0],['pitcher-focus',Math.max(0,RED_RUSH_RELEASE_MS-250)],['pitch-release',RED_RUSH_RELEASE_MS-35],['ball-approach',RED_RUSH_RELEASE_MS+70],['impact',CONTACT_MS-45],['slowmo',CONTACT_MS],['release',CONTACT_MS+125],['settle',CONTACT_MS+825]];
const CAMERA={windup:'hold','pitcher-focus':'pitcher','pitch-release':'pitcher-release','ball-approach':'approach',impact:'contact',slowmo:'contact',release:'track',settle:'recover'};
const EXIT_MS=700;
const LOOP_MS=CONTACT_MS+1800;
const PITCHERS=[
  {id:'regular-02-teal-mirage',name:'TEAL MIRAGE',atlas:tealMirageAtlas},
  {id:'regular-03-amber-sinker',name:'AMBER SINKER',atlas:amberSinkerAtlas},
  {id:'regular-04-ivory-ace',name:'IVORY ACE',atlas:ivoryAceAtlas},
  {id:'elite-01-cobalt-impact',name:'COBALT IMPACT · ELITE',atlas:cobaltImpactAtlas},
  {id:'boss-01-emerald-tyrant',name:'EMERALD TYRANT · BOSS',atlas:emeraldTyrantAtlas},
  {id:'regular-01-red-rush',name:'RED RUSH',atlas:redRushAtlas},
];

export default function CinematicV2Showcase(){
  const sceneRef=useRef(null);
  const cameraRef=useRef(null);
  const [token,setToken]=useState(1);
  const [stage,setStage]=useState('windup');
  const [auto,setAuto]=useState(true);
  const [pitcherId,setPitcherId]=useState(PITCHERS[0].id);
  const pitcher=PITCHERS.find(p=>p.id===pitcherId)||PITCHERS[0];
  const replay=()=>setToken(v=>v+1);
  const choosePitcher=id=>{setPitcherId(id);setStage('windup');setToken(v=>v+1)};
  useEffect(()=>{const timers=STAGES.map(([name,at])=>setTimeout(()=>setStage(name),at));return()=>timers.forEach(clearTimeout)},[token]);
  useEffect(()=>{if(!auto)return;const id=setInterval(replay,LOOP_MS);return()=>clearInterval(id)},[auto]);
  useEffect(()=>{
    const cam=cameraRef.current;if(!cam)return;
    if(stage!=='release'||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){cam.style.removeProperty('--track-x');cam.style.removeProperty('--track-y');cam.style.removeProperty('--track-scale');return}
    const started=performance.now();let raf=0;
    const follow=now=>{const u=Math.max(0,Math.min(1,(now-started)/EXIT_MS)),launch=1-Math.pow(1-Math.min(1,u/.34),3),coast=u<.34?0:(u-.34)/.66,coastEase=coast*coast*(3-2*coast),arc=Math.sin(Math.PI*Math.min(1,u));cam.style.setProperty('--track-x',`${(-1.8-4.9*launch-2.2*coastEase).toFixed(2)}%`);cam.style.setProperty('--track-y',`${(.45+3.9*launch+2.1*coastEase-1.45*arc).toFixed(2)}%`);cam.style.setProperty('--track-scale',(1.082+.052*launch+.018*coastEase).toFixed(3));if(u<1)raf=requestAnimationFrame(follow)};
    raf=requestAnimationFrame(follow);return()=>cancelAnimationFrame(raf)
  },[stage,token]);
  const camera=CAMERA[stage]||'hold';
  return <main className="cinematic-v2-showcase">
    <header className="cinematic-v2-showcase__bar"><div><strong>CINEMATIC V2 · {pitcher.name}</strong><small>투수 선택 → 릴리즈 → 300ms 비행 → 컨택 → 가속 → 회수</small></div><select aria-label="프리뷰 투수 선택" value={pitcherId} onChange={e=>choosePitcher(e.target.value)}>{PITCHERS.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button type="button" onClick={replay}>다시 재생</button><button type="button" aria-pressed={auto} onClick={()=>setAuto(v=>!v)}>{auto?'자동 ON':'자동 OFF'}</button></header>
    <section ref={sceneRef} data-camera={camera} className={`bp-scene cinematic-v2-showcase__scene fx-stage-${stage} fx-homer cam-${camera}`}>
      <div ref={cameraRef} className="cinematic-v2-showcase__camera"><div className="bp-bg" aria-hidden="true"/><div className="bp-haze" aria-hidden="true"/><div className="bp-pitcher cinematic-v2-showcase__pitcher" aria-hidden="true"/><div className="bp-batter cinematic-v2-showcase__batter" aria-hidden="true"/><div className="bp-zone cinematic-v2-showcase__zone" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><BallparkActors key={pitcher.id} sceneRef={sceneRef} pitcherAtlas={pitcher.atlas} artId={pitcher.id} batterPoses={POSES} batterSheet={BATTER_V15_SHEET} batterRig={BATTER_V15_RIG} pitchZone={4} shot={SHOT} fxStage={stage} playToken={token}/></div>
      <div className="cinematic-v2-showcase__label"><b>HOME RUN</b><span>{pitcher.name} · {stage.toUpperCase()}</span></div>
    </section>
  </main>;
}
