import React,{useState} from 'react';
import Duel from './App.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import {playableStorage} from './battle-vnext/playable-storage.js';
import {NORMAL_REVIEW_PREFIX} from './normal-review.js';
export default function NormalReview(){
 const [storage]=useState(()=>{let backing;try{backing=window.localStorage;}catch{}return playableStorage(backing,NORMAL_REVIEW_PREFIX);});
 return <ErrorBoundary storage={storage}><div className="vnext-shell"><Duel storage={storage} reviewRun/></div></ErrorBoundary>;
}
