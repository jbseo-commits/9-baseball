import React,{useState} from 'react';
import Duel from '../App.jsx';
import {createV10Duel,enterV10Node,readV10Duel,saveV10Duel} from '../engine.js';
import {playableStorage} from './playable-storage.js';
import MemoryPreviewBoundary from './MemoryPreviewBoundary.jsx';

export function startPlayableRun(storage,search=''){
 let saved;try{saved=readV10Duel(storage);}catch{}
 if(saved)return saved;
 const value=new URLSearchParams(search).get('seed');
 const seed=value!==null&&/^\d{1,10}$/.test(value)&&Number(value)<=4294967295?Number(value):Date.now()>>>0;
 const initial=createV10Duel(seed),node=initial.runMap.nodes.find(n=>initial.runMap.reachableIds.includes(n.id)&&n.opponent);
 const run=node?enterV10Node(initial,node.id):initial;saveV10Duel(storage,run);return run;
}
export default function PlayableRun(){
 const [storage]=useState(()=>{let backing;try{backing=window.sessionStorage;}catch{}const own=playableStorage(backing);startPlayableRun(own,window.location.search);return own;});
 return <MemoryPreviewBoundary><div className="vnext-shell bv-playable-run"><Duel storage={storage} startInRun/></div></MemoryPreviewBoundary>;
}
