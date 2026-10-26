import {useEffect,useRef,useState} from 'react';

export function useWideBattle(enabled){
  const [wide,setWide]=useState(()=>!!(enabled&&typeof window!=='undefined'&&window.matchMedia?.('(orientation: landscape)').matches));
  useEffect(()=>{
    if(!enabled){setWide(false);return;}
    const media=window.matchMedia?.('(orientation: landscape)');if(!media)return;
    const update=()=>setWide(media.matches);update();media.addEventListener?.('change',update);
    return()=>media.removeEventListener?.('change',update);
  },[enabled]);
  return enabled&&wide;
}

export function comparisonMode(win=typeof window!=='undefined'?window:null){
  const value=new URLSearchParams(win?.location?.search||'').get('battleLayout');
  return value==='compare'||value==='inside'?value:null;
}
export function comparisonViewport({width,height,wide,battle}){
  const available=Math.max(1,height-32);
  const h=wide&&battle?Math.max(288,available):Math.max(width<360?568:640,available);
  const w=wide&&battle?Math.max(568,width):width<360?320:Math.min(520,h*9/16);
  return {width:w,height:h,scale:Math.min(1,width/w,available/h)};
}
export function validLayoutMessage(event,source,origin){
  if(event.origin!==origin||event.source!==source)return false;
  const d=event.data;
  return !!(d?.type==='9zone-layout-stage'&&typeof d.battle==='boolean'&&typeof d.busy==='boolean'
    ||d?.type==='9zone-layout-ack'&&Number.isSafeInteger(d.requestId)&&typeof d.accepted==='boolean');
}
/* Only layout metadata crosses the frame boundary: no engine snapshot, pending
   roll, private probabilities or storage. Child checks busy at request time. */
export function useBattleLayoutSignal(busy,enabled=true){
  const inside=comparisonMode()==='inside',live=useRef(busy);live.current=busy;
  useEffect(()=>{
    if(!inside||!enabled)return;
    const send=data=>window.parent.postMessage(data,window.location.origin);
    const request=e=>{
      if(e.origin!==window.location.origin||e.source!==window.parent||e.data?.type!=='9zone-layout-request'||!Number.isSafeInteger(e.data.requestId))return;
      send({type:'9zone-layout-ack',requestId:e.data.requestId,accepted:!live.current});
    };
    window.addEventListener('message',request);
    return()=>{window.removeEventListener('message',request);send({type:'9zone-layout-stage',battle:false,busy:false});};
  },[inside,enabled]);
  useEffect(()=>{
    if(inside&&enabled)window.parent.postMessage({type:'9zone-layout-stage',battle:true,busy:!!busy},window.location.origin);
  },[inside,enabled,busy]);
  return inside&&enabled;
}
/* Visual flight lands at home plate. The tactical board can sit off the field.
   Hidden portrait markers have zero size, so the original targets remain exact. */
export function pitchTargetElements(scene){
  const field=scene?.querySelector('.bp-field-target');
  return field?.offsetWidth>0?{zone:field,cells:[...field.children]}:{zone:scene?.querySelector('.bp-zone'),cells:[...scene?.querySelectorAll('.bp-cell')||[]]};
}
