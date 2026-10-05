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
const RESULTS={
  homer:{grade:'homer',kind:'homer',title:'HOME RUN',freeze:90,settle:700,duration:1040,release:125,stageSettle:825,exit:700,track:{x0:-1.8,xLaunch:-4.9,xCoast:-2.2,y0:.45,yLaunch:3.9,yCoast:2.1,arc:1.45,scale0:1.082,scaleLaunch:.052,scaleCoast:.018}},
  extra:{grade:'extra',kind:'extra',title:'EXTRA BASE HIT',freeze:72,settle:620,duration:930,release:145,stageSettle:760,exit:560,track:{x0:-1.1,xLaunch:-3.1,xCoast:-1.35,y0:.25,yLaunch:1.8,yCoast:.85,arc:.75,scale0:1.06,scaleLaunch:.032,scaleCoast:.01}},
  solid:{grade:'solid',kind:'solid',title:'BASE HIT',freeze:54,settle:540,duration:820,release:165,stageSettle:690,exit:430,track:{x0:-.65,xLaunch:-1.75,xCoast:-.65,y0:.12,yLaunch:.7,yCoast:.28,arc:.32,scale0:1.038,scaleLaunch:.018,scaleCoast:.004}},
  foul:{grade:'battle-foul',kind:'foul',title:'FOUL',freeze:38,settle:480,duration:730,release:120,stageSettle:610,exit:340,track:{x0:.1,xLaunch:1.55,xCoast:.35,y0:.05,yLaunch:1.45,yCoast:.25,arc:.15,scale0:1.025,scaleLaunch:.012,scaleCoast:0}},
  whiff:{grade:'chase',kind:'miss',title:'SWING & MISS',freeze:0,settle:500,duration:760,release:105,stageSettle:620,exit:300,track:{x0:.45,xLaunch:.75,xCoast:.15,y0:0,yLaunch:-.18,yCoast:0,arc:0,scale0:1.012,scaleLaunch:-.008,scaleCoast:0}},
};
const PITCHERS=[
  {id:'regular-02-teal-mirage',name:'TEAL MIRAGE',atlas:tealMirageAtlas},
  {id:'regular-03-amber-sinker',name:'AMBER SINKER',atlas:amberSinkerAtlas},
  {id:'regular-04-ivory-ace',name:'IVORY ACE',atlas:ivoryAceAtlas},
  {id:'elite-01-cobalt-impact',name:'COBALT IMPACT · ELITE',atlas:cobaltImpactAtlas},
  {id:'boss-01-emerald-tyrant',name:'EMERALD TYRANT · BOSS',atlas:emeraldTyrantAtlas},
  {id:'regular-01-red-rush',name:'RED RUSH',atlas:redRushAtlas},
];

