import React,{useLayoutEffect,useRef,useState} from 'react';
import {SCENE,worldCamera,actorBox,cameraMatrix,sceneSnapshot} from './scene-geometry.js';
import coverage from '../../../assets/production-art/mockup-v1-intake/actor-coverage.json';
import stadiumUrl from '../../../assets/production-art/mockup-v1-intake/stadium-wide.webp';
import batterUrl from '../../../assets/production-art/mockup-v1-intake/batter-catcher.webp';
import pitcherUrl from '../../../assets/production-art/mockup-v1-intake/pitcher-home.webp';
import './scene.css';

/* C02 — 구장과 배우를 한 카메라로 그린다. 정지 원화 단계이며 동작은 C06.
   엔진 판정·다음 공을 부르지 않는다. playToken/fxStage는 data 속성으로만 노출한다. */

/* 선정 정지 포즈. 어떤 기존 상대 artId에도 승인된 매핑이 없다(actor-coverage.json approvedArtIds=[]).
   검토 화면·fixture에서만 명시적으로 넘긴다. 실제 상대를 이 그림으로 몰래 대체하지 않는다. */
export const SAMPLE_ACTORS=Object.freeze({batter:batterUrl,pitcher:pitcherUrl});
export const STADIUM_URL=stadiumUrl;

/* 승인된 상대만 그림을 돌려준다. 지금은 항상 null → 투수 자리는 비고 마운드 그림자만 남는다. */
export function approvedPitcherArt(artId){
  return artId&&(coverage.approvedArtIds||[]).includes(artId)?pitcherUrl:null;
}

const ACTORS=['pitcher','batter'];

export default function BattleScene({scene=null,actors={},size=null,phase='deciding',reviewNotice=false,onLayout=null,children=null,className='',reserveHand=false}){
  const rootRef=useRef(null);
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
  const camera=worldCamera(box.width,Math.max(1,box.height-inset));
  const snap=box.width>0&&box.height>0?sceneSnapshot(box.width,box.height,inset):null;
  useLayoutEffect(()=>{if(snap)onLayoutRef.current?.(snap);},[box.width,box.height,inset]);// eslint-disable-line react-hooks/exhaustive-deps
  const vars=snap?{'--bv-home-x':snap.home.x+'px','--bv-home-y':snap.home.y+'px','--bv-release-x':snap.release.x+'px','--bv-release-y':snap.release.y+'px',
    '--bv-contact-x':snap.contact.x+'px','--bv-contact-y':snap.contact.y+'px','--bv-world-scale':camera.scale}:{};
  return <section ref={rootRef} className={'bv-scene'+(className?' '+className:'')} aria-label="승부 구장" style={vars}
    data-phase={phase} data-fx-stage={scene?.fxStage||undefined} data-play-token={scene?.playToken??undefined}
    data-shot={scene?.shotGrade||undefined} data-motion={scene?.motionEnabled?'live':'static'} data-camera-align={camera.yAlign}>
    <div className="bv-world" aria-hidden="true" style={{width:SCENE.world.width,height:SCENE.world.height,transform:cameraMatrix(camera),visibility:camera.scale?'visible':'hidden'}}>
      <img className="bv-stadium" src={stadiumUrl} alt="" width={SCENE.world.width} height={SCENE.world.height} draggable="false" decoding="async"/>
      {SCENE.shadows.map((s,i)=><i key={i} className="bv-ground-shadow" style={{left:s.x,top:s.y,width:s.width,height:s.height,transform:`rotate(${s.rotation}deg)`}}/>)}
      {ACTORS.map(name=>{
        const b=actorBox(SCENE[name]),url=actors[name]||null;
        return <div key={name} className={'bv-actor bv-actor-'+name} data-actor={name} data-actor-missing={url?undefined:'true'}
          style={{left:b.x,top:b.y,width:b.width,height:b.height}}>
          {url&&<img src={url} alt="" width={SCENE[name].sourceWidth} height={SCENE[name].sourceHeight} draggable="false" decoding="async"/>}
        </div>;
      })}
    </div>
    <div className="bv-scene-shade" aria-hidden="true"/>
    {reviewNotice&&<p className="bv-scene-notice" role="note">정지 원화 · 투구·타격 동작은 아직 없음{actors.pitcher&&actors.pitcher===SAMPLE_ACTORS.pitcher?' · 샘플 투수':''}</p>}
    {children}
  </section>;
}
