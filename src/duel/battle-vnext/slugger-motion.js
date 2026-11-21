import {ATBAT_COMPOSITION} from './atbat-composition.js';
export const reviewSluggerEligible=(reviewRun,hitter)=>import.meta.env.VITE_NORMAL_REVIEW==='1'&&reviewRun===true&&hitter?.version===1&&hitter.id==='slugger-v1';
export const sluggerMotionPaths=(enabled,base='./')=>enabled?{json:base+'slugger-motion-v2/slugger.json',texture:base+'slugger-motion-v2/slugger.webp'}:null;
const point=p=>p&&typeof p==='object'&&['x','y'].every(k=>Number.isFinite(p[k])&&p[k]>=0&&p[k]<=192);
export function validateSluggerMotion(raw){
 if(!raw||raw.sourceWidth!==192||raw.sourceHeight!==192||raw.columns!==4||raw.rows!==4||!Array.isArray(raw.frames)||raw.frames.length!==14)return null;
 if(raw.anchor?.x!==52.5||raw.anchor?.y!==175)return null;
 if(raw.event!==undefined&&!point(raw.event))return null;
 if(!raw.frames.every((f,i)=>f&&typeof f==='object'&&!Array.isArray(f)&&(f.id===undefined||f.id===i)&&(f.contact===undefined||point(f.contact))))return null;
 // World geometry, events, frame names and URLs are code-owned. The JSON is
 // a format/registration gate, never authority to change contact or the camera.
 return {...ATBAT_COMPOSITION.batter,sourceWidth:192,sourceHeight:192,columns:4,rows:4,anchor:{x:52.5,y:175},worldFoot:{...ATBAT_COMPOSITION.batter.worldFoot},worldHeight:1100,event:{x:160.5,y:86},readyImage:null,
  frames:ATBAT_COMPOSITION.batter.frames.map(f=>({name:f.name}))};
}
export const isReviewSluggerActor=a=>a?.kind==='review-slugger-atlas'&&a.classId==='slugger-v1';
export const disposeSluggerActor=a=>{if(a?.url?.startsWith('blob:'))URL.revokeObjectURL(a.url);};
export async function loadSluggerMotion({enabled=false,base='./',signal,fetcher=globalThis.fetch,decode=decodeTexture}={}){
 const paths=sluggerMotionPaths(enabled,base);if(!paths)return null;
 try{
  const response=await fetcher(paths.json,{signal,credentials:'same-origin',redirect:'error'});
  if(!response.ok||response.redirected)return null;
  const text=await response.text();if(text.length>32768)return null;
  const meta=validateSluggerMotion(JSON.parse(text));if(!meta||signal?.aborted)return null;
  const texture=await decode(paths.texture,signal);
  if(signal?.aborted||texture.width!==768||texture.height!==768||!texture.url?.startsWith('blob:')){disposeSluggerActor(texture);return null;}
  return {kind:'review-slugger-atlas',classId:'slugger-v1',url:texture.url,meta};
 }catch{return null;}
}
async function decodeTexture(url,signal){
 const response=await fetch(url,{signal,credentials:'same-origin',redirect:'error'});
 if(!response.ok||response.redirected)throw Error('texture unavailable');
 const blob=await response.blob();if(blob.type!=='image/webp'||blob.size>8*1024*1024)throw Error('texture format');
 const objectUrl=URL.createObjectURL(blob);
 try{const image=new Image();image.src=objectUrl;await image.decode();return {width:image.naturalWidth,height:image.naturalHeight,url:objectUrl};}
 catch(e){URL.revokeObjectURL(objectUrl);throw e;}
}
