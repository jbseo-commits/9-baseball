import React,{useLayoutEffect,useRef,useState} from 'react';
import {SCENE,worldCamera,atbatCamera,actorBox,cameraMatrix,sceneSnapshot} from './scene-geometry.js';
import coverage from '../../../assets/production-art/mockup-v1-intake/actor-coverage.json';
import stadiumUrl from '../../../assets/production-art/mockup-v1-intake/stadium-wide.webp';
import {PILOT_ACTORS,PILOT_MOTION,motionAt,MOTION_CONTACT,MOTION_RELEASE} from './motion-timeline.js';
import SceneEffects from './SceneEffects.jsx';
import {sceneEffectAt} from './scene-effects.js';
import './motion.css';
import useSceneClock from './use-scene-clock.js';
import './scene.css';
import {ATBAT_COMPOSITION} from './atbat-composition.js';

/* Registered authored poses and VFX share one camera and host clock.
   This render-only scene never judges or advances the engine. */

/* 선정 정지 포즈. 어떤 기존 상대 artId에도 승인된 매핑이 없다(actor-coverage.json approvedArtIds=[]).
   검토 화면·fixture에서만 명시적으로 넘긴다. 실제 상대를 이 그림으로 몰래 대체하지 않는다. */
export const SAMPLE_ACTORS=PILOT_ACTORS;
export const STADIUM_URL=stadiumUrl;

/* 승인된 상대만 그림을 돌려준다. 지금은 항상 null → 투수 자리는 비고 마운드 그림자만 남는다. */
export function approvedPitcherArt(artId){
  return artId&&(coverage.approvedArtIds||[]).includes(artId)?SAMPLE_ACTORS.pitcher:null;
}

const ACTORS=['pitcher','batter'];

