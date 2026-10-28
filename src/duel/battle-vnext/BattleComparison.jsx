import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {COMPARE_MESSAGE,COMPARE_SCENARIOS,COMPARE_VARIANTS,comparisonScenario,comparisonUrl} from './compare-config.js';
import './comparison.css';
const NAMES={legacy:'기존 전투 UI',vnext:'가로 개선 UI'};
const READY='9zone-battle-compare-ready';
function GameFrame({variant,fixture,revision,active,path,paired}){
  const frame=useRef(null),box=useRef(null),[size,setSize]=useState(null);
  const current=useRef(active);current.current=active;
  const send=()=>frame.current?.contentWindow?.postMessage({type:COMPARE_MESSAGE,version:1,active:current.current},window.location.origin);
  useEffect(()=>{send();},[active]);
  useEffect(()=>{
    const ready=e=>{if(e.origin===window.location.origin&&e.source===frame.current?.contentWindow&&e.data?.type===READY&&e.data.version===1)send();};
    window.addEventListener('message',ready);return()=>window.removeEventListener('message',ready);
  },[]);
  useLayoutEffect(()=>{
    const el=box.current;if(!el)return;
    const read=()=>{const w=el.clientWidth,h=w<600?el.clientHeight:Math.min(el.clientHeight,Math.floor(w*9/16));if(w>0&&h>0)setSize(s=>s?.w===w&&s?.h===h?s:{w,h});};
    read();const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(read):null;observer?.observe(el);
    window.addEventListener('resize',read);return()=>{observer?.disconnect();window.removeEventListener('resize',read);};
  },[]);
  return <section className={'bc-pane'+(active?'':' is-hidden')} role={paired?'region':'tabpanel'} id={'bc-panel-'+variant} aria-labelledby={'bc-title-'+variant} aria-hidden={!active} inert={!active?'':undefined}>
    <header><span className={'bc-badge b-'+variant}>{variant==='legacy'?'A':'B'}</span><h2 id={'bc-title-'+variant}>{NAMES[variant]}</h2><a href={comparisonUrl(path,variant,fixture,{embedded:false})} target="_blank" rel="noopener noreferrer">크게 열기 ↗</a></header>
    <div className="bc-game-space" ref={box}>
      {variant==='legacy'&&<span className="bc-scroll-hint">↓ 아래로 스크롤하면 손패가 보입니다</span>}
      <iframe ref={frame} key={revision} title={NAMES[variant]} src={comparisonUrl(path,variant,fixture)} onLoad={send} tabIndex={active?0:-1}
        style={size?{width:size.w,height:size.h}:undefined}/>
    </div>
  </section>;
}
export default function BattleComparison(){
  const [fixture,setFixture]=useState(()=>comparisonScenario(new URLSearchParams(window.location.search).get('compareScenario'))),[revision,setRevision]=useState(0);
  const [tab,setTab]=useState('vnext'),[wide,setWide]=useState(()=>!!window.matchMedia?.('(min-width: 1200px)').matches),[paired,setPaired]=useState(true);
  useEffect(()=>{const m=window.matchMedia?.('(min-width: 1200px)');if(!m)return;const update=()=>setWide(m.matches);m.addEventListener?.('change',update);return()=>m.removeEventListener?.('change',update);},[]);
  const both=wide&&paired,path=window.location.pathname;
  const choose=id=>{setFixture(id);setRevision(n=>n+1);const url=new URL(window.location.href);url.searchParams.set('compareScenario',id);window.history.replaceState({},'',url);};
  const keyTab=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'legacy':e.key==='End'?'vnext':tab==='legacy'?'vnext':'legacy';setTab(next);document.getElementById('bc-tab-'+next)?.focus();}};
  return <main className="battle-comparison" data-layout={both?'paired':'single'}>
    <header className="bc-toolbar"><h1>9ZONE <span>두 버전 비교</span></h1>
      {!both&&<div role="tablist" aria-label="비교할 버전">{COMPARE_VARIANTS.map(v=><button key={v} type="button" role="tab" id={'bc-tab-'+v} aria-controls={'bc-panel-'+v} aria-selected={tab===v} tabIndex={tab===v?0:-1} onKeyDown={keyTab} onClick={()=>setTab(v)}>{v==='legacy'?'A · 기존':'B · 개선'}</button>)}</div>}
      <label>장면 <select aria-label="비교 장면" value={fixture} onChange={e=>choose(e.target.value)}>{COMPARE_SCENARIOS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      <button type="button" onClick={()=>setRevision(n=>n+1)}>함께 다시 시작</button>
      {wide&&<button type="button" aria-pressed={both} onClick={()=>setPaired(v=>!v)}>{both?'한 화면씩 보기':'나란히 보기'}</button>}
      <a href={comparisonUrl(path,tab,fixture,{embedded:false})} target="_blank" rel="noopener noreferrer">크게 열기 ↗</a>
    </header>
    <div className="bc-subbar"><p>같은 시작 상태 · 조작은 각각 독립 · 비교 화면은 무음</p></div>
    <div className="bc-frames">{COMPARE_VARIANTS.map(v=><GameFrame key={v} variant={v} fixture={fixture} revision={revision} paired={both} active={both||tab===v} path={path}/>)}</div>
    <footer className="bc-note">기존 전투 UI와 샘플 배우를 적용한 가로 개선 UI를 같은 게임 규칙으로 비교합니다. 전환해도 선택은 유지되며 실제 저장에는 반영되지 않습니다.</footer>
  </main>;
}
