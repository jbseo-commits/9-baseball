/* One presentation clock for App and the isolated review host. Never advances
   the engine. Monotonic reconciliation drops stale AV cues after backgrounding. */
export function startPresentationClock(timeline,{onStage=()=>{},onImpact=()=>{},onSettle=()=>{},onComplete=()=>{},
  now=()=>performance.now(),setTimer=setTimeout,clearTimer=clearTimeout,document:doc=globalThis.document,startedAt=now(),lateCueMs=120}={}){
  const events=[{at:timeline.impactAt,stage:'impact',cue:onImpact},
    ...(timeline.slowmo>0?[{at:timeline.impactAt+(timeline.freeze||0),stage:'slowmo'}]:[]),
    {at:timeline.releaseAt,stage:'release'},{at:timeline.settleAt,stage:'settle',cue:onSettle},
    {at:timeline.duration,stage:null,end:true}].sort((a,b)=>a.at-b.at);
  let index=0,timer=null,cancelled=false,stage='windup';
  const detach=()=>doc?.removeEventListener?.('visibilitychange',reconcile);
  function reconcile(){
    if(cancelled)return;
    if(timer!=null)clearTimer(timer);timer=null;
    const elapsed=Math.max(0,now()-startedAt);
    let changed=false,ended=false;
    while(index<events.length&&elapsed>=events[index].at){
      const e=events[index++];stage=e.stage;changed=true;
      e.cue?.({elapsed,late:elapsed-e.at,audible:doc?.visibilityState!=='hidden'&&elapsed-e.at<=lateCueMs});
      if(cancelled)return;
      if(e.end){ended=true;break;}
    }
    if(changed)onStage(stage,{elapsed,startedAt,timeline});
    if(cancelled)return;
    if(ended){cancelled=true;detach();onComplete();return;}
    timer=setTimer(reconcile,Math.max(0,events[index].at-elapsed));
  }
  onStage('windup',{elapsed:0,startedAt,timeline});
  doc?.addEventListener?.('visibilitychange',reconcile);
  reconcile();
  return {startedAt,timeline,cancel(){if(cancelled)return;cancelled=true;if(timer!=null)clearTimer(timer);detach();},reconcile};
}
