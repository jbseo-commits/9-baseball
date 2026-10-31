import React,{useState} from 'react';
import Duel from '../App.jsx';
import {createV10Duel,enterV10Node,readV10Duel,saveV10Duel} from '../engine.js';
import {playableStorage} from './playable-storage.js';
import {normalizeEncounterPilot} from '../encounter-pilot-v1.js';
import MemoryPreviewBoundary from './MemoryPreviewBoundary.jsx';

export function playableRequest(search='',nowSeed=Date.now()>>>0){
 const params=new URLSearchParams(search),pilot=normalizeEncounterPilot(params.get('encounterPilot'));
 const value=params.get('seed'),validSeed=value!==null&&/^\d{1,10}$/.test(value)&&Number(value)<=4294967295;
 return {pilot,seed:validSeed?Number(value):pilot?1:nowSeed>>>0,
  namespace:pilot?`encounter-${pilot}-${validSeed?Number(value):1}`:null};
}
export function startPlayableRun(storage,search=''){
 const request=playableRequest(search);
 let saved;try{saved=readV10Duel(storage);}catch{}
 if(saved&&(request.pilot
  ?saved.initialSeed===request.seed&&saved.v10?.encounterPilot?.id===request.pilot
  :!saved.v10?.encounterPilot))return saved;
 const initial=createV10Duel(request.seed,request.pilot?{tutorial:request.pilot==='red',encounterPilot:request.pilot}:{}),node=initial.runMap.nodes.find(n=>initial.runMap.reachableIds.includes(n.id)&&n.opponent
  &&(request.pilot?n.opponent.encounterPilot?.id===request.pilot:!n.opponent.encounterPilot));
 const run=node?enterV10Node(initial,node.id):initial;saveV10Duel(storage,run);return run;
}
export default function PlayableRun(){
 const [storage]=useState(()=>{let backing;try{backing=window.sessionStorage;}catch{}const request=playableRequest(window.location.search);const own=playableStorage(backing,request.namespace);startPlayableRun(own,window.location.search);return own;});
 return <MemoryPreviewBoundary><div className="vnext-shell bv-playable-run"><Duel storage={storage} startInRun/></div></MemoryPreviewBoundary>;
}
