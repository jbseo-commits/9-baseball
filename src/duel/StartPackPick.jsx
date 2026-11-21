import React,{useEffect,useRef,useState} from 'react';
import {HITTER_CLASSES} from './hitter-classes.js';
import {canStartHitter,defaultNewHitter,sluggerReviewOnly} from './new-run-selection.js';
import {careerProgress} from './hitter-career.js';
import {HITTER_BUILDS} from './hitter-builds.js';
import './hitter-select.css';
const PORTRAITS=Object.freeze({'contact-v1':'roster-v2/contact.webp','slugger-v1':'roster-v2/slugger.webp','bad-ball-v1':'roster-v2/bad-ball.webp','spray-v1':'roster-v2/spray.webp'});
function Portrait({id}){
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false);
 const src=import.meta.env.VITE_NORMAL_REVIEW==='1'?import.meta.env.BASE_URL+PORTRAITS[id]:null;
 return <span className="hc-portrait" data-art={ready&&!failed?'owner-portrait':'neutral-silhouette'}>
  <svg viewBox="0 0 120 200" aria-hidden="true" className="hc-silhouette"><ellipse cx="60" cy="192" rx="40" ry="5"/><path d="M48 21h24l9 9-5 16-10 8 12 8 7 35 14 33-10 5-19-33-1 19 13 60-15 8-12-55-8 54-16-4 7-67-3-23-13 32-11-5 21-50 17-17-10-9-2-16z"/><path d="M28 85L11 13l5-2 21 71z"/><path className="hc-silhouette-edge" d="M43 28h40M42 65l18 9 15-10M45 118h23"/></svg>
  {src&&!failed&&<img src={src} alt="" draggable="false" style={{opacity:ready?1:0}} onLoad={e=>{const img=e.currentTarget;img.decode().then(()=>{if(img.naturalWidth>0&&img.naturalHeight>0)setReady(true);else setFailed(true);}).catch(()=>setFailed(true));}} onError={()=>setFailed(true)}/>}
 </span>;
}
export default function StartPackPick({onPick,onClose,reviewRun=false,career={version:1,runs:{}}}){
 const [chosen,setChosen]=useState(()=>defaultNewHitter(reviewRun)),committed=useRef(false);
 const reviewOnly=sluggerReviewOnly(reviewRun);
 const pack=HITTER_CLASSES.find(c=>c.id===chosen),build=HITTER_BUILDS[chosen];
 useEffect(()=>{const f=e=>{if(e.key==='Escape')onClose?.();};window.addEventListener('keydown',f);return()=>window.removeEventListener('keydown',f);},[onClose]);
 return <div className="hc-root" role="dialog" aria-modal="true" aria-label="타자 선택">
  <header className="hc-head"><div><small>새 원정 · 타자 선택</small><h2>누구의 야구로 승부할까</h2></div><button onClick={onClose} aria-label="닫기">×</button></header>
  <div className="hc-roster" role="radiogroup" aria-label="타자">
   {HITTER_CLASSES.map(c=>{const p=careerProgress(career,c.id),allowed=canStartHitter(career,c.id,reviewRun),on=c.id===chosen;return <button key={c.id} type="button" role="radio" aria-label={c.name} aria-checked={on} aria-disabled={!allowed} data-testid="start-pack" data-pack={c.id} className={'hc-player '+(on?'selected ':'')+(!allowed?'locked':'')} onClick={()=>{if(allowed)setChosen(c.id);}}>
    <Portrait id={c.id}/><strong>{c.name}</strong><span className="hc-style">{({'slugger-v1':'준비한 한 칸에 장타','contact-v1':'단타를 잇고, 두 스트라이크를 버틴다','bad-ball-v1':'밖에 걸거나, 볼을 골라 압박','spray-v1':'코스를 골라 치고 주자를 보낸다'})[c.id]}</span>
    <span className="hc-unlock">{allowed?(on?'선택됨':'출전 가능'):reviewOnly?'이번 검수 잠김':`잠김 · ${p.label}`}</span>
    {!allowed&&!reviewOnly&&<><progress value={p.value} max={p.target} aria-label={p.label}/><small>{p.value} / {p.target}</small></>}
   </button>;})}
  </div>
  <footer className="hc-foot"><div><b>{build.passive}</b><span>{build.branches.map(b=>b.name).join(' / ')} · 경기 보상에서 발전</span><small>전신 실루엣은 중립 검수 표시 · 전투는 기존 승인 타자</small></div><button data-testid="start-pack-go" disabled={!canStartHitter(career,chosen,reviewRun)} onClick={()=>{if(!committed.current&&canStartHitter(career,chosen,reviewRun)){committed.current=true;onPick?.(chosen);}}}>{pack.name}로 출발 →</button></footer>
 </div>;
}