export default function CinematicV2Showcase(){
  const sceneRef=useRef(null),cameraRef=useRef(null);
  const [token,setToken]=useState(1),[stage,setStage]=useState('windup'),[auto,setAuto]=useState(true),[pitcherId,setPitcherId]=useState(PITCHERS[0].id),[resultId,setResultId]=useState('homer');
  const pitcher=PITCHERS.find(p=>p.id===pitcherId)||PITCHERS[0],result=RESULTS[resultId]||RESULTS.homer,isMiss=result.kind==='miss';
  const shot={grade:result.grade,kind:result.kind,title:result.title,motion:{impactAt:CONTACT_MS,settleAt:CONTACT_MS+result.settle,duration:CONTACT_MS+result.duration,freeze:result.freeze,slowmo:!isMiss,syncToPitcher:true}};
  const stages=[['windup',0],['pitcher-focus',Math.max(0,RED_RUSH_RELEASE_MS-250)],['pitch-release',RED_RUSH_RELEASE_MS-35],['ball-approach',RED_RUSH_RELEASE_MS+70],['impact',CONTACT_MS-45],[isMiss?'miss':'slowmo',CONTACT_MS],['release',CONTACT_MS+result.release],['settle',CONTACT_MS+result.stageSettle]];
  const loopMs=CONTACT_MS+result.duration+760;
  const replay=()=>setToken(v=>v+1),choosePitcher=id=>{setPitcherId(id);setStage('windup');setToken(v=>v+1)},chooseResult=id=>{setResultId(id);setStage('windup');setToken(v=>v+1)};
  useEffect(()=>{const timers=stages.map(([name,at])=>setTimeout(()=>setStage(name),at));return()=>timers.forEach(clearTimeout)},[token,resultId]);
  useEffect(()=>{if(!auto)return;const id=setInterval(replay,loopMs);return()=>clearInterval(id)},[auto,loopMs]);
  useEffect(()=>{
    const cam=cameraRef.current;if(!cam)return;
    if(stage!=='release'||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){cam.style.removeProperty('--track-x');cam.style.removeProperty('--track-y');cam.style.removeProperty('--track-scale');return}
    const started=performance.now(),cfg=result.track;let raf=0;
    const follow=now=>{const u=Math.max(0,Math.min(1,(now-started)/result.exit)),launch=1-Math.pow(1-Math.min(1,u/.34),3),coast=u<.34?0:(u-.34)/.66,coastEase=coast*coast*(3-2*coast),arc=Math.sin(Math.PI*Math.min(1,u));cam.style.setProperty('--track-x',`${(cfg.x0+cfg.xLaunch*launch+cfg.xCoast*coastEase).toFixed(2)}%`);cam.style.setProperty('--track-y',`${(cfg.y0+cfg.yLaunch*launch+cfg.yCoast*coastEase-cfg.arc*arc).toFixed(2)}%`);cam.style.setProperty('--track-scale',(cfg.scale0+cfg.scaleLaunch*launch+cfg.scaleCoast*coastEase).toFixed(3));if(u<1)raf=requestAnimationFrame(follow)};
    raf=requestAnimationFrame(follow);return()=>cancelAnimationFrame(raf)
  },[stage,token,resultId]);
  const camera=stage==='windup'?'hold':stage==='pitcher-focus'?'pitcher':stage==='pitch-release'?'pitcher-release':stage==='ball-approach'?'approach':stage==='impact'||stage==='slowmo'?'contact':stage==='miss'?'miss':stage==='release'?'track':'recover';
  return <main className="cinematic-v2-showcase">
    <header className="cinematic-v2-showcase__bar"><div><strong>CINEMATIC V2 · {result.title}</strong><small>성공은 힘의 크기 · 파울은 빗겨나감 · 헛스윙은 힘의 공백</small></div><select aria-label="타격 결과 선택" value={resultId} onChange={e=>chooseResult(e.target.value)}><option value="homer">HOME RUN</option><option value="extra">2루타 / EXTRA BASE HIT</option><option value="solid">일반 안타 / BASE HIT</option><option value="foul">파울 / FOUL</option><option value="whiff">헛스윙 / SWING & MISS</option></select><select aria-label="프리뷰 투수 선택" value={pitcherId} onChange={e=>choosePitcher(e.target.value)}>{PITCHERS.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button type="button" onClick={replay}>다시 재생</button><button type="button" aria-pressed={auto} onClick={()=>setAuto(v=>!v)}>{auto?'자동 ON':'자동 OFF'}</button></header>
    <section ref={sceneRef} data-camera={camera} className={`bp-scene cinematic-v2-showcase__scene fx-stage-${stage} fx-${result.grade} result-${resultId} cam-${camera}`}>
      <div ref={cameraRef} className="cinematic-v2-showcase__camera"><div className="bp-bg" aria-hidden="true"/><div className="bp-haze" aria-hidden="true"/><div className="bp-pitcher cinematic-v2-showcase__pitcher" aria-hidden="true"/><div className="bp-batter cinematic-v2-showcase__batter" aria-hidden="true"/><div className="bp-zone cinematic-v2-showcase__zone" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><BallparkActors key={pitcher.id} sceneRef={sceneRef} pitcherAtlas={pitcher.atlas} artId={pitcher.id} batterPoses={POSES} batterSheet={BATTER_V15_SHEET} batterRig={BATTER_V15_RIG} pitchZone={4} shot={shot} fxStage={stage} playToken={token}/></div>
      <div className="cinematic-v2-showcase__label"><b>{result.title}</b><span>{pitcher.name} · {stage.toUpperCase()}</span></div>
    </section>
  </main>;
}
