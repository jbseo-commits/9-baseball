import fs from 'node:fs';
import {pitchDescriptor,samplePitchFlight,PITCH_PROFILES} from './src/duel/battle-vnext/pitch-trajectory.js';
import {judgePrototypeContact,scorePrototypeResult,SWIPE_MULTIPLIER,SWING_LEAD_MS,CONTACT_RADIUS} from './src/duel/battle-vnext/pitch-swing-prototype.js';
const start=1317,impact=1617,d=pitchDescriptor({profile:'fastball',release:{x:800,y:350},target:{x:550,y:700},releaseAt:start,impactAt:impact,seed:23});
const sizes=['small','medium','large'],profiles=['fastball','slider','curve'],rows=[];let comparisons=0,geometricDiscord=0,scoreOrderViolations=0,resultDifferences=0;
for(const profile of profiles){const desc=pitchDescriptor({...d,profile}),row={profile,points:0,window:{},sizeResultCounts:{},identicalGeometricSample:true,largeVsMediumDominanceViolations:0,largeVsSmallDominanceViolations:0};for(const s of sizes)row.window[s]=[];
 const atCommit=samplePitchFlight(desc,start+140),fastAtCommit=samplePitchFlight(pitchDescriptor({...d,profile:'fastball'}),start+140),atDeadline={u:140/300,position:atCommit.position,deltaFromFast:{x:atCommit.position.x-fastAtCommit.position.x,y:atCommit.position.y-fastAtCommit.position.y},tangent:atCommit.tangent};
 for(let t=start;t<=impact+700;t++){row.points++;const outcomes=sizes.map(s=>judgePrototypeContact({descriptor:desc,contactAt:t,target:desc.target,swipe:s}));comparisons++;
  if(new Set(outcomes.map(o=>`${o.position?.x},${o.position?.y},${o.distance},${o.timingErrorMs}`)).size!==1){row.identicalGeometricSample=false;geometricDiscord++;}
  if(new Set(outcomes.map(o=>o.result)).size>1)resultDifferences++;
  const scores=sizes.map((s,i)=>scorePrototypeResult({score:0,strikes:0,result:outcomes[i].result,multiplier:outcomes[i].multiplier}));
  if(scores[2].score<scores[1].score||scores[2].strikes>scores[1].strikes)row.largeVsMediumDominanceViolations++;
  if(scores[2].score<scores[0].score||scores[2].strikes>scores[0].strikes)row.largeVsSmallDominanceViolations++;
  for(let i=0;i<sizes.length;i++){const s=sizes[i],o=outcomes[i];row.sizeResultCounts[s]??={contact:0,'cut-foul':0,miss:0};row.sizeResultCounts[s][o.result]++;if(o.result==='contact'||o.result==='cut-foul')row.window[s].push(t-impact);}
 }
 for(const s of sizes){const vals=row.window[s];row.window[s]=vals.length?{firstMs:Math.min(...vals),lastMs:Math.max(...vals),count:vals.length}:null;}
 row.launchDeadlineMsAfterRelease=140;row.launchDeadlineFraction=140/300;row.launchDeadlineSample=atDeadline;row.curveTurnaroundMsAfterRelease=150;row.peakSliderMsAfterRelease=225;rows.push(row);
}
const summaries=rows.map(r=>({profile:r.profile,windows:r.window,sizeResults:r.sizeResultCounts,geometrySameAcrossSizes:r.identicalGeometricSample,largeVsMediumDominanceViolations:r.largeVsMediumDominanceViolations,largeVsSmallDominanceViolations:r.largeVsSmallDominanceViolations,at140msDeltaFromFastball:r.launchDeadlineSample.deltaFromFast}));
const report={sourceCommit:'06aa22d',sourceHashes:{prototype:process.env.PROTOTYPE_SHA,trajectory:process.env.TRAJECTORY_SHA},descriptor:{release:{x:800,y:350},target:{x:550,y:700},releaseAt:start,impactAt:impact,flightMs:impact-start,seed:23},model:{swingLeadMs:SWING_LEAD_MS,commitDeadlineMsAfterRelease:impact-start-SWING_LEAD_MS,contactRadius:CONTACT_RADIUS,multipliers:SWIPE_MULTIPLIER,grid:'every integer contactAt from release through impact+700ms at same registered T target for all swipe classes; no engine pending or forecast inputs'},gridPointsPerProfile:rows[0].points,gridComparisons:comparisons,geometricDiscord,scoreOrderViolations,resultDifferences,summaries,interpretation:'Conditional rule dominance only for an identical target/time/input-class comparison; no gesture-duration, motor-effort, human reaction, or engine reward cost is represented.'};
fs.writeFileSync('/tmp/g030-swipe-dominance/result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