export default function BattleScene({scene=null,actors={},size=null,phase='deciding',reviewNotice=false,onLayout=null,children=null,className='',reserveHand=false,framing='cover',playback=null,result=null,finale=null}){
  const rootRef=useRef(null);
  const elapsed=useSceneClock(playback);
  const composition=framing==='atbat'?ATBAT_COMPOSITION:null;
  const reduced=playback?.timeline?.duration<=60;
  const effect=sceneEffectAt({elapsed,playback,result,phase,composition});
  const pose=motionAt({elapsed,timeline:playback?.timeline,action:playback?.action,landed:phase==='result',knockedOut:!!result?.knockedOut,reduced});
  const [measured,setMeasured]=useState(null);
  const onLayoutRef=useRef(onLayout);onLayoutRef.current=onLayout;
  useLayoutEffect(()=>{
    if(size)return undefined;
    const el=rootRef.current;if(!el)return undefined;
    const read=()=>{const w=el.clientWidth,h=el.clientHeight;setMeasured(m=>m&&m.width===w&&m.height===h?m:{width:w,height:h});};
    read();
    if(typeof ResizeObserver!=='undefined'){const ro=new ResizeObserver(read);ro.observe(el);return ()=>ro.disconnect();}
    window.addEventListener('resize',read);
    return ()=>window.removeEventListener('resize',read);
  },[size]);
  const box=size||measured||{width:0,height:0};
  // Short landscape keeps the whole world together above the foreground hand.
  // No actor-only translation, scaling or mirroring.
  const inset=reserveHand&&box.width>=box.height&&box.height<=540?Math.min(30,box.height*.09):0;
  const camera=(framing==='atbat'?atbatCamera:worldCamera)(box.width,Math.max(1,box.height-inset));
  const snap=box.width>0&&box.height>0?sceneSnapshot(box.width,box.height,inset,framing):null;
  useLayoutEffect(()=>{if(snap){const at=p=>({x:p.x*camera.scale+camera.x,y:p.y*camera.scale+camera.y});const pilot=actors.batter===SAMPLE_ACTORS.batter||actors.pitcher===SAMPLE_ACTORS.pitcher;onLayoutRef.current?.(pilot?{...snap,contact:at(composition?.contact||MOTION_CONTACT),release:at(composition?.release||MOTION_RELEASE)}:snap);}},[box.width,box.height,inset,framing,actors.batter,actors.pitcher]);// eslint-disable-line react-hooks/exhaustive-deps
  const authored=actors.batter===SAMPLE_ACTORS.batter||actors.pitcher===SAMPLE_ACTORS.pitcher;
  const at=p=>({x:p.x*camera.scale+camera.x,y:p.y*camera.scale+camera.y});
  const contact=at(composition?.contact||(authored?MOTION_CONTACT:SCENE.sampleFlight.contact)),release=at(composition?.release||(authored?MOTION_RELEASE:SCENE.sampleFlight.release));
  const vars=snap?{'--bv-home-x':snap.home.x+'px','--bv-home-y':snap.home.y+'px','--bv-release-x':release.x+'px','--bv-release-y':release.y+'px',
    '--bv-contact-x':contact.x+'px','--bv-contact-y':contact.y+'px','--bv-world-scale':camera.scale}:{};
  return <section ref={rootRef} className={'bv-scene'+(className?' '+className:'')} aria-label="승부 구장" style={vars}
    data-phase={phase} data-fx-stage={scene?.fxStage||undefined} data-play-token={scene?.playToken??undefined}
    data-shot={scene?.shotGrade||undefined} data-motion={authored?'authored':'static'} data-camera-align={camera.yAlign}>
    <div className="bv-world-camera" style={{transform:effect?.camera?`translate(${effect.camera*camera.scale}px,${-effect.camera*.25*camera.scale}px)`:'none'}}>
    <div className="bv-world" aria-hidden="true" style={{width:SCENE.world.width,height:SCENE.world.height,transform:cameraMatrix(camera),visibility:camera.scale?'visible':'hidden'}}>
      <img className="bv-stadium" src={composition?.stadium||stadiumUrl} alt="" width={SCENE.world.width} height={SCENE.world.height} draggable="false" decoding="async"/>
      {(composition?.shadows||SCENE.shadows).map((s,i)=><i key={i} className="bv-ground-shadow" style={{left:s.x,top:s.y,width:s.width,height:s.height,transform:`rotate(${s.rotation}deg)`}}/>)}
      {ACTORS.map(name=>{
        const url=actors[name]||null,isAtlas=url===SAMPLE_ACTORS[name],meta=isAtlas?(composition?.[name]||PILOT_MOTION[name]):SCENE[name],b=actorBox(meta),frame=pose[name];
        return <div key={name} className={'bv-actor bv-actor-'+name} data-actor={name} data-actor-missing={url?undefined:'true'}
          data-pose={isAtlas?meta.frames[frame].name:undefined} style={{left:b.x,top:b.y,width:b.width,height:b.height}}>
          {url&&(isAtlas?<div className="bv-motion-crop"><img src={url} alt="" width={meta.sourceWidth*meta.columns} height={meta.sourceHeight*meta.rows} draggable="false" decoding="async" style={{width:meta.columns*100+'%',height:meta.rows*100+'%',left:-(frame%meta.columns)*100+'%',top:-Math.floor(frame/meta.columns)*100+'%'}}/></div>:<img src={url} alt="" width={meta.sourceWidth} height={meta.sourceHeight} draggable="false" decoding="async"/>)}
        </div>;
      })}
      <SceneEffects effect={effect} finale={finale} composition={composition}/>
    </div></div>
    <div className="bv-scene-shade" aria-hidden="true"/>
    {reviewNotice&&<p className="bv-scene-notice" role="note">그림 포즈 모션 검수{actors.pitcher&&actors.pitcher===SAMPLE_ACTORS.pitcher?' · 샘플 투수':''}</p>}
    {effect?.kind==='exact'&&effect.flash>0&&<div className="bv-contact-focus" style={{opacity:effect.flash*.65}} aria-hidden="true"/>}
    {finale&&<div className={"bv-finale-focus f-"+finale} aria-hidden="true"/>}
    {children}
  </section>;
}
