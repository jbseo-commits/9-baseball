import React,{useState} from 'react';
import Duel from '../App.jsx';
import {createV10Duel,readV10Duel,saveV10Duel} from '../engine.js';
import {playableStorage} from './playable-storage.js';
import {TIDE_PLAYTEST_PREFIX,TIDE_PLAYTEST_SEED} from './tide-playtest.js';
import './tide-playtest.css';
export default function TidePlaytest(){
 const [storage]=useState(()=>{let backing;try{backing=window.sessionStorage;}catch{}return playableStorage(backing,TIDE_PLAYTEST_PREFIX);});
 const [running,setRunning]=useState(false),[saved]=useState(()=>{try{return readV10Duel(storage);}catch{return null;}});
 function fresh(){saveV10Duel(storage,createV10Duel(TIDE_PLAYTEST_SEED));setRunning(true);}
 if(running)return <div className="vnext-shell"><Duel storage={storage} startInRun/></div>;
 return <main className="tide-playtest-entry"><span>9ZONE · PLAYTEST</span><h1>타이드의 밀물과 썰물</h1><p>타이드가 첫 경기에서 기다리는 실제 런입니다.<br/>카드와 판정, 보상과 다음 경로는 기존 규칙 그대로 진행합니다.</p><button onClick={fresh}>새 타이드 런 시작</button>{saved&&<button onClick={()=>setRunning(true)}>검수 런 이어하기</button>}<small>검수 진행은 이 탭에 별도 저장됩니다. 기존 플레이 기록은 바뀌지 않습니다.<br/>새 투수 원화와 경기장 후보는 아직 적용하지 않았습니다.</small></main>;
}
